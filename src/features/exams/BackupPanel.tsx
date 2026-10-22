import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { createLocalBackup, parseLocalBackup, restoreLocalBackup, serializeLocalBackup } from '../../storage/backup';
import { useAcademicProfileStore } from '../../store/academicProfile';
import { useExamsTasksStore } from '../../store/examsTasks';
import { usePlannerStore } from '../../store/planner';

function downloadText(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function BackupPanel() {
  const { t } = useTranslation();
  const hydrateAcademicProfile = useAcademicProfileStore((state) => state.hydrate);
  const hydratePlanner = usePlannerStore((state) => state.hydrate);
  const hydrateExamsTasks = useExamsTasksStore((state) => state.hydrate);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const backup = await createLocalBackup();
      downloadText('fau-study-navigator-backup.json', serializeLocalBackup(backup), 'application/json;charset=utf-8');
      setMessage(t('exams.backupExported'));
    } catch {
      setMessage(t('exams.backupFailed'));
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const backup = parseLocalBackup(await file.text());
      if (!window.confirm(t('exams.confirmRestore'))) return;
      const summary = await restoreLocalBackup(backup);
      await Promise.all([hydrateAcademicProfile(true), hydratePlanner(true), hydrateExamsTasks(true)]);
      setMessage(`${t('exams.restoreDone')} ${summary.addedCourses + summary.addedAttempts + summary.addedExams + summary.addedTasks}`);
    } catch {
      setMessage(t('exams.restoreInvalid'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t('exams.backupTitle')}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('exams.backupBody')}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => void exportBackup()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950">{t('exams.exportJson')}</button>
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold disabled:opacity-50 dark:border-slate-700">{t('exams.restoreJson')}</button>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} className="sr-only" />
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm font-semibold text-slate-600 dark:text-slate-300">{message}</p>
    </section>
  );
}
