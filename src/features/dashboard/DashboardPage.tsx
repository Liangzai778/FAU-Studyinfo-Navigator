import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { academicData } from '../../data/academicData';
import { facultyCoverage, projectLinks } from '../../data/coverage';
import { calculateEctsProgress } from '../../domain/ectsEngine';
import type { TranslationKey } from '../../i18n/messages';
import { useTranslation } from '../../i18n/useTranslation';
import { useAcademicProfileStore } from '../../store/academicProfile';
import { useExamsTasksStore } from '../../store/examsTasks';
import { usePlannerStore } from '../../store/planner';
import { EmptyState } from '../../components/common/EmptyState';
import { ExternalLink } from '../../components/common/ExternalLink';
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

// These three are opened daily and are the reason a student keeps the page pinned.
// Keeping them on the dashboard saves a trip through the resource list, which
// stays the place for everything rarer.
const quickLinks: Array<{
  href: string;
  icon: 'mail' | 'degree' | 'resources';
  title: TranslationKey;
  body: TranslationKey;
}> = [
  {
    href: 'https://faumail.fau.de',
    icon: 'mail',
    title: 'dashboard.quickLinksMail',
    body: 'dashboard.quickLinksMailBody',
  },
  {
    href: 'https://campo.fau.de',
    icon: 'degree',
    title: 'dashboard.quickLinksCampo',
    body: 'dashboard.quickLinksCampoBody',
  },
  {
    href: 'https://www.studon.fau.de',
    icon: 'resources',
    title: 'dashboard.quickLinksStudOn',
    body: 'dashboard.quickLinksStudOnBody',
  },
];

export function DashboardPage() {
  const { t, language } = useTranslation();
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

      <section aria-labelledby="quick-links-heading" className="mb-10">
        <h2 id="quick-links-heading" className="mb-1 text-lg font-semibold text-slate-950 dark:text-white">
          {t('dashboard.quickLinksTitle')}
        </h2>
        <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('dashboard.quickLinksBody')}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800 dark:hover:bg-sky-950/30"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300">
                <Icon name={link.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-semibold text-slate-950 dark:text-white">
                  {t(link.title)}
                  <Icon name="external" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </span>
                <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-300">{t(link.body)}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="coverage-heading" className="mb-10">
        <h2 id="coverage-heading" className="mb-1 text-lg font-semibold text-slate-950 dark:text-white">
          {t('dashboard.coverageTitle')}
        </h2>
        <p className="mb-4 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('dashboard.coverageBody')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {facultyCoverage.map((faculty) => {
            const covered = faculty.status === 'covered';
            const moduleCount = faculty.programmes.reduce((sum, programme) => sum + programme.moduleCount, 0);
            return (
              <article
                key={faculty.facultyId}
                className={`rounded-2xl border p-4 ${
                  covered
                    ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{faculty.name[language]}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      covered
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {t(covered ? 'dashboard.coverageStatusCovered' : 'dashboard.coverageStatusPending')}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {faculty.programmes.length} {t('dashboard.coverageProgrammeUnit')} · {moduleCount}{' '}
                  {t('dashboard.coverageModuleUnit')}
                </p>
                {covered ? (
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {faculty.programmes.map((programme) => (
                      <li key={programme.programmeId}>{programme.name[language]}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
        <p className="mt-3 text-sm font-semibold">
          <ExternalLink href={projectLinks.contributing} className="text-sky-700 underline dark:text-sky-300">
            {t('dashboard.coverageCta')}
          </ExternalLink>
        </p>
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
          <Link to="/legal" className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-200">
            {t('app.legalLink')}
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardMetric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p></article>;
}
