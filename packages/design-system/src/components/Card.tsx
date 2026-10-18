import type { ReactNode } from "react";

export interface CardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Card({ title, children, footer }: CardProps) {
  return (
    <section className="ds-card">
      {title && <h3 className="ds-card__title">{title}</h3>}
      <div className="ds-card__body">{children}</div>
      {footer && <div className="ds-card__footer">{footer}</div>}
    </section>
  );
}
