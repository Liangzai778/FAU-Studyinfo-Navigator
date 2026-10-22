import { ExternalLink } from '../../components/common/ExternalLink';
import { faculties } from '../../data/faculties';
import type { Resource, ResourceCategory } from '../../domain/resources';
import { useTranslation } from '../../i18n/useTranslation';

type ResourceCardProps = {
  resource: Resource;
  category: ResourceCategory | undefined;
  favorite: boolean;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ResourceCard({
  resource,
  category,
  favorite,
  onToggleFavorite,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  const { language, t } = useTranslation();
  const appliesToAll = resource.facultyIds.length === faculties.length;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {category?.name[language] ?? resource.categoryId}
          </span>
          <span
            className={[
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              resource.verificationStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
            ].join(' ')}
          >
            {resource.verificationStatus === 'verified' ? t('resources.official') : t('resources.pending')}
          </span>
        </div>
        <button
          type="button"
          aria-pressed={favorite}
          aria-label={favorite ? t('resources.unfavorite') : t('resources.favorite')}
          title={favorite ? t('resources.unfavorite') : t('resources.favorite')}
          className={[
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xl',
            favorite
              ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'border-slate-200 bg-white text-slate-400 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-500',
          ].join(' ')}
          onClick={onToggleFavorite}
        >
          <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
        </button>
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{resource.name[language]}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.description[language]}</p>

      <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs leading-5 dark:border-slate-800">
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t('resources.facultyLabel')}:</dt>
          <dd className="text-slate-700 dark:text-slate-200">
            {appliesToAll
              ? t('resources.appliesAll')
              : resource.facultyIds
                  .map((id) => faculties.find((faculty) => faculty.id === id)?.name[language] ?? id)
                  .join(', ')}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t('resources.source')}:</dt>
          <dd className="min-w-0 text-slate-700 dark:text-slate-200">{resource.source.title[language]}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t('resources.lastChecked')}:</dt>
          <dd className="text-slate-700 dark:text-slate-200">{resource.lastCheckedAt ?? t('resources.notChecked')}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <ExternalLink
          href={resource.url}
          className="inline-flex min-h-10 items-center rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          {t('resources.open')}
        </ExternalLink>
        {resource.kind === 'custom' && onEdit && onDelete ? (
          <>
            <button
              type="button"
              className="min-h-10 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onEdit}
            >
              {t('resources.edit')}
            </button>
            <button
              type="button"
              className="min-h-10 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
              onClick={onDelete}
            >
              {t('resources.delete')}
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
