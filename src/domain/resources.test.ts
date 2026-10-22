import { describe, expect, it } from 'vitest';
import { officialResources } from '../data/resources';
import { customSiteInputSchema, filterAndSortResources, parseKeywords } from './resources';

const baseFilter = {
  query: '',
  facultyId: 'all' as const,
  degreeType: 'bachelor' as const,
  favoriteIds: [] as string[],
  favoritesFirst: true,
  sort: 'recommended' as const,
  categoryOrder: ['study', 'exams', 'services', 'faculty', 'life', 'personal'],
  language: 'zh-CN' as const,
};

describe('resource search and sorting', () => {
  it('finds resources by Chinese and English keywords', () => {
    expect(filterAndSortResources(officialResources, { ...baseFilter, query: '成绩' }).map((item) => item.id)).toContain('campo');
    expect(filterAndSortResources(officialResources, { ...baseFilter, query: 'opening hours' }).map((item) => item.id)).toContain('library');
  });

  it('filters by degree type and faculty applicability', () => {
    const bachelorResults = filterAndSortResources(officialResources, {
      ...baseFilter,
      facultyId: 'tech',
      degreeType: 'bachelor',
    });
    const masterResults = filterAndSortResources(officialResources, {
      ...baseFilter,
      facultyId: 'med',
      degreeType: 'master',
    });
    expect(bachelorResults).toHaveLength(officialResources.length);
    expect(masterResults).toHaveLength(officialResources.length);
  });

  it('places favorites first when requested', () => {
    const results = filterAndSortResources(officialResources, {
      ...baseFilter,
      favoriteIds: ['library'],
      favoritesFirst: true,
    });
    expect(results[0]?.id).toBe('library');
  });

  it('parses and deduplicates multilingual keywords', () => {
    expect(parseKeywords('library, 图书馆，library; study')).toEqual(['library', '图书馆', 'study']);
  });
});

describe('custom site validation', () => {
  const validInput = {
    name: 'My faculty site',
    description: 'Saved locally',
    url: 'https://example.org/path',
    categoryId: 'personal',
    facultyIds: ['tech'] as const,
    degreeTypes: ['master'] as const,
    keywords: ['portal'],
  };

  it('accepts a valid HTTPS site', () => {
    expect(customSiteInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects non-HTTPS and empty applicability', () => {
    expect(customSiteInputSchema.safeParse({ ...validInput, url: 'http://example.org' }).success).toBe(false);
    expect(customSiteInputSchema.safeParse({ ...validInput, facultyIds: [] }).success).toBe(false);
    expect(customSiteInputSchema.safeParse({ ...validInput, degreeTypes: [] }).success).toBe(false);
  });
});
