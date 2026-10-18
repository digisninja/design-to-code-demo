// Generates src/tokens.css from the shared tokens.json so code, Figma
// variables and the validator all read the same values.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../../design-rules/src/tokens.json", import.meta.url));
const out = fileURLToPath(new URL("../src/tokens.css", import.meta.url));
const t = JSON.parse(readFileSync(src, "utf8"));

const lines = [];
for (const [k, v] of Object.entries(t.color)) lines.push(`  --color-${k}: ${v};`);
for (const [k, v] of Object.entries(t.space)) lines.push(`  --space-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.radius)) lines.push(`  --radius-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.font.size)) lines.push(`  --font-size-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.font.weight)) lines.push(`  --font-weight-${k}: ${v};`);
for (const [k, v] of Object.entries(t.size)) lines.push(`  --size-${k}: ${v}px;`);
lines.push(`  --font-family: "${t.font.family}", system-ui, sans-serif;`);

writeFileSync(out, `/* AUTO-GENERATED from packages/design-rules/src/tokens.json — do not edit. */\n:root {\n${lines.join("\n")}\n}\n`);
console.log(`tokens.css written (${lines.length} variables)`);
