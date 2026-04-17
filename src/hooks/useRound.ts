import type { Dispatch, MutableRefObject } from 'react';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initialRoundState,
  type RoundAction,
  type RoundState,
  roundReducer,
} from '../game/roundReducer';
import { pickRandom, weightedLetterBag } from '../game/utils';
import { getLocaleLetters } from '../i18n/localeRegistry';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';

const ALARM_DURATION_MS = 3500;
const ONE_SECOND_MS = 1000;
const LAST_TICK_THRESHOLD = 10;

interface UseRoundOptions {
  gameSeconds: number;
  totalRounds: number;
  isMuted: boolean;
  locale: string;
}

interface RoundActions {
  startRound: () => void;
  rerollLetter: () => void;
  togglePause: () => void;
  resetRound: () => void;
  newGame: () => void;
}

function canBeginRound(
  state: {
    phase: string;
    roundCount: number;
    totalRounds: number;
  },
  incrementRound: boolean,
): boolean {
  if (state.phase === 'spinning') {
    return false;
  }

  if (incrementRound && state.roundCount >= state.totalRounds && state.totalRounds > 0) {
    return false;
  }

  return true;
}

function drawNextLetter(locale: string, currentRemaining: string[], currentDrawn: string[]) {
  let remaining = [...currentRemaining];
  let drawn = [...currentDrawn];

  if (remaining.length === 0) {
    remaining = weightedLetterBag(locale);
    drawn = [];
  }

  const chosen = remaining.pop() ?? pickRandom(getLocaleLetters(locale));
  drawn.push(chosen);

  return { chosen, remaining, drawn };
}

function useRoundClock(phase: string, isPaused: boolean, dispatch: Dispatch<RoundAction>) {
  useEffect(() => {
    if ((phase !== 'buffer' && phase !== 'running') || isPaused) {
      return;
    }

    const id = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, ONE_SECOND_MS);

    return () => window.clearInterval(id);
  }, [dispatch, isPaused, phase]);
}

function useRoundAlarm(options: {
  alarmOn: boolean;
  alarmTimeoutRef: MutableRefObject<number | null>;
  clearAlarmTimeout: () => void;
  dispatch: Dispatch<RoundAction>;
  playAlarm: () => void;
}) {
  const { alarmOn, alarmTimeoutRef, clearAlarmTimeout, dispatch, playAlarm } = options;
  useEffect(() => {
    if (!alarmOn) {
      return;
    }

    playAlarm();
    clearAlarmTimeout();
    alarmTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: 'ALARM_OFF' });
      alarmTimeoutRef.current = null;
    }, ALARM_DURATION_MS);
  }, [alarmOn, alarmTimeoutRef, clearAlarmTimeout, dispatch, playAlarm]);
}

function useRoundTickSound(options: {
  isPaused: boolean;
  phase: string;
  playTick: () => void;
  secondsLeft: number;
  tickedSecondRef: MutableRefObject<number | null>;
}) {
  const { isPaused, phase, playTick, secondsLeft, tickedSecondRef } = options;
  useEffect(() => {
    if (phase !== 'running' || isPaused || secondsLeft > LAST_TICK_THRESHOLD || secondsLeft <= 0) {
      return;
    }

    if (tickedSecondRef.current === secondsLeft) {
      return;
    }

    tickedSecondRef.current = secondsLeft;
    playTick();
  }, [isPaused, phase, playTick, secondsLeft, tickedSecondRef]);
}

function useRoundTickReset(phase: string, tickedSecondRef: MutableRefObject<number | null>) {
  useEffect(() => {
    if (phase !== 'running') {
      tickedSecondRef.current = null;
    }
  }, [phase, tickedSecondRef]);
}

function useRoundCleanup(clearAlarmTimeout: () => void) {
  useEffect(() => () => clearAlarmTimeout(), [clearAlarmTimeout]);
}

function useRoundEffects(options: {
  alarmTimeoutRef: MutableRefObject<number | null>;
  clearAlarmTimeout: () => void;
  dispatch: Dispatch<RoundAction>;
  playAlarm: () => void;
  playTick: () => void;
  resetRoller: () => void;
  state: RoundState;
  tickedSecondRef: MutableRefObject<number | null>;
}) {
  const {
    alarmTimeoutRef,
    clearAlarmTimeout,
    dispatch,
    playAlarm,
    playTick,
    resetRoller,
    state,
    tickedSecondRef,
  } = options;

  useEffect(() => {
    resetRoller();
  }, [resetRoller]);
  useRoundClock(state.phase, state.isPaused, dispatch);
  useRoundAlarm({
    alarmOn: state.alarmOn,
    alarmTimeoutRef,
    clearAlarmTimeout,
    dispatch,
    playAlarm,
  });
  useRoundTickSound({
    isPaused: state.isPaused,
    phase: state.phase,
    playTick,
    secondsLeft: state.secondsLeft,
    tickedSecondRef,
  });
  useRoundTickReset(state.phase, tickedSecondRef);
  useRoundCleanup(clearAlarmTimeout);
}

