import { useEffect, useRef } from "react";
import { useSettings } from "@/features/settings/SettingsProvider";
import { BrandMark } from "@/shared/ui/BrandMark";
import accessibilityHtml from "../../docs/accessibility.md";
import privacyHtml from "../../docs/privacy.md";
import { AUTHOR_NAME, AUTHOR_URL, LICENSE_URL, SOURCE_CODE_URL } from "./links";

export function LegalPage({ path }: { path: "/privacy" | "/accessibility" }) {
  const { settings } = useSettings();
  const main = useRef<HTMLElement>(null);
  const isPrivacy = path === "/privacy";

  useEffect(() => {
    document.documentElement.lang = "en";
    document.title = `${isPrivacy ? "Privacy statement" : "Accessibility statement"} — Scattergories`;
    main.current?.focus();
  }, [isPrivacy]);

  return (
    <div className="app-shell legal-page" data-theme={settings.theme} lang="en">
      <div className="legal-page__sheet">
        <header className="legal-page__masthead">
          <a href="/" aria-label="Scattergories home">
            <BrandMark size={40} />
            <span>Scattergories</span>
          </a>
        </header>
        <main ref={main} tabIndex={-1}>
          <a className="legal-page__back" href="/">
            Back to the game
          </a>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted repository Markdown is compiled at build time. */}
          <article dangerouslySetInnerHTML={{ __html: isPrivacy ? privacyHtml : accessibilityHtml }} />
        </main>
        <nav className="legal-page__nav" aria-label="Documents">
          <a href="/privacy" aria-current={isPrivacy ? "page" : undefined}>
            Privacy statement
          </a>
          <a href="/accessibility" aria-current={isPrivacy ? undefined : "page"}>
            Accessibility statement
          </a>
        </nav>
        <p className="legal-page__credit">
          Made by <a href={AUTHOR_URL}>{AUTHOR_NAME}</a> · <a href={SOURCE_CODE_URL}>Source</a> ·{" "}
          <a href={LICENSE_URL}>MIT license</a>
        </p>
      </div>
    </div>
  );
}
