import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { LETTERS } from '../game/constants';
import { initialRoundState, roundReducer } from '../game/roundReducer';
import { pickRandom, weightedLetterBag } from '../game/utils';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';

const ALARM_DURATION_MS = 3500;

interface UseRoundOptions {
  gameSeconds: number;
  totalRounds: number;
  isMuted: boolean;
}

export function useRound({ gameSeconds, totalRounds, isMuted }: UseRoundOptions) {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const roller = useLetterRoller();
  const { playTick, playAlarm } = useAudio(isMuted);

  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const letterBagRef = useRef<string[]>([]);
  const tickedSecondRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

  const drawNextLetter = useCallback(() => {
    if (letterBagRef.current.length === 0) {
      letterBagRef.current = weightedLetterBag();
      setUsedLetters([]);
    }

    const chosen = letterBagRef.current.pop() ?? pickRandom(LETTERS);
    setUsedLetters((prev) => [...prev, chosen]);
    return chosen;
  }, []);

  const clearAlarmTimeout = useCallback(() => {
    if (alarmTimeoutRef.current !== null) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  const beginRound = useCallback(
    (incrementRound: boolean) => {
      if (state.phase === 'spinning') {
        return;
      }

      if (incrementRound && state.roundCount >= state.totalRounds && state.totalRounds > 0) {
        dispatch({ type: 'START_BLOCKED' });
        return;
      }

      clearAlarmTimeout();
      const nextLetter = drawNextLetter();
      dispatch({
        type: 'START_SPIN',
        gameSeconds,
        totalRounds,
        incrementRound,
      });

      roller.spinTo(nextLetter, () => {
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
    ],
  );

  const startRound = useCallback(() => beginRound(true), [beginRound]);
  const rerollLetter = useCallback(() => beginRound(false), [beginRound]);

  const togglePause = useCallback(() => {
    dispatch({ type: 'PAUSE_TOGGLE' });
  }, []);

  const resetRound = useCallback(() => {
    roller.reset();
    clearAlarmTimeout();
    dispatch({ type: 'RESET' });
  }, [clearAlarmTimeout, roller]);

  const newGame = useCallback(() => {
    letterBagRef.current = [];
    setUsedLetters([]);
    roller.reset();
    clearAlarmTimeout();
    dispatch({ type: 'NEW_GAME' });
    beginRound(false);
  }, [beginRound, clearAlarmTimeout, roller]);

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
    usedLetters,
    hasMoreRounds: state.roundCount < totalRounds,
    startRound,
    rerollLetter,
    togglePause,
    resetRound,
    newGame,
  };
}
