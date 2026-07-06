import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { clampInt } from "@/domain/game/utils";
import { useDebouncedCommit } from "@/shared/lib/useDebouncedCommit";
import { Field } from "./Field";

interface DebouncedNumberFieldProps {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  fallback: number;
  suffix?: ReactNode;
  onCommit: (value: string) => void;
}

// A numeric field that types freely (local draft), debounces the clamped commit
// while typing, and flushes a clamped commit immediately on blur or unmount —
// e.g. the popover closing via an outside click while the field still has focus.
// biome-ignore lint/complexity/noExcessiveLinesPerFunction: self-contained draft/commit/flush-on-unmount logic is one cohesive unit.
export function DebouncedNumberField({
  id,
  label,
  value,
  min,
  max,
  fallback,
  suffix,
  onCommit,
}: DebouncedNumberFieldProps) {
  const [draft, setDraft] = useState(value);
  const isFocusedRef = useRef(false);

  // Reflect external changes to the prop while the user is not editing.
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  const { schedule, cancel } = useDebouncedCommit((raw: string) =>
    onCommit(String(clampInt(raw, min, max, fallback))),
  );

  // Cancel any pending debounce and commit the clamped value now.
  // Shared by blur and the flush-on-unmount effect below.
  const commitClamped = (raw: string) => {
    cancel();
    const clamped = String(clampInt(raw, min, max, fallback));
    onCommit(clamped);
    return clamped;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraft(next);
    schedule(next);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setDraft(commitClamped(draft));
  };

  // Enter commits (by blurring the field).
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  // Refs keep the unmount cleanup (empty deps) pointed at the latest values.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const commitClampedRef = useRef(commitClamped);
  commitClampedRef.current = commitClamped;
  useEffect(
    () => () => {
      commitClampedRef.current(draftRef.current);
    },
    [],
  );

  return (
    <Field
      className="ds-field--inline"
      id={id}
      label={label}
      type="number"
      inputMode="numeric"
      value={draft}
      min={min}
      max={max}
      suffix={suffix}
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
