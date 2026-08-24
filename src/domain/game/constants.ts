import { getLocaleLetters } from "@/i18n/localeRegistry";
import { CATEGORY_KEYS } from "./categoryKeys";
import gameConstants from "./constants.json";

// The default letter set used for English and as a baseline for tests.
export const englishLetters = getLocaleLetters("en");

export const categories = CATEGORY_KEYS;

export const bufferSecondsMin = gameConstants.bufferSecondsMin;
export const bufferSecondsMax = gameConstants.bufferSecondsMax;
export const bufferSecondsDefault = gameConstants.bufferSecondsDefault;

// Settings bounds and defaults
export const durationMin = gameConstants.durationMin;
export const durationMax = gameConstants.durationMax;
export const durationDefault = gameConstants.durationDefault;

export const catCountMin = gameConstants.catCountMin;
export const catCountMax = gameConstants.catCountMax;
export const catCountDefault = gameConstants.catCountDefault;
