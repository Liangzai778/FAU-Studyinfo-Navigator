import { useEffect, useMemo, useState } from 'react';
import type { SemesterTimetable } from '../../domain/planner';
import {
  addDays,
  addMonths,
  eventsOnDate,
  formatIsoDate,
  formatMinutes,
  isWithinSemester,
  mondayOfWeek,
  monthGrid,
  parseIsoDate,
  teachingWeekNumber,
  weekdayIndex,
} from '../../domain/calendar';
import { minutesToLabel, parseTimeOfDay } from '../../domain/timetableGrid';
import { TIMETABLE_DAYS } from '../../domain/timetableLabels';
import { useTranslation } from '../../i18n/useTranslation';
import { readSemesterRange, writeSemesterRange, type SemesterRange } from '../../storage/calendarSettings';
import { useCalendarEventsStore } from '../../store/calendarEvents';

type SemesterCalendarProps = {
  tables: SemesterTimetable[];
};

type CalendarView = 'month' | 'week' | 'day';

type EventDraft = {
  title: string;
  date: string;
  start: string;
  end: string;
  notes: string;
};

function currentSemesterId() {
  const now = new Date();
  const term = now.getMonth() >= 8 ? 'winter' : 'summer';
  return `${now.getFullYear()}-${term}`;
}

function draftTime(value: string): number | null {
  if (!value) return null;
  return parseTimeOfDay(value);
}

/**
 * Month, week and day views from the semester range.
 *
 * Courses repeat by weekday because that is how the regulation describes them;
 * they are only drawn inside the semester range, and the range itself is
 * editable because faculties do not all start on the same day.
 */
