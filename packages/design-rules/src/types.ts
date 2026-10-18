/**
 * A tool-agnostic snapshot of a design node. The Figma plug-in serialises
 * SceneNodes into this shape; the MCP server and CI validate the same shape,
 * so a rule behaves identically in Figma, in the IDE and in the pipeline.
 */
export interface RGBA {
  r: number; // 0..1
  g: number;
  b: number;
  a?: number;
}

export interface DesignNode {
  id: string;
  name: string;
  type: string; // FRAME | TEXT | INSTANCE | COMPONENT | RECTANGLE | ...
  width: number;
  height: number;
  /** Solid fills only (gradients/images are ignored by colour rules). */
  fills?: RGBA[];
  strokes?: RGBA[];
  /** Name of the main component when this node is an INSTANCE/COMPONENT. */
  componentName?: string;
  /** Instance/component property values, e.g. { variant: "primary", type: "password" }. */
  componentProps?: Record<string, string | boolean>;
  /** Accessible label recorded by the designer (plug-in data "a11y-label"). */
  a11yLabel?: string;
  /** Auto-layout spacing, when present. */
  layout?: { padding: [number, number, number, number]; gap: number };
  text?: {
    characters: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
  };
  children?: DesignNode[];
}

export type RuleCategory = "accessibility" | "security" | "design-system";
export type Severity = "error" | "warning";

export interface RuleMeta {
  id: string;
  title: string;
  category: RuleCategory;
  severity: Severity;
  description: string;
  rationale: string;
  /** How to fix it — shown in the plug-in, Storybook and returned to the AI. */
  fix: string;
  reference?: string;
}

export interface Issue {
  ruleId: string;
  severity: Severity;
  category: RuleCategory;
  nodeId: string;
  nodeName: string;
  message: string;
  fix: string;
}

export interface ValidationResult {
  passed: boolean;
  summary: { errors: number; warnings: number; nodesChecked: number };
  issues: Issue[];
}
