import type { MutableRefObject } from 'react';
import { useCallback, useRef, useState } from 'react';
import { pickRandom } from '../game/utils';
import { getLocaleLetters } from '../i18n/localeRegistry';

const SPIN_MS = 1800;
const INITIAL_LETTER = '?';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const BASE_FLIP_INTERVAL_MS = 60;
const FLIP_INTERVAL_SPREAD_MS = 260;

function getFlipInterval(progress: number): number {
  return BASE_FLIP_INTERVAL_MS + progress * progress * FLIP_INTERVAL_SPREAD_MS;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function runSpinAnimation(params: {
  finalLetter: string;
  locale: string;
  onFlip: (letter: string) => void;
  onLanded: () => void;
  session: number;
  sessionRef: MutableRefObject<number>;
}) {
  const currentLetters = getLocaleLetters(params.locale);
  let startTimestamp = 0;
  let lastFlipTimestamp = 0;

  function frame(timestamp: number) {
    if (params.sessionRef.current !== params.session) {
      return;
    }

    if (startTimestamp === 0) {
      startTimestamp = timestamp;
      lastFlipTimestamp = timestamp;
    }

    const elapsed = timestamp - startTimestamp;
    const progress = Math.min(elapsed / SPIN_MS, 1);
    const flipInterval = getFlipInterval(progress);

    if (timestamp - lastFlipTimestamp >= flipInterval) {
      lastFlipTimestamp = timestamp;

      if (progress >= 1) {
        params.onLanded();
        return;
      }

      params.onFlip(pickRandom(currentLetters));
      window.requestAnimationFrame(frame);
      return;
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

export function useLetterRoller(locale: string) {
  const [letter, setLetter] = useState(INITIAL_LETTER);
  const [visible, setVisible] = useState(false);
  const [landing, setLanding] = useState(false);
  const sessionRef = useRef(0);

  const cancelSpin = useCallback(() => {
    sessionRef.current += 1;
  }, []);

  const spinTo = useCallback(
    (finalLetter: string, onLanded: () => void) => {
      const session = sessionRef.current + 1;
      sessionRef.current = session;

      setVisible(true);
      setLanding(false);
      setLetter(finalLetter);

      // Skip animation when the user prefers reduced motion — snap straight to result.
      if (prefersReducedMotion()) {
        setLanding(true);
        onLanded();
        return;
      }

      runSpinAnimation({
        finalLetter,
        locale,
        onFlip: (letterValue) => {
          setLetter(letterValue);
        },
        onLanded: () => {
          setLetter(finalLetter);
          setLanding(true);
          onLanded();
        },
        session,
        sessionRef,
      });
    },
    [locale],
  );

  const reset = useCallback(() => {
    sessionRef.current += 1;
    setLetter(INITIAL_LETTER);
    setVisible(false);
    setLanding(false);
  }, []);

  return { letter, visible, landing, spinTo, reset, cancelSpin };
}
