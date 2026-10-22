import { useState } from 'react';
import { Icon } from '../../components/common/Icon';
import { PageHeader } from '../../components/common/PageHeader';
import { BackupPanel } from '../exams/BackupPanel';
import { useTranslation } from '../../i18n/useTranslation';
import { clearIndexedDbPersonalData } from '../../storage/clearLocalData';
import { useAcademicProfileStore } from '../../store/academicProfile';
import { useExamsTasksStore } from '../../store/examsTasks';
import { usePlannerStore } from '../../store/planner';
import { usePreferenceStore } from '../../store/preferences';
import { useResourceNavigatorStore } from '../../store/resourceNavigator';

export function SettingsPage() {
  const { language, t } = useTranslation();
  const theme = usePreferenceStore((state) => state.theme);
  const setLanguage = usePreferenceStore((state) => state.setLanguage);
  const setTheme = usePreferenceStore((state) => state.setTheme);
  const reset = usePreferenceStore((state) => state.reset);
  const resetResources = useResourceNavigatorStore((state) => state.reset);
  const hydrateAcademicProfile = useAcademicProfileStore((state) => state.hydrate);
  const hydratePlanner = usePlannerStore((state) => state.hydrate);
  const hydrateExamsTasks = useExamsTasksStore((state) => state.hydrate);
  const [resetMessage, setResetMessage] = useState(false);
  const [clearMessage, setClearMessage] = useState('');
  const [clearing, setClearing] = useState(false);

  const resetPreferences = () => {
    reset();
    setResetMessage(true);
  };

  const clearAllData = async () => {
    if (!window.confirm(t('settings.clearConfirm'))) return;
    setClearing(true);
    setClearMessage('');
    try {
      await clearIndexedDbPersonalData();
      resetResources();
      reset();
      await Promise.all([hydrateAcademicProfile(true), hydratePlanner(true), hydrateExamsTasks(true)]);
      setClearMessage(t('settings.clearDone'));
    } catch {
      setClearMessage(t('settings.clearFailed'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <Icon name="globe" className="mt-0.5 h-6 w-6 text-sky-700 dark:text-sky-300" />
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">{t('settings.languageTitle')}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('settings.languageBody')}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label={t('settings.languageTitle')}>
            {(['zh-CN', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={language === option}
                className={[
                  'rounded-xl border px-4 py-3 text-sm font-semibold',
                  language === option
                    ? 'border-sky-700 bg-sky-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
                ].join(' ')}
                onClick={() => setLanguage(option)}
              >
                {option === 'zh-CN' ? t('settings.chinese') : t('settings.english')}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <Icon name={theme === 'light' ? 'sun' : 'moon'} className="mt-0.5 h-6 w-6 text-sky-700 dark:text-sky-300" />
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">{t('settings.themeTitle')}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('settings.themeBody')}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label={t('settings.themeTitle')}>
            {(['light', 'dark'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                className={[
                  'rounded-xl border px-4 py-3 text-sm font-semibold',
                  theme === option
                    ? 'border-sky-700 bg-sky-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
                ].join(' ')}
                onClick={() => setTheme(option)}
              >
                {option === 'light' ? t('settings.light') : t('settings.dark')}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-6 w-6 text-emerald-700 dark:text-emerald-300" />
          <div>
            <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">{t('settings.storageTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-200/80">{t('settings.storageBody')}</p>
          </div>
        </div>
      </section>

      <div className="mt-5"><BackupPanel /></div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={resetPreferences}
        >
          {t('settings.reset')}
        </button>
        <p aria-live="polite" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {resetMessage ? t('settings.resetDone') : ''}
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/30">
        <h2 className="font-semibold text-rose-950 dark:text-rose-100">{t('settings.clearTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-rose-900/80 dark:text-rose-200/80">{t('settings.clearBody')}</p>
        <button type="button" disabled={clearing} onClick={() => void clearAllData()} className="mt-4 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50">
          {t('settings.clearAction')}
        </button>
        <p aria-live="polite" className="mt-3 min-h-5 text-sm font-semibold text-rose-800 dark:text-rose-200">{clearMessage}</p>
      </section>
    </div>
  );
}
