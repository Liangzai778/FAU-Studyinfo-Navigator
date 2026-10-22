import assert from 'node:assert/strict';
import test from 'node:test';
import { createCalendarIcs } from '../src/domain/calendarExport.ts';

const exam = {
  id: 'synthetic-exam-1',
  title: 'Synthetic exam, test only',
  courseId: null,
  startsAt: '2026-11-12T09:30',
  endsAt: '2026-11-12T11:00',
  timezone: 'Europe/Berlin',
  location: 'Room; A',
  notes: 'Line one\nLine two',
  registrationStatus: 'unknown',
  origin: 'personal',
  dateStatus: 'user_entered',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const task = {
  id: 'synthetic-task-1',
  title: 'Synthetic task, test only',
  courseId: null,
  deadline: '2026-11-10T18:00',
  timezone: 'Europe/Berlin',
  notes: '',
  completed: false,
  origin: 'personal',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('exports personal records as a Europe/Berlin ICS calendar', () => {
  const ics = createCalendarIcs({ exams: [exam], tasks: [task], generatedAt: new Date('2026-01-02T03:04:05.000Z') });
  assert.match(ics, /TZID:Europe\/Berlin\r\n/);
  assert.match(ics, /DTSTART;TZID=Europe\/Berlin:20261112T093000/);
  assert.match(ics, /DTEND;TZID=Europe\/Berlin:20261112T110000/);
  assert.match(ics, /SUMMARY:Synthetic exam\\, test only/);
  assert.match(ics, /LOCATION:Room\\; A/);
  assert.match(ics, /X-FAU-SN-ORIGIN:PERSONAL/);
  assert.doesNotMatch(ics, /STATUS:CONFIRMED/);
  assert.ok(ics.endsWith('\r\n'));
});

test('uses stable local UIDs and removes duplicate records', () => {
  const ics = createCalendarIcs({ exams: [exam, exam], tasks: [task, task], generatedAt: new Date('2026-01-02T03:04:05.000Z') });
  assert.equal((ics.match(/UID:exam-synthetic-exam-1/g) ?? []).length, 1);
  assert.equal((ics.match(/UID:task-synthetic-task-1/g) ?? []).length, 1);
});
