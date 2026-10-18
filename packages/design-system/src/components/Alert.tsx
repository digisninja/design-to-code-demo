import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "error";

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

export function Alert({ tone = "info", title, children }: AlertProps) {
  const urgent = tone === "error" || tone === "warning";
  return (
    <div className={`ds-alert ds-alert--${tone}`} role={urgent ? "alert" : "status"}>
      {title && <span className="ds-alert__title">{title}</span>}
      <span>{children}</span>
    </div>
  );
}