export function SemesterCalendar({ tables }: SemesterCalendarProps) {
  const { language, t } = useTranslation();
  const todayIso = formatIsoDate(new Date());
  const fallbackSemester = currentSemesterId();

  const [semesterId, setSemesterId] = useState(() => tables.at(-1)?.semesterId ?? fallbackSemester);
  const [range, setRange] = useState<SemesterRange>(() => readSemesterRange(semesterId));
  const [viewDate, setViewDate] = useState(() => parseIsoDate(range.start) ?? new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [draft, setDraft] = useState<EventDraft>({
    title: '',
    date: todayIso,
    start: '',
    end: '',
    notes: '',
  });
  const [message, setMessage] = useState('');

  const events = useCalendarEventsStore((state) => state.events);
  const storageError = useCalendarEventsStore((state) => state.storageError);
  const hydrate = useCalendarEventsStore((state) => state.hydrate);
  const addEvent = useCalendarEventsStore((state) => state.addEvent);
  const deleteEvent = useCalendarEventsStore((state) => state.deleteEvent);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const table = tables.find((item) => item.semesterId === semesterId);
  const entries = table?.entries ?? [];
  const cells = useMemo(() => monthGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  const weekdayNames = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(language === 'zh-CN' ? 'zh-CN' : 'en-GB', { weekday: 'short' }).format(
          new Date(2026, 9, 5 + index),
        ),
      ),
    [language],
  );

  const dayLabel = (date: Date) =>
    new Intl.DateTimeFormat(language === 'zh-CN' ? 'zh-CN' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);

  const monthTitle = new Intl.DateTimeFormat(language === 'zh-CN' ? 'zh-CN' : 'en-GB', {
    year: 'numeric',
    month: 'long',
  }).format(viewDate);

  const weekStart = mondayOfWeek(viewDate);
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const title =
    view === 'month'
      ? monthTitle
      : view === 'week'
        ? `${dayLabel(weekStart)} – ${dayLabel(addDays(weekStart, 6))}`
        : dayLabel(viewDate);

  const coursesForDate = (date: Date) => {
    const day = TIMETABLE_DAYS[weekdayIndex(date)];
    if (!day) return [];
    return entries
      .flatMap((entry) =>
        entry.meetings
          .filter((meeting) => meeting.day === day)
          .map((meeting) => ({ entry, meeting })),
      )
      .sort((left, right) => left.meeting.startMinutes - right.meeting.startMinutes);
  };

  const changeSemester = (nextId: string) => {
    setSemesterId(nextId);
    const nextRange = readSemesterRange(nextId);
    setRange(nextRange);
    setViewDate(parseIsoDate(nextRange.start) ?? new Date());
  };

  const changeRange = (field: 'start' | 'end', value: string) => {
    const saved = writeSemesterRange(semesterId, { ...range, [field]: value });
    setRange(saved);
    setViewDate(parseIsoDate(saved.start) ?? new Date());
  };

  const shift = (direction: number) => {
    const next =
      view === 'month'
        ? addMonths(viewDate, direction)
        : view === 'week'
          ? addDays(viewDate, direction * 7)
          : addDays(viewDate, direction);
    setViewDate(next);
    if (view === 'day') setDraft((current) => ({ ...current, date: formatIsoDate(next) }));
  };

  const goToday = () => {
    const now = new Date();
    setViewDate(now);
    if (view === 'day') setDraft((current) => ({ ...current, date: formatIsoDate(now) }));
  };

  const changeView = (next: CalendarView) => {
    setView(next);
    if (next === 'day') setDraft((current) => ({ ...current, date: formatIsoDate(viewDate) }));
  };

  const submitEvent = async () => {
    const startMinutes = draftTime(draft.start);
    const endMinutes = draftTime(draft.end);
    const id = await addEvent({
      title: draft.title,
      date: draft.date,
      startMinutes,
      endMinutes,
      notes: draft.notes,
    });
    if (id) {
      setMessage(t('calendar.eventSaved'));
      setDraft((current) => ({ ...current, title: '', start: '', end: '', notes: '' }));
    } else {
      setMessage(storageError ? t('calendar.storageFailed') : t('calendar.eventInvalid'));
    }
  };

  const upcoming = events
    .filter((event) => event.date >= todayIso)
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date) || (left.startMinutes ?? -1) - (right.startMinutes ?? -1))
    .slice(0, 8);

  const past = events
    .filter((event) => event.date < todayIso)
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date) || (right.startMinutes ?? -1) - (left.startMinutes ?? -1))
    .slice(0, 5);

  const eventTime = (event: (typeof events)[number]) =>
    event.startMinutes === null
      ? t('calendar.allDay')
      : `${formatMinutes(event.startMinutes)}${event.endMinutes === null ? '' : `–${formatMinutes(event.endMinutes)}`}`;

  const renderChips = (date: Date, limit?: number) => {
    const inSemester = isWithinSemester(formatIsoDate(date), range.start, range.end);
    const courses = inSemester ? coursesForDate(date) : [];
    const dayEvents = eventsOnDate(events, formatIsoDate(date));
    const shownCourses = limit ? courses.slice(0, limit) : courses;
    const shownEvents = limit ? dayEvents.slice(0, limit) : dayEvents;
    return (
      <div className="mt-1 space-y-1">
        {shownCourses.map(({ entry, meeting }) => (
          <span key={`${entry.attemptId}-${meeting.day}`} className="block truncate rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-950 dark:bg-sky-950 dark:text-sky-100">
            {minutesToLabel(meeting.startMinutes)} {entry.title}
          </span>
        ))}
        {limit && courses.length > shownCourses.length ? (
          <span className="block text-[10px] font-semibold text-slate-500">+{courses.length - shownCourses.length} {t('calendar.more')}</span>
        ) : null}
        {shownEvents.map((event) => (
          <span key={event.id} className="block truncate rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100">
            {event.startMinutes === null ? t('calendar.allDay') : formatMinutes(event.startMinutes)} {event.title}
          </span>
        ))}
        {limit && dayEvents.length > shownEvents.length ? (
          <span className="block text-[10px] font-semibold text-amber-700 dark:text-amber-300">+{dayEvents.length - shownEvents.length} {t('calendar.more')}</span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {tables.length > 1 ? (
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.semester')}</span>
              <select
                value={semesterId}
                onChange={(event) => changeSemester(event.target.value)}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              >
                {tables.map((item) => (
                  <option key={item.semesterId} value={item.semesterId}>{item.semesterId}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.startDate')}</span>
            <input
              type="date"
              value={range.start}
              onChange={(event) => changeRange('start', event.target.value)}
              aria-label={t('calendar.startDate')}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.endDate')}</span>
            <input
              type="date"
              value={range.end}
              onChange={(event) => changeRange('end', event.target.value)}
              aria-label={t('calendar.endDate')}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
            {(['month', 'week', 'day'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => changeView(option)}
                className={`px-3 py-2 text-sm font-semibold ${
                  view === option ? 'bg-sky-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {option === 'month' ? t('calendar.viewMonth') : option === 'week' ? t('calendar.viewWeek') : t('calendar.viewDay')}
              </button>
            ))}
          </div>
          <button type="button" aria-label={t('calendar.prev')} onClick={() => shift(-1)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            ←
          </button>
          <span className="min-w-44 text-center text-base font-bold text-slate-950 dark:text-white">{title}</span>
          <button type="button" aria-label={t('calendar.next')} onClick={() => shift(1)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            →
          </button>
          <button type="button" onClick={goToday} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            {t('calendar.today')}
          </button>
          <input
            type="date"
            aria-label={t('calendar.jump')}
            value={formatIsoDate(viewDate)}
            onChange={(event) => {
              const next = parseIsoDate(event.target.value);
              if (next) setViewDate(next);
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {t('calendar.startHint')} · {range.start} – {range.end}
      </p>

      {view === 'month' ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-7 bg-slate-100 text-center text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {weekdayNames.map((name) => (
              <div key={name} className="py-2">{name}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const week = cell.date.getDay() === 1 ? teachingWeekNumber(cell.iso, range.start) : null;
              const isToday = cell.iso === todayIso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, date: cell.iso }))}
                  aria-label={cell.iso}
                  className={[
                    'min-h-28 border-b border-r border-slate-200 p-2 text-left align-top dark:border-slate-700',
                    cell.inMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 text-slate-400 dark:bg-slate-950/60',
                    isToday ? 'ring-2 ring-inset ring-sky-500' : '',
                  ].join(' ')}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`text-sm font-bold ${isToday ? 'text-sky-700 dark:text-sky-300' : ''}`}>{cell.date.getDate()}</span>
                    {week && week > 0 ? (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {language === 'zh-CN' ? `第 ${week} 周` : `Week ${week}`}
                      </span>
                    ) : null}
                  </div>
                  {renderChips(cell.date, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === 'week' ? (
        <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          {weekDates.map((date) => {
            const iso = formatIsoDate(date);
            const isToday = iso === todayIso;
            return (
              <div key={iso} className={`min-h-40 border-r border-slate-200 p-2 last:border-r-0 dark:border-slate-700 ${isToday ? 'bg-sky-50/60 dark:bg-sky-950/30' : ''}`}>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {new Intl.DateTimeFormat(language === 'zh-CN' ? 'zh-CN' : 'en-GB', { weekday: 'short' }).format(date)}
                </p>
                <p className={`text-sm font-bold ${isToday ? 'text-sky-700 dark:text-sky-300' : 'text-slate-900 dark:text-white'}`}>
                  <button type="button" aria-label={iso} onClick={() => setDraft((current) => ({ ...current, date: iso }))}>
                    {date.getDate()}
                  </button>
                </p>
                {renderChips(date)}
              </div>
            );
          })}
        </div>
      ) : null}

      {view === 'day' ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{dayLabel(viewDate)}</p>
          {(() => {
            const iso = formatIsoDate(viewDate);
            const week = teachingWeekNumber(iso, range.start);
            const inSemester = isWithinSemester(iso, range.start, range.end);
            const courses = inSemester ? coursesForDate(viewDate) : [];
            const dayEvents = eventsOnDate(events, iso);
            return (
              <>
                {week && week > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {language === 'zh-CN' ? `第 ${week} 周` : `Week ${week}`}
                  </p>
                ) : null}
                {courses.length === 0 && dayEvents.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('calendar.dayEmpty')}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {courses.map(({ entry, meeting }) => (
                      <li key={`${entry.attemptId}-${meeting.day}`} className="rounded-lg bg-sky-100 px-3 py-2 text-sm font-medium text-sky-950 dark:bg-sky-950 dark:text-sky-100">
                        {minutesToLabel(meeting.startMinutes)}
                        {meeting.durationMinutes ? `–${minutesToLabel(meeting.startMinutes + meeting.durationMinutes)}` : ''} {entry.title}
                      </li>
                    ))}
                    {dayEvents.map((event) => (
                      <li key={event.id} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100">
                        {eventTime(event)} {event.title}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          })()}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section aria-label={t('calendar.addEvent')} id="calendar-event-form">
          <h3 className="font-bold text-slate-950 dark:text-white">{t('calendar.addEvent')}</h3>
          <div className="mt-3 grid gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.eventTitle')}</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={120}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.eventDate')}</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.startTime')}</span>
                <input
                  type="time"
                  step={900}
                  value={draft.start}
                  onChange={(event) => setDraft({ ...draft, start: event.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.endTime')}</span>
                <input
                  type="time"
                  step={900}
                  value={draft.end}
                  onChange={(event) => setDraft({ ...draft, end: event.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-200">{t('calendar.eventNotes')}</span>
              <input
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                maxLength={500}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <div>
              <button type="button" onClick={() => void submitEvent()} className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800">
                {t('calendar.saveEvent')}
              </button>
            </div>
            <p aria-live="polite" className="min-h-5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>
          </div>
        </section>

        <div>
          <section aria-label={t('calendar.upcoming')}>
            <h3 className="font-bold text-slate-950 dark:text-white">{t('calendar.upcoming')}</h3>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('calendar.noEvents')}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-amber-950 dark:text-amber-100">{event.title}</p>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                        {dayLabel(parseIsoDate(event.date) ?? new Date())} · {eventTime(event)}
                      </p>
                      {event.notes ? <p className="mt-1 text-xs text-amber-900/70 dark:text-amber-200/70">{event.notes}</p> : null}
                    </div>
                    <button type="button" onClick={() => void deleteEvent(event.id)} aria-label={`${t('calendar.deleteEvent')} ${event.title}`} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-amber-900 underline dark:text-amber-200">
                      {t('calendar.deleteEvent')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label={t('calendar.past')} className="mt-5">
            <h3 className="font-bold text-slate-950 dark:text-white">{t('calendar.past')}</h3>
            {past.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('calendar.noEvents')}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {past.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{event.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {dayLabel(parseIsoDate(event.date) ?? new Date())} · {eventTime(event)}
                      </p>
                    </div>
                    <button type="button" onClick={() => void deleteEvent(event.id)} aria-label={`${t('calendar.deleteEvent')} ${event.title}`} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 underline dark:text-slate-300">
                      {t('calendar.deleteEvent')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!table ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t('calendar.emptySemester')}</p> : null}
        </div>
      </div>
    </div>
  );
}
