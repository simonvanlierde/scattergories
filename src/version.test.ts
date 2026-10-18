import { describe, expect, it } from "vitest";
import changelog from "../CHANGELOG.md?raw";

describe("release version", () => {
  it("shows the latest released version in the CHANGELOG", () => {
    const latest = changelog.match(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/m);

    expect(latest?.[1]).toBe(__APP_VERSION__);
  });
});
