import { useState } from 'react';
import type { CourseMeeting, SemesterTimetable, TimetableDay, TimetableEntry } from '../../domain/planner';
import { findClashes } from '../../domain/planner';
import {
  GRID_END_MINUTES,
  GRID_START_MINUTES,
  SLOT_COUNT,
  SLOT_MINUTES,
  minutesToLabel,
  parseTimeOfDay,
  snapToSlot,
} from '../../domain/timetableGrid';
import { TIMETABLE_DAYS, timetableDayLabelKey } from '../../domain/timetableLabels';
import { useTranslation } from '../../i18n/useTranslation';

type Patch = {
  location?: string;
  meetings?: CourseMeeting[];
  days?: TimetableDay[];
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

const timeOf = (minutes: number) => minutesToLabel(minutes);

/**
 * Weekly grid from 08:00 to 21:00.
 *
 * A lecture that runs Monday 09:00 and Wednesday 14:00 is one record but two
 * blocks with two different times, so each column draws its own block from its
 * own meeting. Courses whose weekday has no time yet sit in a strip above the
 * grid instead of vanishing.
 */
export function TimetableGrid({ table, onSave }: TimetableGridProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLocation, setDraftLocation] = useState('');
  // A time input is edited over several keystrokes ("11:00" arrives as "1",
  // "11", ...). Writing to storage on each one made the field re-read the old
  // value and drop what was typed, so the draft is kept here until blur.
  const [draftTimes, setDraftTimes] = useState<Record<string, { start: string; end: string }>>({});

  const clashes = findClashes(table.entries);
  const placed = table.entries.filter((entry) => entry.meetings.length > 0);
  const unplaced = table.entries.filter((entry) => entry.meetings.length === 0);

  const hourMarks = [];
  for (let minutes = GRID_START_MINUTES; minutes <= GRID_END_MINUTES; minutes += 60) hourMarks.push(minutes);

  const startEditing = (entry: TimetableEntry) => {
    setEditingId(entry.attemptId);
    setDraftLocation(entry.location);
    setDraftTimes(
      Object.fromEntries(
        entry.meetings.map((meeting) => [
          `${entry.attemptId}-${meeting.day}`,
          { start: timeOf(meeting.startMinutes), end: timeOf(meeting.startMinutes + (meeting.durationMinutes ?? 90)) },
        ]),
      ),
    );
  };

  /** Commits a draft time once the student leaves the field. */
  const commitTime = (entry: TimetableEntry, meeting: CourseMeeting, key: string) => {
    const draft = draftTimes[key];
    if (!draft) return;
    const startRaw = parseTimeOfDay(draft.start);
    const endRaw = parseTimeOfDay(draft.end);
    if (startRaw === null || endRaw === null) return;
    const start = snapToSlot(startRaw);
    const end = snapToSlot(endRaw);
    if (end <= start) return;
    setMeetingTime(entry, meeting.day, start, end);
  };

  const commitLocation = (entry: TimetableEntry) => {
    onSave(entry, { location: draftLocation.trim() });
    setEditingId(null);
  };

  /** Adds a weekday at the same time as the last one, or drops it if present. */
  const toggleDay = (entry: TimetableEntry, day: TimetableDay) => {
    const existing = entry.meetings.find((meeting) => meeting.day === day);
    if (existing) {
      const meetings = entry.meetings.filter((meeting) => meeting.day !== day);
      onSave(entry, { meetings, days: entry.daysWithoutTime.filter((item) => item !== day) });
      return;
    }
    const last = entry.meetings[entry.meetings.length - 1];
    onSave(entry, {
      meetings: [...entry.meetings, { day, startMinutes: last?.startMinutes ?? GRID_START_MINUTES, durationMinutes: last?.durationMinutes ?? 90 }],
      days: entry.daysWithoutTime.filter((item) => item !== day),
    });
  };

  /** Gives a weekday that had no time its own block. */
  const scheduleDay = (entry: TimetableEntry, day: TimetableDay) => {
    const last = entry.meetings[entry.meetings.length - 1];
    onSave(entry, {
      meetings: [...entry.meetings, { day, startMinutes: last?.startMinutes ?? GRID_START_MINUTES, durationMinutes: last?.durationMinutes ?? 90 }],
      days: entry.daysWithoutTime.filter((item) => item !== day),
    });
  };

  const setMeetingTime = (entry: TimetableEntry, day: TimetableDay, startMinutes: number, endMinutes: number) => {
    const meetings = entry.meetings.map((meeting) =>
      meeting.day === day ? { ...meeting, startMinutes, durationMinutes: Math.max(SLOT_MINUTES, endMinutes - startMinutes) } : meeting,
    );
    onSave(entry, { meetings });
  };

  const renderCard = (entry: TimetableEntry, meeting: CourseMeeting) => {
    const top = ((meeting.startMinutes - GRID_START_MINUTES) / SLOT_MINUTES) * SLOT_PX;
    const duration = meeting.durationMinutes ?? 90;
    const height = Math.max(46, (duration / SLOT_MINUTES) * SLOT_PX - 2);
    const timeKey = `${entry.attemptId}-${meeting.day}`;
    const draft = draftTimes[timeKey] ?? {
      start: timeOf(meeting.startMinutes),
      end: timeOf(meeting.startMinutes + duration),
    };
    const clashing = clashes.some(
      (clash) =>
        clash.day === meeting.day && (clash.first.attemptId === entry.attemptId || clash.second.attemptId === entry.attemptId),
    );

    return (
      <article
        key={`${entry.attemptId}-${meeting.day}`}
        className={`absolute inset-x-1 rounded-lg border p-1.5 text-[11px] leading-tight shadow-sm ${STATUS_STYLES[entry.status]} ${
          clashing ? 'ring-2 ring-amber-500 ring-offset-1' : ''
        }`}
        style={{ top, height }}
      >
        <p className="font-mono text-[10px] font-bold tracking-tight opacity-80">
          {timeOf(meeting.startMinutes)}–{timeOf(meeting.startMinutes + duration)}
        </p>
        <p className="mt-0.5 font-semibold">
          {clashing ? <span aria-hidden="true" className="mr-0.5">⚠</span> : null}
          {entry.title}
        </p>
        <p className="opacity-75">
          {entry.ects ?? t('common.unknown')} ECTS
          {entry.meetings.length > 1 ? ` · ${t('planner.timetable.timesPerWeek').replace('{count}', String(entry.meetings.length))}` : ''}
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
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={draft.start}
                min="08:00"
                max="20:45"
                step="900"
                aria-label={`${t(timetableDayLabelKey(meeting.day))} ${t('planner.timetable.startTime')}`}
                onChange={(event) => setDraftTimes((current) => ({ ...current, [timeKey]: { ...draft, start: event.target.value } }))}
                onBlur={() => commitTime(entry, meeting, timeKey)}
                className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-600 dark:bg-slate-950"
              />
              <input
                type="time"
                value={draft.end}
                min="08:15"
                max="21:00"
                step="900"
                aria-label={`${t(timetableDayLabelKey(meeting.day))} ${t('planner.timetable.endTime')}`}
                onChange={(event) => setDraftTimes((current) => ({ ...current, [timeKey]: { ...draft, end: event.target.value } }))}
                onBlur={() => commitTime(entry, meeting, timeKey)}
                className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-600 dark:bg-slate-950"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {TIMETABLE_DAYS.map((weekday) => (
                <button
                  key={weekday}
                  type="button"
                  onClick={() => toggleDay(entry, weekday)}
                  aria-pressed={entry.meetings.some((item) => item.day === weekday)}
                  className={`rounded px-1.5 py-0.5 font-semibold ${
                    entry.meetings.some((item) => item.day === weekday)
                      ? 'bg-sky-700 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
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
              entry.location
                ? 'bg-white/60 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
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
              <div key={entry.attemptId} className="rounded-lg border border-amber-300 bg-white p-2 text-left text-[11px] dark:border-amber-800 dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-white">{entry.title}</span>
                <span className="ml-1 text-slate-500 dark:text-slate-400">
                  · {entry.ects ?? t('common.unknown')} ECTS
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {entry.daysWithoutTime.length === 0 ? (
                    <span className="text-slate-500 dark:text-slate-400">{t('planner.timetable.day.unassigned')}</span>
                  ) : (
                    entry.daysWithoutTime.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => scheduleDay(entry, day)}
                        className="rounded bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-900 hover:bg-amber-300 dark:bg-amber-900 dark:text-amber-100"
                        title={t('planner.timetable.setTime')}
                      >
                        {t(timetableDayLabelKey(day))}
                      </button>
                    ))
                  )}
                </div>
              </div>
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
                  {timeOf(minutes)}
                </span>
              ))}
            </div>

            {TIMETABLE_DAYS.map((day) => {
              const dayMeetings = placed.flatMap((entry) =>
                entry.meetings.filter((meeting) => meeting.day === day).map((meeting) => ({ entry, meeting })),
              );
              return (
                <div
                  key={day}
                  className="relative bg-white dark:bg-slate-900"
                  style={{
                    height: SLOT_COUNT * SLOT_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${(4 * SLOT_PX) - 1}px, rgba(100,116,139,0.18) ${(4 * SLOT_PX) - 1}px, rgba(100,116,139,0.18) ${4 * SLOT_PX}px)`,
                  }}
                >
                  {dayMeetings.map(({ entry, meeting }) => renderCard(entry, meeting))}
                  {dayMeetings.length === 0 ? (
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
