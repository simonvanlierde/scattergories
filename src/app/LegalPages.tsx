import { useEffect, useRef } from "react";
import { useSettings } from "@/features/settings/SettingsProvider";
import { BrandMark } from "@/shared/ui/BrandMark";
import accessibilityHtml from "../../docs/accessibility.md";
import privacyHtml from "../../docs/privacy.md";

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
      </div>
    </div>
  );
}
