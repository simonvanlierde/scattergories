import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { useId } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string;
  suffix?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

function joinClassNames(...tokens: (string | false | null | undefined)[]): string {
  return tokens.filter(Boolean).join(' ');
}

function renderHelper(
  error: string | undefined,
  helper: string | undefined,
  helperId: string,
): ReactNode {
  if (error) {
    return (
      <span id={helperId} className="ds-field__helper ds-field__helper--error" role="alert">
        {error}
      </span>
    );
  }
  if (helper) {
    return (
      <span id={helperId} className="ds-field__helper">
        {helper}
      </span>
    );
  }
  return null;
}

export function Field({ label, helper, error, suffix, id, className, ref, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helperId = `${inputId}-helper`;
  const describedBy = helper || error ? helperId : undefined;

  const control = (
    <input
      ref={ref}
      id={inputId}
      className="ds-field__control"
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      {...rest}
    />
  );

  return (
    <div className={joinClassNames('ds-field', className)}>
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
      {renderHelper(error, helper, helperId)}
    </div>
  );
}
