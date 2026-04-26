import type { Dispatch, MutableRefObject } from 'react';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initialRoundState,
  type RoundAction,
  type RoundState,
  roundReducer,
} from '@/domain/game/roundReducer';
import { pickRandom, weightedLetterBag } from '@/domain/game/utils';
import type { CategoryRefreshMode } from '@/features/settings/schema';
import { getLocaleLetters } from '@/i18n/localeRegistry';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';

const ALARM_DURATION_MS = 3500;
const ONE_SECOND_MS = 1000;
const LAST_TICK_THRESHOLD = 10;

interface UseRoundOptions {
  gameSeconds: number;
  isMuted: boolean;
  locale: string;
  categoryRefreshMode: CategoryRefreshMode;
  onLetterPicked?: () => void;
}

interface RoundActions {
  startRound: () => void;
  rerollLetter: () => void;
  togglePause: () => void;
  resetRound: () => void;
}

function canBeginRound(state: { phase: string }): boolean {
  return state.phase !== 'spinning';
}

function drawAutoLetter(locale: string, previousLetter: string | null) {
  const letters = getLocaleLetters(locale);
  const candidates =
    previousLetter && letters.length > 1
      ? letters.filter((letter) => letter !== previousLetter)
      : letters;
  const chosen = pickRandom(candidates);
  return { chosen, remaining: [], drawn: [] };
}

function drawPinnedLetter(locale: string, currentRemaining: string[], currentDrawn: string[]) {
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

interface DrawNextLetterOptions {
  locale: string;
  mode: CategoryRefreshMode;
  currentRemaining: string[];
  currentDrawn: string[];
  previousLetter: string | null;
}

function drawNextLetter(options: DrawNextLetterOptions) {
  const { locale, mode, currentRemaining, currentDrawn, previousLetter } = options;

  if (mode === 'auto') {
    return drawAutoLetter(locale, previousLetter);
  }

  return drawPinnedLetter(locale, currentRemaining, currentDrawn);
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
    previousLetter: string | null,
  ) => {
    chosen: string;
    remaining: string[];
    drawn: string[];
  };
  gameSeconds: number;
  onLetterPicked: () => void;
  playLetterLand: () => void;
  roller: ReturnType<typeof useLetterRoller>;
  state: RoundState;
}) {
  const {
    clearAlarmTimeout,
    dispatch,
    drawNextLetterForLocale,
    gameSeconds,
    onLetterPicked,
    playLetterLand,
    roller,
    state,
  } = params;

  return useCallback(() => {
    if (!canBeginRound(state)) {
      return;
    }

    clearAlarmTimeout();
    const { chosen, remaining, drawn } = drawNextLetterForLocale(
      state.remainingLetters,
      state.drawnLetters,
      roller.letter === '?' ? null : roller.letter,
    );
    onLetterPicked();

    dispatch({
      type: 'START_SPIN',
      gameSeconds,
      remainingLetters: remaining,
      drawnLetters: drawn,
    });

    roller.spinTo(chosen, () => {
      playLetterLand();
      dispatch({ type: 'LETTER_LANDED' });
    });
  }, [
    clearAlarmTimeout,
    dispatch,
    drawNextLetterForLocale,
    gameSeconds,
    onLetterPicked,
    playLetterLand,
    roller,
    state,
  ]);
}

function useRerollLetterAction(
  params: {
    dispatch: Dispatch<RoundAction>;
    drawNextLetterForLocale: (
      remaining: string[],
      drawn: string[],
      previousLetter: string | null,
    ) => {
      chosen: string;
      remaining: string[];
      drawn: string[];
    };
    onLetterPicked: () => void;
    roller: ReturnType<typeof useLetterRoller>;
    state: RoundState;
  },
  beginRound: () => void,
) {
  const { dispatch, drawNextLetterForLocale, onLetterPicked, roller, state } = params;

  return useCallback(() => {
    if (state.phase === 'buffer' || state.phase === 'running') {
      const { chosen, remaining, drawn } = drawNextLetterForLocale(
        state.remainingLetters,
        state.drawnLetters,
        roller.letter === '?' ? null : roller.letter,
      );
      onLetterPicked();

      roller.spinTo(chosen, () => undefined);
      dispatch({ type: 'SYNC_BAGS', remainingLetters: remaining, drawnLetters: drawn });
      return;
    }

    beginRound();
  }, [beginRound, dispatch, drawNextLetterForLocale, onLetterPicked, roller, state]);
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

  return {
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

interface CreateRoundResultOptions {
  state: RoundState;
  roller: ReturnType<typeof useLetterRoller>;
  actions: RoundActions & { beginRound: () => void };
}

function createRoundResult({ state, roller, actions }: CreateRoundResultOptions) {
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
    startRound: actions.startRound,
    rerollLetter: actions.rerollLetter,
    togglePause: actions.togglePause,
    resetRound: actions.resetRound,
  };
}

export function useRound({
  gameSeconds,
  isMuted,
  locale,
  categoryRefreshMode,
  onLetterPicked = () => undefined,
}: UseRoundOptions) {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const roller = useLetterRoller(locale);
  const { playTick, playAlarm, playLetterLand } = useAudio(isMuted);
  const { alarmTimeoutRef, clearAlarmTimeout, tickedSecondRef } = useRoundRuntime();
  const resetRoller = roller.reset;
  const drawNextLetterForLocale = useCallback(
    (currentRemaining: string[], currentDrawn: string[], previousLetter: string | null) =>
      drawNextLetter({
        locale,
        mode: categoryRefreshMode,
        currentRemaining,
        currentDrawn,
        previousLetter,
      }),
    [categoryRefreshMode, locale],
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
    onLetterPicked,
    playLetterLand,
    roller,
    state,
  });
  const rerollLetter = useRerollLetterAction(
    {
      dispatch,
      drawNextLetterForLocale,
      onLetterPicked,
      roller,
      state,
    },
    beginRound,
  );
  const { resetRound, togglePause } = useRoundControlActions({
    clearAlarmTimeout,
    dispatch,
    roller,
  });
  const actions = {
    beginRound,
    rerollLetter,
    resetRound,
    startRound: beginRound,
    togglePause,
  } satisfies RoundActions & { beginRound: () => void };

  return createRoundResult({ state, roller, actions });
}
