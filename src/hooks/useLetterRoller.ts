import { useCallback, useRef, useState } from 'react';
import { pickRandom } from '../game/utils';
import { getLocaleLetters } from '../i18n/localeRegistry';

const SPIN_MS = 1800;

export function useLetterRoller(locale: string) {
  const [letter, setLetter] = useState('?');
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

      const currentLetters = getLocaleLetters(locale);

      setVisible(true);
      setLanding(false);
      setLetter(finalLetter);

      // Skip animation when the user prefers reduced motion — snap straight to result.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setLanding(true);
        onLanded();
        return;
      }

      let startTimestamp = 0;
      let lastFlipTimestamp = 0;

      function frame(timestamp: number) {
        if (sessionRef.current !== session) {
          return;
        }

        if (startTimestamp === 0) {
          startTimestamp = timestamp;
          lastFlipTimestamp = timestamp;
        }

        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / SPIN_MS, 1);
        const flipInterval = 60 + progress * progress * 260;

        if (timestamp - lastFlipTimestamp >= flipInterval) {
          lastFlipTimestamp = timestamp;

          if (progress >= 1) {
            setLetter(finalLetter);
            setLanding(true);
            onLanded();
            return;
          }

          setLetter(pickRandom(currentLetters));
        }

        window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    },
    [locale],
  );

  const reset = useCallback(() => {
    sessionRef.current += 1;
    setLetter('?');
    setVisible(false);
    setLanding(false);
  }, []);

  return { letter, visible, landing, spinTo, reset, cancelSpin };
}
