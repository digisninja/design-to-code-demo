// Example screen built only from @dtc/design-system — the target Claude / Cursor
// edit during the demo ("add a password field", "implement the latest Figma export").
import { Alert, Button, Card, Input } from "@dtc/design-system";

export function SettingsPage() {
  return (
    <div style={{ maxWidth: 480, display: "grid", gap: "var(--space-4)", padding: "var(--space-6)" }}>
      <Alert tone="info" title="Profile">These details are visible to your team.</Alert>
      <Card
        title="Account"
        footer={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button>Save changes</Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <Input label="Full name" placeholder="Jane Doe" />
          <Input label="Email" type="email" placeholder="jane@example.com" helperText="We'll send a confirmation link." />
        </div>
      </Card>
    </div>
  );
}
