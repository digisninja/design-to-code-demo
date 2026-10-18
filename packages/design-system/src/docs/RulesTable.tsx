import { RULES, type RuleCategory } from "@dtc/design-rules";

const LABEL: Record<RuleCategory, string> = {
  accessibility: "♿ Accessibility",
  security: "🔒 Security",
  "design-system": "🎨 Design system",
};

export function RulesTable({ category }: { category: RuleCategory }) {
  const rows = RULES.filter((r) => r.category === category);
  return (
    <div className="ds-root">
      <h2>{LABEL[category]}</h2>
      {rows.map((r) => (
        <div key={r.id} style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <code>{r.id}</code>
            <strong>{r.title}</strong>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: r.severity === "error" ? "#B91C1C" : "#92400E" }}>
              {r.severity.toUpperCase()}
            </span>
          </div>
          <p style={{ margin: "8px 0" }}>{r.description}</p>
          <p style={{ margin: "4px 0", color: "#374151" }}><em>Why:</em> {r.rationale}</p>
          <p style={{ margin: "4px 0", color: "#374151" }}><em>Fix:</em> {r.fix}</p>
          {r.reference && <p style={{ margin: "4px 0", fontSize: 12, color: "#6B7280" }}>{r.reference}</p>}
        </div>
      ))}
    </div>
  );
}
