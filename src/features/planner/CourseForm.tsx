import { useMemo, useState, type FormEvent } from 'react';
import type { RequirementGroup } from '../../domain/academic';
import { entrySemesterIdSchema, type AcademicSelection } from '../../domain/academic';
import type { CatalogueEntry } from '../../domain/courseCatalogue';
import { defaultGroupForEntry, searchCatalogue } from '../../domain/courseCatalogue';
import {
  localCourseInputSchema,
  type CourseAttemptInput,
  type LocalCourse,
  type LocalCourseInput,
  type StudyStatus,
  type TimetableDay,
} from '../../domain/planner';
import { timetableDayLabelKey, TIMETABLE_DAYS } from '../../domain/timetableLabels';
import { useTranslation } from '../../i18n/useTranslation';

type AddCourseFormProps = {
  selectedPo: AcademicSelection | null;
  groups: RequirementGroup[];
  catalogue: CatalogueEntry[];
  editingCourse: LocalCourse | null;
  onAdd: (course: LocalCourseInput, attempt: Omit<CourseAttemptInput, 'courseId'>) => Promise<boolean>;
  onEdit: (courseId: string, course: LocalCourseInput) => Promise<boolean>;
  onCancelEdit: () => void;
};

export function CourseForm({ selectedPo, groups, catalogue, editingCourse, onAdd, onEdit, onCancelEdit }: AddCourseFormProps) {
  const { language, t } = useTranslation();
  // The parent re-mounts this form via a `key` whenever `editingCourse` changes,
  // so lazy initial state is the single source of truth for the form's draft.
  const editingEntry = useMemo(
    () => (editingCourse?.moduleVersionId
      ? catalogue.find((entry) => entry.moduleVersionId === editingCourse.moduleVersionId) ?? null
      : null),
    [catalogue, editingCourse],
  );
  const [manualMode, setManualMode] = useState(() => Boolean(editingCourse && !editingEntry));
  const [query, setQuery] = useState('');
  const [selectedModuleVersionId, setSelectedModuleVersionId] = useState(() => editingEntry?.moduleVersionId ?? '');
  const [manualTitle, setManualTitle] = useState(() => (editingCourse && !editingEntry ? editingCourse.title : ''));
  const [manualEcts, setManualEcts] = useState(() => (editingCourse && !editingEntry ? editingCourse.ects?.toString() ?? '' : ''));
  const [year, setYear] = useState('');
  const [term, setTerm] = useState<'summer' | 'winter' | ''>('');
  const [status, setStatus] = useState<StudyStatus>('planned');
  const [recognitionConfirmed, setRecognitionConfirmed] = useState(false);
  const [requirementGroupId, setRequirementGroupId] = useState(() => (editingCourse ? '' : ''));
  const [location, setLocation] = useState('');
  const [day, setDay] = useState<TimetableDay | ''>('');
  const [isExtraCourse, setIsExtraCourse] = useState(() => editingCourse?.isExtraCourse ?? false);
  const [countsTowardDegree, setCountsTowardDegree] = useState(() => editingCourse?.countsTowardDegree ?? true);
  const [error, setError] = useState('');

  const results = useMemo(() => searchCatalogue(catalogue, query, language).slice(0, 40), [catalogue, language, query]);
  const selectedEntry = selectedModuleVersionId
    ? catalogue.find((entry) => entry.moduleVersionId === selectedModuleVersionId) ?? null
    : null;
  const groupIdsInScope = new Set(groups.map((group) => group.id));

  const chooseEntry = (entry: CatalogueEntry) => {
    setSelectedModuleVersionId(entry.moduleVersionId);
    setManualMode(false);
    // Preselect the group that accepts the module, so the ECTS lands where the
    // rules expect it without the student having to know the group structure.
    setRequirementGroupId(defaultGroupForEntry(entry));
    setError('');
  };

  const groupName = (groupId: string) => groups.find((group) => group.id === groupId)?.name[language] ?? groupId;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    let courseInput: LocalCourseInput;
    if (manualMode) {
      const parsed = localCourseInputSchema.safeParse({
        title: manualTitle,
        ects: manualEcts.trim() ? Number(manualEcts) : null,
        moduleId: editingCourse?.moduleId ?? null,
        moduleVersionId: editingCourse?.moduleVersionId ?? null,
        isExtraCourse,
        countsTowardDegree,
      });
      if (!parsed.success) {
        setError(t('planner.formInvalid'));
        return;
      }
      courseInput = parsed.data;
    } else {
      if (!selectedEntry) {
        setError(t('planner.chooseCourseFirst'));
        return;
      }
      const parsed = localCourseInputSchema.safeParse({
        title: selectedEntry.title.slice(0, 120),
        ects: selectedEntry.ects,
        moduleId: selectedEntry.moduleId,
        moduleVersionId: selectedEntry.moduleVersionId,
        isExtraCourse: isExtraCourse || selectedEntry.groupIds.length === 0,
        countsTowardDegree,
      });
      if (!parsed.success) {
        setError(t('planner.formInvalid'));
        return;
      }
      courseInput = parsed.data;
    }

    if (editingCourse) {
      const saved = await onEdit(editingCourse.id, courseInput);
      setError(saved ? '' : t('planner.storageFailed'));
      return;
    }

    const semesterId = `${year}-${term}`;
    if (!entrySemesterIdSchema.safeParse(semesterId).success) {
      setError(t('planner.formInvalidSemester'));
      return;
    }
    const saved = await onAdd(courseInput, {
      semesterId,
      status,
      recognitionConfirmed: status === 'recognized' && recognitionConfirmed,
      poVersionId: selectedPo?.examinationRegulationVersionId ?? null,
      requirementGroupId: requirementGroupId && groupIdsInScope.has(requirementGroupId) ? requirementGroupId : null,
      location: location.trim(),
      day: day || null,
      notes: '',
    });
    if (!saved) {
      setError(t('planner.storageFailed'));
      return;
    }
    setQuery('');
    setSelectedModuleVersionId('');
    setManualTitle('');
    setManualEcts('');
    setStatus('planned');
    setRecognitionConfirmed(false);
    setRequirementGroupId('');
    setLocation('');
    setDay('');
    setIsExtraCourse(false);
    setCountsTowardDegree(true);
    setError('');
  };

  const canUseCatalogue = catalogue.length > 0;

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t(editingCourse ? 'planner.editCourse' : 'planner.addCourse')}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('planner.pickCourseHint')}</p>
        </div>
        {editingCourse ? (
          <button type="button" onClick={onCancelEdit} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {t('planner.cancelEdit')}
          </button>
        ) : null}
      </div>

      {!editingCourse ? (
        <div className="mt-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.searchCourse')}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('planner.searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          {!canUseCatalogue ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{t('planner.noCatalogue')}</p>
          ) : (
            <div role="listbox" aria-label={t('planner.pickCourseTitle')} className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {results.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('planner.noSearchResults')}</p>
              ) : results.map((entry) => {
                const selected = entry.moduleVersionId === selectedModuleVersionId;
                const eligible = entry.groupIds.filter((id) => groupIdsInScope.has(id));
                return (
                  <button
                    key={entry.moduleVersionId}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => chooseEntry(entry)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-sky-600 bg-sky-50 dark:border-sky-400 dark:bg-sky-950/50'
                        : 'border-slate-200 bg-white hover:border-sky-300 dark:border-slate-700 dark:bg-slate-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-slate-950 dark:text-white">{language === 'zh-CN' ? entry.title : entry.titleEn}</span>
                      <span className="text-sm font-bold text-sky-800 dark:text-sky-300">{entry.ects ?? t('common.unknown')} ECTS</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t('planner.moduleCode')}: {entry.moduleId}</span>
                      {language === 'zh-CN' && entry.titleEn !== entry.title ? <span>{entry.titleEn}</span> : null}
                      {entry.offeringTerms ? (
                        <span>{entry.offeringTerms.map((termKey) => t(termKey === 'summer' ? 'planner.offeringSummer' : 'planner.offeringWinter')).join(' / ')}</span>
                      ) : null}
                    </div>
                    {eligible.length > 0 ? (
                      <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        {eligible.map(groupName).join(' · ')}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">{t('planner.notInAnyGroup')}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedEntry ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60">
              <p className="font-semibold text-slate-950 dark:text-white">
                {language === 'zh-CN' ? selectedEntry.title : selectedEntry.titleEn}
                <span className="ml-2 font-bold text-sky-800 dark:text-sky-300">{selectedEntry.ects ?? t('common.unknown')} ECTS</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedEntry.moduleId}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {!editingCourse && canUseCatalogue ? (
        <label className="mt-3 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={manualMode} onChange={(event) => { setManualMode(event.target.checked); setSelectedModuleVersionId(''); }} />
          {t('planner.customCourse')}
        </label>
      ) : null}

      {manualMode ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.courseTitle')}</span>
            <input value={manualTitle} maxLength={120} onChange={(event) => setManualTitle(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.ects')}</span>
            <input value={manualEcts} type="number" min="0.1" max="300" step="0.1" onChange={(event) => setManualEcts(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <p className="md:col-span-3 text-xs text-slate-500 dark:text-slate-400">{t('planner.customCourseHint')}</p>
        </div>
      ) : null}

      {!editingCourse ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.status')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as StudyStatus)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              {(['planned', 'in_progress', 'passed', 'failed', 'recognized'] as const).map((value) => (
                <option key={value} value={value}>{t(`planner.status.${value}`)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.semesterYear')}</span>
            <input value={year} type="number" min="1900" max="2200" onChange={(event) => setYear(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.semesterTerm')}</span>
            <select value={term} onChange={(event) => setTerm(event.target.value as 'summer' | 'winter' | '')} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <option value="">{t('planner.chooseTerm')}</option>
              <option value="summer">{t('degree.summerSemester')}</option>
              <option value="winter">{t('degree.winterSemester')}</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.requirementGroup')}</span>
            <select value={requirementGroupId} onChange={(event) => setRequirementGroupId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <option value="">{t('planner.unassignedGroup')}</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name[language]}</option>)}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.timetable.location')}</span>
            <input value={location} maxLength={160} placeholder={t('planner.timetable.locationPlaceholder')} onChange={(event) => setLocation(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.timetable.weekday')}</span>
            <select value={day} onChange={(event) => setDay(event.target.value as TimetableDay | '')} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <option value="">{t('planner.timetable.day.unassigned')}</option>
              {TIMETABLE_DAYS.map((value) => <option key={value} value={value}>{t(timetableDayLabelKey(value))}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={countsTowardDegree} onChange={(event) => setCountsTowardDegree(event.target.checked)} />
          {t('planner.countsTowardDegree')}
        </label>
        {manualMode ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={isExtraCourse} onChange={(event) => setIsExtraCourse(event.target.checked)} />
            {t('planner.extraCourse')}
          </label>
        ) : null}
        {!editingCourse && status === 'recognized' ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={recognitionConfirmed} onChange={(event) => setRecognitionConfirmed(event.target.checked)} />
            {t('planner.recognitionConfirmed')}
          </label>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button type="submit" className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800">
          {t(editingCourse ? 'planner.saveChanges' : 'planner.addToPlan')}
        </button>
        <p aria-live="polite" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
      </div>
    </form>
  );
}
