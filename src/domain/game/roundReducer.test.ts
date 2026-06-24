import { describe, expect, it } from 'vitest';
import { FIVE, ONE, TEN, THIRTY, TWO, ZERO } from '@/test/constants';
import { BUFFER_SECONDS, DEFAULT_TIMER_SECONDS } from '@/test/gameConstants';
import { initialRoundState, roundReducer } from './roundReducer';

const startSpin = () => ({
  type: 'START_SPIN' as const,
  gameSeconds: DEFAULT_TIMER_SECONDS,
  remainingLetters: ['A', 'B'],
  drawnLetters: ['C'],
});

describe('roundReducer', () => {
  it('starts in idle', () => {
    expect(initialRoundState.phase).toBe('idle');
    expect(initialRoundState.secondsLeft).toBe(ZERO);
    expect(initialRoundState.remainingLetters).toEqual([]);
    expect(initialRoundState.drawnLetters).toEqual([]);
  });

  it('START_SPIN moves to spinning without multi-round progress', () => {
    const next = roundReducer(initialRoundState, startSpin());
    expect(next.phase).toBe('spinning');
    expect(next.gameSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(next.alarmOn).toBe(false);
    expect(next.statusKey).toBeNull();
    expect(next.remainingLetters).toEqual(['A', 'B']);
    expect(next.drawnLetters).toEqual(['C']);
  });

  it('LETTER_LANDED transitions spinning → buffer with bufferSeconds', () => {
    const spinning = roundReducer(initialRoundState, startSpin());
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
    const buffer = roundReducer(roundReducer(initialRoundState, startSpin()), {
      type: 'LETTER_LANDED',
    });
    const ticked = roundReducer(buffer, { type: 'TICK' });
    expect(ticked.phase).toBe('buffer');
    expect(ticked.secondsLeft).toBe(BUFFER_SECONDS - ONE);
  });

  it('TICK at last buffer second transitions to running with gameSeconds', () => {
    const buffer = roundReducer(roundReducer(initialRoundState, startSpin()), {
      type: 'LETTER_LANDED',
    });
    let state = buffer;
    for (let i = ZERO; i < BUFFER_SECONDS - ONE; i += ONE) {
      state = roundReducer(state, { type: 'TICK' });
    }
    // state.secondsLeft === 1, phase still buffer
    expect(state.phase).toBe('buffer');
    expect(state.secondsLeft).toBe(ONE);

    const running = roundReducer(state, { type: 'TICK' });
    expect(running.phase).toBe('running');
    expect(running.secondsLeft).toBe(DEFAULT_TIMER_SECONDS);
    expect(running.statusKey).toBe('timer.go');
  });

  it('TICK counts down running phase', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: FIVE,
      gameSeconds: FIVE,
    };
    const next = roundReducer(running, { type: 'TICK' });
    expect(next.phase).toBe('running');
    expect(next.secondsLeft).toBe(TWO + TWO);
  });

  it('TICK at last running second transitions to done and triggers alarm', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: ONE,
    };
    const done = roundReducer(running, { type: 'TICK' });
    expect(done.phase).toBe('done');
    expect(done.secondsLeft).toBe(ZERO);
    expect(done.alarmOn).toBe(true);
    expect(done.statusKey).toBe('timer.roundOver');
  });

  it('TICK is ignored while paused', () => {
    const paused = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: FIVE,
      isPaused: true,
    };
    const next = roundReducer(paused, { type: 'TICK' });
    expect(next).toBe(paused);
  });

  it('PAUSE_TOGGLE flips isPaused only during buffer/running', () => {
    const running = { ...initialRoundState, phase: 'running' as const, secondsLeft: FIVE };
    expect(roundReducer(running, { type: 'PAUSE_TOGGLE' }).isPaused).toBe(true);

    const idle = roundReducer(initialRoundState, { type: 'PAUSE_TOGGLE' });
    expect(idle).toBe(initialRoundState);
  });

  it('RESET returns to idle without clearing pinned letter bags', () => {
    const running = {
      ...initialRoundState,
      phase: 'running' as const,
      secondsLeft: THIRTY,
      isPaused: true,
      alarmOn: true,
      remainingLetters: ['A'],
      drawnLetters: ['B'],
    };
    const reset = roundReducer(running, { type: 'RESET' });
    expect(reset.phase).toBe('idle');
    expect(reset.secondsLeft).toBe(ZERO);
    expect(reset.isPaused).toBe(false);
    expect(reset.alarmOn).toBe(false);
    expect(reset.remainingLetters).toEqual(['A']);
    expect(reset.drawnLetters).toEqual(['B']);
  });

  it('SYNC_BAGS updates letter bags without changing other state', () => {
    const mid = { ...initialRoundState, phase: 'running' as const, secondsLeft: TEN };
    const synced = roundReducer(mid, {
      type: 'SYNC_BAGS',
      remainingLetters: ['X'],
      drawnLetters: ['Y'],
    });
    expect(synced.phase).toBe('running');
    expect(synced.secondsLeft).toBe(TEN);
    expect(synced.remainingLetters).toEqual(['X']);
    expect(synced.drawnLetters).toEqual(['Y']);
  });

  it('ALARM_OFF clears the alarm flag', () => {
    const ringing = { ...initialRoundState, alarmOn: true };
    expect(roundReducer(ringing, { type: 'ALARM_OFF' }).alarmOn).toBe(false);
  });
});
