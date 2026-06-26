import type { Dispatch, MutableRefObject } from 'react';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initialRoundState,
  type RoundAction,
  type RoundState,
  roundReducer,
} from '@/domain/game/roundReducer';
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

interface RoundActions {
  primaryAction: () => void;
  newLetter: () => void;
  nextRound: () => void;
  togglePause: () => void;
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

function useSpinActions(params: {
  bufferSeconds: number;
  clearAlarmTimeout: () => void;
  dispatch: Dispatch<RoundAction>;
  gameSeconds: number;
  locale: string;
  onLetterPicked: () => void;
  playLetterLand: () => void;
  roller: ReturnType<typeof useLetterRoller>;
  state: RoundState;
}) {
  const {
    bufferSeconds,
    clearAlarmTimeout,
    dispatch,
    gameSeconds,
    locale,
    onLetterPicked,
    playLetterLand,
    roller,
    state,
  } = params;

  // Draws a new letter and spins. `autoStart` runs the countdown on landing;
  // otherwise it lands in a `ready` state awaiting Start. `redrawCategories`
  // composes a fresh category set (false = keep the current deck — reroll).
  const runSpin = useCallback(
    (opts: { autoStart: boolean; redrawCategories: boolean }) => {
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
        autoStart: opts.autoStart,
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
      dispatch,
      gameSeconds,
      locale,
      onLetterPicked,
      playLetterLand,
      roller,
      state,
    ],
  );

  const beginRound = useCallback(
    () => runSpin({ autoStart: true, redrawCategories: true }),
    [runSpin],
  );
  const newLetter = useCallback(
    () => runSpin({ autoStart: false, redrawCategories: false }),
    [runSpin],
  );
  const nextRound = useCallback(
    () => runSpin({ autoStart: false, redrawCategories: true }),
    [runSpin],
  );

  return { beginRound, newLetter, nextRound };
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
  actions: RoundActions;
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
    primaryAction: actions.primaryAction,
    newLetter: actions.newLetter,
    nextRound: actions.nextRound,
    togglePause: actions.togglePause,
  };
}

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
  const { alarmTimeoutRef, clearAlarmTimeout, tickedSecondRef } = useRoundRuntime();
  const resetRoller = roller.reset;

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

  // Apply live duration / get-ready changes to an in-flight round.
  useEffect(() => {
    dispatch({ type: 'SET_GAME_SECONDS', gameSeconds });
  }, [gameSeconds]);
  useEffect(() => {
    dispatch({ type: 'SET_BUFFER_SECONDS', bufferSeconds });
  }, [bufferSeconds]);

  const { beginRound, newLetter, nextRound } = useSpinActions({
    bufferSeconds,
    clearAlarmTimeout,
    dispatch,
    gameSeconds,
    locale,
    onLetterPicked,
    playLetterLand,
    roller,
    state,
  });

  const togglePause = useCallback(() => dispatch({ type: 'PAUSE_TOGGLE' }), []);

  const primaryAction = useCallback(() => {
    switch (state.phase) {
      case 'idle':
        beginRound();
        break;
      case 'ready':
        dispatch({ type: 'BEGIN_COUNTDOWN' });
        break;
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
  }, [state.phase, beginRound, nextRound, togglePause]);

  const actions: RoundActions = { primaryAction, newLetter, nextRound, togglePause };

  return createRoundResult({ state, roller, actions });
}
