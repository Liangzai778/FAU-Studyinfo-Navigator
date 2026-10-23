import { z } from 'zod';
import { facultyIdSchema, type FacultyId } from '../data/faculties';

export const localizedTextSchema = z.object({
  'zh-CN': z.string().min(1),
  en: z.string().min(1),
});

export const degreeTypeSchema = z.enum(['bachelor', 'master']);
export type DegreeType = z.infer<typeof degreeTypeSchema>;

export const verificationStatusSchema = z.enum(['verified', 'pending']);

export const resourceSourceSchema = z.object({
  title: localizedTextSchema,
  url: z.string().url().refine((value) => value.startsWith('https://')),
});

/**
 * What kind of opening a resource is. Shown as a badge so a scholarship with a
 * once-a-year deadline never looks like a page you can heedlessly bookmark.
 * All three are usable by international students; the point of the list is that
 * most students never hear about them at all.
 */
export const opportunityKindSchema = z.enum(['funding', 'programme', 'support', 'career']);
export type OpportunityKind = z.infer<typeof opportunityKindSchema>;

/** A document the student can read offline, such as a programme PDF. */
export const resourceDocumentSchema = z.object({
  title: localizedTextSchema,
  url: z.string().url().refine((value) => value.startsWith('https://')),
  /** e.g. "PDF". Left as free text because not every document is a PDF. */
  format: z.string().min(1).max(20),
});

export const resourceSchema = z.object({
  id: z.string().min(1).max(120),
  // 'external' marks an official third-party site (DAAD, Study in Germany)
  // that is authoritative but not run by FAU.
  kind: z.enum(['official', 'custom', 'external']),
  name: localizedTextSchema,
  description: localizedTextSchema,
  categoryId: z.string().min(1).max(80),
  url: z.string().url().refine((value) => value.startsWith('https://')),
  facultyIds: z.array(facultyIdSchema).min(1),
  degreeTypes: z.array(degreeTypeSchema).min(1),
  keywords: z.object({
    'zh-CN': z.array(z.string().min(1).max(40)).max(24),
    en: z.array(z.string().min(1).max(40)).max(24),
  }),
  source: resourceSourceSchema,
  lastCheckedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  verificationStatus: verificationStatusSchema,
  priority: z.number().int().min(0).max(10_000),
  createdAt: z.string().datetime().nullable(),

  // --- Optional facts for opportunities (scholarships, programmes, support) ---
  // Every one is optional so the existing entries stay valid unchanged.
  opportunityKind: opportunityKindSchema.nullable().default(null),
  /**
   * Who it is actually open to. Written out because "international students"
   * is not one group: degree-seeking students, exchange students and refugees
   * face different rules, and picking the wrong one wastes an application.
   */
  audience: z.array(localizedTextSchema).max(6).default([]),
  /** Plain-text benefit, e.g. "300 EUR per month for two semesters". */
  benefit: localizedTextSchema.nullable().default(null),
  /**
   * Application window exactly as the official page states it, including the
   * year. Never inferred: a wrong deadline is worse than no deadline.
   */
  deadline: localizedTextSchema.nullable().default(null),
  documents: z.array(resourceDocumentSchema).max(6).default([]),
});

export type Resource = z.infer<typeof resourceSchema>;

export const customResourceSchema = resourceSchema.extend({
  kind: z.literal('custom'),
  verificationStatus: z.literal('pending'),
  lastCheckedAt: z.null(),
});

export type CustomResource = z.infer<typeof customResourceSchema>;

export const customSiteInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240),
  url: z.string().trim().url().refine((value) => value.startsWith('https://')),
  categoryId: z.string().min(1).max(80),
  facultyIds: z.array(facultyIdSchema).min(1),
  degreeTypes: z.array(degreeTypeSchema).min(1),
  keywords: z.array(z.string().trim().min(1).max(40)).max(24),
});

export type CustomSiteInput = z.infer<typeof customSiteInputSchema>;

export const resourceCategorySchema = z.object({
  id: z.string().min(1).max(80),
  name: localizedTextSchema,
  builtIn: z.boolean(),
});

