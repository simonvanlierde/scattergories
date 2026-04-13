import { describe, expect, it } from 'vitest';
import { BUFFER_SECONDS } from './constants';
import { initialRoundState, roundReducer } from './roundReducer';

const startSpin = (incrementRound: boolean) => ({
  type: 'START_SPIN' as const,
  gameSeconds: 90,
  totalRounds: 3,
  incrementRound,
});

describe('roundReducer', () => {
  it('starts in idle', () => {
    expect(initialRoundState.phase).toBe('idle');
    expect(initialRoundState.secondsLeft).toBe(0);
    expect(initialRoundState.roundCount).toBe(0);
  });

  it('START_SPIN moves to spinning and increments round when requested', () => {
    const next = roundReducer(initialRoundState, startSpin(true));
    expect(next.phase).toBe('spinning');
    expect(next.roundCount).toBe(1);
    expect(next.gameSeconds).toBe(90);
    expect(next.totalRounds).toBe(3);
    expect(next.alarmOn).toBe(false);
    expect(next.statusKey).toBeNull();
  });

  it('START_SPIN does not increment round when incrementRound is false', () => {
    const next = roundReducer(initialRoundState, startSpin(false));
    expect(next.roundCount).toBe(0);
  });

  it('LETTER_LANDED transitions spinning → buffer with BUFFER_SECONDS', () => {
    const spinning = roundReducer(initialRoundState, startSpin(true));
    const buffer = roundReducer(spinning, { type: 'LETTER_LANDED' });
    expect(buffer.phase).toBe('buffer');
    expect(buffer.secondsLeft).toBe(BUFFER_SECONDS);
    expect(buffer.statusKey).toBe('timer.getReady');
  });

  it('LETTER_LANDED is a no-op outside spinning', () => {
    const next = roundReducer(initialRoundState, { type: 'LETTER_LANDED' });
    expect(next).toBe(initialRoundState);
  });

  it('TICK counts down buffer phase by one', () => {
    const buffer = roundReducer(roundReducer(initialRoundState, startSpin(true)), {
      type: 'LETTER_LANDED',
    });
    const ticked = roundReducer(buffer, { type: 'TICK' });
    expect(ticked.phase).toBe('buffer');
    expect(ticked.secondsLeft).toBe(BUFFER_SECONDS - 1);
  });

  it('TICK at last buffer second transitions to running with gameSeconds', () => {
    const buffer = roundReducer(roundReducer(initialRoundState, startSpin(true)), {
      type: 'LETTER_LANDED',
    });
    let state = buffer;
    for (let i = 0; i < BUFFER_SECONDS - 1; i += 1) {
      state = roundReducer(state, { type: 'TICK' });
    }
    // state.secondsLeft === 1, phase still buffer
    expect(state.phase).toBe('buffer');
    expect(state.secondsLeft).toBe(1);

    const running = roundReducer(state, { type: 'TICK' });
    expect(running.phase).toBe('running');
    expect(running.secondsLeft).toBe(90);
    expect(running.statusKey).toBe('timer.go');
  });

  it('TICK counts down running phase', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: 5,
      gameSeconds: 5,
    };
    const next = roundReducer(running, { type: 'TICK' });
    expect(next.phase).toBe('running');
    expect(next.secondsLeft).toBe(4);
  });

  it('TICK at last running second transitions to done and triggers alarm', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: 1,
      roundCount: 1,
      totalRounds: 3,
    };
    const done = roundReducer(running, { type: 'TICK' });
    expect(done.phase).toBe('done');
    expect(done.secondsLeft).toBe(0);
    expect(done.alarmOn).toBe(true);
    expect(done.statusKey).toBe('timer.roundOver');
  });

  it('done transition uses gameCompleteRound on the final round', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: 1,
      roundCount: 3,
      totalRounds: 3,
    };
    const done = roundReducer(running, { type: 'TICK' });
    expect(done.statusKey).toBe('timer.gameCompleteRound');
  });

  it('TICK is ignored while paused', () => {
    const paused = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: 5,
      isPaused: true,
    };
    const next = roundReducer(paused, { type: 'TICK' });
    expect(next).toBe(paused);
  });

  it('PAUSE_TOGGLE flips isPaused only during buffer/running', () => {
    const running = { ...initialRoundState, phase: 'running' as const, secondsLeft: 5 };
    expect(roundReducer(running, { type: 'PAUSE_TOGGLE' }).isPaused).toBe(true);

    const idle = roundReducer(initialRoundState, { type: 'PAUSE_TOGGLE' });
    expect(idle).toBe(initialRoundState);
  });

  it('RESET returns to idle without losing roundCount', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: 30,
      roundCount: 2,
      isPaused: true,
      alarmOn: true,
    };
    const reset = roundReducer(running, { type: 'RESET' });
    expect(reset.phase).toBe('idle');
    expect(reset.secondsLeft).toBe(0);
    expect(reset.isPaused).toBe(false);
    expect(reset.alarmOn).toBe(false);
    expect(reset.roundCount).toBe(2);
  });

  it('NEW_GAME resets round count but keeps totalRounds', () => {
    const mid = {
      ...initialRoundState,
      phase: 'done' as const,
      roundCount: 3,
      totalRounds: 5,
    };
    const fresh = roundReducer(mid, { type: 'NEW_GAME' });
    expect(fresh.phase).toBe('idle');
    expect(fresh.roundCount).toBe(0);
    expect(fresh.totalRounds).toBe(5);
  });

  it('ALARM_OFF clears the alarm flag', () => {
    const ringing = { ...initialRoundState, alarmOn: true };
    expect(roundReducer(ringing, { type: 'ALARM_OFF' }).alarmOn).toBe(false);
  });

  it('START_BLOCKED sets the gameComplete status', () => {
    const next = roundReducer(initialRoundState, { type: 'START_BLOCKED' });
    expect(next.statusKey).toBe('timer.gameComplete');
  });
});
