import { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialRoundState, roundReducer } from '../game/roundReducer';
import { pickRandom, weightedLetterBag } from '../game/utils';
import { getLocaleLetters } from '../i18n/localeRegistry';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';

const ALARM_DURATION_MS = 3500;

interface UseRoundOptions {
  gameSeconds: number;
  totalRounds: number;
  isMuted: boolean;
  locale: string;
}

export function useRound({ gameSeconds, totalRounds, isMuted, locale }: UseRoundOptions) {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const roller = useLetterRoller(locale);
  const { playTick, playAlarm } = useAudio(isMuted);

  const tickedSecondRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  const resetRoller = roller.reset;

  const drawNextLetter = useCallback(
    (currentRemaining: string[], currentDrawn: string[]) => {
      let remaining = [...currentRemaining];
      let drawn = [...currentDrawn];

      if (remaining.length === 0) {
        remaining = weightedLetterBag(locale);
        drawn = [];
      }

      const chosen = remaining.pop() ?? pickRandom(getLocaleLetters(locale));
      drawn.push(chosen);

      return { chosen, remaining, drawn };
    },
    [locale],
  );

  const clearAlarmTimeout = useCallback(() => {
    if (alarmTimeoutRef.current !== null) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    resetRoller();
  }, [resetRoller]);

  const beginRound = useCallback(
    (incrementRound: boolean) => {
      if (state.phase === 'spinning') {
        return;
      }

      if (incrementRound && state.roundCount >= state.totalRounds && state.totalRounds > 0) {
        return;
      }

      clearAlarmTimeout();
      const { chosen, remaining, drawn } = drawNextLetter(
        state.remainingLetters,
        state.drawnLetters,
      );

      dispatch({
        type: 'START_SPIN',
        gameSeconds,
        totalRounds,
        incrementRound,
        remainingLetters: remaining,
        drawnLetters: drawn,
      });

      roller.spinTo(chosen, () => {
        dispatch({ type: 'LETTER_LANDED' });
      });
    },
    [
      clearAlarmTimeout,
      drawNextLetter,
      gameSeconds,
      roller,
      state.phase,
      state.roundCount,
      state.totalRounds,
      totalRounds,
      state.drawnLetters,
      state.remainingLetters,
    ],
  );

  const startRound = useCallback(() => beginRound(true), [beginRound]);
  const rerollLetter = useCallback(() => {
    if (state.phase === 'buffer' || state.phase === 'running') {
      const { chosen, remaining, drawn } = drawNextLetter(
        state.remainingLetters,
        state.drawnLetters,
      );

      // Note: we're intentionally not dispatching START_SPIN here because
      // rerolling mid-round shouldn't reset the timer or increment round.
      // However, we DO need to sync the bags.
      // To keep it simple, let's add a SYNC_BAGS action or just handle it in START_SPIN.
      // Actually, START_SPIN is what initiates a letter roll usually.
      // If we're mid-round, we just want the roller to roll.
      // Wait, if we roll a new letter, we definitely want it to stay.
      // I'll add a SYNC_BAGS action to the reducer for mid-round rerolls.
      roller.spinTo(chosen, () => undefined);
      dispatch({ type: 'SYNC_BAGS', remainingLetters: remaining, drawnLetters: drawn });
      return;
    }

    beginRound(false);
  }, [beginRound, drawNextLetter, roller, state.phase, state.remainingLetters, state.drawnLetters]);

  const togglePause = useCallback(() => {
    dispatch({ type: 'PAUSE_TOGGLE' });
  }, []);

  const resetRound = useCallback(() => {
    roller.reset();
    clearAlarmTimeout();
    dispatch({ type: 'RESET' });
  }, [clearAlarmTimeout, roller]);

  const newGame = useCallback(() => {
    roller.reset();
    clearAlarmTimeout();
    dispatch({ type: 'NEW_GAME' });
  }, [clearAlarmTimeout, roller]);

  // Countdown clock
  useEffect(() => {
    if ((state.phase !== 'buffer' && state.phase !== 'running') || state.isPaused) {
      return;
    }

    const id = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => window.clearInterval(id);
  }, [state.phase, state.isPaused]);

  // Alarm side effect on round end
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
  }, [clearAlarmTimeout, playAlarm, state.alarmOn]);

  // Last-10-seconds tick sound
  useEffect(() => {
    if (
      state.phase !== 'running' ||
      state.isPaused ||
      state.secondsLeft > 10 ||
      state.secondsLeft <= 0
    ) {
      return;
    }

    if (tickedSecondRef.current === state.secondsLeft) {
      return;
    }

    tickedSecondRef.current = state.secondsLeft;
    playTick();
  }, [playTick, state.isPaused, state.phase, state.secondsLeft]);

  // Reset tick guard when leaving running
  useEffect(() => {
    if (state.phase !== 'running') {
      tickedSecondRef.current = null;
    }
  }, [state.phase]);

  // Cleanup on unmount
  useEffect(() => () => clearAlarmTimeout(), [clearAlarmTimeout]);

  return {
    phase: state.phase,
    secondsLeft: state.secondsLeft,
    isPaused: state.isPaused,
    roundCount: state.roundCount,
    alarmOn: state.alarmOn,
    statusKey: state.statusKey,
    letter: roller.letter,
    letterVisible: roller.visible,
    letterLanding: roller.landing,
    usedLetters: state.drawnLetters,
    hasMoreRounds: state.roundCount < totalRounds,
    startRound,
    rerollLetter,
    togglePause,
    resetRound,
    newGame,
  };
}
