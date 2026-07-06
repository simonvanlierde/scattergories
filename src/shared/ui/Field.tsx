import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { useId } from "react";
import { cx } from "./cx";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Field({ label, suffix, id, className, ref, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const control = <input ref={ref} id={inputId} className="ds-field__control" {...rest} />;

  return (
    <div className={cx("ds-field", className)}>
      <label className="ds-field__label" htmlFor={inputId}>
        {label}
      </label>
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
