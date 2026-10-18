import { useId, type InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** A11Y-005: required visible label. */
  label: string;
  /** SEC-004: password is always rendered masked by the browser. */
  type?: "text" | "email" | "password";
  helperText?: string;
  error?: string;
}

export function Input({ label, type = "text", helperText, error, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = `${inputId}-desc`;
  const desc = error ?? helperText;
  return (
    <div className="ds-field">
      <label className="ds-field__label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className="ds-field__input"
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={desc ? descId : undefined}
        autoComplete={type === "password" ? "current-password" : rest.autoComplete}
        {...rest}
      />
      {desc && (
        <span id={descId} className={error ? "ds-field__error" : "ds-field__help"} role={error ? "alert" : undefined}>
          {desc}
        </span>
      )}
    </div>
  );
}
