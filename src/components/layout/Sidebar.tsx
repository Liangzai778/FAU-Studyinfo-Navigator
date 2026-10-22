import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { Icon } from '../common/Icon';
import { navigationItems } from './navigation';

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 lg:block">
      <nav aria-label={t('nav.primary')}>
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white',
                  ].join(' ')
                }
              >
                <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute inset-x-4 bottom-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{t('app.unofficial')}</p>
      </div>
    </aside>
  );
}
