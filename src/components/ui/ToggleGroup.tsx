import type { ReactNode } from 'react';

interface ToggleOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

interface ToggleGroupProps<T extends string> {
  label: string;
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

function joinClassNames(...tokens: (string | false | null | undefined)[]): string {
  return tokens.filter(Boolean).join(' ');
}

export function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: ToggleGroupProps<T>) {
  return (
    <fieldset className={joinClassNames('ds-toggle-group', className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className="ds-toggle-group__option"
            aria-pressed={isSelected}
            aria-label={option.ariaLabel}
            onClick={() => {
              if (!isSelected) {
                onChange(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
