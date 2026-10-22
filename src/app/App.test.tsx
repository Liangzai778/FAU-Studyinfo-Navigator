import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { defaultPreferences, preferenceStorageKey, usePreferenceStore } from '../store/preferences';

describe('application shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    usePreferenceStore.setState(defaultPreferences);
  });

  it('renders the Chinese dashboard by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '学习导航概览' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: '主导航' })).toHaveLength(2);
  });

  it('switches the entire shell to English and persists the choice', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '切换为英文' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Study navigation overview' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(preferenceStorageKey) ?? '{}')).toMatchObject({
      language: 'en',
    });
  });

  it('applies dark mode from the top bar', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '切换为深色模式' }));
    expect(document.documentElement).toHaveClass('dark');
  });
});
