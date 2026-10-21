import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, expect, it } from "vitest";
import type { Phase, StatusKey } from "@/domain/game/roundReducer";
import { i18n, initI18n } from "@/i18n/config";
import { Playmat } from "./Playmat";

beforeAll(async () => {
  await initI18n();
});

function renderAt(
  secondsLeft: number,
  gameSeconds = 60,
  {
    phase = "running",
    statusKey = "timer.go",
    roundNumber = 1,
  }: { phase?: Phase; statusKey?: StatusKey; roundNumber?: number } = {},
) {
  const noop = () => undefined;
  render(
    <I18nextProvider i18n={i18n}>
      <Playmat
        phase={phase}
        isPaused={false}
        secondsLeft={secondsLeft}
        gameSeconds={gameSeconds}
        letter="A"
        letterVisible
        letterLanding={false}
        statusKey={statusKey}
        roundNumber={roundNumber}
        onPrimary={noop}
        onNewLetter={noop}
        onNextRound={noop}
      />
    </I18nextProvider>,
  );
  const status = screen.getByTestId("round-status");
  const region = (politeness: string) => status.querySelector(`[aria-live="${politeness}"]`)?.textContent ?? null;
  return { status, polite: region("polite"), assertive: region("assertive") };
}

it.each([
  [16, "Go!"],
  [15, "15 seconds left"],
  [6, "15 seconds left"],
  [5, "5 seconds left"],
  [1, "5 seconds left"],
])("at %ss the live region reads %j", (secondsLeft, expected) => {
  expect(renderAt(secondsLeft).status).toHaveTextContent(expected);
});

it("skips a threshold the round started below", () => {
  expect(renderAt(10, 10).status).toHaveTextContent("Go!");
});

it.each([
  [16, "Go!", ""],
  [15, "15 seconds left", ""],
  [5, "", "5 seconds left"],
])("at %ss speaks %j politely and %j at once", (secondsLeft, polite, assertive) => {
  expect(renderAt(secondsLeft)).toMatchObject({ polite, assertive });
});

it("says the round is over at once", () => {
  expect(renderAt(0, 60, { phase: "done", statusKey: "timer.roundOver" })).toMatchObject({
    polite: "",
    assertive: "Round over!",
  });
});

it("shows which round the table is on once one has started", () => {
  renderAt(0, 60, { phase: "done", statusKey: "timer.roundOver", roundNumber: 4 });
  expect(screen.getByText("Round 4")).toBeInTheDocument();
});

it("shows no round count before the first roll", () => {
  renderAt(0, 60, { phase: "idle", statusKey: null, roundNumber: 0 });
  expect(screen.queryByText(/Round \d/)).not.toBeInTheDocument();
});
