import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { PageHeader } from '../../components/common/PageHeader';
import { formatBerlinLocalDateTime } from '../../domain/berlinDateTime';
import { createCalendarIcs } from '../../domain/calendarExport';
import type { PersonalExam, PersonalExamInput, StudyTask, StudyTaskInput } from '../../domain/exams';
import { useTranslation } from '../../i18n/useTranslation';
import { useExamsTasksStore } from '../../store/examsTasks';
import { usePlannerStore } from '../../store/planner';
import { ExamForm } from './ExamForm';
import { TaskForm } from './TaskForm';

function downloadCalendar(contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fau-study-navigator-personal-calendar.ics';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ExamsPage() {
  const { language, t } = useTranslation();
  const courses = usePlannerStore((state) => state.courses);
  const hydratePlanner = usePlannerStore((state) => state.hydrate);
  const { exams, tasks, hydrated, storageError, hydrate, addExam, updateExam, deleteExam, addTask, updateTask, deleteTask } = useExamsTasksStore();
  const [editingExam, setEditingExam] = useState<PersonalExam | null>(null);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { void hydrate(); void hydratePlanner(); }, [hydrate, hydratePlanner]);

  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const timeline = useMemo(() => [
    ...exams.map((exam) => ({ kind: 'exam' as const, date: exam.startsAt, item: exam })),
    ...tasks.map((task) => ({ kind: 'task' as const, date: task.deadline, item: task })),
  ].sort((left, right) => left.date.localeCompare(right.date)), [exams, tasks]);

  const saveExam = async (input: PersonalExamInput, id: string | null) => {
    const saved = id ? await updateExam(id, input) : (await addExam(input)) !== null;
    if (saved) { setEditingExam(null); setMessage(t(id ? 'exams.examUpdated' : 'exams.examAdded')); }
    return saved;
  };
  const saveTask = async (input: StudyTaskInput, id: string | null) => {
    const saved = id ? await updateTask(id, input) : (await addTask(input)) !== null;
    if (saved) { setEditingTask(null); setMessage(t(id ? 'exams.taskUpdated' : 'exams.taskAdded')); }
    return saved;
  };
  const removeExam = async (exam: PersonalExam) => {
    if (!window.confirm(t('exams.confirmDeleteExam'))) return;
    if (await deleteExam(exam.id)) { setEditingExam(null); setMessage(t('exams.examDeleted')); }
  };
  const removeTask = async (task: StudyTask) => {
    if (!window.confirm(t('exams.confirmDeleteTask'))) return;
    if (await deleteTask(task.id)) { setEditingTask(null); setMessage(t('exams.taskDeleted')); }
  };

  return (
    <div>
      <PageHeader title={t('exams.title')} subtitle={t('exams.subtitle')} />
      <section className="mb-6 flex gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/40">
        <Icon name="shield" className="mt-0.5 h-6 w-6 shrink-0 text-sky-700 dark:text-sky-300" />
        <div><h2 className="font-semibold text-sky-950 dark:text-sky-100">{t('exams.warningTitle')}</h2><p className="mt-1 text-sm leading-6 text-sky-900/80 dark:text-sky-200/80">{t('exams.warningBody')}</p></div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ExamForm key={`exam-${editingExam?.id ?? 'new'}`} courses={courses} editing={editingExam} onSave={saveExam} onCancel={() => setEditingExam(null)} />
        <TaskForm key={`task-${editingTask?.id ?? 'new'}`} courses={courses} editing={editingTask} onSave={saveTask} onCancel={() => setEditingTask(null)} />
      </div>

      <p aria-live="polite" className="mt-4 min-h-6 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{!hydrated ? t('exams.loading') : storageError ? t('exams.storageFailed') : message}</p>

      <section className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t('exams.timelineTitle')}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('exams.timelineBody')}</p></div>
          <button type="button" disabled={timeline.length === 0} onClick={() => downloadCalendar(createCalendarIcs({ exams, tasks }))} className="rounded-xl border border-sky-700 px-4 py-2.5 text-sm font-bold text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-300">{t('exams.exportIcs')}</button>
        </div>
        {timeline.length === 0 ? <div className="mt-4"><EmptyState title={t('exams.emptyTitle')} body={t('exams.emptyBody')} /></div> : (
          <ol className="mt-5 space-y-4 border-l-2 border-slate-200 pl-5 dark:border-slate-700">
            {timeline.map((entry) => entry.kind === 'exam' ? (
              <ExamTimelineItem key={`exam-${entry.item.id}`} exam={entry.item} courseTitle={entry.item.courseId ? courseById.get(entry.item.courseId)?.title : undefined} language={language} onEdit={() => setEditingExam(entry.item)} onDelete={() => void removeExam(entry.item)} onUpdate={updateExam} />
            ) : (
              <TaskTimelineItem key={`task-${entry.item.id}`} task={entry.item} courseTitle={entry.item.courseId ? courseById.get(entry.item.courseId)?.title : undefined} language={language} onEdit={() => setEditingTask(entry.item)} onDelete={() => void removeTask(entry.item)} onUpdate={updateTask} />
            ))}
          </ol>
        )}
      </section>

    </div>
  );
}

