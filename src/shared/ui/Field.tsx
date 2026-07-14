import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { useId } from "react";
import { cx } from "./cx";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: ReactNode;
  /** One line explaining what the setting does; sits under the label, tied via aria-describedby. */
  hint?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Field({ label, suffix, hint, id, className, ref, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  const control = (
    <input
      ref={ref}
      id={inputId}
      className="ds-field__control"
      aria-describedby={hint ? hintId : undefined}
      {...rest}
    />
  );

  const labelEl = (
    <label className="ds-field__label" htmlFor={inputId}>
      {label}
    </label>
  );

  return (
    <div className={cx("ds-field", className)}>
      {hint ? (
        <div className="ds-field__text">
          {labelEl}
          <p className="ds-field__hint" id={hintId}>
            {hint}
          </p>
        </div>
      ) : (
        labelEl
      )}
      {suffix ? (
        <div className="ds-field__inline">
          {control}
          <span className="ds-field__suffix" aria-hidden="true">
            {suffix}
          </span>
        </div>
      ) : (
        control
      )}
    </div>
  );
}
