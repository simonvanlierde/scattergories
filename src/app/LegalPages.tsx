import { useLingui } from "@lingui/react";
import { useEffect, useRef } from "react";
import { useSettings } from "@/features/settings/SettingsProvider";
import { BrandMark } from "@/shared/ui/BrandMark";
import accessibilityHtml from "../../docs/accessibility.md";
import privacyHtml from "../../docs/privacy.md";
import { AUTHOR_NAME, AUTHOR_URL, LICENSE_URL, SOURCE_CODE_URL } from "./links";

export function LegalPage({ path }: { path: "/privacy" | "/accessibility" }) {
  const { settings } = useSettings();
  const { _: t, i18n } = useLingui();
  const main = useRef<HTMLElement>(null);
  const isPrivacy = path === "/privacy";

  useEffect(() => {
    document.title = `${isPrivacy ? "Privacy statement" : "Accessibility statement"} — Scattergories`;
    main.current?.focus();
  }, [isPrivacy]);

  return (
    <div className="app-shell legal-page" data-theme={settings.theme} lang={i18n.locale}>
      <div className="legal-page__sheet">
        <header className="legal-page__masthead">
          <a href="/" aria-label={t("legal.home")}>
            <BrandMark size={40} />
            <span>Scattergories</span>
          </a>
        </header>
        <main ref={main} tabIndex={-1}>
          <a className="legal-page__back" href="/">
            {t("legal.back")}
          </a>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted repository Markdown is compiled at build time. */}
          <article lang="en" dangerouslySetInnerHTML={{ __html: isPrivacy ? privacyHtml : accessibilityHtml }} />
          <p className="legal-page__credit">
            <a href={AUTHOR_URL}>{t("about.madeBy", { name: AUTHOR_NAME })}</a> ·{" "}
            <a href={SOURCE_CODE_URL}>{t("about.source")}</a> · <a href={LICENSE_URL}>{t("about.license")}</a>
          </p>
        </main>
        <nav className="legal-page__nav" aria-label="Documents">
          <a href="/privacy" aria-current={isPrivacy ? "page" : undefined}>
            {t("modal.privacyLink")}
          </a>
          <a href="/accessibility" aria-current={isPrivacy ? undefined : "page"}>
            {t("modal.accessibilityLink")}
          </a>
        </nav>
      </div>
    </div>
  );
}
