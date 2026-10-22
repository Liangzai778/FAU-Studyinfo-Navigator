import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatBerlinLocalDateTime,
  parseLocalDateTime,
  resolveBerlinLocalDateTime,
  toIcsLocalDateTime,
} from '../src/domain/berlinDateTime.ts';

test('accepts valid Berlin wall-clock date-times and rejects impossible dates', () => {
  assert.deepEqual(parseLocalDateTime('2026-11-12T09:30'), { year: 2026, month: 11, day: 12, hour: 9, minute: 30 });
  assert.equal(parseLocalDateTime('2026-02-30T09:30'), null);
  assert.equal(resolveBerlinLocalDateTime('2026-11-12T09:30').valid, true);
});

test('rejects the Europe/Berlin daylight-saving spring gap', () => {
  const result = resolveBerlinLocalDateTime('2026-03-29T02:30');
  assert.equal(result.valid, false);
  assert.deepEqual(result.matchingInstants, []);
});

test('marks the Europe/Berlin autumn repeated hour as ambiguous', () => {
  const result = resolveBerlinLocalDateTime('2026-10-25T02:30');
  assert.equal(result.valid, true);
  assert.equal(result.ambiguous, true);
  assert.equal(result.matchingInstants.length, 2);
});

test('keeps display and ICS values in Berlin wall-clock form', () => {
  assert.equal(formatBerlinLocalDateTime('2026-11-12T09:30', 'en'), '12.11.2026, 09:30 (Berlin time)');
  assert.equal(formatBerlinLocalDateTime('2026-11-12T09:30', 'zh-CN'), '12.11.2026 09:30（柏林时间）');
  assert.equal(toIcsLocalDateTime('2026-11-12T09:30'), '20261112T093000');
});
