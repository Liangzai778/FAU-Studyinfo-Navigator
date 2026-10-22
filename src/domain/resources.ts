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

export const resourceSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(['official', 'custom']),
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
export type ResourceSort = 'recommended' | 'name' | 'category';

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
