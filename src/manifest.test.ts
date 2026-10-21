import { describe, expect, it } from "vitest";
import manifestText from "../public/manifest.json?raw";

interface WebManifestIcon {
  src: string;
}

interface WebManifest {
  icons?: WebManifestIcon[];
  screenshots?: { src: string; form_factor?: string }[];
}

describe("manifest icons", () => {
  it("references the hero-derived icon set", () => {
    const manifest = JSON.parse(manifestText) as WebManifest;
    const sources = manifest.icons?.map((icon) => icon.src) ?? [];

    expect(sources).toEqual(
      expect.arrayContaining(["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-512-maskable.png"]),
    );
  });
});

describe("manifest screenshots", () => {
  it("offers one narrow and one wide screenshot for the install sheet", () => {
    const manifest = JSON.parse(manifestText) as WebManifest;
    const shots = manifest.screenshots ?? [];

    expect(shots.map((shot) => shot.form_factor).sort()).toEqual(["narrow", "wide"]);
    for (const shot of shots) {
      expect(shot.src).toMatch(/^\/screenshots\/[a-z]+\.jpg$/);
    }
  });
});
