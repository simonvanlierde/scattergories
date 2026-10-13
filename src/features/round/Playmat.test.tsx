import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, expect, it } from "vitest";
import { i18n, initI18n } from "@/i18n/config";
import { Playmat } from "./Playmat";

beforeAll(async () => {
  await initI18n();
});

function renderAt(secondsLeft: number, gameSeconds = 60) {
  const noop = () => undefined;
  render(
    <I18nextProvider i18n={i18n}>
      <Playmat
        phase="running"
        isPaused={false}
        secondsLeft={secondsLeft}
        gameSeconds={gameSeconds}
        letter="A"
        letterVisible
        letterLanding={false}
        statusKey="timer.go"
        onPrimary={noop}
        onNewLetter={noop}
        onNextRound={noop}
      />
    </I18nextProvider>,
  );
  return screen.getByTestId("round-status");
}

it.each([
  [16, "Go!"],
  [15, "15 seconds left"],
  [6, "15 seconds left"],
  [5, "5 seconds left"],
  [1, "5 seconds left"],
])("at %ss the live region reads %j", (secondsLeft, expected) => {
  expect(renderAt(secondsLeft)).toHaveTextContent(expected);
});

it("skips a threshold the round started below", () => {
  expect(renderAt(10, 10)).toHaveTextContent("Go!");
});
