import { useTranslation } from '../../i18n/useTranslation';
import { usePreferenceStore } from '../../store/preferences';
import { Icon } from '../common/Icon';

export function TopBar() {
  const { language, t } = useTranslation();
  const theme = usePreferenceStore((state) => state.theme);
  const setLanguage = usePreferenceStore((state) => state.setLanguage);
  const setTheme = usePreferenceStore((state) => state.setTheme);

  const languageLabel = language === 'zh-CN' ? t('topbar.switchEnglish') : t('topbar.switchChinese');
  const themeLabel = theme === 'light' ? t('topbar.darkMode') : t('topbar.lightMode');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-700 text-sm font-black tracking-tight text-white shadow-sm">
            FS
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white sm:text-base">{t('app.name')}</p>
            <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {t('app.localOnly')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
            aria-label={languageLabel}
            title={languageLabel}
            onClick={() => setLanguage(language === 'zh-CN' ? 'en' : 'zh-CN')}
          >
            <Icon name="globe" className="h-4 w-4" />
            <span aria-hidden="true">{language === 'zh-CN' ? 'EN' : '中'}</span>
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
