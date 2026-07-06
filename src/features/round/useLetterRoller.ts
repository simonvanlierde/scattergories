import { useRef, useState } from "react";
import { pickRandom } from "@/domain/game/utils";
import { getLocaleLetters } from "@/i18n/localeRegistry";
import { prefersReducedMotion, runRoll } from "./rollAnimation";

const INITIAL_LETTER = "?";

export function useLetterRoller(locale: string) {
  const [letter, setLetter] = useState(INITIAL_LETTER);
  const [visible, setVisible] = useState(false);
  const [landing, setLanding] = useState(false);
  const spinIdRef = useRef(0);

  const spinTo = (finalLetter: string, onLanded: () => void) => {
    const spinId = spinIdRef.current + 1;
    spinIdRef.current = spinId;

    setVisible(true);
    setLanding(false);
    setLetter(finalLetter);

    // Skip animation when the user prefers reduced motion — snap straight to result.
    if (prefersReducedMotion()) {
      setLanding(true);
      onLanded();
      return;
    }

    const currentLetters = getLocaleLetters(locale);
    runRoll({
      onFlip: () => {
        setLetter(pickRandom(currentLetters));
      },
      onLanded: () => {
        setLetter(finalLetter);
        setLanding(true);
        onLanded();
      },
      spinId,
      spinIdRef,
    });
  };

  const reset = () => {
    spinIdRef.current += 1;
    setLetter(INITIAL_LETTER);
    setVisible(false);
    setLanding(false);
  };

  return { letter, visible, landing, spinTo, reset };
}
