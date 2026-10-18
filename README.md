# Design → Code

An end-to-end demo of a **governed design-to-code pipeline**:

```
 Figma (DS components)                     Storybook (requirements + rules)
        │                                              ▲
        ▼                                              │ same data
 🛡️ Design Guard plug-in ──push──▶  design-to-code MCP server ──▶ Claude Code / Cursor ──▶ GitHub PR ──▶ CI
   a11y · security · DS rules        (specs, tokens, rules,        implement with           re-validates,
   blocks hand-off on errors          latest Figma export)         @dtc/design-system       deploys Storybook
        └──────────────── all import @dtc/design-rules (single source of truth) ────────────────┘
```

**Main idea:** the rules live in **one package**, `packages/design-rules`. The Figma plug-in, the Storybook docs, the MCP server and CI all import the same `RULES`, `COMPONENTS`, `tokens` and `validate()`. So rule `SEC-002` means the same thing in Figma, in the IDE and in the pipeline.

## Repo layout

| Path | What |
| --- | --- |
| `packages/design-rules` | Tokens, component specs and 13 rules (Accessibility, Security, Design system), plus the `validate()` engine and unit tests |
| `packages/design-system` | React components (Button, Input, Card, Alert) and the Storybook site: Rules, Tokens, and each component's requirements |
| `packages/figma-plugin` | **Design Guard**: checks the selection or page, click an issue to jump to its layer, sets accessible labels, pushes clean designs to the MCP server |
| `packages/mcp-server` | Custom MCP server (stdio), plus a localhost bridge (`:4848`) that receives exports from the plug-in |
| `examples/` | App screens built from the design system; the AI edits these |
| `.mcp.json`, `CLAUDE.md` | Claude Code wiring |
| `.cursor/mcp.json`, `.cursor/rules/` | Cursor wiring |
| `.github/` | CI (tests, typecheck, builds, Storybook to GitHub Pages) and the PR rules checklist |

## Rules

| ID | Rule | Severity |
| --- | --- | --- |
| A11Y-001 | Text contrast ≥ 4.5:1 (3:1 for large text) | error |
| A11Y-002 | Touch target ≥ 44×44 | error |
| A11Y-003 | Font size ≥ 12px | warning |
| A11Y-004 | Icon-only buttons have an accessible label | error |
| A11Y-005 | Inputs have a visible label | error |
| SEC-001 | No secrets/API keys in text | error |
| SEC-002 | No real PII (emails, SSN, card numbers) | error |
| SEC-003 | Links use HTTPS | warning |
| SEC-004 | Password fields are masked | error |
| DS-001 | Colours come from tokens | warning |
| DS-002 | Inter typeface | warning |
| DS-003 | Use library instances, not detached copies | warning |
| DS-004 | Spacing on the 4px grid | warning |

## Setup

```bash
npm install
```

```bash
npm run build
```

```bash
npm test
```

```bash
npm run storybook
```

- **MCP server:** Claude Code picks up `.mcp.json`, and Cursor picks up `.cursor/mcp.json`. Both start `node packages/mcp-server/dist/index.js`, which also opens the plug-in bridge on `http://localhost:4848`. To run the server on its own, use `npm run mcp`.
- **Figma plug-in:** in Figma desktop, go to *Plugins → Development → Import plugin from manifest…* and choose `packages/figma-plugin/manifest.json`. Run `npm run plugin:watch` while you're editing it.

### MCP tools

| Tool | Purpose |
| --- | --- |
| `list_components` / `get_component_spec` | Props, variants, do/don't, the rules that apply, source path, Storybook link |
| `get_design_rules` / `get_design_tokens` | The rule catalogue and tokens |
| `validate_design` | Runs the same validator the plug-in uses |
| `list_figma_exports` / `get_figma_export` | Designs pushed from Figma, with a screenshot |
| Prompt `implement_figma_design` | A step-by-step brief: export → specs → code → validate → PR |

## 5-minute interview demo script

1. **The problem (30s).** Design hand-offs leak accessibility bugs, real customer data and pasted secrets into code, and AI coding tools copy whatever they're shown. We move the guardrails *left*, into Figma, and give the AI the *contract* instead of a picture.
2. **Figma + Design Guard (90s).** Open the *Login – broken* frame and run Design Guard. It shows:
   - contrast 2.0:1 (A11Y-001)
   - a 32px button (A11Y-002)
   - `john.smith@acme.io` (SEC-002)
   - a plain-text password (SEC-004)
   - an `sk-proj-…` key (SEC-001)

   **Push is blocked.** Click an issue to jump to its layer. Then show *Login – clean*: everything passes, so push it to the MCP server.
3. **Storybook (45s).** Open *Rules*: the same IDs and the same fixes. Then *Components → Input*: the Figma variants map to React props, and the panel lists the rules enforced.
4. **Claude Code (90s).** Ask: *"Implement the latest Figma export as `examples/LoginPage.tsx`."* Claude calls `get_figma_export`, `get_component_spec` and `validate_design`, writes code with `<Input label type="password">` and `<Button>`, runs `npm test`, and opens a PR.
5. **Cursor (30s).** Ask the same MCP for a change, e.g. *"add a 'Forgot password' secondary button"*. This shows the pipeline isn't tied to one tool.
6. **GitHub (30s).** The PR template has the rules checklist. CI runs the validator tests, typecheck, builds and the Storybook build, then deploys Storybook to GitHub Pages.

**Defence in depth:** the MCP bridge listens only on `127.0.0.1`, re-validates every export on the server and returns 422 if it has errors, limits the request size, and can require a `DTC_BRIDGE_TOKEN`. The plug-in's network access is limited to localhost in `manifest.json`.
