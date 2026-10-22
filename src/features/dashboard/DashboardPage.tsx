import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { academicData } from '../../data/academicData';
import { calculateEctsProgress } from '../../domain/ectsEngine';
import type { TranslationKey } from '../../i18n/messages';
import { useTranslation } from '../../i18n/useTranslation';
import { useAcademicProfileStore } from '../../store/academicProfile';
import { useExamsTasksStore } from '../../store/examsTasks';
import { usePlannerStore } from '../../store/planner';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { PageHeader } from '../../components/common/PageHeader';

const actions: Array<{
  to: string;
  icon: 'degree' | 'resources' | 'settings';
  title: TranslationKey;
  body: TranslationKey;
}> = [
  {
    to: '/resources',
    icon: 'resources',
    title: 'dashboard.resourcesTitle',
    body: 'dashboard.resourcesBody',
  },
  {
    to: '/degree',
    icon: 'degree',
    title: 'dashboard.degreeTitle',
    body: 'dashboard.degreeBody',
  },
  {
    to: '/settings',
    icon: 'settings',
    title: 'dashboard.settingsTitle',
    body: 'dashboard.settingsBody',
  },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const profile = useAcademicProfileStore((state) => state.profile);
  const hydrateProfile = useAcademicProfileStore((state) => state.hydrate);
  const courses = usePlannerStore((state) => state.courses);
  const attempts = usePlannerStore((state) => state.attempts);
  const hydratePlanner = usePlannerStore((state) => state.hydrate);
  const exams = useExamsTasksStore((state) => state.exams);
  const tasks = useExamsTasksStore((state) => state.tasks);
  const hydrateExamsTasks = useExamsTasksStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateProfile();
    void hydratePlanner();
    void hydrateExamsTasks();
  }, [hydrateExamsTasks, hydratePlanner, hydrateProfile]);

  const selectedPoId = profile?.mode === 'scoped' ? profile.selection.examinationRegulationVersionId : null;
  const selectedPo = academicData.examinationRegulationVersions.find((item) => item.id === selectedPoId);
  const progress = useMemo(() => calculateEctsProgress({
    selectedPoVersionId: selectedPoId,
    courses,
    attempts,
    requirementGroups: selectedPoId ? academicData.requirementGroups.filter((group) => group.examinationRegulationVersionId === selectedPoId) : [],
    sourceStatuses: Object.fromEntries(academicData.academicSources.map((source) => [source.id, source.verificationStatus])),
  }), [attempts, courses, selectedPoId]);
  const hasPersonalData = courses.length + exams.length + tasks.length > 0;

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} eyebrow={t('app.localOnly')} />

      <section className={`mb-8 flex gap-4 rounded-2xl border p-5 ${selectedPo ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50'}`}>
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <Icon name="degree" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-950 dark:text-white">{t(selectedPo ? 'dashboard.scopeReadyTitle' : 'dashboard.noticeTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{selectedPo ? `${t('dashboard.scopeReadyBody')} ${selectedPo.code}` : t('dashboard.noticeBody')}</p>
        </div>
      </section>

      <section aria-labelledby="start-heading" className="mb-10">
        <h2 id="start-heading" className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          {t('dashboard.nextTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800 dark:hover:bg-sky-950/30"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300">
                <Icon name={action.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-semibold text-slate-950 dark:text-white">{t(action.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t(action.body)}</p>
            </Link>
          ))}
        </div>
      </section>

      {hasPersonalData ? (
        <section aria-label={t('dashboard.progressTitle')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric label={t('dashboard.courseCount')} value={courses.length} />
          <DashboardMetric label={t('planner.completedEcts')} value={progress.completedEcts} />
          <DashboardMetric label={t('planner.plannedEcts')} value={progress.plannedEcts} />
          <DashboardMetric label={t('dashboard.personalDates')} value={exams.length + tasks.filter((task) => !task.completed).length} />
        </section>
      ) : (
        <EmptyState title={t('dashboard.emptyTitle')} body={t('dashboard.emptyBody')} badge={t('common.localData')} />
      )}

      <section className="mt-6 flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <Icon name="shield" className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <div>
          <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">{t('dashboard.privacyTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-200/80">{t('dashboard.privacyBody')}</p>
        </div>
      </section>
    </div>
  );
}

function DashboardMetric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p></article>;
}