type TimelineCommon = { courseTitle?: string; language: 'zh-CN' | 'en'; onEdit: () => void; onDelete: () => void };

function ExamTimelineItem({ exam, courseTitle, language, onEdit, onDelete, onUpdate }: TimelineCommon & { exam: PersonalExam; onUpdate: (id: string, input: PersonalExamInput) => Promise<boolean> }) {
  const { t } = useTranslation();
  return (
    <li className={timelineCardClass}>
      <span className="absolute -left-[1.72rem] top-6 h-3 w-3 rounded-full bg-sky-600 ring-4 ring-white dark:ring-slate-950" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-2"><Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">{t('exams.examBadge')}</Badge><Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">{t('exams.personalEntry')}</Badge></div><h3 className="mt-2 font-bold text-slate-950 dark:text-white">{exam.title}</h3><p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{formatBerlinLocalDateTime(exam.startsAt, language)}</p></div>
        <Actions onEdit={onEdit} onDelete={onDelete} />
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{courseTitle ?? (exam.courseId ? t('exams.missingLinkedCourse') : t('exams.noLinkedCourse'))}{exam.location ? ` · ${exam.location}` : ''}</p>
      <label className="mt-3 block max-w-sm text-xs font-semibold text-slate-500 dark:text-slate-400">{t('exams.registrationStatus')}
        <select value={exam.registrationStatus} onChange={(event) => void onUpdate(exam.id, { title: exam.title, courseId: exam.courseId, startsAt: exam.startsAt, endsAt: exam.endsAt, location: exam.location, notes: exam.notes, registrationStatus: event.target.value as PersonalExam['registrationStatus'] })} className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="unknown">{t('exams.registration.unknown')}</option><option value="not_registered">{t('exams.registration.not_registered')}</option><option value="user_marked_registered">{t('exams.registration.user_marked_registered')}</option><option value="attended">{t('exams.registration.attended')}</option><option value="cancelled">{t('exams.registration.cancelled')}</option>
        </select>
      </label>
      {exam.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500 dark:text-slate-400">{exam.notes}</p> : null}
    </li>
  );
}

function TaskTimelineItem({ task, courseTitle, language, onEdit, onDelete, onUpdate }: TimelineCommon & { task: StudyTask; onUpdate: (id: string, input: StudyTaskInput) => Promise<boolean> }) {
  const { t } = useTranslation();
  return (
    <li className={timelineCardClass}>
      <span className="absolute -left-[1.72rem] top-6 h-3 w-3 rounded-full bg-violet-600 ring-4 ring-white dark:ring-slate-950" />
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge className="bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">{t('exams.taskBadge')}</Badge>{task.completed ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{t('exams.completed')}</Badge> : null}</div><h3 className={`mt-2 font-bold text-slate-950 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</h3><p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{formatBerlinLocalDateTime(task.deadline, language)}</p></div><Actions onEdit={onEdit} onDelete={onDelete} /></div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{courseTitle ?? (task.courseId ? t('exams.missingLinkedCourse') : t('exams.noLinkedCourse'))}</p>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={task.completed} onChange={(event) => void onUpdate(task.id, { title: task.title, courseId: task.courseId, deadline: task.deadline, notes: task.notes, completed: event.target.checked })} />{t('exams.taskCompleted')}</label>
      {task.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500 dark:text-slate-400">{task.notes}</p> : null}
    </li>
  );
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return <div className="flex gap-2"><button type="button" onClick={onEdit} className={actionClass}>{t('resources.edit')}</button><button type="button" onClick={onDelete} className={deleteClass}>{t('resources.delete')}</button></div>;
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{children}</span>;
}

const timelineCardClass = 'relative rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const actionClass = 'rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950';
const deleteClass = 'rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950';
