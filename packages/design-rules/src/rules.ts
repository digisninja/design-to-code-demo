import type { RuleMeta } from "./types";

/**
 * Every rule enforced across the pipeline. Add a rule here and it appears in
 * the Figma plug-in, the Storybook "Rules" page and the MCP `get_design_rules`
 * tool — then implement its check in validate.ts.
 */
export const RULES: RuleMeta[] = [
  // ── Accessibility ────────────────────────────────────────────────────────
  {
    id: "A11Y-001",
    title: "Text colour contrast",
    category: "accessibility",
    severity: "error",
    description: "Text must have a contrast ratio of at least 4.5:1 against its background (3:1 for large text ≥ 24px, or ≥ 18.66px bold).",
    rationale: "Low-contrast text is unreadable for people with low vision or in bright light.",
    fix: "Use a darker text token (e.g. neutral-900 / neutral-700) or a lighter background token.",
    reference: "WCAG 2.2 SC 1.4.3",
  },
  {
    id: "A11Y-002",
    title: "Minimum touch target",
    category: "accessibility",
    severity: "error",
    description: "Interactive components (Button, Input) must be at least 44×44px.",
    rationale: "Small targets are hard to hit for people with motor impairments and on touch screens.",
    fix: "Use size md or lg, or increase padding so the hit area is ≥ 44px.",
    reference: "WCAG 2.2 SC 2.5.8 / Apple HIG",
  },
  {
    id: "A11Y-003",
    title: "Minimum font size",
    category: "accessibility",
    severity: "warning",
    description: "Text must be at least 12px.",
    rationale: "Very small text is hard to read and often fails zoom/readability checks.",
    fix: "Use the xs (12px) token or larger.",
  },
  {
    id: "A11Y-004",
    title: "Icon-only buttons need an accessible label",
    category: "accessibility",
    severity: "error",
    description: "A Button with no visible text must carry an accessible label (plug-in field \"Accessible label\").",
    rationale: "Screen readers announce unlabeled icon buttons as just \"button\".",
    fix: "Select the button and set an Accessible label in the plug-in, or add visible text.",
    reference: "WCAG 2.2 SC 4.1.2",
  },
  {
    id: "A11Y-005",
    title: "Inputs need a visible label",
    category: "accessibility",
    severity: "error",
    description: "Every Input must contain a visible text layer named \"Label\".",
    rationale: "Placeholder text disappears on typing and is not a substitute for a label.",
    fix: "Turn on the Input's label property or add a text layer named \"Label\".",
    reference: "WCAG 2.2 SC 3.3.2",
  },

  // ── Security ─────────────────────────────────────────────────────────────
  {
    id: "SEC-001",
    title: "No secrets in designs",
    category: "security",
    severity: "error",
    description: "Text layers must not contain API keys, tokens or passwords (e.g. sk-…, AKIA…, ghp_…, password=…).",
    rationale: "Designs are shared widely and exported to AI tools and code — a pasted secret leaks everywhere.",
    fix: "Replace with an obvious placeholder such as \"sk-••••••••\" and rotate the leaked credential.",
  },
  {
    id: "SEC-002",
    title: "No real personal data",
    category: "security",
    severity: "error",
    description: "Mock content must not contain real-looking PII: emails outside example.com/.org/.net, SSNs, or valid card numbers.",
    rationale: "Real customer data in mockups is a privacy breach (GDPR/CCPA) and ends up in generated code and fixtures.",
    fix: "Use reserved test data: jane@example.com, 000-00-0000, 4242 4242 4242 4242 (Stripe test card is allowed).",
  },
  {
    id: "SEC-003",
    title: "Links must use HTTPS",
    category: "security",
    severity: "warning",
    description: "URLs shown in designs must use https://.",
    rationale: "Insecure URLs in designs get copied verbatim into code.",
    fix: "Change http:// to https://.",
  },
  {
    id: "SEC-004",
    title: "Password fields must be masked",
    category: "security",
    severity: "error",
    description: "An Input with type=password must display masked characters (•) in its value layer.",
    rationale: "Showing plain-text passwords encourages insecure implementations and shoulder-surfing.",
    fix: "Set the Input's value to bullets (••••••••) or leave it empty.",
  },

  // ── Design system ────────────────────────────────────────────────────────
  {
    id: "DS-001",
    title: "Colours must come from tokens",
    category: "design-system",
    severity: "warning",
    description: "Solid fills and text colours must match a colour token.",
    rationale: "Off-palette colours break theming and drift from the coded components.",
    fix: "Apply the nearest colour token / Figma variable instead of a raw hex value.",
  },
  {
    id: "DS-002",
    title: "Use the system typeface",
    category: "design-system",
    severity: "warning",
    description: "Text must use the token font family (Inter).",
    rationale: "Unapproved fonts aren't loaded in the product and may have licensing issues.",
    fix: "Change the font family to Inter.",
  },
  {
    id: "DS-003",
    title: "Use library components",
    category: "design-system",
    severity: "warning",
    description: "Frames named like a library component (Button, Input, Card, Alert) must be instances of that component, not detached copies.",
    rationale: "Detached components don't receive updates and can't be mapped to code by the AI.",
    fix: "Replace the frame with an instance from the Design System library.",
  },
  {
    id: "DS-004",
    title: "Spacing on the 4px grid",
    category: "design-system",
    severity: "warning",
    description: "Auto-layout padding and gap must be multiples of 4px.",
    rationale: "Off-grid spacing can't be expressed with space tokens.",
    fix: "Round padding/gap to the nearest space token (4, 8, 12, 16, 24…).",
  },
];

export const RULES_BY_ID: Record<string, RuleMeta> = Object.fromEntries(RULES.map((r) => [r.id, r]));
