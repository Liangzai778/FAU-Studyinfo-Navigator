import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPreferences, preferenceStorageKey, usePreferenceStore } from './preferences';

describe('preference store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    usePreferenceStore.setState(defaultPreferences);
  });

  it('uses Simplified Chinese and light theme by default', () => {
    expect(usePreferenceStore.getState().language).toBe('zh-CN');
    expect(usePreferenceStore.getState().theme).toBe('light');
  });

  it('persists language and theme in localStorage', () => {
    usePreferenceStore.getState().setLanguage('en');
    usePreferenceStore.getState().setTheme('dark');

    expect(JSON.parse(window.localStorage.getItem(preferenceStorageKey) ?? '{}')).toEqual({
      language: 'en',
      theme: 'dark',
    });
  });

  it('restores defaults without clearing unrelated localStorage values', () => {
    window.localStorage.setItem('unrelated', 'keep');
    usePreferenceStore.getState().setLanguage('en');
    usePreferenceStore.getState().reset();

    expect(usePreferenceStore.getState().language).toBe('zh-CN');
    expect(window.localStorage.getItem('unrelated')).toBe('keep');
  });
});
