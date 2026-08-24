import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { getLocaleLetterWeights } from "@/domain/game/localeWeights";
import { roundReducer } from "@/domain/game/roundReducer";
import { weightedLetterBag } from "@/domain/game/utils";
import { getLocaleLetters } from "@/i18n/localeRegistry";
import { ONE_SECOND_MS, TWO_SECONDS_MS } from "@/test/constants";
import { BUFFER_SECONDS } from "@/test/gameConstants";
import { useAudio } from "./useAudio";
import { useLetterRoller } from "./useLetterRoller";
import { useRound } from "./useRound";

const SHORT_ROUND_SECONDS = 5;
const LONG_ROUND_SECONDS = 20;
const PARTIAL_SECOND_MS = 400;
const REMAINDER_MS = ONE_SECOND_MS - PARTIAL_SECOND_MS;
const PAUSED_WAIT_MS = 5000;
const SUSPENDED_HOURS_MS = 3 * 60 * 60 * 1000;
const FIXED_RANDOM = 0.5;

vi.mock("./useAudio");
vi.mock("./useLetterRoller");
// Real reducer, wrapped so a test can count the actions the hook dispatches.
vi.mock("@/domain/game/roundReducer", async (importActual) => {
  const actual = await importActual<typeof import("@/domain/game/roundReducer")>();
  return { ...actual, roundReducer: vi.fn(actual.roundReducer) };
});

const mockPlayTick = vi.fn();
const mockPlayAlarm = vi.fn();
const mockPlayLetterLand = vi.fn();
const mockSpinTo = vi.fn();
const mockResetRoller = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(useAudio).mockReturnValue({
    playTick: mockPlayTick,
    playAlarm: mockPlayAlarm,
    playLetterLand: mockPlayLetterLand,
  } satisfies ReturnType<typeof useAudio>);
  vi.mocked(useLetterRoller).mockReturnValue({
    letter: "?",
    visible: false,
    landing: false,
    spinTo: mockSpinTo,
    reset: mockResetRoller,
  } satisfies ReturnType<typeof useLetterRoller>);
});

function createRoundDriver(options: Partial<Parameters<typeof useRound>[0]> = {}) {
  let landCallback: (() => void) | undefined;
  mockSpinTo.mockImplementation((_letter: string, callback: () => void) => {
    landCallback = callback;
  });

  const rendered = renderHook(() =>
    useRound({
      gameSeconds: SHORT_ROUND_SECONDS,
      bufferSeconds: BUFFER_SECONDS,
      isMuted: false,
      locale: "en",
      ...options,
    }),
  );

  const advanceSeconds = (seconds: number) => {
    for (let elapsed = 0; elapsed < seconds; elapsed += 1) {
      act(() => vi.advanceTimersByTime(ONE_SECOND_MS));
    }
  };

  return {
    get current() {
      return rendered.result.current;
    },
    start() {
      act(() => rendered.result.current.primaryAction());
    },
    landLetter() {
      if (!landCallback) {
        throw new Error("Expected spinTo to register a landing callback before landing");
      }
      act(() => landCallback?.());
    },
    advanceBuffer() {
      advanceSeconds(BUFFER_SECONDS);
    },
    advanceGame(seconds = options.gameSeconds ?? SHORT_ROUND_SECONDS) {
      advanceSeconds(seconds);
    },
    advanceSeconds,
  };
}

it("starts in idle state", () => {
  const driver = createRoundDriver();

  expect(driver.current.phase).toBe("idle");
});

it("starts a round by spinning a letter", () => {
  const driver = createRoundDriver();

  driver.start();

  expect(driver.current.phase).toBe("spinning");
  expect(mockSpinTo).toHaveBeenCalledOnce();
});

it("moves from landed letter buffer into the running countdown", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();

  expect(driver.current.phase).toBe("buffer");
  expect(driver.current.secondsLeft).toBe(BUFFER_SECONDS);

  driver.advanceBuffer();

  expect(driver.current.phase).toBe("running");
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
});

