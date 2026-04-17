import { getLocaleLetters } from '../i18n/localeRegistry';
import categoriesResourceEn from '../i18n/locales/categories.en.json';
import gameConstants from './constants.json';

// The default letter set used for English and as a baseline for tests.
export const englishLetters = getLocaleLetters('en');
export const letters = englishLetters;

export const categories = Object.freeze(Object.keys(categoriesResourceEn));

export const bufferSeconds = gameConstants.bufferSeconds;

// Settings bounds and defaults
export const durationMin = gameConstants.durationMin;
export const durationMax = gameConstants.durationMax;
export const durationDefault = gameConstants.durationDefault;

export const catCountMin = gameConstants.catCountMin;
export const catCountMax = gameConstants.catCountMax;
export const catCountDefault = gameConstants.catCountDefault;

export const roundsMin = gameConstants.roundsMin;
export const roundsMax = gameConstants.roundsMax;
export const roundsDefault = gameConstants.roundsDefault;
