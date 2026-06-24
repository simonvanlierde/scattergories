import { describe, expect, it } from 'vitest';
import manifestText from '../public/manifest.json?raw';

interface WebManifestIcon {
  src: string;
}

interface WebManifest {
  icons?: WebManifestIcon[];
}

describe('manifest icons', () => {
  it('references the hero-derived icon set', () => {
    const manifest = JSON.parse(manifestText) as WebManifest;
    const sources = manifest.icons?.map((icon) => icon.src) ?? [];

    expect(sources).toEqual(
      expect.arrayContaining([
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/icon-512-maskable.png',
      ]),
    );
  });
});
