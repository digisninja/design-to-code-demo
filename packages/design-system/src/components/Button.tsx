import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

/** A11Y-004: an icon-only button must have an aria-label — enforced by the type. */
export type ButtonProps =
  | (BaseProps & { children: ReactNode })
  | (BaseProps & { children?: undefined; icon: ReactNode; "aria-label": string });

export function Button({ variant = "primary", size = "md", icon, children, className, type = "button", ...rest }: ButtonProps) {
  const cls = ["ds-button", `ds-button--${variant}`, `ds-button--${size}`, className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
