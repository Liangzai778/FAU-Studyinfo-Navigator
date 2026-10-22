import { useEffect } from 'react';
import { z } from 'zod';
import { create } from 'zustand';

const STORAGE_KEY = 'fau-study-navigator.preferences.v1';

const preferencesSchema = z.object({
  language: z.enum(['zh-CN', 'en']),
  theme: z.enum(['light', 'dark']),
});

export type Preferences = z.infer<typeof preferencesSchema>;

type PreferenceState = Preferences & {
  setLanguage: (language: Preferences['language']) => void;
  setTheme: (theme: Preferences['theme']) => void;
  reset: () => void;
};

export const defaultPreferences: Preferences = {
  language: 'zh-CN',
  theme: 'light',
};

function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    const parsed = preferencesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

function savePreferences(preferences: Preferences) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are non-critical. The UI continues with in-memory state.
  }
}

const initialPreferences = loadPreferences();

export const usePreferenceStore = create<PreferenceState>((set) => ({
  ...initialPreferences,
  setLanguage: (language) =>
    set((state) => {
      const next = { language, theme: state.theme };
      savePreferences(next);
      return next;
    }),
  setTheme: (theme) =>
    set((state) => {
      const next = { language: state.language, theme };
      savePreferences(next);
      return next;
    }),
  reset: () => {
    savePreferences(defaultPreferences);
    set(defaultPreferences);
  },
}));

export function applyTheme(theme: Preferences['theme']) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
}

export function applyStoredTheme() {
  applyTheme(usePreferenceStore.getState().theme);
}

export function useDocumentPreferences() {
  const language = usePreferenceStore((state) => state.language);
  const theme = usePreferenceStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}

export const preferenceStorageKey = STORAGE_KEY;
