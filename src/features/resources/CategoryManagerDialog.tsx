import { useEffect, useState } from 'react';
import type { ResourceCategory } from '../../domain/resources';
import { useTranslation } from '../../i18n/useTranslation';

type CategoryManagerDialogProps = {
  categories: ResourceCategory[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onClose: () => void;
};

export function CategoryManagerDialog({ categories, onAdd, onRename, onDelete, onMove, onClose }: CategoryManagerDialogProps) {
  const { language, t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const addCategory = () => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length > 40) {
      setError(t('resources.categoryInvalid'));
      return;
    }
    onAdd(trimmedName);
    setNewName('');
    setError('');
  };

  const deleteCategory = (id: string) => {
    if (window.confirm(t('resources.confirmDeleteCategory'))) onDelete(id);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/60 p-0 sm:place-items-center sm:p-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="category-dialog-title" className="text-2xl font-bold text-slate-950 dark:text-white">{t('resources.categoriesTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('resources.categoriesDescription')}</p>
          </div>
          <button type="button" className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} aria-label={t('resources.categoryClose')}>×</button>
        </div>

        <div className="mt-6 flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t('resources.categoryName')}</span>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t('resources.categoryName')}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <button type="button" className="rounded-xl bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800" onClick={addCategory}>
            {t('resources.categoryAdd')}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}

        <ol className="mt-6 space-y-2">
          {categories.map((category, index) => (
            <li key={category.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              {category.builtIn ? (
                <span className="min-w-0 flex-1 font-semibold text-slate-900 dark:text-white">{category.name[language]}</span>
              ) : (
                <input
                  className="h-10 min-w-40 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-semibold dark:border-slate-700 dark:bg-slate-950"
                  defaultValue={category.name[language]}
                  aria-label={`${t('resources.categoryRename')}: ${category.name[language]}`}
                  onBlur={(event) => onRename(category.id, event.target.value)}
                />
              )}
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {category.builtIn ? t('resources.categoryBuiltIn') : t('resources.categoryCustom')}
              </span>
              <button type="button" disabled={index === 0} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm disabled:opacity-40 dark:border-slate-700" aria-label={`${t('resources.categoryMoveUp')}: ${category.name[language]}`} onClick={() => onMove(category.id, -1)}>↑</button>
              <button type="button" disabled={index === categories.length - 1} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm disabled:opacity-40 dark:border-slate-700" aria-label={`${t('resources.categoryMoveDown')}: ${category.name[language]}`} onClick={() => onMove(category.id, 1)}>↓</button>
              {!category.builtIn ? (
                <button type="button" className="rounded-lg border border-rose-200 px-2.5 py-2 text-sm text-rose-700 dark:border-rose-900 dark:text-rose-300" aria-label={`${t('resources.categoryDelete')}: ${category.name[language]}`} onClick={() => deleteCategory(category.id)}>{t('resources.delete')}</button>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
          <button type="button" className="rounded-xl bg-sky-700 px-5 py-2.5 font-semibold text-white hover:bg-sky-800" onClick={onClose}>{t('resources.categoryClose')}</button>
        </div>
      </section>
    </div>
  );
}
