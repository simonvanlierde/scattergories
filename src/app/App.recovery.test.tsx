import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./useGameController", () => ({
  useGameController: () => {
    throw new Error("corrupt saved settings");
  },
}));

it("shows the recovery screen when the game state fails to build", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
  expect(screen.getByRole("button", { name: "Reload app" })).toBeInTheDocument();
});
