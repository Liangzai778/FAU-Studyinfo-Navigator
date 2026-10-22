import type { TranslationKey } from '../../i18n/messages';

export type NavigationItem = {
  to: string;
  labelKey: TranslationKey;
  icon: 'dashboard' | 'degree' | 'planner' | 'exams' | 'resources' | 'settings';
  end?: boolean;
};

export const navigationItems: NavigationItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: 'dashboard', end: true },
  { to: '/degree', labelKey: 'nav.degree', icon: 'degree' },
  { to: '/planner', labelKey: 'nav.planner', icon: 'planner' },
  { to: '/exams', labelKey: 'nav.exams', icon: 'exams' },
  { to: '/resources', labelKey: 'nav.resources', icon: 'resources' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'settings' },
];
