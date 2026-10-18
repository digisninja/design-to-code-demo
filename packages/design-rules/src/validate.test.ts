import { describe, expect, it } from "vitest";
import { fromHex } from "./color";
import type { DesignNode } from "./types";
import { validate } from "./validate";

const text = (id: string, characters: string, color = "#111827", extra: Partial<DesignNode["text"]> = {}, name = "Text"): DesignNode => ({
  id, name, type: "TEXT", width: 100, height: 20, fills: [fromHex(color)],
  text: { characters, fontSize: 16, fontFamily: "Inter", fontWeight: 400, ...extra },
});

const ids = (roots: DesignNode[]) => validate(roots).issues.map((i) => i.ruleId);

describe("validate", () => {
  it("passes a compliant primary button", () => {
    const btn: DesignNode = {
      id: "1", name: "Button", type: "INSTANCE", componentName: "Button", width: 120, height: 44,
      fills: [fromHex("#4F46E5")], layout: { padding: [12, 16, 12, 16], gap: 8 },
      children: [text("2", "Save", "#FFFFFF")],
    };
    expect(validate([btn]).passed).toBe(true);
    expect(ids([btn])).toEqual([]);
  });

  it("flags low contrast, small target, off-token colour", () => {
    const btn: DesignNode = {
      id: "1", name: "Button", type: "INSTANCE", componentName: "Button", width: 80, height: 32,
      fills: [fromHex("#A5B4FC")], children: [text("2", "Go", "#FFFFFF")],
    };
    expect(ids([btn])).toEqual(expect.arrayContaining(["A11Y-001", "A11Y-002", "DS-001"]));
  });

  it("requires a label on icon-only buttons", () => {
    const btn: DesignNode = { id: "1", name: "Button", type: "INSTANCE", componentName: "Button", width: 44, height: 44, fills: [fromHex("#4F46E5")] };
    expect(ids([btn])).toContain("A11Y-004");
    expect(ids([{ ...btn, a11yLabel: "Close" }])).not.toContain("A11Y-004");
  });

  it("detects secrets, PII and http links", () => {
    const frame: DesignNode = {
      id: "f", name: "Settings", type: "FRAME", width: 400, height: 400, fills: [fromHex("#FFFFFF")],
      children: [
        text("a", "API key: sk-proj-abcdefghijklmnop1234"),
        text("b", "Contact john.smith@acme.io"),
        text("c", "SSN 123-45-6789"),
        text("d", "Card 4111 1111 1111 1111"),
        text("e", "Docs at http://acme.io/docs"),
        text("ok", "jane@example.com · 4242 4242 4242 4242"),
      ],
    };
    const r = validate([frame]);
    const byNode = (id: string) => r.issues.filter((i) => i.nodeId === id).map((i) => i.ruleId);
    expect(byNode("a")).toContain("SEC-001");
    expect(byNode("b")).toContain("SEC-002");
    expect(byNode("c")).toContain("SEC-002");
    expect(byNode("d")).toContain("SEC-002");
    expect(byNode("e")).toContain("SEC-003");
    expect(byNode("ok")).toEqual([]);
  });

  it("enforces input label and password masking", () => {
    const input: DesignNode = {
      id: "i", name: "Input", type: "INSTANCE", componentName: "Input", componentProps: { type: "password" },
      width: 320, height: 72, children: [text("v", "hunter2", "#111827", {}, "Value")],
    };
    expect(ids([input])).toEqual(expect.arrayContaining(["A11Y-005", "SEC-004"]));
  });

  it("flags detached components, off-grid spacing, fonts and tiny text", () => {
    const frame: DesignNode = {
      id: "d", name: "Button", type: "FRAME", width: 120, height: 44, fills: [fromHex("#4F46E5")],
      layout: { padding: [10, 15, 10, 15], gap: 6 },
      children: [text("t", "Hi", "#FFFFFF", { fontFamily: "Comic Sans MS", fontSize: 10 })],
    };
    expect(ids([frame])).toEqual(expect.arrayContaining(["DS-003", "DS-004", "DS-002", "A11Y-003"]));
  });
});
