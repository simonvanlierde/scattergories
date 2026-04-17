import { BUFFER_SECONDS } from './constants';

export type Phase = 'idle' | 'spinning' | 'buffer' | 'running' | 'done';

export type StatusKey =
  | 'timer.getReady'
  | 'timer.go'
  | 'timer.roundOver'
  | 'timer.gameCompleteRound'
  | null;

export interface RoundState {
  phase: Phase;
  secondsLeft: number;
  isPaused: boolean;
  roundCount: number;
  totalRounds: number;
  gameSeconds: number;
  alarmOn: boolean;
  statusKey: StatusKey;
  remainingLetters: string[];
  drawnLetters: string[];
}

export type RoundAction =
  | {
      type: 'START_SPIN';
      gameSeconds: number;
      totalRounds: number;
      incrementRound: boolean;
      remainingLetters: string[];
      drawnLetters: string[];
    }
  | { type: 'LETTER_LANDED' }
  | { type: 'TICK' }
  | { type: 'PAUSE_TOGGLE' }
  | { type: 'RESET' }
  | { type: 'ALARM_OFF' }
  | { type: 'SYNC_BAGS'; remainingLetters: string[]; drawnLetters: string[] }
  | { type: 'NEW_GAME' };

export const initialRoundState: RoundState = {
  phase: 'idle',
  secondsLeft: 0,
  isPaused: false,
  roundCount: 0,
  totalRounds: 1,
  gameSeconds: 0,
  alarmOn: false,
  statusKey: null,
  remainingLetters: [],
  drawnLetters: [],
};

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case 'START_SPIN': {
      const nextRoundCount = action.incrementRound ? state.roundCount + 1 : state.roundCount;

      return {
        ...state,
        phase: 'spinning',
        secondsLeft: 0,
        isPaused: false,
        alarmOn: false,
        statusKey: null,
        roundCount: nextRoundCount,
        totalRounds: action.totalRounds,
        gameSeconds: action.gameSeconds,
        remainingLetters: action.remainingLetters,
        drawnLetters: action.drawnLetters,
      };
    }

    case 'LETTER_LANDED':
      if (state.phase !== 'spinning') {
        return state;
      }

      return {
        ...state,
        phase: 'buffer',
        secondsLeft: BUFFER_SECONDS,
        statusKey: 'timer.getReady',
      };

    case 'TICK': {
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
          const hasMoreRounds = state.roundCount < state.totalRounds;

          return {
            ...state,
            phase: 'done',
            secondsLeft: 0,
            alarmOn: true,
            statusKey: hasMoreRounds ? 'timer.roundOver' : 'timer.gameCompleteRound',
          };
        }

        return { ...state, secondsLeft: state.secondsLeft - 1 };
      }

      return state;
    }

    case 'PAUSE_TOGGLE':
      if (state.phase !== 'buffer' && state.phase !== 'running') {
        return state;
      }

      return { ...state, isPaused: !state.isPaused };

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

    case 'NEW_GAME':
      return {
        ...initialRoundState,
        totalRounds: state.totalRounds,
        remainingLetters: [],
        drawnLetters: [],
      };

    default:
      return state;
  }
}
