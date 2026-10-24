import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { academicData } from '../../data/academicData';
import type { RequirementGroup } from '../../domain/academic';
import { calculateEctsProgress } from '../../domain/ectsEngine';
import type {
  CourseAttempt,
  CourseAttemptInput,
  EctsRiskCode,
  LocalCourse,
  LocalCourseInput,
  StudyStatus,
  CourseMeeting,
} from '../../domain/planner';
import { useTranslation } from '../../i18n/useTranslation';
import { useAcademicProfileStore } from '../../store/academicProfile';
import { usePlannerStore } from '../../store/planner';
import { buildCourseCatalogue } from '../../domain/courseCatalogue';
import { buildTimetable } from '../../domain/planner';
import type { TimetableDay } from '../../domain/planner';
import { CourseForm } from './CourseForm';
import { TimetableGrid } from './TimetableGrid';
import { SemesterCalendar } from './SemesterCalendar';

const riskKeys: Record<EctsRiskCode, `planner.risk.${EctsRiskCode}`> = {
  no_selected_po: 'planner.risk.no_selected_po',
  no_verified_rules: 'planner.risk.no_verified_rules',
  unverified_rule: 'planner.risk.unverified_rule',
  unknown_source: 'planner.risk.unknown_source',
  missing_group_ects: 'planner.risk.missing_group_ects',
  missing_course_ects: 'planner.risk.missing_course_ects',
  unconfirmed_recognition: 'planner.risk.unconfirmed_recognition',
  po_mismatch: 'planner.risk.po_mismatch',
  unassigned_po: 'planner.risk.unassigned_po',
  unknown_requirement_group: 'planner.risk.unknown_requirement_group',
  ineligible_module: 'planner.risk.ineligible_module',
  duplicate_course: 'planner.risk.duplicate_course',
  exclusive_double_count_prevented: 'planner.risk.exclusive_double_count_prevented',
};