function useBeginRoundAction(params: {
  clearAlarmTimeout: () => void;
  dispatch: Dispatch<RoundAction>;
  drawNextLetterForLocale: (
    remaining: string[],
    drawn: string[],
  ) => {
    chosen: string;
    remaining: string[];
    drawn: string[];
  };
  gameSeconds: number;
  roller: ReturnType<typeof useLetterRoller>;
  state: RoundState;
  totalRounds: number;
}) {
  const {
    clearAlarmTimeout,
    dispatch,
    drawNextLetterForLocale,
    gameSeconds,
    roller,
    state,
    totalRounds,
  } = params;

  return useCallback(
    (incrementRound: boolean) => {
      if (!canBeginRound(state, incrementRound)) {
        return;
      }

      clearAlarmTimeout();
      const { chosen, remaining, drawn } = drawNextLetterForLocale(
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
    [clearAlarmTimeout, dispatch, drawNextLetterForLocale, gameSeconds, roller, state, totalRounds],
  );
}

function useRerollLetterAction(
  params: {
    dispatch: Dispatch<RoundAction>;
    drawNextLetterForLocale: (
      remaining: string[],
      drawn: string[],
    ) => {
      chosen: string;
      remaining: string[];
      drawn: string[];
    };
    roller: ReturnType<typeof useLetterRoller>;
    state: RoundState;
  },
  beginRound: (incrementRound: boolean) => void,
) {
  const { dispatch, drawNextLetterForLocale, roller, state } = params;

  return useCallback(() => {
    if (state.phase === 'buffer' || state.phase === 'running') {
      const { chosen, remaining, drawn } = drawNextLetterForLocale(
        state.remainingLetters,
        state.drawnLetters,
      );

      roller.spinTo(chosen, () => undefined);
      dispatch({ type: 'SYNC_BAGS', remainingLetters: remaining, drawnLetters: drawn });
      return;
    }

    beginRound(false);
  }, [beginRound, dispatch, drawNextLetterForLocale, roller, state]);
}

function useRoundControlActions(params: {
  clearAlarmTimeout: () => void;
  dispatch: Dispatch<RoundAction>;
  roller: ReturnType<typeof useLetterRoller>;
}) {
  const { clearAlarmTimeout, dispatch, roller } = params;

  const togglePause = useCallback(() => {
    dispatch({ type: 'PAUSE_TOGGLE' });
  }, [dispatch]);
  const resetRound = useCallback(() => {
    roller.reset();
    clearAlarmTimeout();
    dispatch({ type: 'RESET' });
  }, [clearAlarmTimeout, dispatch, roller]);
  const newGame = useCallback(() => {
    roller.reset();
    clearAlarmTimeout();
    dispatch({ type: 'NEW_GAME' });
  }, [clearAlarmTimeout, dispatch, roller]);

  return {
    newGame,
    resetRound,
    togglePause,
  };
}

function useRoundRuntime() {
  const tickedSecondRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  const clearAlarmTimeout = useCallback(() => {
    if (alarmTimeoutRef.current !== null) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  return {
    alarmTimeoutRef,
    clearAlarmTimeout,
    tickedSecondRef,
  };
}

function createRoundResult(
  state: RoundState,
  roller: ReturnType<typeof useLetterRoller>,
  actions: RoundActions & { beginRound: (incrementRound: boolean) => void },
  totalRounds: number,
) {
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
    startRound: actions.startRound,
    rerollLetter: actions.rerollLetter,
    togglePause: actions.togglePause,
    resetRound: actions.resetRound,
    newGame: actions.newGame,
  };
}

export function useRound({ gameSeconds, totalRounds, isMuted, locale }: UseRoundOptions) {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const roller = useLetterRoller(locale);
  const { playTick, playAlarm } = useAudio(isMuted);
  const { alarmTimeoutRef, clearAlarmTimeout, tickedSecondRef } = useRoundRuntime();
  const resetRoller = roller.reset;
  const drawNextLetterForLocale = useCallback(
    (currentRemaining: string[], currentDrawn: string[]) =>
      drawNextLetter(locale, currentRemaining, currentDrawn),
    [locale],
  );
  useRoundEffects({
    alarmTimeoutRef,
    clearAlarmTimeout,
    dispatch,
    playAlarm,
    playTick,
    resetRoller,
    state,
    tickedSecondRef,
  });

  const beginRound = useBeginRoundAction({
    clearAlarmTimeout,
    dispatch,
    drawNextLetterForLocale,
    gameSeconds,
    roller,
    state,
    totalRounds,
  });
  const rerollLetter = useRerollLetterAction(
    {
      dispatch,
      drawNextLetterForLocale,
      roller,
      state,
    },
    beginRound,
  );
  const { newGame, resetRound, togglePause } = useRoundControlActions({
    clearAlarmTimeout,
    dispatch,
    roller,
  });
  const actions = {
    beginRound,
    newGame,
    rerollLetter,
    resetRound,
    startRound: () => beginRound(true),
    togglePause,
  } satisfies RoundActions & { beginRound: (incrementRound: boolean) => void };

  return createRoundResult(state, roller, actions, totalRounds);
}
