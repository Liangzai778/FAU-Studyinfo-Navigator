import { Icon } from './Icon';

type EmptyStateProps = {
  title: string;
  body: string;
  badge?: string;
};

export function EmptyState({ title, body, badge }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon name="empty" className="h-6 w-6" />
      </span>
      {badge ? (
        <span className="mt-5 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {badge}
        </span>
      ) : null}
      <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">{body}</p>
    </section>
  );
}
