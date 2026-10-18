import { contrastRatio, toHex } from "./color";
import { COMPONENT_NAMES } from "./components";
import { RULES_BY_ID } from "./rules";
import tokens from "./tokens.json";
import type { DesignNode, Issue, RGBA, ValidationResult } from "./types";

const TOKEN_HEXES = new Set(Object.values(tokens.color).map((h) => h.toUpperCase()));
const WHITE: RGBA = { r: 1, g: 1, b: 1, a: 1 };
const INTERACTIVE = new Set(["Button", "Input"]);

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-(live|proj|ant)?[-_]?[A-Za-z0-9]{16,}/, // OpenAI / Anthropic / Stripe style
  /\bAKIA[0-9A-Z]{16}\b/, // AWS access key
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, // GitHub token
  /\bxox[abpr]-[A-Za-z0-9-]{10,}/, // Slack token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(password|passwd|secret|api[_-]?key)\s*[:=]\s*(?!•)\S{4,}/i,
];
const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g;
const SAFE_EMAIL_DOMAIN = /@(example\.(com|org|net)|test\.com)$/i;
const SSN = /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/;
const CARD = /\b(?:\d[ -]?){13,19}\b/g;
const TEST_CARDS = new Set(["4242424242424242", "4000056655665556", "5555555555554444"]);
const HTTP_URL = /\bhttp:\/\/(?!localhost|127\.0\.0\.1)[^\s]+/i;

function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function baseName(n: DesignNode): string | undefined {
  // "Button/Primary" or "Button, variant=primary" → "Button"
  const src = n.componentName ?? n.name;
  return src.split(/[/,=\s]/)[0];
}

function visibleFill(n: DesignNode): RGBA | undefined {
  const f = n.fills?.find((c) => (c.a ?? 1) > 0.5);
  return f;
}

function collectText(n: DesignNode, out: DesignNode[] = []): DesignNode[] {
  if (n.text && n.text.characters.trim()) out.push(n);
  n.children?.forEach((c) => collectText(c, out));
  return out;
}

export function validate(roots: DesignNode[]): ValidationResult {
  const issues: Issue[] = [];
  let nodesChecked = 0;

  const report = (ruleId: string, node: DesignNode, message: string) => {
    const rule = RULES_BY_ID[ruleId];
    issues.push({
      ruleId,
      severity: rule.severity,
      category: rule.category,
      nodeId: node.id,
      nodeName: node.name,
      message,
      fix: rule.fix,
    });
  };

  const visit = (n: DesignNode, bg: RGBA) => {
    nodesChecked++;
    const fill = visibleFill(n);
    const isText = n.type === "TEXT" && !!n.text;
    const name = baseName(n);
    const isInstance = n.type === "INSTANCE" || n.type === "COMPONENT";

    // DS-001 — token colours (text colour and container fills)
    for (const c of [...(n.fills ?? []), ...(n.strokes ?? [])]) {
      if ((c.a ?? 1) === 0) continue;
      const hex = toHex(c);
      if (!TOKEN_HEXES.has(hex)) report("DS-001", n, `${hex} is not a colour token.`);
    }

    // DS-003 — detached library components
    if (!isInstance && name && COMPONENT_NAMES.includes(name) && (n.type === "FRAME" || n.type === "GROUP")) {
      report("DS-003", n, `"${n.name}" looks like a ${name} but is not a library instance.`);
    }

    // DS-004 — 4px grid
    if (n.layout) {
      const off = [...n.layout.padding, n.layout.gap].filter((v) => v % 4 !== 0);
      if (off.length) report("DS-004", n, `Spacing ${off.join(", ")}px is off the 4px grid.`);
    }

    // Component-level rules
    if (name && INTERACTIVE.has(name) && isInstance) {
      if (n.width < tokens.size["touch-target-min"] || n.height < tokens.size["touch-target-min"]) {
        // Inputs are wide; only their height matters. Buttons need both.
        const tooSmall = name === "Input" ? n.height < 44 : true;
        if (tooSmall) report("A11Y-002", n, `${name} is ${Math.round(n.width)}×${Math.round(n.height)}px; minimum is 44×44px.`);
      }
    }
    if (name === "Button" && isInstance) {
      const texts = collectText(n);
      if (texts.length === 0 && !n.a11yLabel?.trim()) {
        report("A11Y-004", n, "Icon-only button has no accessible label.");
      }
    }
    if (name === "Input" && isInstance) {
      const texts = collectText(n);
      if (!texts.some((t) => /^label$/i.test(t.name))) report("A11Y-005", n, "Input has no visible \"Label\" text layer.");
      if (n.componentProps?.type === "password") {
        const value = texts.find((t) => /^value$/i.test(t.name));
        if (value && /[^•●*\s]/.test(value.text!.characters)) {
          report("SEC-004", n, "Password value is displayed in plain text.");
        }
      }
    }

    // Text rules
    if (isText) {
      const t = n.text!;
      const color = fill ?? { r: 0, g: 0, b: 0 };
      const ratio = contrastRatio(color, bg);
      const large = t.fontSize >= 24 || (t.fontSize >= 18.66 && t.fontWeight >= 700);
      const min = large ? 3 : 4.5;
      if (ratio < min) {
        report("A11Y-001", n, `Contrast ${ratio.toFixed(2)}:1 (${toHex(color)} on ${toHex(bg)}) is below ${min}:1.`);
      }
      if (t.fontSize < 12) report("A11Y-003", n, `Font size ${t.fontSize}px is below 12px.`);
      if (t.fontFamily && t.fontFamily !== tokens.font.family) {
        report("DS-002", n, `Font "${t.fontFamily}" is not ${tokens.font.family}.`);
      }

      const s = t.characters;
      if (SECRET_PATTERNS.some((re) => re.test(s))) report("SEC-001", n, "Text looks like a secret or credential.");
      for (const m of s.match(EMAIL) ?? []) {
        if (!SAFE_EMAIL_DOMAIN.test(m)) report("SEC-002", n, `Email "${m}" may be real PII — use example.com.`);
      }
      if (SSN.test(s)) report("SEC-002", n, "Text contains an SSN-like number.");
      for (const m of s.match(CARD) ?? []) {
        const digits = m.replace(/\D/g, "");
        if (digits.length >= 13 && luhn(digits) && !TEST_CARDS.has(digits)) {
          report("SEC-002", n, "Text contains a valid-looking card number.");
        }
      }
      if (HTTP_URL.test(s)) report("SEC-003", n, "Insecure http:// URL.");
    }

    // Children see this node's fill as their background.
    const nextBg = !isText && fill ? fill : bg;
    n.children?.forEach((c) => visit(c, nextBg));
  };

  roots.forEach((r) => visit(r, WHITE));

  const errors = issues.filter((i) => i.severity === "error").length;
  return {
    passed: errors === 0,
    summary: { errors, warnings: issues.length - errors, nodesChecked },
    issues,
  };
}
