import { useState, type FormEvent } from 'react';
import type { RequirementGroup } from '../../domain/academic';
import {
  entrySemesterIdSchema,
  type AcademicSelection,
} from '../../domain/academic';
import {
  localCourseInputSchema,
  type CourseAttemptInput,
  type LocalCourse,
  type LocalCourseInput,
  type StudyStatus,
} from '../../domain/planner';
import { useTranslation } from '../../i18n/useTranslation';

type AddCourseFormProps = {
  selectedPo: AcademicSelection | null;
  groups: RequirementGroup[];
  editingCourse: LocalCourse | null;
  onAdd: (course: LocalCourseInput, attempt: Omit<CourseAttemptInput, 'courseId'>) => Promise<boolean>;
  onEdit: (courseId: string, course: LocalCourseInput) => Promise<boolean>;
  onCancelEdit: () => void;
};

export function CourseForm({ selectedPo, groups, editingCourse, onAdd, onEdit, onCancelEdit }: AddCourseFormProps) {
  const { language, t } = useTranslation();
  // The parent re-mounts this form via a `key` whenever `editingCourse` changes,
  // so lazy initial state is the single source of truth for the form's draft.
  const [title, setTitle] = useState(() => editingCourse?.title ?? '');
  const [ects, setEcts] = useState(() => editingCourse?.ects?.toString() ?? '');
  const [year, setYear] = useState('');
  const [term, setTerm] = useState<'summer' | 'winter' | ''>('');
  const [status, setStatus] = useState<StudyStatus>('planned');
  const [recognitionConfirmed, setRecognitionConfirmed] = useState(false);
  const [requirementGroupId, setRequirementGroupId] = useState('');
  const [isExtraCourse, setIsExtraCourse] = useState(() => editingCourse?.isExtraCourse ?? false);
  const [countsTowardDegree, setCountsTowardDegree] = useState(
    () => editingCourse?.countsTowardDegree ?? true,
  );
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsedCourse = localCourseInputSchema.safeParse({
      title,
      ects: ects.trim() ? Number(ects) : null,
      moduleId: null,
      moduleVersionId: null,
      isExtraCourse,
      countsTowardDegree,
    });
    if (!parsedCourse.success) {
      setError(t('planner.formInvalid'));
      return;
    }

    if (editingCourse) {
      const saved = await onEdit(editingCourse.id, parsedCourse.data);
      setError(saved ? '' : t('planner.storageFailed'));
      return;
    }

    const semesterId = `${year}-${term}`;
    if (!entrySemesterIdSchema.safeParse(semesterId).success) {
      setError(t('planner.formInvalidSemester'));
      return;
    }
    const saved = await onAdd(parsedCourse.data, {
      semesterId,
      status,
      recognitionConfirmed: status === 'recognized' && recognitionConfirmed,
      poVersionId: selectedPo?.examinationRegulationVersionId ?? null,
      requirementGroupId: requirementGroupId || null,
      notes: '',
    });
    if (!saved) {
      setError(t('planner.storageFailed'));
      return;
    }
    setTitle('');
    setEcts('');
    setStatus('planned');
    setRecognitionConfirmed(false);
    setRequirementGroupId('');
    setIsExtraCourse(false);
    setCountsTowardDegree(true);
    setError('');
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t(editingCourse ? 'planner.editCourse' : 'planner.addCourse')}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('planner.userDataNotice')}</p>
        </div>
        {editingCourse ? (
          <button type="button" onClick={onCancelEdit} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {t('planner.cancelEdit')}
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.courseTitle')}</span>
          <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.ects')}</span>
          <input value={ects} type="number" min="0.1" max="300" step="0.1" onChange={(event) => setEcts(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        {!editingCourse ? (
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.status')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as StudyStatus)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              {(['planned', 'in_progress', 'passed', 'failed', 'recognized'] as const).map((value) => (
                <option key={value} value={value}>{t(`planner.status.${value}`)}</option>
              ))}
            </select>
          </label>
        ) : null}

        {!editingCourse ? (
          <>
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
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('planner.requirementGroup')}</span>
              <select value={requirementGroupId} onChange={(event) => setRequirementGroupId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                <option value="">{t('planner.unassignedGroup')}</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name[language]}</option>)}
              </select>
            </label>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={isExtraCourse} onChange={(event) => setIsExtraCourse(event.target.checked)} />
          {t('planner.extraCourse')}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={countsTowardDegree} onChange={(event) => setCountsTowardDegree(event.target.checked)} />
          {t('planner.countsTowardDegree')}
        </label>
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
