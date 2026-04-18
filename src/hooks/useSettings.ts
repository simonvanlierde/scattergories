import {
  SettingsProvider as SettingsProviderValue,
  useSettings as useSettingsValue,
} from '../settings/SettingsProvider';

const SettingsProvider = SettingsProviderValue;
const useSettings = useSettingsValue;

export type { CategoryMode, PromptDeckPreference, Settings, Theme } from '../settings/schema';
export { SettingsProvider, useSettings };
