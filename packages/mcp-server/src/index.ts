import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { COMPONENTS, RULES, RULES_BY_ID, tokens, validate, type DesignNode } from "@dtc/design-rules";
import { startBridge } from "./bridge";
import { componentsUsed, listExports, loadExport } from "./store";

const STORYBOOK_URL = (process.env.STORYBOOK_URL ?? "http://localhost:6006").replace(/\/$/, "");

const json = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const fail = (message: string) => ({ content: [{ type: "text" as const, text: message }], isError: true });

const server = new McpServer({ name: "dtc-design-system", version: "0.1.0" });

server.registerTool(
  "list_components",
  {
    title: "List design-system components",
    description: "List every component in @dtc/design-system with its Figma name and one-line description. Use these instead of hand-rolled markup.",
  },
  async () =>
    json(COMPONENTS.map((c) => ({ name: c.name, figmaName: c.figmaName, description: c.description, importPath: c.importPath }))),
);

server.registerTool(
  "get_component_spec",
  {
    title: "Get component spec",
    description: "Full contract for one component: props, Figma variants, usage do/don't, governing rules (with fixes), source path, Storybook docs URL and an example.",
    inputSchema: { name: z.string().describe("Component name, e.g. \"Button\" (case-insensitive; Figma name also accepted)") },
  },
  async ({ name }) => {
    const key = name.trim().toLowerCase();
    const spec = COMPONENTS.find((c) => c.name.toLowerCase() === key || c.figmaName.toLowerCase() === key);
    if (!spec) return fail(`Unknown component "${name}". Available: ${COMPONENTS.map((c) => c.name).join(", ")}`);
    return json({
      ...spec,
      rules: spec.rules.map((id) => RULES_BY_ID[id] ?? { id }),
      storybookUrl: `${STORYBOOK_URL}/?path=/docs/${spec.storyId}`,
    });
  },
);

server.registerTool(
  "get_design_rules",
  {
    title: "Get design rules",
    description: "Accessibility, security and design-system rules enforced in Figma, CI and code review. Each rule includes rationale and how to fix it.",
    inputSchema: { category: z.enum(["accessibility", "security", "design-system"]).optional() },
  },
  async ({ category }) => json(category ? RULES.filter((r) => r.category === category) : RULES),
);

server.registerTool(
  "get_design_tokens",
  {
    title: "Get design tokens",
    description: "Colour, spacing, radius, typography and size tokens. Generated code must use these values (DS-001, DS-002, DS-004).",
  },
  async () => json(tokens),
);

// Loose node schema: required identity fields are checked, everything else is passed to validate() as-is.
const designNode = z
  .object({ id: z.string(), name: z.string(), type: z.string(), width: z.number(), height: z.number() })
  .passthrough();

server.registerTool(
  "validate_design",
  {
    title: "Validate design nodes",
    description: "Run the shared rule engine over DesignNode trees (same checks as the Figma plug-in). Returns pass/fail, counts and issues with fixes.",
    inputSchema: { nodes: z.array(designNode).min(1).describe("DesignNode[] roots, as found in a Figma export's `nodes`") },
  },
  async ({ nodes }) => json(validate(nodes as unknown as DesignNode[])),
);

server.registerTool(
  "list_figma_exports",
  {
    title: "List Figma exports",
    description: "Designs pushed from the Design Guard Figma plug-in, newest first. Only designs that passed validation are stored.",
  },
  async () => json(listExports()),
);

server.registerTool(
  "get_figma_export",
  {
    title: "Get Figma export",
    description: "Fetch one Figma export: the design JSON (node tree + validation), a PNG screenshot when available, and the library components it uses.",
    inputSchema: { id: z.string().default("latest").describe("Export id from list_figma_exports, or \"latest\"") },
  },
  async ({ id }) => {
    const exp = loadExport(id);
    if (!exp) return fail(id === "latest" ? "No Figma exports yet — push one from the Design Guard plug-in." : `Export "${id}" not found.`);
    const { screenshot, ...design } = exp;
    const used = componentsUsed(exp.nodes);
    const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
      { type: "text", text: JSON.stringify(design, null, 2) },
    ];
    if (screenshot) content.push({ type: "image", data: screenshot.replace(/^data:image\/png;base64,/, ""), mimeType: "image/png" });
    content.push({
      type: "text",
      text:
        `Library components used: ${Object.entries(used).map(([n, c]) => `${n} ×${c}`).join(", ") || "none"}.\n` +
        `Call get_component_spec for each before writing code.`,
    });
    return { content };
  },
);

server.registerPrompt(
  "implement_figma_design",
  {
    title: "Implement a Figma design",
    description: "Step-by-step brief for turning a validated Figma export into code with @dtc/design-system, then opening a PR.",
    argsSchema: {
      exportId: z.string().optional().describe("Export id (default: latest)"),
      targetFile: z.string().optional().describe("Where to write the result, e.g. apps/web/src/pages/Settings.tsx"),
    },
  },
  ({ exportId, targetFile }) => {
    const id = exportId || "latest";
    const target = targetFile || "a new file in the most appropriate location (ask if unclear)";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Implement the Figma design export "${id}" in ${target}.`,
              "",
              `1. Call get_figma_export with id "${id}". Study the screenshot and the node tree (layout, text, component props).`,
              "2. For every library component it uses, call get_component_spec. Call get_design_tokens for colours/spacing/type.",
              "3. Implement using ONLY components from @dtc/design-system and token values — no hand-rolled buttons/inputs, no raw hex colours, no off-grid spacing. Map Figma variant properties 1:1 to React props.",
              "4. Carry over accessibility: visible labels on inputs, aria-label on icon-only buttons, masked password fields. Use only placeholder data (example.com emails, no secrets).",
              "5. Call validate_design with the export's nodes (and any nodes you changed) and fix every error. Consult get_design_rules for fixes.",
              "6. Run `npm test` (and `npm run typecheck`) and fix failures.",
              "7. Create a branch (e.g. feat/figma-<short-name>), commit with a message referencing the export id, push, and open a PR summarising which components and rules were applied.",
            ].join("\n"),
          },
        },
      ],
    };
  },
);

startBridge();
await server.connect(new StdioServerTransport());
process.stderr.write("[dtc-mcp] MCP server ready on stdio\n");
