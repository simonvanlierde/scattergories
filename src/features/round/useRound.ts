import { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialRoundState, roundReducer } from '@/domain/game/roundReducer';
import { pickRandom, weightedLetterBag } from '@/domain/game/utils';
import { getLocaleLetters } from '@/i18n/localeRegistry';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';

const ALARM_DURATION_MS = 3500;
const ONE_SECOND_MS = 1000;
const LAST_TICK_THRESHOLD = 10;

interface UseRoundOptions {
  gameSeconds: number;
  bufferSeconds: number;
  isMuted: boolean;
  locale: string;
  avoidRepeats?: boolean;
  onLetterPicked?: () => void;
}

// Draws the next letter from a non-repeating weighted bag, refilling when empty
// and avoiding an immediate repeat of the previous letter at the refill boundary.
// When avoidRepeats is off, each draw is an independent random letter (repeats
// allowed) and the bag is left untouched so it resumes if the setting flips back.
function drawNextLetterFromBag(
  locale: string,
  bag: { remaining: string[]; drawn: string[] },
  previousLetter: string | null,
  avoidRepeats: boolean,
) {
  const { remaining: currentRemaining, drawn: currentDrawn } = bag;
  if (!avoidRepeats) {
    const letters = getLocaleLetters(locale);
    let chosen = pickRandom(letters);
    // Still skip an immediate back-to-back repeat — it reads as "the spin did nothing".
    while (letters.length > 1 && chosen === previousLetter) {
      chosen = pickRandom(letters);
    }
    return { chosen, remaining: currentRemaining, drawn: currentDrawn };
  }

  let remaining = [...currentRemaining];
  let drawn = [...currentDrawn];

  if (remaining.length === 0) {
    remaining = weightedLetterBag(locale);
    drawn = [];
  }

  let chosen = remaining.pop() ?? pickRandom(getLocaleLetters(locale));
  const swapIndex = remaining.length - 1;
  const swap = remaining[swapIndex];
  if (chosen === previousLetter && swap !== undefined) {
    remaining[swapIndex] = chosen;
    chosen = swap;
  }
  drawn.push(chosen);

  return { chosen, remaining, drawn };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: composition hook — the body wires the reducer, audio, roller, and round effects together.
export function useRound({
  gameSeconds,
  bufferSeconds,
  isMuted,
  locale,
  avoidRepeats = true,
  onLetterPicked = () => undefined,
}: UseRoundOptions) {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const roller = useLetterRoller(locale);
  const { playTick, playAlarm, playLetterLand } = useAudio(isMuted);
  const resetRoller = roller.reset;

  const tickedSecondRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  // Sub-second remainder carried across a pause so resuming doesn't lose progress.
  const tickRemainderRef = useRef<number | null>(null);
  // Latest pause flag, read in the countdown cleanup to tell pause from a phase change.
  const isPausedRef = useRef(state.isPaused);
  isPausedRef.current = state.isPaused;
  // The last letter that actually landed — used for repeat-avoidance, unlike the
  // roller's live letter which cycles through random flip letters mid-spin.
  const lastLandedLetterRef = useRef<string | null>(null);
  // Kept memoized: it's read in useEffect dependency arrays below, where a
  // render-body function would trip biome's useExhaustiveDependencies lint.
  const clearAlarmTimeout = useCallback(() => {
    if (alarmTimeoutRef.current !== null) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  // Rebuild the letter bag for the current alphabet whenever the locale changes
  // (and on mount), so a switch doesn't keep drawing the old locale's letters.
  useEffect(() => {
    resetRoller();
    lastLandedLetterRef.current = null;
    dispatch({
      type: 'SYNC_BAGS',
      remainingLetters: weightedLetterBag(locale),
      drawnLetters: [],
    });
  }, [locale, resetRoller]);

  // Self-correcting countdown clock: aligns each tick to a wall-clock deadline
  // instead of a bare interval, so pause/resume keeps sub-second progress and a
  // long throttle (e.g. a backgrounded tab) catches up the seconds it missed.
  useEffect(() => {
    if ((state.phase !== 'buffer' && state.phase !== 'running') || state.isPaused) {
      return;
    }

    let timeoutId = 0;
    let targetAt = Date.now() + (tickRemainderRef.current ?? ONE_SECOND_MS);
    tickRemainderRef.current = null;

    const runTick = () => {
      const now = Date.now();
      // Fire one TICK per whole second elapsed, catching up after any throttle.
      const ticks = Math.max(1, Math.floor((now - targetAt) / ONE_SECOND_MS) + 1);
      targetAt += ticks * ONE_SECOND_MS;
      for (let i = 0; i < ticks; i += 1) {
        dispatch({ type: 'TICK' });
      }
      timeoutId = window.setTimeout(runTick, Math.max(0, targetAt - Date.now()));
    };

    timeoutId = window.setTimeout(runTick, Math.max(0, targetAt - Date.now()));

    return () => {
      window.clearTimeout(timeoutId);
      // On pause (not a phase change), keep the unfinished fraction of the second.
      if (isPausedRef.current) {
        tickRemainderRef.current = targetAt - Date.now();
      }
    };
  }, [state.isPaused, state.phase]);

  // Sound the alarm when a round ends, then auto-clear it after the alarm window.
  useEffect(() => {
    if (!state.alarmOn) {
      return;
    }

    playAlarm();
    clearAlarmTimeout();
    alarmTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: 'ALARM_OFF' });
      alarmTimeoutRef.current = null;
    }, ALARM_DURATION_MS);
  }, [state.alarmOn, clearAlarmTimeout, playAlarm]);

  // Tick sound during the final seconds of the running phase, once per second.
  useEffect(() => {
    if (
      state.phase !== 'running' ||
      state.isPaused ||
      state.secondsLeft > LAST_TICK_THRESHOLD ||
      state.secondsLeft <= 0
    ) {
      return;
    }

    if (tickedSecondRef.current === state.secondsLeft) {
      return;
    }

    tickedSecondRef.current = state.secondsLeft;
    playTick();
  }, [state.isPaused, state.phase, state.secondsLeft, playTick]);

  useEffect(() => {
    if (state.phase !== 'running') {
      tickedSecondRef.current = null;
    }
  }, [state.phase]);

  useEffect(() => () => clearAlarmTimeout(), [clearAlarmTimeout]);

  // Apply live duration / get-ready changes to an in-flight round.
  useEffect(() => {
    dispatch({ type: 'SET_GAME_SECONDS', gameSeconds });
  }, [gameSeconds]);
  useEffect(() => {
    dispatch({ type: 'SET_BUFFER_SECONDS', bufferSeconds });
  }, [bufferSeconds]);

  // Draws a new letter and spins. The countdown auto-starts when the letter
  // lands. `redrawCategories` composes a fresh category set (false = keep the
  // current deck — reroll).
  const runSpin = (opts: { redrawCategories: boolean }) => {
    clearAlarmTimeout();
    // A fresh spin restarts the countdown from a full second.
    tickRemainderRef.current = null;
    const { chosen, remaining, drawn } = drawNextLetterFromBag(
      locale,
      { remaining: state.remainingLetters, drawn: state.drawnLetters },
      lastLandedLetterRef.current,
      avoidRepeats,
    );
    if (opts.redrawCategories) {
      onLetterPicked();
    }

    dispatch({
      type: 'START_SPIN',
      gameSeconds,
      bufferSeconds,
      remainingLetters: remaining,
      drawnLetters: drawn,
    });

    roller.spinTo(chosen, () => {
      lastLandedLetterRef.current = chosen;
      playLetterLand();
      dispatch({ type: 'LETTER_LANDED' });
    });
  };

  const newLetter = () => runSpin({ redrawCategories: false });
  const nextRound = () => runSpin({ redrawCategories: true });
  const togglePause = () => dispatch({ type: 'PAUSE_TOGGLE' });

  const primaryAction = () => {
    switch (state.phase) {
      case 'idle':
      case 'done':
        nextRound();
        break;
      case 'buffer':
      case 'running':
        togglePause();
        break;
      default:
        break;
    }
  };

  return {
    phase: state.phase,
    secondsLeft: state.secondsLeft,
    isPaused: state.isPaused,
    alarmOn: state.alarmOn,
    statusKey: state.statusKey,
    letter: roller.letter,
    letterVisible: roller.visible,
    letterLanding: roller.landing,
    usedLetters: state.drawnLetters,
    primaryAction,
    newLetter,
    nextRound,
    togglePause,
  };
}
