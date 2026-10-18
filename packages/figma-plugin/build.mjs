import { copyFileSync, mkdirSync } from "node:fs";
import * as esbuild from "esbuild";

mkdirSync("dist", { recursive: true });
const copyUi = () => copyFileSync("src/ui.html", "dist/ui.html");

const options = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017", // Figma's plug-in sandbox
  format: "iife",
  logLevel: "info",
  plugins: [{ name: "ui", setup: (b) => b.onEnd(copyUi) }],
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
