import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { faculties, allFacultyIds, type FacultyId } from '../../data/faculties';
import {
  customSiteInputSchema,
  parseKeywords,
  type CustomResource,
  type CustomSiteInput,
  type DegreeType,
  type ResourceCategory,
} from '../../domain/resources';
import { useTranslation } from '../../i18n/useTranslation';

type FieldName = 'name' | 'description' | 'url' | 'categoryId' | 'facultyIds' | 'degreeTypes';
type FieldErrors = Partial<Record<FieldName, string>>;

type CustomSiteDialogProps = {
  categories: ResourceCategory[];
  resource: CustomResource | null;
  onClose: () => void;
  onSave: (input: CustomSiteInput) => void;
};

export function CustomSiteDialog({ categories, resource, onClose, onSave }: CustomSiteDialogProps) {
  const { language, t } = useTranslation();
  const [name, setName] = useState(resource?.name[language] ?? '');
  const [description, setDescription] = useState(resource?.description[language] ?? '');
  const [url, setUrl] = useState(resource?.url ?? 'https://');
  const [categoryId, setCategoryId] = useState(resource?.categoryId ?? 'personal');
  const [facultyIds, setFacultyIds] = useState<FacultyId[]>(resource?.facultyIds ?? allFacultyIds);
  const [degreeTypes, setDegreeTypes] = useState<DegreeType[]>(resource?.degreeTypes ?? ['bachelor', 'master']);
  const [keywordText, setKeywordText] = useState(resource?.keywords[language].join(', ') ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.id !== 'life' || category.builtIn),
    [categories],
  );

  const toggleFaculty = (facultyId: FacultyId) => {
    setFacultyIds((current) =>
      current.includes(facultyId) ? current.filter((id) => id !== facultyId) : [...current, facultyId],
    );
  };

  const toggleDegree = (degreeType: DegreeType) => {
    setDegreeTypes((current) =>
      current.includes(degreeType) ? current.filter((type) => type !== degreeType) : [...current, degreeType],
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = {
      name,
      description,
      url,
      categoryId,
      facultyIds,
      degreeTypes,
      keywords: parseKeywords(keywordText),
    };
    const parsed = customSiteInputSchema.safeParse(candidate);
    const nextErrors: FieldErrors = {};

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName | undefined;
        if (!field || nextErrors[field]) continue;
        const errorKey = {
          name: 'resources.formInvalidName',
          description: 'resources.formInvalidDescription',
          url: 'resources.formInvalidUrl',
          categoryId: 'resources.formInvalidCategory',
          facultyIds: 'resources.formInvalidFaculty',
          degreeTypes: 'resources.formInvalidDegree',
        }[field] as Parameters<typeof t>[0];
        nextErrors[field] = t(errorKey);
      }
    }
    if (!categories.some((category) => category.id === categoryId)) {
      nextErrors.categoryId = t('resources.formInvalidCategory');
    }
    setErrors(nextErrors);
    if (!parsed.success || Object.keys(nextErrors).length) return;
    onSave(parsed.data);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/60 p-0 sm:place-items-center sm:p-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-dialog-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="site-dialog-title" className="text-2xl font-bold text-slate-950 dark:text-white">
              {resource ? t('resources.formEditTitle') : t('resources.formAddTitle')}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('resources.formUserContentHint')}</p>
          </div>
          <button type="button" className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} aria-label={t('resources.formCancel')}>
            ×
          </button>
        </div>

        <form className="mt-6 space-y-5" noValidate onSubmit={submit}>
          <Field label={t('resources.formName')} error={errors.name}>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </Field>

          <Field label={t('resources.formDescription')} error={errors.description}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(errors.description)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </Field>

          <Field label={t('resources.formUrl')} error={errors.url}>
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              aria-invalid={Boolean(errors.url)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </Field>

          <Field label={t('resources.formCategory')} error={errors.categoryId}>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-invalid={Boolean(errors.categoryId)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name[language]}</option>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('resources.formFaculties')}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {faculties.map((faculty) => (
                <label key={faculty.id} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <input type="checkbox" checked={facultyIds.includes(faculty.id)} onChange={() => toggleFaculty(faculty.id)} className="mt-0.5 h-4 w-4" />
                  <span>{faculty.name[language]}</span>
                </label>
              ))}
            </div>
            {errors.facultyIds ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{errors.facultyIds}</p> : null}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('resources.formDegrees')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['bachelor', 'master'] as const).map((degreeType) => (
                <label key={degreeType} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <input type="checkbox" checked={degreeTypes.includes(degreeType)} onChange={() => toggleDegree(degreeType)} className="h-4 w-4" />
                  <span>{t(degreeType === 'bachelor' ? 'resources.bachelor' : 'resources.master')}</span>
                </label>
              ))}
            </div>
            {errors.degreeTypes ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{errors.degreeTypes}</p> : null}
          </fieldset>

          <Field label={t('resources.formKeywords')} hint={t('resources.formKeywordsHint')}>
            <input
              value={keywordText}
              onChange={(event) => setKeywordText(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="button" className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold dark:border-slate-700" onClick={onClose}>
              {t('resources.formCancel')}
            </button>
            <button type="submit" className="rounded-xl bg-sky-700 px-5 py-2.5 font-semibold text-white hover:bg-sky-800">
              {t('resources.formSave')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-rose-700 dark:text-rose-300">{error}</span> : null}
      {hint ? <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}
