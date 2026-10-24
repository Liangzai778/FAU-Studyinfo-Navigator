import { Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white focus:translate-y-0"
        href="#main-content"
      >
        {t('app.skipToContent')}
      </a>
      <TopBar />
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <main id="main-content" tabIndex={-1} className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:py-10 lg:px-10 lg:pb-10">
            <Outlet />
          </main>
          <footer className="border-t border-slate-200 bg-white px-6 pb-24 pt-6 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 lg:ml-0 lg:py-6">
            <p>{t('app.unofficial')}</p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>{t('app.legalLine')}</span>
              <span aria-hidden="true">·</span>
              <Link to="/legal" className="font-semibold text-sky-700 underline underline-offset-2 dark:text-sky-300">
                {t('app.legalLink')}
              </Link>
            </p>
          </footer>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
