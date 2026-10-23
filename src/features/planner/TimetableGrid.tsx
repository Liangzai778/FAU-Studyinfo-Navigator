import { useState } from 'react';
import type { SemesterTimetable, TimetableDay } from '../../domain/planner';
import { TIMETABLE_DAYS, timetableDayLabelKey } from '../../domain/timetableLabels';
import { useTranslation } from '../../i18n/useTranslation';

type TimetableGridProps = {
  table: SemesterTimetable;
  onSave: (entry: SemesterTimetable['entries'][number], patch: { location?: string; day?: TimetableDay | null }) => void;
};

/**
 * Week view over one semester.
 *
 * Rooms are editable inline: the module handbook lists rooms but a student
 * knows their own group's actual room, and a wrong room should be correctable
 * without leaving the timetable.
 */
export function TimetableGrid({ table, onSave }: TimetableGridProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLocation, setDraftLocation] = useState('');

  const columns: (TimetableDay | null)[] = [...TIMETABLE_DAYS, null];

  const startEditing = (attemptId: string, current: string) => {
    setEditingId(attemptId);
    setDraftLocation(current);
  };

  const commit = (entry: SemesterTimetable['entries'][number]) => {
    onSave(entry, { location: draftLocation.trim() });
    setEditingId(null);
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-6 gap-2">
        {columns.map((day) => (
          <div key={day ?? 'unassigned'} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-950/60">
            <h4 className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(timetableDayLabelKey(day))}
            </h4>
            <div className="space-y-2">
              {table.entries.filter((entry) => entry.day === day).map((entry) => (
                <article key={entry.attemptId} className="rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold leading-snug text-slate-950 dark:text-white">{entry.title}</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">{entry.ects ?? t('common.unknown')} ECTS</p>
                  {editingId === entry.attemptId ? (
                    <div className="mt-2 space-y-1">
                      <input
                        autoFocus
                        value={draftLocation}
                        maxLength={160}
                        placeholder={t('planner.timetable.locationPlaceholder')}
                        onChange={(event) => setDraftLocation(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commit(entry);
                          if (event.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 dark:border-slate-600 dark:bg-slate-950"
                      />
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => commit(entry)} className="rounded bg-sky-700 px-2 py-1 font-semibold text-white">
                          {t('planner.timetable.saveLocation')}
                        </button>
                        <select
                          value={entry.day ?? ''}
                          onChange={(event) => {
                            const value = event.target.value as TimetableDay | '';
                            onSave(entry, { day: value || null });
                            setEditingId(null);
                          }}
                          className="rounded border border-slate-300 bg-white px-1 py-1 dark:border-slate-600 dark:bg-slate-950"
                        >
                          <option value="">{t('planner.timetable.day.unassigned')}</option>
                          {TIMETABLE_DAYS.map((value) => <option key={value} value={value}>{t(timetableDayLabelKey(value))}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditing(entry.attemptId, entry.location)}
                      className={`mt-2 block w-full rounded-md px-1.5 py-1 text-left ${
                        entry.location ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200'
                      }`}
                    >
                      {entry.location || t('planner.timetable.setLocation')}
                    </button>
                  )}
                </article>
              ))}
              {table.entries.filter((entry) => entry.day === day).length === 0 ? (
                <p className="text-center text-xs text-slate-400 dark:text-slate-600">—</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
