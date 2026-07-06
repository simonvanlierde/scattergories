import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("kaboom");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <span>content</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("shows the fallback and logs when a child throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("fallback")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("renders nothing when a child throws and no fallback is given", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
