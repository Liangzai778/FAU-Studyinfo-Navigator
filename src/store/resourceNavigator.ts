import { z } from 'zod';
import { create } from 'zustand';
import { allFacultyIds, facultyIdSchema, type FacultyId } from '../data/faculties';
import { defaultCategoryOrder } from '../data/resourceCategories';
import {
  customResourceSchema,
  customSiteInputSchema,
  degreeTypeSchema,
  resourceCategorySchema,
  type CustomResource,
  type CustomSiteInput,
  type DegreeType,
  type ResourceCategory,
  type ResourceSort,
} from '../domain/resources';

const STORAGE_KEY = 'fau-study-navigator.resources.v1';

const persistedResourceStateSchema = z.object({
  facultyId: z.union([z.literal('all'), facultyIdSchema]),
  degreeType: degreeTypeSchema,
  favoriteIds: z.array(z.string().min(1)).max(500),
  favoritesFirst: z.boolean(),
  sort: z.enum(['recommended', 'name', 'category']),
  customResources: z.array(customResourceSchema).max(200),
  customCategories: z.array(resourceCategorySchema.extend({ builtIn: z.literal(false) })).max(50),
  categoryOrder: z.array(z.string().min(1)).max(100),
});

type PersistedResourceState = z.infer<typeof persistedResourceStateSchema>;

type ResourceNavigatorState = PersistedResourceState & {
  setFacultyId: (facultyId: FacultyId | 'all') => void;
  setDegreeType: (degreeType: DegreeType) => void;
  setFavoritesFirst: (favoritesFirst: boolean) => void;
  setSort: (sort: ResourceSort) => void;
  toggleFavorite: (resourceId: string) => void;
  addCustomResource: (input: CustomSiteInput) => string;
  updateCustomResource: (resourceId: string, input: CustomSiteInput) => void;
  deleteCustomResource: (resourceId: string) => void;
  addCustomCategory: (name: string) => string | null;
  renameCustomCategory: (categoryId: string, name: string) => void;
  deleteCustomCategory: (categoryId: string) => void;
  moveCategory: (categoryId: string, direction: -1 | 1) => void;
  reset: () => void;
};

export const defaultResourceState: PersistedResourceState = {
  facultyId: 'all',
  degreeType: 'bachelor',
  favoriteIds: [],
  favoritesFirst: true,
  sort: 'recommended',
  customResources: [],
  customCategories: [],
  categoryOrder: defaultCategoryOrder,
};

function readPersistedState(): PersistedResourceState {
  if (typeof window === 'undefined') return defaultResourceState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultResourceState;
    const parsed = persistedResourceStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultResourceState;
  } catch {
    return defaultResourceState;
  }
}

function selectPersisted(state: ResourceNavigatorState): PersistedResourceState {
  return {
    facultyId: state.facultyId,
    degreeType: state.degreeType,
    favoriteIds: state.favoriteIds,
    favoritesFirst: state.favoritesFirst,
    sort: state.sort,
    customResources: state.customResources,
    customCategories: state.customCategories,
    categoryOrder: state.categoryOrder,
  };
}

function persist(state: PersistedResourceState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The navigator remains usable in memory if localStorage is unavailable.
  }
}

