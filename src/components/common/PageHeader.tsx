type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
};

export function PageHeader({ title, subtitle, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
        {subtitle}
      </p>
    </header>
  );
}
