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
  onLetterPicked?: () => void;
}

// Draws the next letter from a non-repeating weighted bag, refilling when empty
// and avoiding an immediate repeat of the previous letter at the refill boundary.
function drawNextLetterFromBag(
  locale: string,
  currentRemaining: string[],
  currentDrawn: string[],
  previousLetter: string | null,
) {
  let remaining = [...currentRemaining];
  let drawn = [...currentDrawn];

  if (remaining.length === 0) {
    remaining = weightedLetterBag(locale);
    drawn = [];
  }

  let chosen = remaining.pop() ?? pickRandom(getLocaleLetters(locale));
  if (chosen === previousLetter && remaining.length > 0) {
    const swapIndex = remaining.length - 1;
    const swap = remaining[swapIndex];
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
  onLetterPicked = () => undefined,
}: UseRoundOptions) {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const roller = useLetterRoller(locale);
  const { playTick, playAlarm, playLetterLand } = useAudio(isMuted);
  const resetRoller = roller.reset;

  const tickedSecondRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  const clearAlarmTimeout = useCallback(() => {
    if (alarmTimeoutRef.current !== null) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    resetRoller();
  }, [resetRoller]);

  // Countdown clock: ticks once a second while in the buffer or running phase.
  useEffect(() => {
    if ((state.phase !== 'buffer' && state.phase !== 'running') || state.isPaused) {
      return;
    }

    const id = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, ONE_SECOND_MS);

    return () => window.clearInterval(id);
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
  const runSpin = useCallback(
    (opts: { redrawCategories: boolean }) => {
      clearAlarmTimeout();
      const { chosen, remaining, drawn } = drawNextLetterFromBag(
        locale,
        state.remainingLetters,
        state.drawnLetters,
        roller.letter === '?' ? null : roller.letter,
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
        playLetterLand();
        dispatch({ type: 'LETTER_LANDED' });
      });
    },
    [
      bufferSeconds,
      clearAlarmTimeout,
      gameSeconds,
      locale,
      onLetterPicked,
      playLetterLand,
      roller,
      state,
    ],
  );

  const newLetter = useCallback(() => runSpin({ redrawCategories: false }), [runSpin]);
  const nextRound = useCallback(() => runSpin({ redrawCategories: true }), [runSpin]);
  const togglePause = useCallback(() => dispatch({ type: 'PAUSE_TOGGLE' }), []);

  const primaryAction = useCallback(() => {
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
  }, [state.phase, nextRound, togglePause]);

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