export function PlannerPage() {
  const { language, t } = useTranslation();
  const profile = useAcademicProfileStore((state) => state.profile);
  const hydrateProfile = useAcademicProfileStore((state) => state.hydrate);
  const courses = usePlannerStore((state) => state.courses);
  const attempts = usePlannerStore((state) => state.attempts);
  const hydrated = usePlannerStore((state) => state.hydrated);
  const storageError = usePlannerStore((state) => state.storageError);
  const lastSavedAt = usePlannerStore((state) => state.lastSavedAt);
  const hydrate = usePlannerStore((state) => state.hydrate);
  const addCourseWithAttempt = usePlannerStore((state) => state.addCourseWithAttempt);
  const updateCourse = usePlannerStore((state) => state.updateCourse);
  const deleteCourse = usePlannerStore((state) => state.deleteCourse);
  const addAttempt = usePlannerStore((state) => state.addAttempt);
  const updateAttempt = usePlannerStore((state) => state.updateAttempt);
  const deleteAttempt = usePlannerStore((state) => state.deleteAttempt);
  const [editingCourse, setEditingCourse] = useState<LocalCourse | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    void hydrate();
    void hydrateProfile();
  }, [hydrate, hydrateProfile]);

  const selection = profile?.mode === 'scoped' ? profile.selection : null;
  const selectedPoId = selection?.examinationRegulationVersionId ?? null;
  const groups = useMemo(
    () => selectedPoId
      ? academicData.requirementGroups.filter((group) => group.examinationRegulationVersionId === selectedPoId)
      : [],
    [selectedPoId],
  );
  const sourceStatuses = useMemo(
    () => Object.fromEntries(academicData.academicSources.map((source) => [source.id, source.verificationStatus])),
    [],
  );
  const progress = useMemo(
    () => calculateEctsProgress({ selectedPoVersionId: selectedPoId, courses, attempts, requirementGroups: groups, sourceStatuses }),
    [attempts, courses, groups, selectedPoId, sourceStatuses],
  );
  const catalogue = useMemo(
    () => buildCourseCatalogue({ data: academicData, poVersionId: selectedPoId, groups, language }),
    [groups, language, selectedPoId],
  );
  const timetable = useMemo(() => buildTimetable(attempts, courses), [attempts, courses]);
  // Marks already-planned modules in the picker so a second click cannot
  // silently add the same lecture twice.
  const plannedModuleVersionIds = useMemo(
    () => courses.map((course) => course.moduleVersionId).filter((id): id is string => Boolean(id)),
    [courses],
  );
  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const semesterGroups = useMemo(() => {
    const grouped = new Map<string, CourseAttempt[]>();
    attempts.forEach((attempt) => {
      const current = grouped.get(attempt.semesterId) ?? [];
      current.push(attempt);
      grouped.set(attempt.semesterId, current);
    });
    return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [attempts]);

  const addCourse = async (course: LocalCourseInput, attempt: Omit<CourseAttemptInput, 'courseId'>) => {
    const id = await addCourseWithAttempt(course, attempt);
    setLiveMessage(t(id ? 'planner.courseAdded' : 'planner.storageFailed'));
    return Boolean(id);
  };

  const editCourse = async (courseId: string, input: LocalCourseInput) => {
    const saved = await updateCourse(courseId, input);
    if (saved) setEditingCourse(null);
    setLiveMessage(t(saved ? 'planner.courseUpdated' : 'planner.storageFailed'));
    return saved;
  };

  const removeCourse = async (course: LocalCourse) => {
    if (!window.confirm(t('planner.confirmDeleteCourse'))) return;
    const saved = await deleteCourse(course.id);
    setLiveMessage(t(saved ? 'planner.courseDeleted' : 'planner.storageFailed'));
  };

  // Inline timetable edits only ever touch room and weekday; everything else
  // about the attempt is preserved as-is.
  const onTimetablePatch = async (
    attemptId: string,
    patch: { location?: string; meetings?: CourseMeeting[]; days?: TimetableDay[] },
  ) => {
    const attempt = attempts.find((item) => item.id === attemptId);
    if (!attempt) return;
    await patchAttempt(attempt, patch);
  };

  const patchAttempt = async (attempt: CourseAttempt, patch: Partial<CourseAttemptInput>) => {
    const saved = await updateAttempt(attempt.id, {
      courseId: attempt.courseId,
      semesterId: attempt.semesterId,
      status: attempt.status,
      recognitionConfirmed: attempt.recognitionConfirmed,
      poVersionId: attempt.poVersionId,
      requirementGroupId: attempt.requirementGroupId,
      location: attempt.location,
      meetings: attempt.meetings,
      days: attempt.days,
      notes: attempt.notes,
      ...patch,
    });
    setLiveMessage(t(saved ? 'planner.attemptUpdated' : 'planner.storageFailed'));
  };

  const addRetake = async (course: LocalCourse, previousAttempt: CourseAttempt) => {
    const id = await addAttempt({
      courseId: course.id,
      semesterId: nextSemester(previousAttempt.semesterId),
      status: 'planned',
      recognitionConfirmed: false,
      poVersionId: selectedPoId,
      requirementGroupId: selectedPoId === previousAttempt.poVersionId ? previousAttempt.requirementGroupId : null,
      location: '',
      // Carry the times into the retake: the lecture usually keeps its slot.
      meetings: previousAttempt.meetings.map((meeting) => ({ ...meeting })),
      days: previousAttempt.days,
      notes: '',
    });
    setLiveMessage(t(id ? 'planner.retakeAdded' : 'planner.storageFailed'));
  };

  const removeAttempt = async (attempt: CourseAttempt) => {
    if (!window.confirm(t('planner.confirmDeleteAttempt'))) return;
    const saved = await deleteAttempt(attempt.id);
    setLiveMessage(t(saved ? 'planner.attemptDeleted' : 'planner.storageFailed'));
  };

  return (
    <div>
      <PageHeader title={t('planner.title')} subtitle={t('planner.subtitle')} eyebrow={t('planner.phaseLabel')} />

      <section aria-label={t('planner.progressTitle')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProgressCard label={t('planner.completedEcts')} value={progress.completedEcts} hint={t('planner.completedEctsHint')} />
        <ProgressCard label={t('planner.earnedEcts')} value={progress.earnedEcts} hint={t('planner.earnedEctsHint')} />
        <ProgressCard label={t('planner.plannedEcts')} value={progress.plannedEcts} hint={t('planner.plannedEctsHint')} />
        <ProgressCard label={t('planner.graduationStatus')} value={t(`planner.result.${progress.graduationStatus}`)} hint={t('planner.graduationHint')} warning={progress.graduationStatus === 'unknown'} />
      </section>

      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
        <h2 className="font-bold text-amber-950 dark:text-amber-100">{t('planner.risksTitle')}</h2>
        {progress.risks.length === 0 ? (
          <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-200/80">{t('planner.noRisks')}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950 dark:text-amber-100">
            {progress.risks.map((risk, index) => (
              <li key={`${risk.code}-${risk.courseId ?? risk.groupId ?? index}`} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{t(riskKeys[risk.code])}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t('planner.requirementsTitle')}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('planner.requirementsBody')}</p>
        {progress.groups.length === 0 ? (
          <div className="mt-4"><EmptyState title={t('planner.noGroupsTitle')} body={t('planner.noGroupsBody')} badge={t('common.unknown')} /></div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {progress.groups.map((item) => {
              const group = groupById.get(item.groupId);
              return (
                <article key={item.groupId} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-950 dark:text-white">{group?.name[language] ?? item.groupId}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800">{t(`planner.result.${item.status}`)}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <Metric label={t('planner.earnedEcts')} value={item.earnedEcts} />
                    <Metric label={t('planner.plannedEcts')} value={item.plannedEcts} />
                    <Metric label={t('planner.missingEcts')} value={item.missingEcts ?? t('common.unknown')} />
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8">
        <CourseForm key={`course-${editingCourse?.id ?? 'new'}`} selectedPo={selection} groups={groups} editingCourse={editingCourse} catalogue={catalogue} plannedModuleVersionIds={plannedModuleVersionIds} onAdd={addCourse} onEdit={editCourse} onCancelEdit={() => setEditingCourse(null)} />
      </div>

      <p aria-live="polite" className="mt-4 min-h-6 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        {!hydrated ? t('planner.loading') : storageError ? t('planner.storageFailed') : liveMessage}
        {lastSavedAt ? (
          <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
            · {t('settings.lastSaved')} {new Date(lastSavedAt).toLocaleTimeString(language === 'zh-CN' ? 'zh-CN' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
      </p>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t('planner.timetable.title')}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('planner.timetable.body')}</p>
        {timetable.length === 0 ? (
          <div className="mt-4"><EmptyState title={t('planner.timetable.empty')} body={t('planner.emptyBody')} /></div>
        ) : (
          <div className="mt-5 space-y-8">
            {timetable.map((table) => (
              <section key={table.semesterId} aria-label={formatSemester(table.semesterId, language)} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">{formatSemester(table.semesterId, language)}</h3>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                      {t('planner.timetable.totalEcts')}: {table.totalEcts}
                    </span>
                    {table.missingLocations > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        {t('planner.timetable.locationMissing')} · {table.missingLocations}
                      </span>
                    ) : null}
                  </div>
                </div>
                <TimetableGrid table={table} onSave={(entry, patch) => void onTimetablePatch(entry.attemptId, patch)} />
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t('calendar.title')}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('calendar.body')}</p>
        <div className="mt-5">
          <SemesterCalendar tables={timetable} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t('planner.semesterPlanTitle')}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('planner.semesterPlanBody')}</p>
        {semesterGroups.length === 0 ? (
          <div className="mt-4"><EmptyState title={t('planner.emptyTitle')} body={t('planner.emptyBody')} /></div>
        ) : (
          <div className="mt-5 space-y-8">
            {semesterGroups.map(([semesterId, semesterAttempts]) => (
              <section key={semesterId}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">{formatSemester(semesterId, language)}</h3>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{semesterAttempts.length}</span>
                </div>
                <div className="space-y-3">
                  {semesterAttempts.map((attempt) => {
                    const course = courseById.get(attempt.courseId);
                    if (!course) return null;
                    const courseAttempts = attempts.filter((item) => item.courseId === course.id);
                    return (
                      <AttemptCard
                        key={attempt.id}
                        course={course}
                        attempt={attempt}
                        attemptCount={courseAttempts.length}
                        groups={groups}
                        selectedPoId={selectedPoId}
                        onPatch={patchAttempt}
                        onEditCourse={() => setEditingCourse(course)}
                        onDeleteCourse={() => void removeCourse(course)}
                        onAddRetake={() => void addRetake(course, attempt)}
                        onDeleteAttempt={() => void removeAttempt(attempt)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProgressCard({ label, value, hint, warning = false }: { label: string; value: string | number; hint: string; warning?: boolean }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${warning ? 'text-amber-700 dark:text-amber-300' : 'text-slate-950 dark:text-white'}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 font-bold text-slate-950 dark:text-white">{value}</dd></div>;
}

type AttemptCardProps = {
  course: LocalCourse;
  attempt: CourseAttempt;
  attemptCount: number;
  groups: RequirementGroup[];
  selectedPoId: string | null;
  onPatch: (attempt: CourseAttempt, patch: Partial<CourseAttemptInput>) => Promise<void>;
  onEditCourse: () => void;
  onDeleteCourse: () => void;
  onAddRetake: () => void;
  onDeleteAttempt: () => void;
};

function AttemptCard({ course, attempt, attemptCount, groups, selectedPoId, onPatch, onEditCourse, onDeleteCourse, onAddRetake, onDeleteAttempt }: AttemptCardProps) {
  const { language, t } = useTranslation();
  const [year, term] = attempt.semesterId.split('-');
  const [draftYear, setDraftYear] = useState(year ?? '');
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-950 dark:text-white">{course.title}</h4>
            {course.isExtraCourse ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">{t('planner.extraCourse')}</span> : null}
            {!course.countsTowardDegree ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">{t('planner.notCounted')}</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.ects ?? t('common.unknown')} ECTS · {t('planner.attemptNumber')} {attemptCount}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEditCourse} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950">{t('resources.edit')}</button>
          <button type="button" onClick={onAddRetake} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">{t('planner.addRetake')}</button>
          {attemptCount > 1 ? <button type="button" onClick={onDeleteAttempt} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950">{t('planner.deleteAttempt')}</button> : null}
          <button type="button" onClick={onDeleteCourse} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950">{t('resources.delete')}</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{t('planner.status')}</span>
          <select value={attempt.status} onChange={(event) => void onPatch(attempt, { status: event.target.value as StudyStatus, recognitionConfirmed: false })} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            {(['planned', 'in_progress', 'passed', 'failed', 'recognized'] as const).map((value) => <option key={value} value={value}>{t(`planner.status.${value}`)}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{t('planner.semesterYear')}</span>
          <input
            type="number"
            min="1900"
            max="2200"
            value={draftYear}
            onChange={(event) => setDraftYear(event.target.value)}
            onBlur={() => {
              const next = `${draftYear}-${term}`;
              const numericYear = Number(draftYear);
              if (/^\d{4}-(summer|winter)$/.test(next) && numericYear >= 1900 && numericYear <= 2200) void onPatch(attempt, { semesterId: next });
              else setDraftYear(year ?? '');
            }}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{t('planner.semesterTerm')}</span>
          <select value={term} onChange={(event) => void onPatch(attempt, { semesterId: `${draftYear}-${event.target.value}` })} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="summer">{t('degree.summerSemester')}</option>
            <option value="winter">{t('degree.winterSemester')}</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{t('planner.requirementGroup')}</span>
          <select value={attempt.requirementGroupId ?? ''} onChange={(event) => void onPatch(attempt, { requirementGroupId: event.target.value || null })} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="">{t('planner.unassignedGroup')}</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name[language]}</option>)}
          </select>
        </label>
      </div>
      {attempt.status === 'recognized' ? (
        <label className="mt-3 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={attempt.recognitionConfirmed} onChange={(event) => void onPatch(attempt, { recognitionConfirmed: event.target.checked })} />
          {t('planner.recognitionConfirmed')}
        </label>
      ) : null}
      {attempt.poVersionId && attempt.poVersionId !== selectedPoId ? <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">{t('planner.poRecordPreserved')}</p> : null}
    </article>
  );
}

function nextSemester(semesterId: string) {
  const [yearText, term] = semesterId.split('-');
  const year = Number(yearText);
  return term === 'summer' ? `${year}-winter` : `${year + 1}-summer`;
}

function formatSemester(semesterId: string, language: 'zh-CN' | 'en') {
  const [year, term] = semesterId.split('-');
  const label = term === 'summer'
    ? language === 'zh-CN' ? '夏季学期' : 'Summer semester'
    : language === 'zh-CN' ? '冬季学期' : 'Winter semester';
  return `${label} ${year}`;
}
