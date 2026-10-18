/**
 * Component contracts — the "requirements" shared by Figma (component +
 * property names), Storybook (docs) and code (React props). The MCP server
 * hands these to Claude / Cursor so generated code uses the real components.
 */
export interface PropSpec {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export interface ComponentSpec {
  name: string;
  figmaName: string;
  description: string;
  importPath: string;
  sourcePath: string;
  storyId: string;
  props: PropSpec[];
  /** Figma variant property name → allowed values (must match the React prop values). */
  variants: Record<string, string[]>;
  usage: { do: string[]; dont: string[] };
  /** Rule IDs that specifically govern this component. */
  rules: string[];
  example: string;
}

const IMPORT = "@dtc/design-system";

export const COMPONENTS: ComponentSpec[] = [
  {
    name: "Button",
    figmaName: "Button",
    description: "Triggers an action. One primary button per view.",
    importPath: IMPORT,
    sourcePath: "packages/design-system/src/components/Button.tsx",
    storyId: "components-button--docs",
    props: [
      { name: "variant", type: "'primary' | 'secondary' | 'danger'", default: "'primary'", description: "Visual emphasis." },
      { name: "size", type: "'sm' | 'md' | 'lg'", default: "'md'", description: "Height 36 / 44 / 52px. Use sm only in dense desktop tables." },
      { name: "children", type: "ReactNode", description: "Visible label. Omit only for icon buttons." },
      { name: "icon", type: "ReactNode", description: "Optional leading icon." },
      { name: "aria-label", type: "string", description: "Required when there is no visible label (A11Y-004)." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables interaction." },
    ],
    variants: { variant: ["primary", "secondary", "danger"], size: ["sm", "md", "lg"] },
    usage: {
      do: ["Use a verb: \"Save changes\"", "Use danger only for destructive actions"],
      dont: ["Don't place two primary buttons side by side", "Don't use sm on touch devices (A11Y-002)"],
    },
    rules: ["A11Y-001", "A11Y-002", "A11Y-004", "DS-001", "DS-003"],
    example: `<Button variant="primary" onClick={save}>Save changes</Button>`,
  },
  {
    name: "Input",
    figmaName: "Input",
    description: "Single-line text field with label, helper and error text.",
    importPath: IMPORT,
    sourcePath: "packages/design-system/src/components/Input.tsx",
    storyId: "components-input--docs",
    props: [
      { name: "label", type: "string", required: true, description: "Visible label (A11Y-005)." },
      { name: "type", type: "'text' | 'email' | 'password'", default: "'text'", description: "password renders a masked field (SEC-004)." },
      { name: "helperText", type: "string", description: "Hint shown below the field." },
      { name: "error", type: "string", description: "Error message; sets aria-invalid and replaces helperText." },
      { name: "placeholder", type: "string", description: "Example value — never a substitute for label." },
    ],
    variants: { type: ["text", "email", "password"], state: ["default", "error", "disabled"] },
    usage: {
      do: ["Always provide a label", "Use example.com addresses in placeholders (SEC-002)"],
      dont: ["Don't show plain-text passwords (SEC-004)", "Don't rely on placeholder as label"],
    },
    rules: ["A11Y-001", "A11Y-002", "A11Y-005", "SEC-002", "SEC-004"],
    example: `<Input label="Email" type="email" placeholder="jane@example.com" />`,
  },
  {
    name: "Card",
    figmaName: "Card",
    description: "Groups related content with an optional title and footer actions.",
    importPath: IMPORT,
    sourcePath: "packages/design-system/src/components/Card.tsx",
    storyId: "components-card--docs",
    props: [
      { name: "title", type: "string", description: "Card heading, rendered as <h3>." },
      { name: "children", type: "ReactNode", required: true, description: "Body content." },
      { name: "footer", type: "ReactNode", description: "Actions area, typically Buttons." },
    ],
    variants: {},
    usage: { do: ["Keep one topic per card"], dont: ["Don't nest cards"] },
    rules: ["A11Y-001", "DS-001", "DS-004"],
    example: `<Card title="Plan" footer={<Button>Upgrade</Button>}>You are on Free.</Card>`,
  },
  {
    name: "Alert",
    figmaName: "Alert",
    description: "Inline status message.",
    importPath: IMPORT,
    sourcePath: "packages/design-system/src/components/Alert.tsx",
    storyId: "components-alert--docs",
    props: [
      { name: "tone", type: "'info' | 'success' | 'warning' | 'error'", default: "'info'", description: "error/warning use role=alert; others role=status." },
      { name: "title", type: "string", description: "Bold summary line." },
      { name: "children", type: "ReactNode", required: true, description: "Message body." },
    ],
    variants: { tone: ["info", "success", "warning", "error"] },
    usage: { do: ["Say what happened and what to do next"], dont: ["Don't convey meaning by colour alone"] },
    rules: ["A11Y-001", "DS-001"],
    example: `<Alert tone="success" title="Saved">Your changes are live.</Alert>`,
  },
];

export const COMPONENT_NAMES = COMPONENTS.map((c) => c.figmaName);
