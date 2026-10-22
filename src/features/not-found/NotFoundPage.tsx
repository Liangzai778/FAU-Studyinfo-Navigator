import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <p className="text-sm font-bold tracking-[0.2em] text-sky-700 dark:text-sky-300">404</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{t('notFound.title')}</h1>
      <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{t('notFound.body')}</p>
      <Link className="mt-7 inline-flex rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800" to="/">
        {t('notFound.action')}
      </Link>
    </section>
  );
}
