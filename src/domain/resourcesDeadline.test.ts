import { describe, expect, it } from 'vitest';
import { deadlineSortDate, filterAndSortResources } from './resources';

describe('deadline sorting', () => {
  it('reads an English deadline', () => {
    // The semester label "2027/28" must not be mistaken for the deadline;
    // the sentence names two dates and the first one wins.
    expect(deadlineSortDate('Winter semester 2027/28: 15 September 2027 to 15 October 2027')).toBe(Date.UTC(2027, 8, 15));
  });

  it('reads a Chinese deadline', () => {
    expect(deadlineSortDate('2027/28 冬季学期：2027 年 9 月 15 日 – 2027 年 10 月 15 日')).toBe(Date.UTC(2027, 8, 15));
  });

  it('treats a missing date as unknown instead of zero', () => {
    expect(deadlineSortDate(null)).toBeNull();
    expect(deadlineSortDate('')).toBeNull();
    expect(deadlineSortDate('rolling, no fixed deadline')).toBeNull();
  });

  it('does not sort "September 2030" before "March 2027"', () => {
    const september2030 = deadlineSortDate('September 2030');
    const march2027 = deadlineSortDate('March 2027');
    expect(march2027!).toBeLessThan(september2030!);
  });

  it('puts one dated entry in front of many undated ones, not just past the first', () => {
    // The bug this guards against: returning early when both sides are
    // undated makes the comparator treat undated pairs as equal, so the dated
    // entry only swaps with one neighbour and the rest stay ahead of it.
    const base = {
      kind: 'official' as const,
      categoryId: 'international',
      url: 'https://example.test/a',
      keywords: { 'zh-CN': [], en: [] },
      source: { title: { 'zh-CN': 'x', en: 'x' }, url: 'https://example.test/a' },
      facultyIds: [],
      degreeTypes: ['master' as const],
      lastCheckedAt: '2026-10-24',
      verificationStatus: 'verified' as const,
      createdAt: null,
      opportunityKind: 'funding' as const,
      audience: [],
      documents: [],
      description: { 'zh-CN': 'x', en: 'x' },
    };
    const undated = Array.from({ length: 12 }, (_, index) => ({
      ...base,
      id: `plain-${index}`,
      name: { 'zh-CN': `普通${index}`, en: `Plain ${index}` },
      priority: index + 1,
      benefit: null,
      deadline: null,
    }));
    const dated = {
      ...base,
      id: 'dated',
      name: { 'zh-CN': '有截止', en: 'Has deadline' },
      priority: 999,
      benefit: null,
      deadline: { 'zh-CN': '2027 年 3 月 1 日', en: 'March 2027' },
    };

    const sorted = filterAndSortResources([...undated, dated], {
      query: '',
      language: 'en',
      facultyId: 'all',
      degreeType: 'master',
      favoritesFirst: false,
      favoriteIds: [],
      categoryOrder: [],
      sort: 'deadline',
    });
    expect(sorted[0]!.id).toBe('dated');
    // Everything else keeps the recommended order.
    expect(sorted.slice(1).map((item) => item.id)).toEqual(undated.map((item) => item.id));
  });

  it('puts dated entries before undated ones', () => {
    const base = {
      kind: 'official' as const,
      categoryId: 'international',
      url: 'https://example.test/a',
      keywords: { 'zh-CN': [], en: [] },
      source: { title: { 'zh-CN': 'x', en: 'x' }, url: 'https://example.test/a' },
      facultyIds: [],
      degreeTypes: ['master' as const],
      lastCheckedAt: '2026-10-24',
      verificationStatus: 'verified' as const,
      createdAt: null,
      opportunityKind: 'funding' as const,
      audience: [],
      documents: [],
      description: { 'zh-CN': 'x', en: 'x' },
    };
    const items = [
      { ...base, id: 'none', name: { 'zh-CN': '无截止', en: 'No deadline' }, priority: 1, benefit: null, deadline: null },
      { ...base, id: 'late', name: { 'zh-CN': '晚', en: 'Late' }, priority: 2, benefit: null, deadline: { 'zh-CN': '2028 年 3 月 1 日', en: 'March 2028' } },
      { ...base, id: 'soon', name: { 'zh-CN': '早', en: 'Soon' }, priority: 3, benefit: null, deadline: { 'zh-CN': '2027 年 1 月 1 日', en: 'January 2027' } },
    ];
    const sorted = filterAndSortResources(items, {
      query: '',
      language: 'en',
      facultyId: 'all',
      degreeType: 'master',
      favoritesFirst: false,
      favoriteIds: [],
      categoryOrder: [],
      sort: 'deadline',
    });
    expect(sorted.map((item) => item.id)).toEqual(['soon', 'late', 'none']);
  });
});
