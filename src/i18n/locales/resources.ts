import type { Messages } from "@lingui/core";
import { FALLBACK_LOCALE, resolveLocale } from "../localeRegistry";
import { messages as english } from "./en.po";

const loaders = import.meta.glob<{ messages: Messages }>(["./*.po", "!./en.po"]);

async function loadLocaleMessages(locale: string): Promise<Messages> {
  const resolved = resolveLocale(locale);
  if (resolved === FALLBACK_LOCALE) {
    return english;
  }
  const loader = loaders[`./${resolved}.po`];
  if (!loader) {
    return english;
  }
  return (await loader()).messages;
}

export { loadLocaleMessages };
