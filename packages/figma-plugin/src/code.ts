/// <reference types="@figma/plugin-typings" />
import { validate, type DesignNode, type RGBA, type ValidationResult } from "@dtc/design-rules";

const LABEL_KEY = "a11y-label";

figma.showUI(__html__, { width: 380, height: 600, themeColors: true });

function solid(paints: ReadonlyArray<Paint> | PluginAPI["mixed"] | undefined): RGBA[] | undefined {
  if (!paints || paints === figma.mixed) return undefined;
  const out = (paints as ReadonlyArray<Paint>)
    .filter((p): p is SolidPaint => p.type === "SOLID" && p.visible !== false)
    .map((p) => ({ r: p.color.r, g: p.color.g, b: p.color.b, a: p.opacity ?? 1 }));
  return out.length ? out : undefined;
}

async function serialize(node: SceneNode): Promise<DesignNode | null> {
  if (!node.visible) return null;
  const out: DesignNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: "width" in node ? node.width : 0,
    height: "height" in node ? node.height : 0,
  };

  if ("fills" in node) out.fills = solid(node.fills as ReadonlyArray<Paint> | PluginAPI["mixed"]);
  if ("strokes" in node) out.strokes = solid(node.strokes);

  const label = node.getPluginData(LABEL_KEY);
  if (label) out.a11yLabel = label;

  if (node.type === "INSTANCE") {
    const main = await node.getMainComponentAsync();
    if (main) out.componentName = main.parent?.type === "COMPONENT_SET" ? main.parent.name : main.name;
    const props: Record<string, string | boolean> = {};
    for (const [key, p] of Object.entries(node.componentProperties)) {
      // Text/boolean props are keyed "name#123:0"; variants are plain.
      props[key.split("#")[0].trim().toLowerCase()] = typeof p.value === "boolean" ? p.value : String(p.value).toLowerCase();
    }
    out.componentProps = props;
  } else if (node.type === "COMPONENT") {
    out.componentName = node.parent?.type === "COMPONENT_SET" ? node.parent.name : node.name;
  }

  if ("layoutMode" in node && node.layoutMode !== "NONE") {
    out.layout = {
      padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft],
      gap: node.itemSpacing,
    };
  }

  if (node.type === "TEXT") {
    const seg = node.getStyledTextSegments(["fontName", "fontSize", "fontWeight", "fills"])[0];
    out.text = {
      characters: node.characters,
      fontSize: seg?.fontSize ?? 16,
      fontFamily: seg?.fontName.family ?? "",
      fontWeight: seg?.fontWeight ?? 400,
    };
    if (seg) out.fills = solid(seg.fills);
  }

  if ("children" in node) {
    const kids = await Promise.all(node.children.map(serialize));
    out.children = kids.filter((k): k is DesignNode => k !== null);
  }
  return out;
}

function scope(): readonly SceneNode[] {
  return figma.currentPage.selection.length ? figma.currentPage.selection : figma.currentPage.children;
}

let last: { nodes: DesignNode[]; result: ValidationResult } | null = null;

async function run() {
  const roots = scope();
  const nodes = (await Promise.all(roots.map(serialize))).filter((n): n is DesignNode => n !== null);
  const result = validate(nodes);
  last = { nodes, result };
  const sel = figma.currentPage.selection;
  figma.ui.postMessage({
    type: "result",
    result,
    scope: sel.length ? `${sel.length} selected layer(s)` : `page "${figma.currentPage.name}"`,
    selectedLabel: sel.length === 1 ? sel[0].getPluginData(LABEL_KEY) : null,
    canLabel: sel.length === 1,
  });
}

let timer: ReturnType<typeof setTimeout> | undefined;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(run, 250);
};
figma.on("selectionchange", schedule);
// dynamic-page access: listen to the current page rather than the whole document.
figma.currentPage.on("nodechange", schedule);
figma.on("currentpagechange", () => {
  figma.currentPage.on("nodechange", schedule);
  schedule();
});

figma.ui.onmessage = async (msg: { type: string; [k: string]: unknown }) => {
  switch (msg.type) {
    case "validate":
      return run();

    case "select-node": {
      const node = await figma.getNodeByIdAsync(msg.id as string);
      if (node && "visible" in node) {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      }
      return;
    }

    case "set-label": {
      const sel = figma.currentPage.selection;
      if (sel.length !== 1) return figma.notify("Select exactly one layer to label.");
      sel[0].setPluginData(LABEL_KEY, String(msg.label ?? "").trim());
      figma.notify("Accessible label saved");
      return run();
    }

    case "export": {
      await run();
      if (!last) return;
      if (!last.result.passed) {
        figma.notify("Fix all errors before pushing to code.", { error: true });
        return;
      }
      let screenshot: string | undefined;
      const sel = figma.currentPage.selection;
      if (sel.length === 1) {
        const png = await sel[0].exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 1 } });
        screenshot = figma.base64Encode(png);
      }
      figma.ui.postMessage({
        type: "export-payload",
        payload: {
          source: "figma",
          fileKey: figma.fileKey ?? null,
          fileName: figma.root.name,
          page: figma.currentPage.name,
          exportedAt: new Date().toISOString(),
          nodes: last.nodes,
          validation: last.result,
          screenshot,
        },
      });
      return;
    }

    case "notify":
      figma.notify(String(msg.text), { error: Boolean(msg.error) });
      return;
  }
};

run();