export type ResourceCategory = z.infer<typeof resourceCategorySchema>;
export type ResourceSort = 'recommended' | 'name' | 'category' | 'deadline';

export type ResourceFilter = {
  query: string;
  facultyId: FacultyId | 'all';
  degreeType: DegreeType;
  favoriteIds: readonly string[];
  favoritesFirst: boolean;
  sort: ResourceSort;
  categoryOrder: readonly string[];
  language: 'zh-CN' | 'en';
};

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().trim();
}

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

/**
 * Pulls the first real date out of a deadline sentence.
 *
 * Deadline text is written for humans ("15 September 2027", "2027 年 9 月 15 日"),
 * so a bare year is not enough: the sentence also contains the semester label
 * "2027/28", which is not the deadline. Only year+month (+day) patterns count.
 * Returning null means "no machine-readable date"; those sort last, never
 * guessed at.
 */
export function deadlineSortDate(text: string | null | undefined): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const clampMonth = (month: number) => Math.max(0, Math.min(11, month));
  const clampDay = (day: number) => Math.max(1, Math.min(31, day));

  // English: "15 September 2027", "October 15, 2027", "March 2027".
  const english = lower.match(
    /\b(?:(\d{1,2})\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{1,2}))?,?\s+(20\d{2})\b/,
  );
  if (english) {
    return Date.UTC(
      Number(english[4]),
      clampMonth(MONTH_NAMES.indexOf(english[2]!)),
      clampDay(Number(english[1] ?? english[3] ?? 1)),
    );
  }

  // Chinese: "2027 年 9 月 15 日".
  const chinese = lower.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日)?/);
  if (chinese) {
    return Date.UTC(Number(chinese[1]), clampMonth(Number(chinese[2]) - 1), clampDay(Number(chinese[3] ?? 1)));
  }

  return null;
}

export function filterAndSortResources(items: readonly Resource[], filter: ResourceFilter): Resource[] {
  const query = normalize(filter.query);
  const favoriteIds = new Set(filter.favoriteIds);
  const categoryIndex = new Map(filter.categoryOrder.map((id, index) => [id, index]));

  return items
    .filter((resource) => {
      if (filter.facultyId !== 'all' && !resource.facultyIds.includes(filter.facultyId)) return false;
      if (!resource.degreeTypes.includes(filter.degreeType)) return false;
      if (!query) return true;

      const searchable = normalize(
        [
          resource.name['zh-CN'],
          resource.name.en,
          resource.description['zh-CN'],
          resource.description.en,
          ...resource.keywords['zh-CN'],
          ...resource.keywords.en,
        ].join(' '),
      );
      return searchable.includes(query);
    })
    .sort((left, right) => {
      if (filter.favoritesFirst) {
        const favoriteDelta = Number(favoriteIds.has(right.id)) - Number(favoriteIds.has(left.id));
        if (favoriteDelta !== 0) return favoriteDelta;
      }
      if (filter.sort === 'name') {
        return left.name[filter.language].localeCompare(right.name[filter.language], filter.language);
      }
      if (filter.sort === 'deadline') {
        // Soonest deadline first; entries without one fall through to the
        // recommended order below them. Compared as dates, not as text:
        // "September 2030" sorts before "March 2027" alphabetically, which
        // would be actively misleading.
        //
        // The two null cases must not be treated as equal here: returning
        // early would leave every undated entry where it started, in front of
        // the dated one. Falling through lets priority decide between them.
        const leftDate = deadlineSortDate(left.deadline?.[filter.language]);
        const rightDate = deadlineSortDate(right.deadline?.[filter.language]);
        if (leftDate !== null && rightDate === null) return -1;
        if (leftDate === null && rightDate !== null) return 1;
        if (leftDate !== null && rightDate !== null && leftDate !== rightDate) return leftDate - rightDate;
      }
      if (filter.sort === 'category') {
        const leftIndex = categoryIndex.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = categoryIndex.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER;
        if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      }
      return left.priority - right.priority || left.name[filter.language].localeCompare(right.name[filter.language]);
    });
}

export function parseKeywords(value: string): string[] {
  return [...new Set(value.split(/[,，;；\n]/).map((keyword) => keyword.trim()).filter(Boolean))].slice(0, 24);
}
