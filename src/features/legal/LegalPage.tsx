import { Link } from 'react-router-dom';
import { ExternalLink } from '../../components/common/ExternalLink';
import { Icon } from '../../components/common/Icon';
import { PageHeader } from '../../components/common/PageHeader';
import { projectLinks } from '../../data/coverage';
import type { TranslationKey } from '../../i18n/messages';
import { useTranslation } from '../../i18n/useTranslation';

const privacyPoints: TranslationKey[] = [
  'legal.privacyLocal',
  'legal.privacyNoTracking',
  'legal.privacyHosting',
  'legal.privacyRights',
];

/**
 * Plain-German summary of the legal position.
 *
 * Kept as static German rather than a third UI language: the app ships zh-CN
 * and en, but a German-speaking authority or student should be able to read the
 * core statement without switching the interface. The binding full text is
 * LEGAL.md in the repository.
 */
const germanSummary = [
  'Dieses Projekt ist ein nicht-kommerzielles, studentisches Hilfsmittel zur Orientierung und Semesterplanung. Es steht in keiner Verbindung zur Friedrich-Alexander-Universität Erlangen-Nürnberg (FAU) und wird von der FAU nicht empfohlen oder unterstützt.',
  'Es werden keine Werbeeinnahmen, Spenden oder sonstigen kommerziellen Erlöse erzielt. Es werden keine Daten verkauft oder zu Werbezwecken weitergegeben.',
  'Die Anwendung selbst überträgt keine personenbezogenen Daten an einen Server. Studiendaten (Kurse, Noten, Prüfungen, Aufgaben, Studienwahl) werden ausschließlich lokal im Browser gespeichert (TDDDG § 25 Abs. 2 Nr. 2 als unbedingt erforderlich). Es werden keine Analyse-, Tracking- oder Werbedienste und keine Cookies zu Analysezwecken eingesetzt.',
  'Der Hosting-Anbieter (Cloudflare Pages, GitHub Pages) verarbeitet technisch notwendige Zugriffsdaten wie IP-Adresse und User-Agent zur Auslieferung und Absicherung der Seite (Art. 6 Abs. 1 lit. f DSGVO).',
  'Es findet kein automatisiertes Auslesen, Crawlen oder Simulieren einer Anmeldung an Campo, StudOn, FAUmail oder anderen FAU-Systemen statt. Zugangsdaten, Passwörter, SSO-Token oder Cookies der FAU werden nicht abgefragt.',
  'Amtliche Prüfungsordnungen sind nach § 5 UrhG in der Regel urheberrechtlich nicht geschützt. Modulhandbücher und sonstige Dokumente verbleiben beim jeweiligen Rechteinhaber; sie werden nur zur Prüfung der Transkription aufbewahrt und auf Anforderung entfernt. Eine wesentliche Entnahme aus geschützten Datenbanken (§§ 87a ff. UrhG) findet nicht statt.',
  'Die angezeigten Regeln können veralten. Verbindlich sind ausschließlich die offiziellen Dokumente der FAU und Campo.',
];

export function LegalPage() {
  const { t } = useTranslation();

  const docs = [
    { label: t('legal.readLegal'), href: `${projectLinks.repository}/blob/main/LEGAL.md` },
    { label: t('legal.readNotice'), href: `${projectLinks.repository}/blob/main/NOTICE.md` },
    { label: t('legal.readLicense'), href: `${projectLinks.repository}/blob/main/LICENSE` },
  ];

  return (
    <div>
      <PageHeader title={t('legal.title')} subtitle={t('legal.subtitle')} eyebrow={t('legal.eyebrow')} />

      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/40 sm:p-6">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-6 w-6 shrink-0 text-sky-700 dark:text-sky-300" />
          <div>
            <h2 className="font-semibold text-sky-950 dark:text-sky-100">{t('legal.summaryTitle')}</h2>
            <p className="mt-2 leading-7 text-sky-900/85 dark:text-sky-200/85">{t('legal.summaryBody')}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">{t('legal.updated')}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.nonCommercialTitle')}</h2>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{t('legal.nonCommercialBody')}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.harvestTitle')}</h2>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{t('legal.harvestBody')}</p>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.privacyTitle')}</h2>
        <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{t('legal.privacyIntro')}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {privacyPoints.map((key) => (
            <li key={key} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.copyrightTitle')}</h2>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{t('legal.copyrightBody')}</p>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{t('legal.copyrightCite')}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.disclaimerTitle')}</h2>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{t('legal.disclaimerBody')}</p>
          <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">{t('legal.lawTitle')}</h3>
          <p className="mt-1 leading-7 text-slate-600 dark:text-slate-300">{t('legal.lawBody')}</p>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.germanTitle')}</h2>
        <div lang="de" className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {germanSummary.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.docsTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('legal.docsBody')}</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {docs.map((doc) => (
              <li key={doc.href}>
                <ExternalLink href={doc.href} className="text-sky-700 underline dark:text-sky-300">
                  {doc.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('legal.contactTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('legal.contactBody')}</p>
          <ExternalLink href={projectLinks.repository} className="mt-3 inline-block text-sm font-semibold text-sky-700 underline dark:text-sky-300">
            {t('legal.contactLink')}
          </ExternalLink>
          <p className="mt-4 text-sm">
            <Link to="/" className="font-semibold text-slate-600 underline dark:text-slate-300">
              {t('nav.dashboard')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
