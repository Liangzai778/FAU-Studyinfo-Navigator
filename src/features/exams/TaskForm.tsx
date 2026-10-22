import { useState, type FormEvent, type ReactNode } from 'react';
import { resolveBerlinLocalDateTime } from '../../domain/berlinDateTime';
import { studyTaskInputSchema, type StudyTask, type StudyTaskInput } from '../../domain/exams';
import type { LocalCourse } from '../../domain/planner';
import { useTranslation } from '../../i18n/useTranslation';

type TaskFormProps = {
  courses: LocalCourse[];
  editing: StudyTask | null;
  onSave: (input: StudyTaskInput, id: string | null) => Promise<boolean>;
  onCancel: () => void;
};

export function TaskForm({ courses, editing, onSave, onCancel }: TaskFormProps) {
  const { t } = useTranslation();
  // The parent re-mounts this form via a `key` whenever `editing` changes, so
  // lazy initial state is the single source of truth for the form's draft.
  const [title, setTitle] = useState(() => editing?.title ?? '');
  const [courseId, setCourseId] = useState(() => editing?.courseId ?? '');
  const [deadline, setDeadline] = useState(() => editing?.deadline ?? '');
  const [notes, setNotes] = useState(() => editing?.notes ?? '');
  const [completed, setCompleted] = useState(() => editing?.completed ?? false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = studyTaskInputSchema.safeParse({ title, courseId: courseId || null, deadline, notes, completed });
    if (!parsed.success) {
      setError(t('exams.taskFormInvalid'));
      return;
    }
    const saved = await onSave(parsed.data, editing?.id ?? null);
    if (!saved) {
      setError(t('exams.storageFailed'));
      return;
    }
    if (!editing) {
      setTitle(''); setCourseId(''); setDeadline(''); setNotes(''); setCompleted(false);
    }
    setError('');
  };

  const resolution = deadline ? resolveBerlinLocalDateTime(deadline) : null;

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-950 dark:text-white">{t(editing ? 'exams.editTask' : 'exams.addTask')}</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('exams.taskNotice')}</p></div>
        {editing ? <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">{t('exams.cancelEdit')}</button> : null}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={t('exams.taskTitle')} full><input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></Field>
        <Field label={t('exams.linkedCourse')}><select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={inputClass}><option value="">{t('exams.noLinkedCourse')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
        <Field label={t('exams.deadline')}><input required type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClass} /></Field>
        {resolution?.ambiguous ? <p className="-mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 sm:col-span-2">{t('exams.ambiguousTime')}</p> : null}
        <Field label={t('exams.notes')} full><textarea maxLength={1000} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} py-2`} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={completed} onChange={(event) => setCompleted(event.target.checked)} />{t('exams.taskCompleted')}</label>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p> : null}
      <button type="submit" className="mt-5 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800">{t(editing ? 'exams.saveChanges' : 'exams.saveTask')}</button>
    </form>
  );
}

const inputClass = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-900';

function Field({ label, full = false, children }: { label: string; full?: boolean; children: ReactNode }) {
  return <label className={full ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>{children}</label>;
}
