import { useMemo, useState, type ReactNode } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { faculties } from '../../data/faculties';
import { builtInResourceCategories } from '../../data/resourceCategories';
import { officialResources } from '../../data/resources';
import {
  filterAndSortResources,
  type CustomResource,
  type CustomSiteInput,
  type Resource,
  type ResourceCategory,
  type ResourceSort,
} from '../../domain/resources';
import { useTranslation } from '../../i18n/useTranslation';
import { useResourceNavigatorStore } from '../../store/resourceNavigator';
import { CategoryManagerDialog } from './CategoryManagerDialog';
import { CustomSiteDialog } from './CustomSiteDialog';
import { ResourceCard } from './ResourceCard';

export function ResourcesPage() {
  const { language, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CustomResource | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const facultyId = useResourceNavigatorStore((state) => state.facultyId);
  const degreeType = useResourceNavigatorStore((state) => state.degreeType);
  const favoriteIds = useResourceNavigatorStore((state) => state.favoriteIds);
  const favoritesFirst = useResourceNavigatorStore((state) => state.favoritesFirst);
  const sort = useResourceNavigatorStore((state) => state.sort);
  const customResources = useResourceNavigatorStore((state) => state.customResources);
  const customCategories = useResourceNavigatorStore((state) => state.customCategories);
  const categoryOrder = useResourceNavigatorStore((state) => state.categoryOrder);
  const setFacultyId = useResourceNavigatorStore((state) => state.setFacultyId);
  const setDegreeType = useResourceNavigatorStore((state) => state.setDegreeType);
  const setFavoritesFirst = useResourceNavigatorStore((state) => state.setFavoritesFirst);
  const setSort = useResourceNavigatorStore((state) => state.setSort);
  const toggleFavorite = useResourceNavigatorStore((state) => state.toggleFavorite);
  const addCustomResource = useResourceNavigatorStore((state) => state.addCustomResource);
  const updateCustomResource = useResourceNavigatorStore((state) => state.updateCustomResource);
  const deleteCustomResource = useResourceNavigatorStore((state) => state.deleteCustomResource);
  const addCustomCategory = useResourceNavigatorStore((state) => state.addCustomCategory);
  const renameCustomCategory = useResourceNavigatorStore((state) => state.renameCustomCategory);
  const deleteCustomCategory = useResourceNavigatorStore((state) => state.deleteCustomCategory);
  const moveCategory = useResourceNavigatorStore((state) => state.moveCategory);

  const categories = useMemo(() => {
    const allCategories = [...builtInResourceCategories, ...customCategories];
    const order = new Map(categoryOrder.map((id, index) => [id, index]));
    return allCategories.sort(
      (left, right) =>
        (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [categoryOrder, customCategories]);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const allResources = useMemo<Resource[]>(() => [...officialResources, ...customResources], [customResources]);
  const filteredResources = useMemo(
    () =>
      filterAndSortResources(allResources, {
        query,
        facultyId,
        degreeType,
        favoriteIds,
        favoritesFirst,
        sort,
        categoryOrder,
        language,
      }),
    [allResources, categoryOrder, degreeType, facultyId, favoriteIds, favoritesFirst, language, query, sort],
  );

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const pinnedFavorites = favoritesFirst ? filteredResources.filter((resource) => favoriteSet.has(resource.id)) : [];
  const regularResources = favoritesFirst
    ? filteredResources.filter((resource) => !favoriteSet.has(resource.id))
    : filteredResources;

  const groupedResources = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          resources: regularResources.filter((resource) => resource.categoryId === category.id),
        }))
        .filter((group) => group.resources.length > 0),
    [categories, regularResources],
  );

  const openNewSiteDialog = () => {
    setEditingResource(null);
    setSiteDialogOpen(true);
  };

  const saveSite = (input: CustomSiteInput) => {
    if (editingResource) updateCustomResource(editingResource.id, input);
    else addCustomResource(input);
    setSiteDialogOpen(false);
    setEditingResource(null);
    setLiveMessage(t('resources.siteSaved'));
  };

  const editSite = (resource: Resource) => {
    if (resource.kind !== 'custom') return;
    setEditingResource(resource as CustomResource);
    setSiteDialogOpen(true);
  };

  const deleteSite = (resource: Resource) => {
    if (resource.kind !== 'custom') return;
    if (!window.confirm(t('resources.confirmDeleteSite'))) return;
    deleteCustomResource(resource.id);
    setLiveMessage(t('resources.siteDeleted'));
  };

  const addCategory = (name: string) => {
    addCustomCategory(name);
  };

  return (
    <div>
      <PageHeader title={t('resources.title')} subtitle={t('resources.subtitle')} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('resources.scopeTitle')}</h2>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('resources.degreeType')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['bachelor', 'master'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={degreeType === option}
                  className={[
                    'rounded-xl border px-3 py-2.5 text-sm font-semibold',
                    degreeType === option
                      ? 'border-sky-700 bg-sky-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200',
                  ].join(' ')}
                  onClick={() => setDegreeType(option)}
                >
                  {t(option === 'bachelor' ? 'resources.bachelor' : 'resources.master')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('resources.facultyLabel')}</legend>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <ScopeButton selected={facultyId === 'all'} onClick={() => setFacultyId('all')}>
                {t('resources.allFaculties')}
              </ScopeButton>
              {faculties.map((faculty) => (
                <ScopeButton key={faculty.id} selected={facultyId === faculty.id} onClick={() => setFacultyId(faculty.id)}>
                  {faculty.name[language]}
                </ScopeButton>
              ))}
            </div>
          </fieldset>
        </div>

        <p className="mt-5 rounded-xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
          {t('resources.universalNotice')}
        </p>
      </section>

      <section aria-label={t('resources.searchLabel')} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('resources.searchLabel')}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('resources.searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('resources.sortLabel')}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ResourceSort)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 lg:w-44"
            >
              <option value="recommended">{t('resources.sortRecommended')}</option>
              <option value="name">{t('resources.sortName')}</option>
              <option value="category">{t('resources.sortCategory')}</option>
            </select>
          </label>

          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold dark:border-slate-700">
            <input type="checkbox" checked={favoritesFirst} onChange={(event) => setFavoritesFirst(event.target.checked)} className="h-4 w-4" />
            {t('resources.favoriteFirst')}
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {filteredResources.length} {t('resources.resultSuffix')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setCategoryDialogOpen(true)}>
              {t('resources.manageCategories')}
            </button>
            <button type="button" className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800" onClick={openNewSiteDialog}>
              + {t('resources.addSite')}
            </button>
          </div>
        </div>
      </section>

      <p aria-live="polite" className="mt-4 min-h-5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
        {liveMessage}
      </p>

      {filteredResources.length === 0 ? (
        <EmptyState title={t('resources.noResultsTitle')} body={t('resources.noResultsBody')} />
      ) : (
        <div className="mt-3 space-y-10">
          {pinnedFavorites.length > 0 ? (
            <ResourceSection
              title={t('resources.favorites')}
              resources={pinnedFavorites}
              categoryMap={categoryMap}
              favoriteIds={favoriteSet}
              onToggleFavorite={toggleFavorite}
              onEdit={editSite}
              onDelete={deleteSite}
            />
          ) : null}

          {groupedResources.map((group) => (
            <ResourceSection
              key={group.category.id}
              title={group.category.name[language]}
              resources={group.resources}
              categoryMap={categoryMap}
              favoriteIds={favoriteSet}
              onToggleFavorite={toggleFavorite}
              onEdit={editSite}
              onDelete={deleteSite}
            />
          ))}
        </div>
      )}

      {siteDialogOpen ? (
        <CustomSiteDialog
          categories={categories}
          resource={editingResource}
          onClose={() => {
            setSiteDialogOpen(false);
            setEditingResource(null);
          }}
          onSave={saveSite}
        />
      ) : null}

      {categoryDialogOpen ? (
        <CategoryManagerDialog
          categories={categories}
          onAdd={addCategory}
          onRename={renameCustomCategory}
          onDelete={deleteCustomCategory}
          onMove={moveCategory}
          onClose={() => setCategoryDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}

type ScopeButtonProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
};

function ScopeButton({ selected, onClick, children }: ScopeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        'shrink-0 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold sm:text-sm',
        selected
          ? 'border-sky-700 bg-sky-700 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200',
      ].join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type ResourceSectionProps = {
  title: string;
  resources: Resource[];
  categoryMap: Map<string, ResourceCategory>;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
};

function ResourceSection({ title, resources, categoryMap, favoriteIds, onToggleFavorite, onEdit, onDelete }: ResourceSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {resources.length}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            category={categoryMap.get(resource.categoryId)}
            favorite={favoriteIds.has(resource.id)}
            onToggleFavorite={() => onToggleFavorite(resource.id)}
            onEdit={() => onEdit(resource)}
            onDelete={() => onDelete(resource)}
          />
        ))}
      </div>
    </section>
  );
}
