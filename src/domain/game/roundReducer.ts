import { bufferSeconds } from './constants';

type Phase = 'idle' | 'spinning' | 'buffer' | 'running' | 'done';

type StatusKey = 'timer.getReady' | 'timer.go' | 'timer.roundOver' | null;

interface RoundState {
  phase: Phase;
  secondsLeft: number;
  isPaused: boolean;
  gameSeconds: number;
  alarmOn: boolean;
  statusKey: StatusKey;
  remainingLetters: string[];
  drawnLetters: string[];
}

type RoundAction =
  | {
      type: 'START_SPIN';
      gameSeconds: number;
      remainingLetters: string[];
      drawnLetters: string[];
    }
  | { type: 'LETTER_LANDED' }
  | { type: 'TICK' }
  | { type: 'PAUSE_TOGGLE' }
  | { type: 'RESET' }
  | { type: 'ALARM_OFF' }
  | { type: 'SYNC_BAGS'; remainingLetters: string[]; drawnLetters: string[] };

const initialRoundState: RoundState = {
  phase: 'idle',
  secondsLeft: 0,
  isPaused: false,
  gameSeconds: 60,
  alarmOn: false,
  statusKey: null,
  remainingLetters: [],
  drawnLetters: [],
};

function handleStartSpin(
  state: RoundState,
  action: Extract<RoundAction, { type: 'START_SPIN' }>,
): RoundState {
  return {
    ...state,
    phase: 'spinning',
    secondsLeft: 0,
    isPaused: false,
    alarmOn: false,
    statusKey: null,
    gameSeconds: action.gameSeconds,
    remainingLetters: action.remainingLetters,
    drawnLetters: action.drawnLetters,
  };
}

function handleLetterLanded(state: RoundState): RoundState {
  if (state.phase !== 'spinning') {
    return state;
  }

  return {
    ...state,
    phase: 'buffer',
    secondsLeft: bufferSeconds,
    statusKey: 'timer.getReady',
  };
}

function handleTick(state: RoundState): RoundState {
  if (state.isPaused) {
    return state;
  }

  if (state.phase === 'buffer') {
    if (state.secondsLeft <= 1) {
      return {
        ...state,
        phase: 'running',
        secondsLeft: state.gameSeconds,
        statusKey: 'timer.go',
      };
    }

    return { ...state, secondsLeft: state.secondsLeft - 1 };
  }

  if (state.phase === 'running') {
    if (state.secondsLeft <= 1) {
      return {
        ...state,
        phase: 'done',
        secondsLeft: 0,
        alarmOn: true,
        statusKey: 'timer.roundOver',
      };
    }

    return { ...state, secondsLeft: state.secondsLeft - 1 };
  }

  return state;
}

function handlePauseToggle(state: RoundState): RoundState {
  if (state.phase !== 'buffer' && state.phase !== 'running') {
    return state;
  }

  return { ...state, isPaused: !state.isPaused };
}

function handleReset(state: RoundState): RoundState {
  return {
    ...state,
    phase: 'idle',
    secondsLeft: 0,
    isPaused: false,
    alarmOn: false,
    statusKey: null,
  };
}

function handleAlarmOff(state: RoundState): RoundState {
  return { ...state, alarmOn: false };
}

function handleSyncBags(
  state: RoundState,
  action: Extract<RoundAction, { type: 'SYNC_BAGS' }>,
): RoundState {
  return {
    ...state,
    remainingLetters: action.remainingLetters,
    drawnLetters: action.drawnLetters,
  };
}

function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case 'START_SPIN':
      return handleStartSpin(state, action);
    case 'LETTER_LANDED':
      return handleLetterLanded(state);
    case 'TICK':
      return handleTick(state);
    case 'PAUSE_TOGGLE':
      return handlePauseToggle(state);
    case 'RESET':
      return handleReset(state);
    case 'ALARM_OFF':
      return handleAlarmOff(state);
    case 'SYNC_BAGS':
      return handleSyncBags(state, action);

    default:
      return state;
  }
}

export type { Phase, RoundAction, RoundState, StatusKey };
export { initialRoundState, roundReducer };
