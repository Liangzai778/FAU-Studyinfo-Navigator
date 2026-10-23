import { useState } from 'react';
import type { SemesterTimetable, TimetableDay, TimetableEntry } from '../../domain/planner';
import { findClashes } from '../../domain/planner';
import {
  GRID_END_MINUTES,
  GRID_START_MINUTES,
  SLOT_COUNT,
  SLOT_MINUTES,
  minutesToLabel,
} from '../../domain/timetableGrid';
import { TIMETABLE_DAYS, timetableDayLabelKey } from '../../domain/timetableLabels';
import { useTranslation } from '../../i18n/useTranslation';

type Patch = {
  location?: string;
  days?: TimetableDay[];
  startMinutes?: number | null;
  durationMinutes?: number | null;
};

type TimetableGridProps = {
  table: SemesterTimetable;
  onSave: (entry: TimetableEntry, patch: Patch) => void;
};

const STATUS_STYLES: Record<TimetableEntry['status'], string> = {
  planned: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-50',
  in_progress: 'border-indigo-300 bg-indigo-50 text-indigo-950 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-50',
  passed: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-50',
  failed: 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-50',
  recognized: 'border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-50',
};

/** Pixel height of one quarter-hour row. */
const SLOT_PX = 14;

/**
 * Weekly grid from 08:00 to 21:00.
 *
 * A lecture that runs Monday and Wednesday is one record but two blocks, so
 * every day column draws its own copy. Courses without a start time cannot be
 * placed on the clock and sit in a strip above the grid instead of vanishing.
 */
