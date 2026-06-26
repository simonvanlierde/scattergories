type Phase = 'idle' | 'spinning' | 'buffer' | 'ready' | 'running' | 'done';

type StatusKey = 'timer.getReady' | 'timer.ready' | 'timer.go' | 'timer.roundOver' | null;

interface RoundState {
  phase: Phase;
  secondsLeft: number;
  isPaused: boolean;
  gameSeconds: number;
  bufferSeconds: number;
  /** Whether the current spin should auto-start the countdown when the letter lands. */
  autoStartAfterSpin: boolean;
  alarmOn: boolean;
  statusKey: StatusKey;
  remainingLetters: string[];
  drawnLetters: string[];
}

type RoundAction =
  | {
      type: 'START_SPIN';
      gameSeconds: number;
      bufferSeconds: number;
      autoStart: boolean;
      remainingLetters: string[];
      drawnLetters: string[];
    }
  | { type: 'LETTER_LANDED' }
  | { type: 'BEGIN_COUNTDOWN' }
  | { type: 'SET_GAME_SECONDS'; gameSeconds: number }
  | { type: 'SET_BUFFER_SECONDS'; bufferSeconds: number }
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
  bufferSeconds: 3,
  autoStartAfterSpin: true,
  alarmOn: false,
  statusKey: null,
  remainingLetters: [],
  drawnLetters: [],
};

/** Actively counting down — deck edits and redraws are blocked here. */
function isActivePlay(phase: Phase, isPaused: boolean): boolean {
  return (phase === 'buffer' || phase === 'running') && !isPaused;
}

/** Deck edits / redraws allowed: idle, ready, done, or any paused state. */
function canEditDeck(phase: Phase, isPaused: boolean): boolean {
  return !isActivePlay(phase, isPaused);
}

function enterReady(state: RoundState): RoundState {
  return {
    ...state,
    phase: 'ready',
    secondsLeft: state.gameSeconds,
    isPaused: false,
    statusKey: 'timer.ready',
  };
}

function enterCountdown(state: RoundState): RoundState {
  if (state.bufferSeconds <= 0) {
    return {
      ...state,
      phase: 'running',
      secondsLeft: state.gameSeconds,
      isPaused: false,
      statusKey: 'timer.go',
    };
  }
  return {
    ...state,
    phase: 'buffer',
    secondsLeft: state.bufferSeconds,
    isPaused: false,
    statusKey: 'timer.getReady',
  };
}

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
    bufferSeconds: action.bufferSeconds,
    autoStartAfterSpin: action.autoStart,
    remainingLetters: action.remainingLetters,
    drawnLetters: action.drawnLetters,
  };
}

function handleLetterLanded(state: RoundState): RoundState {
  if (state.phase !== 'spinning') {
    return state;
  }

  return state.autoStartAfterSpin ? enterCountdown(state) : enterReady(state);
}

function handleBeginCountdown(state: RoundState): RoundState {
  if (state.phase !== 'ready') {
    return state;
  }

  return enterCountdown(state);
}

function handleSetGameSeconds(
  state: RoundState,
  action: Extract<RoundAction, { type: 'SET_GAME_SECONDS' }>,
): RoundState {
  const next = { ...state, gameSeconds: action.gameSeconds };
  if (state.phase === 'running') {
    // Shrink an in-flight clock; never extend.
    next.secondsLeft = Math.min(state.secondsLeft, action.gameSeconds);
  } else if (state.phase === 'ready') {
    next.secondsLeft = action.gameSeconds;
  }
  return next;
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
    case 'BEGIN_COUNTDOWN':
      return handleBeginCountdown(state);
    case 'SET_GAME_SECONDS':
      return handleSetGameSeconds(state, action);
    case 'SET_BUFFER_SECONDS':
      return { ...state, bufferSeconds: action.bufferSeconds };
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
export { canEditDeck, initialRoundState, isActivePlay, roundReducer };
