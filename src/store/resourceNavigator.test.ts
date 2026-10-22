import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultResourceState,
  resourceNavigatorStorageKey,
  useResourceNavigatorStore,
} from './resourceNavigator';
import type { CustomSiteInput } from '../domain/resources';

const siteInput: CustomSiteInput = {
  name: 'My Portal',
  description: 'Local link',
  url: 'https://example.org/portal',
  categoryId: 'personal',
  facultyIds: ['tech'],
  degreeTypes: ['master'],
  keywords: ['portal'],
};

describe('resource navigator persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useResourceNavigatorStore.setState({
      ...defaultResourceState,
      favoriteIds: [],
      customResources: [],
      customCategories: [],
      categoryOrder: [...defaultResourceState.categoryOrder],
    });
  });

  it('persists faculty, degree, sorting, and favorite choices', () => {
    const store = useResourceNavigatorStore.getState();
    store.setFacultyId('tech');
    store.setDegreeType('master');
    store.setSort('name');
    store.toggleFavorite('campo');

    const saved = JSON.parse(window.localStorage.getItem(resourceNavigatorStorageKey) ?? '{}');
    expect(saved).toMatchObject({ facultyId: 'tech', degreeType: 'master', sort: 'name' });
    expect(saved.favoriteIds).toContain('campo');

    useResourceNavigatorStore.getState().toggleFavorite('campo');
    expect(useResourceNavigatorStore.getState().favoriteIds).not.toContain('campo');
  });

  it('adds, edits, and deletes a personal site', () => {
    const id = useResourceNavigatorStore.getState().addCustomResource(siteInput);
    expect(useResourceNavigatorStore.getState().customResources[0]).toMatchObject({
      id,
      url: siteInput.url,
      verificationStatus: 'pending',
      lastCheckedAt: null,
    });

    useResourceNavigatorStore.getState().updateCustomResource(id, { ...siteInput, name: 'Updated portal' });
    expect(useResourceNavigatorStore.getState().customResources[0]?.name.en).toBe('Updated portal');

    useResourceNavigatorStore.getState().deleteCustomResource(id);
    expect(useResourceNavigatorStore.getState().customResources).toHaveLength(0);
  });

  it('creates, reorders, renames, and deletes a custom category safely', () => {
    const id = useResourceNavigatorStore.getState().addCustomCategory('Research');
    expect(id).not.toBeNull();
    if (!id) return;

    useResourceNavigatorStore.getState().moveCategory(id, -1);
    useResourceNavigatorStore.getState().renameCustomCategory(id, 'Labs');
    expect(useResourceNavigatorStore.getState().customCategories[0]?.name.en).toBe('Labs');

    useResourceNavigatorStore.getState().addCustomResource({ ...siteInput, categoryId: id });
    useResourceNavigatorStore.getState().deleteCustomCategory(id);
    expect(useResourceNavigatorStore.getState().customCategories).toHaveLength(0);
    expect(useResourceNavigatorStore.getState().customResources[0]?.categoryId).toBe('personal');
  });

  it('clears favorites and user-created resource data', () => {
    useResourceNavigatorStore.getState().toggleFavorite('campo');
    useResourceNavigatorStore.getState().addCustomResource(siteInput);
    useResourceNavigatorStore.getState().addCustomCategory('Temporary');
    useResourceNavigatorStore.getState().reset();
    expect(useResourceNavigatorStore.getState()).toMatchObject({
      favoriteIds: [],
      customResources: [],
      customCategories: [],
      facultyId: 'all',
      degreeType: 'bachelor',
    });
  });
});