export function TimetableGrid({ table, onSave }: TimetableGridProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLocation, setDraftLocation] = useState('');

  const placed = table.entries.filter((entry) => entry.days.length > 0 && entry.startMinutes !== null);
  const unplaced = table.entries.filter((entry) => !(entry.days.length > 0 && entry.startMinutes !== null));
  const clashes = findClashes(table.entries);

  const hourMarks = [];
  for (let minutes = GRID_START_MINUTES; minutes <= GRID_END_MINUTES; minutes += 60) hourMarks.push(minutes);

  const startEditing = (entry: TimetableEntry) => {
    setEditingId(entry.attemptId);
    setDraftLocation(entry.location);
  };

  const commitLocation = (entry: TimetableEntry) => {
    onSave(entry, { location: draftLocation.trim() });
    setEditingId(null);
  };

  const toggleDay = (entry: TimetableEntry, day: TimetableDay) => {
    const next = entry.days.includes(day) ? entry.days.filter((item) => item !== day) : [...entry.days, day];
    onSave(entry, { days: TIMETABLE_DAYS.filter((item) => next.includes(item)) });
    setEditingId(null);
  };

  const renderCard = (entry: TimetableEntry, day: TimetableDay) => {
    const top = ((entry.startMinutes as number) - GRID_START_MINUTES) / SLOT_MINUTES * SLOT_PX;
    const height = Math.max(46, ((entry.durationMinutes ?? 90) / SLOT_MINUTES) * SLOT_PX - 2);
    const clashing = clashes.some(
      (clash) => clash.day === day && (clash.first.attemptId === entry.attemptId || clash.second.attemptId === entry.attemptId),
    );

    return (
      <article
        key={`${entry.attemptId}-${day}`}
        className={`absolute inset-x-1 rounded-lg border p-1.5 text-[11px] leading-tight shadow-sm ${STATUS_STYLES[entry.status]} ${
          clashing ? 'ring-2 ring-amber-500 ring-offset-1' : ''
        }`}
        style={{ top, height }}
      >
        {entry.startMinutes !== null ? (
          <p className="font-mono text-[10px] font-bold tracking-tight opacity-80">
            {minutesToLabel(entry.startMinutes)}–{minutesToLabel(entry.startMinutes + (entry.durationMinutes ?? 90))}
          </p>
        ) : null}
        <p className="mt-0.5 font-semibold">
          {clashing ? <span aria-hidden="true" className="mr-0.5">⚠</span> : null}
          {entry.title}
        </p>
        <p className="opacity-75">
          {entry.ects ?? t('common.unknown')} ECTS
          {entry.days.length > 1 ? ` · ${t('planner.timetable.timesPerWeek').replace('{count}', String(entry.days.length))}` : ''}
        </p>
        {editingId === entry.attemptId ? (
          <div className="mt-1 space-y-1">
            <input
              autoFocus
              value={draftLocation}
              maxLength={160}
              placeholder={t('planner.timetable.locationPlaceholder')}
              onChange={(event) => setDraftLocation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitLocation(entry);
                if (event.key === 'Escape') setEditingId(null);
              }}
              className="w-full rounded border border-slate-300 bg-white px-1 py-0.5 text-[11px] text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
            <div className="flex flex-wrap gap-1">
              {TIMETABLE_DAYS.map((weekday) => (
                <button
                  key={weekday}
                  type="button"
                  onClick={() => toggleDay(entry, weekday)}
                  aria-pressed={entry.days.includes(weekday)}
                  className={`rounded px-1.5 py-0.5 font-semibold ${
                    entry.days.includes(weekday) ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t(timetableDayLabelKey(weekday))}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => commitLocation(entry)}
              className="rounded bg-sky-700 px-1.5 py-0.5 font-semibold text-white"
            >
              {t('planner.timetable.saveLocation')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startEditing(entry)}
            className={`mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left ${
              entry.location ? 'bg-white/60 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
            }`}
            title={entry.location || t('planner.timetable.setLocation')}
          >
            {entry.location || t('planner.timetable.setLocation')}
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="mt-4">
      {clashes.length > 0 ? (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/40">
          <p className="font-semibold text-amber-900 dark:text-amber-200">{t('planner.timetable.clashTitle')}</p>
          <ul className="mt-1 space-y-0.5 text-amber-900 dark:text-amber-200">
            {clashes.map((clash, index) => (
              <li key={`${clash.day}-${clash.first.attemptId}-${clash.second.attemptId}-${index}`}>
                {t(timetableDayLabelKey(clash.day))}：{clash.first.title} ↔ {clash.second.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {unplaced.length > 0 ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">{t('planner.timetable.noTimeYet')}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((entry) => (
              <button
                key={entry.attemptId}
                type="button"
                onClick={() => startEditing(entry)}
                className="rounded-lg border border-amber-300 bg-white p-2 text-left text-[11px] dark:border-amber-800 dark:bg-slate-900"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{entry.title}</span>
                <span className="ml-1 text-slate-500 dark:text-slate-400">
                  {entry.days.length > 0
                    ? `· ${entry.days.map((day) => t(timetableDayLabelKey(day))).join(' / ')}`
                    : `· ${t('planner.timetable.day.unassigned')}`}{' '}
                  · {entry.ects ?? t('common.unknown')} ECTS
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[3.2rem_repeat(5,1fr)] gap-px">
            <div />
            {TIMETABLE_DAYS.map((day) => (
              <div key={day} className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(timetableDayLabelKey(day))}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-[3.2rem_repeat(5,1fr)] gap-px rounded-lg bg-slate-200 dark:bg-slate-700">
            <div className="relative bg-slate-50 dark:bg-slate-950" style={{ height: SLOT_COUNT * SLOT_PX }}>
              {hourMarks.slice(0, -1).map((minutes) => (
                <span
                  key={minutes}
                  className="absolute right-1 font-mono text-[10px] text-slate-500 dark:text-slate-400"
                  style={{ top: ((minutes - GRID_START_MINUTES) / SLOT_MINUTES) * SLOT_PX - 6 }}
                >
                  {minutesToLabel(minutes)}
                </span>
              ))}
            </div>

            {TIMETABLE_DAYS.map((day) => {
              const dayEntries = placed.filter((entry) => entry.days.includes(day));
              return (
                <div
                  key={day}
                  className="relative bg-white dark:bg-slate-900"
                  style={{
                    height: SLOT_COUNT * SLOT_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${(4 * SLOT_PX) - 1}px, rgba(100,116,139,0.18) ${(4 * SLOT_PX) - 1}px, rgba(100,116,139,0.18) ${4 * SLOT_PX}px)`,
                  }}
                >
                  {dayEntries.map((entry) => renderCard(entry, day))}
                  {dayEntries.length === 0 ? (
                    <span className="absolute inset-x-0 top-1 text-center text-[10px] text-slate-300 dark:text-slate-700">—</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        {(['planned', 'in_progress', 'passed', 'failed', 'recognized'] as const).map((status) => (
          <span key={status} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm border ${STATUS_STYLES[status]}`} />
            {t(`planner.status.${status}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