it("finishes a running round and plays the alarm", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  driver.advanceGame();

  expect(driver.current.phase).toBe("done");
  expect(driver.current.alarmOn).toBe(true);
  expect(mockPlayAlarm).toHaveBeenCalledOnce();
});

it("plays tick sounds during the final 10 running seconds", () => {
  const driver = createRoundDriver({ gameSeconds: LONG_ROUND_SECONDS });

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();

  expect(driver.current.secondsLeft).toBe(LONG_ROUND_SECONDS);
  expect(mockPlayTick).not.toHaveBeenCalled();

  driver.advanceSeconds(10);
  expect(driver.current.secondsLeft).toBe(10);
  expect(mockPlayTick).toHaveBeenCalledTimes(1);

  driver.advanceSeconds(1);
  expect(mockPlayTick).toHaveBeenCalledTimes(2);
});

it("pauses and resumes without losing countdown time", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();

  act(() => driver.current.togglePause());
  expect(driver.current.isPaused).toBe(true);

  act(() => vi.advanceTimersByTime(TWO_SECONDS_MS));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

  act(() => driver.current.togglePause());
  driver.advanceSeconds(1);

  expect(driver.current.isPaused).toBe(false);
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS - 1);
});

it("uses the plain round-over status when time runs out", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  driver.advanceGame();

  expect(driver.current.phase).toBe("done");
  expect(driver.current.statusKey).toBe("timer.roundOver");
});

it("draws letters from a non-repeating bag and tracks used letters", () => {
  const driver = createRoundDriver();

  driver.start();
  const first = mockSpinTo.mock.calls[0]?.[0];
  driver.landLetter();
  act(() => driver.current.nextRound());
  const second = mockSpinTo.mock.calls[1]?.[0];

  expect(second).not.toBe(first);
  expect(driver.current.usedLetters).toEqual([first, second]);
});

it("draws common letters far more often than rare ones", () => {
  const trials = 60;
  const rareShareLimit = 0.3;
  const weights = getLocaleLetterWeights("en");
  const rare = new Set(
    [...getLocaleLetters("en")].sort((a, b) => (weights[a] ?? 0) - (weights[b] ?? 0)).slice(0, 5),
  );

  let rareFirst = 0;
  for (let i = 0; i < trials; i += 1) {
    vi.clearAllMocks();
    createRoundDriver().start();
    if (rare.has(mockSpinTo.mock.calls[0]?.[0])) {
      rareFirst += 1;
    }
  }

  // True share for the five rarest English letters is ~2%; drawing from the
  // wrong end of the weighted bag would push this near 100%.
  expect(rareFirst / trials).toBeLessThan(rareShareLimit);
});

it("draws from the weighted order when avoidRepeats is off", () => {
  vi.spyOn(Math, "random").mockReturnValue(FIXED_RANDOM);
  const driver = createRoundDriver({ avoidRepeats: false });

  driver.start();

  // Same RNG, same weighted order — a uniform pick would land elsewhere.
  expect(mockSpinTo.mock.calls[0]?.[0]).toBe(weightedLetterBag("en", () => FIXED_RANDOM)[0]);
});

it("keeps the letter and roller when the locale changes mid-round", () => {
  const { result, rerender } = renderHook(
    (props: Parameters<typeof useRound>[0]) => useRound(props),
    {
      initialProps: {
        gameSeconds: SHORT_ROUND_SECONDS,
        bufferSeconds: BUFFER_SECONDS,
        isMuted: false,
        locale: "en",
      },
    },
  );

  let landCallback: (() => void) | undefined;
  mockSpinTo.mockImplementation((_letter: string, callback: () => void) => {
    landCallback = callback;
  });
  act(() => result.current.nextRound());
  act(() => landCallback?.());
  expect(result.current.phase).toBe("buffer");

  const resetsBefore = mockResetRoller.mock.calls.length;
  rerender({
    gameSeconds: SHORT_ROUND_SECONDS,
    bufferSeconds: BUFFER_SECONDS,
    isMuted: false,
    locale: "el",
  });

  // The bag is rebuilt for the new alphabet, but the round in progress keeps its letter.
  expect(mockResetRoller.mock.calls.length).toBe(resetsBefore);
  expect(result.current.phase).toBe("buffer");
});