function createLocalId(prefix: string) {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function makeCustomResource(id: string, input: CustomSiteInput, createdAt: string): CustomResource {
  const parsed = customSiteInputSchema.parse(input);
  return customResourceSchema.parse({
    id,
    kind: 'custom',
    name: { 'zh-CN': parsed.name, en: parsed.name },
    description: {
      'zh-CN': parsed.description || '用户添加的个人网站。',
      en: parsed.description || 'A personal site added by the user.',
    },
    categoryId: parsed.categoryId,
    url: parsed.url,
    facultyIds: parsed.facultyIds,
    degreeTypes: parsed.degreeTypes,
    keywords: { 'zh-CN': parsed.keywords, en: parsed.keywords },
    source: {
      title: { 'zh-CN': '用户手动添加，未经核实', en: 'Added manually by the user; not verified' },
      url: parsed.url,
    },
    lastCheckedAt: null,
    verificationStatus: 'pending',
    priority: 1_000,
    createdAt,
  });
}

const initialState = readPersistedState();

export const useResourceNavigatorStore = create<ResourceNavigatorState>((set) => ({
  ...initialState,
  setFacultyId: (facultyId) =>
    set((state) => {
      const patch = { facultyId };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  setDegreeType: (degreeType) =>
    set((state) => {
      const patch = { degreeType };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  setFavoritesFirst: (favoritesFirst) =>
    set((state) => {
      const patch = { favoritesFirst };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  setSort: (sort) =>
    set((state) => {
      const patch = { sort };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  toggleFavorite: (resourceId) =>
    set((state) => {
      const favoriteIds = state.favoriteIds.includes(resourceId)
        ? state.favoriteIds.filter((id) => id !== resourceId)
        : [resourceId, ...state.favoriteIds];
      const patch = { favoriteIds };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  addCustomResource: (input) => {
    const id = createLocalId('site');
    set((state) => {
      const customResources = [makeCustomResource(id, input, new Date().toISOString()), ...state.customResources];
      const patch = { customResources };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    });
    return id;
  },
  updateCustomResource: (resourceId, input) =>
    set((state) => {
      const customResources = state.customResources.map((resource) =>
        resource.id === resourceId
          ? makeCustomResource(resourceId, input, resource.createdAt ?? new Date().toISOString())
          : resource,
      );
      const patch = { customResources };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  deleteCustomResource: (resourceId) =>
    set((state) => {
      const patch = {
        customResources: state.customResources.filter((resource) => resource.id !== resourceId),
        favoriteIds: state.favoriteIds.filter((id) => id !== resourceId),
      };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  addCustomCategory: (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    const id = createLocalId('category');
    const category = resourceCategorySchema.parse({
      id,
      name: { 'zh-CN': trimmedName, en: trimmedName },
      builtIn: false,
    }) as ResourceCategory & { builtIn: false };
    set((state) => {
      const patch = {
        customCategories: [...state.customCategories, category],
        categoryOrder: [...state.categoryOrder, id],
      };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    });
    return id;
  },
  renameCustomCategory: (categoryId, name) =>
    set((state) => {
      const trimmedName = name.trim();
      if (!trimmedName) return {};
      const customCategories = state.customCategories.map((category) =>
        category.id === categoryId
          ? { ...category, name: { 'zh-CN': trimmedName, en: trimmedName } }
          : category,
      );
      const patch = { customCategories };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  deleteCustomCategory: (categoryId) =>
    set((state) => {
      const patch = {
        customCategories: state.customCategories.filter((category) => category.id !== categoryId),
        customResources: state.customResources.map((resource) =>
          resource.categoryId === categoryId ? { ...resource, categoryId: 'personal' } : resource,
        ),
        categoryOrder: state.categoryOrder.filter((id) => id !== categoryId),
      };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  moveCategory: (categoryId, direction) =>
    set((state) => {
      const categoryOrder = [...state.categoryOrder];
      const currentIndex = categoryOrder.indexOf(categoryId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= categoryOrder.length) return {};
      [categoryOrder[currentIndex], categoryOrder[nextIndex]] = [categoryOrder[nextIndex]!, categoryOrder[currentIndex]!];
      const patch = { categoryOrder };
      persist({ ...selectPersisted(state), ...patch });
      return patch;
    }),
  reset: () => {
    const resetState: PersistedResourceState = {
      ...defaultResourceState,
      favoriteIds: [],
      customResources: [],
      customCategories: [],
      categoryOrder: [...defaultResourceState.categoryOrder],
    };
    persist(resetState);
    set(resetState);
  },
}));

export const resourceNavigatorStorageKey = STORAGE_KEY;
export const defaultCustomResourceScope = {
  facultyIds: allFacultyIds,
  degreeTypes: degreeTypeSchema.options,
};
