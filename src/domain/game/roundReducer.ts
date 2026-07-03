type Phase = 'idle' | 'spinning' | 'buffer' | 'running' | 'done';

type StatusKey = 'timer.getReady' | 'timer.go' | 'timer.roundOver' | null;

interface RoundState {
  phase: Phase;
  secondsLeft: number;
  isPaused: boolean;
  gameSeconds: number;
  bufferSeconds: number;
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
      remainingLetters: string[];
      drawnLetters: string[];
    }
  | { type: 'LETTER_LANDED' }
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
  alarmOn: false,
  statusKey: null,
  remainingLetters: [],
  drawnLetters: [],
};

/** Deck edits / redraws allowed: idle, done, or any paused state — i.e. not actively counting down. */
function canEditDeck(phase: Phase, isPaused: boolean): boolean {
  return !((phase === 'buffer' || phase === 'running') && !isPaused);
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

function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case 'START_SPIN':
      return {
        ...state,
        phase: 'spinning',
        secondsLeft: 0,
        isPaused: false,
        alarmOn: false,
        statusKey: null,
        gameSeconds: action.gameSeconds,
        bufferSeconds: action.bufferSeconds,
        remainingLetters: action.remainingLetters,
        drawnLetters: action.drawnLetters,
      };
    case 'LETTER_LANDED':
      return state.phase === 'spinning' ? enterCountdown(state) : state;
    case 'SET_GAME_SECONDS': {
      const next = { ...state, gameSeconds: action.gameSeconds };
      if (state.phase === 'running') {
        // Shrink an in-flight clock; never extend.
        next.secondsLeft = Math.min(state.secondsLeft, action.gameSeconds);
      }
      return next;
    }
    case 'SET_BUFFER_SECONDS':
      return { ...state, bufferSeconds: action.bufferSeconds };
    case 'TICK':
      return handleTick(state);
    case 'PAUSE_TOGGLE':
      return handlePauseToggle(state);
    case 'RESET':
      return {
        ...state,
        phase: 'idle',
        secondsLeft: 0,
        isPaused: false,
        alarmOn: false,
        statusKey: null,
      };
    case 'ALARM_OFF':
      return { ...state, alarmOn: false };
    case 'SYNC_BAGS':
      return {
        ...state,
        remainingLetters: action.remainingLetters,
        drawnLetters: action.drawnLetters,
      };

    default:
      return state;
  }
}

export type { Phase, RoundAction, RoundState, StatusKey };
export { canEditDeck, initialRoundState, roundReducer };
