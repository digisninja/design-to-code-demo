import type { CSSProperties } from "react";
import { COMPONENTS, RULES_BY_ID } from "@dtc/design-rules";

const th: CSSProperties = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #D1D5DB" };
const td: CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #F3F4F6", verticalAlign: "top" };

/** Renders the shared component contract — the same data the MCP server serves to AI tools. */
export function SpecPanel({ name }: { name: string }) {
  const spec = COMPONENTS.find((c) => c.name === name);
  if (!spec) return null;
  return (
    <div className="ds-root" style={{ fontSize: 14 }}>
      <h2>Requirements</h2>
      <p>
        Figma component: <code>{spec.figmaName}</code> · Source: <code>{spec.sourcePath}</code>
      </p>
      {Object.keys(spec.variants).length > 0 && (
        <>
          <h3>Figma variants ↔ React props</h3>
          <ul>
            {Object.entries(spec.variants).map(([k, v]) => (
              <li key={k}><code>{k}</code>: {v.map((x) => <code key={x} style={{ marginRight: 6 }}>{x}</code>)}</li>
            ))}
          </ul>
        </>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div><h3>✅ Do</h3><ul>{spec.usage.do.map((d) => <li key={d}>{d}</li>)}</ul></div>
        <div><h3>⛔ Don't</h3><ul>{spec.usage.dont.map((d) => <li key={d}>{d}</li>)}</ul></div>
      </div>
      <h3>Rules enforced (Figma plug-in · MCP · CI)</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead><tr><th style={th}>ID</th><th style={th}>Rule</th><th style={th}>Severity</th><th style={th}>Fix</th></tr></thead>
        <tbody>
          {spec.rules.map((id) => {
            const r = RULES_BY_ID[id];
            return (
              <tr key={id}>
                <td style={td}><code>{r.id}</code></td>
                <td style={td}>{r.title}</td>
                <td style={td}>{r.severity}</td>
                <td style={td}>{r.fix}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
