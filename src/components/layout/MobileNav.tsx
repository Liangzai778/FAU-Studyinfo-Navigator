import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { Icon } from '../common/Icon';
import { navigationItems } from './navigation';

export function MobileNav() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('nav.primary')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/98 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/98 lg:hidden"
    >
      <ul className="grid grid-cols-6">
        {navigationItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-1 text-center text-[10px] font-semibold leading-tight',
                  isActive
                    ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                    : 'text-slate-500 dark:text-slate-400',
                ].join(' ')
              }
            >
              <Icon name={item.icon} className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