it("does nothing when the wake lock API is unavailable", () => {
  expect(navigator.wakeLock).toBeUndefined();
  const driver = createRoundDriver();

  expect(() => {
    driver.start();
    driver.landLetter();
    driver.advanceBuffer();
  }).not.toThrow();
  expect(driver.current.phase).toBe("running");
});

it("caps the catch-up burst after a long tab suspension", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

  vi.mocked(roundReducer).mockClear();
  act(() => {
    vi.setSystemTime(Date.now() + SUSPENDED_HOURS_MS);
    vi.advanceTimersByTime(ONE_SECOND_MS);
  });

  const tickCount = vi
    .mocked(roundReducer)
    .mock.calls.filter(([, action]) => action.type === "TICK").length;
  expect(driver.current.phase).toBe("done");
  expect(tickCount).toBeLessThanOrEqual(SHORT_ROUND_SECONDS + 1);
});

it("leaves the bag untouched and skips immediate repeats when avoidRepeats is off", () => {
  const driver = createRoundDriver({ avoidRepeats: false });

  driver.start();
  const first = mockSpinTo.mock.calls[0]?.[0];
  driver.landLetter();
  act(() => driver.current.nextRound());
  const second = mockSpinTo.mock.calls[1]?.[0];

  // Independent random draws: no bag is consumed, so nothing accrues to usedLetters.
  expect(driver.current.usedLetters).toEqual([]);
  // But two consecutive draws never land on the same letter back-to-back.
  expect(second).not.toBe(first);
  expect(getLocaleLetters("en")).toContain(second);
});

it("new letter rerolls and auto-starts the get-ready buffer", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  // From buffer, reroll the letter — should re-spin then auto-start the buffer.
  act(() => driver.current.newLetter());
  expect(driver.current.phase).toBe("spinning");
  driver.landLetter();
  expect(driver.current.phase).toBe("buffer");
  expect(driver.current.secondsLeft).toBe(BUFFER_SECONDS);
});

it("keeps sub-second progress across a pause/resume", () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

  // Part-way into the current second, then pause and wait a while.
  act(() => vi.advanceTimersByTime(PARTIAL_SECOND_MS));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
  act(() => driver.current.togglePause());
  act(() => vi.advanceTimersByTime(PAUSED_WAIT_MS));

  // Resuming needs only the leftover of that second — not a fresh full second.
  act(() => driver.current.togglePause());
  act(() => vi.advanceTimersByTime(REMAINDER_MS - 1));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
  act(() => vi.advanceTimersByTime(1));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS - 1);
});

it("rebuilds the letter bag for the new alphabet when the locale changes", () => {
  let landCallback: (() => void) | undefined;
  mockSpinTo.mockImplementation((_letter: string, callback: () => void) => {
    landCallback = callback;
  });
  const { result, rerender } = renderHook(
    (props: Parameters<typeof useRound>[0]) => useRound(props),
    {
      initialProps: {
        gameSeconds: SHORT_ROUND_SECONDS,
        bufferSeconds: BUFFER_SECONDS,
        isMuted: false,
        locale: "en",
      },
    },
  );

  act(() => result.current.nextRound());
  const enLetter = mockSpinTo.mock.calls[0]?.[0];
  expect(getLocaleLetters("en")).toContain(enLetter);
  act(() => landCallback?.());
  expect(result.current.usedLetters).toEqual([enLetter]);

  rerender({
    gameSeconds: SHORT_ROUND_SECONDS,
    bufferSeconds: BUFFER_SECONDS,
    isMuted: false,
    locale: "el",
  });
  // The switch clears the old-alphabet draw history and rebuilds the bag.
  expect(result.current.usedLetters).toEqual([]);

  act(() => result.current.nextRound());
  const elLetter = mockSpinTo.mock.calls[1]?.[0];
  expect(getLocaleLetters("el")).toContain(elLetter);
  expect(getLocaleLetters("en")).not.toContain(elLetter);
});
