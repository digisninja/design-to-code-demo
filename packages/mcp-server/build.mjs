import * as esbuild from "esbuild";

// @dtc/design-rules ships as TS source, so it is bundled in; the MCP SDK and
// zod stay external and resolve from node_modules at runtime.
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.js",
  platform: "node",
  format: "esm",
  target: "node20",
  external: ["@modelcontextprotocol/sdk", "@modelcontextprotocol/sdk/*", "zod"],
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
});
