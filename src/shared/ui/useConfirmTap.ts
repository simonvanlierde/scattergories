import { useEffect, useState } from "react";

const ARM_MS = 3000;

/**
 * Two-tap guard for destructive actions: the first tap arms, the second (within
 * 3s) fires. Returns the armed flag and a click handler for the button.
 */
export function useConfirmTap(action: () => void) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) {
      return;
    }
    const id = window.setTimeout(() => setArmed(false), ARM_MS);
    return () => window.clearTimeout(id);
  }, [armed]);

  const onClick = () => {
    if (armed) {
      setArmed(false);
      action();
    } else {
      setArmed(true);
    }
  };

  return { armed, onClick };
}
