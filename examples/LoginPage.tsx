// Implements Figma export 2026-10-18T20-48-34-898Z-14b4e9cd ("Login – clean").
// Built only from @dtc/design-system components and tokens.
import type { FormEvent } from "react";
import { Alert, Button, Input } from "@dtc/design-system";

export interface LoginPageProps {
  onSubmit?: (values: { email: string; password: string }) => void;
}

export function LoginPage({ onSubmit }: LoginPageProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit?.({ email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        display: "grid",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
        background: "var(--color-neutral-0)",
        border: "1px solid var(--color-neutral-300)",
        borderRadius: "var(--radius-lg)",
        fontFamily: "var(--font-family)",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "var(--font-size-xl)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--color-neutral-900)",
        }}
      >
        Sign in
      </h1>
      <Alert tone="info" title="Heads up">Use your work email to sign in.</Alert>
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="jane@example.com"
        helperText="We'll never share your email."
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        helperText="At least 8 characters."
        minLength={8}
        required
      />
      <Button type="submit" style={{ width: "100%" }}>Sign in</Button>
    </form>
  );
}
