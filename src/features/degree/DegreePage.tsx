import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ExternalLink } from '../../components/common/ExternalLink';
import { PageHeader } from '../../components/common/PageHeader';
import { academicData, academicDataSummary } from '../../data/academicData';
import {
  entrySemesterIdSchema,
  findCandidatePoVersions,
  getRequirementGroupsForSelection,
  type AcademicSelection,
  type DegreeType,
  type FacultyId,
  type RuleVerificationStatus,
} from '../../domain/academic';
import { useTranslation } from '../../i18n/useTranslation';
import { useAcademicProfileStore } from '../../store/academicProfile';

const statusKeys: Record<RuleVerificationStatus, 'degree.statusVerified' | 'degree.statusTentative' | 'degree.statusNeedsReview' | 'degree.statusUnverified' | 'degree.statusConflict'> = {
  verified: 'degree.statusVerified',
  tentative: 'degree.statusTentative',
  needs_review: 'degree.statusNeedsReview',
  unverified: 'degree.statusUnverified',
  conflict: 'degree.statusConflict',
};

export function DegreePage() {
  const { language, t } = useTranslation();
  const profile = useAcademicProfileStore((state) => state.profile);
  const hydrated = useAcademicProfileStore((state) => state.hydrated);
  const storageError = useAcademicProfileStore((state) => state.storageError);
  const hydrate = useAcademicProfileStore((state) => state.hydrate);
  const saveGeneralProfile = useAcademicProfileStore((state) => state.saveGeneralProfile);
  const saveScopedProfile = useAcademicProfileStore((state) => state.saveScopedProfile);
  const clearProfile = useAcademicProfileStore((state) => state.clearProfile);

  const [degreeType, setDegreeType] = useState<DegreeType>('bachelor');
  const [facultyId, setFacultyId] = useState<FacultyId | ''>('');
  const [programmeId, setProgrammeId] = useState('');
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [entryYear, setEntryYear] = useState('');
  const [entryTerm, setEntryTerm] = useState<'summer' | 'winter' | ''>('');
  const [poVersionId, setPoVersionId] = useState('');
  const [poConfirmed, setPoConfirmed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!profile) return;
    // Syncing the form draft from IndexedDB hydration is a legitimate external-system -> React update.
    const source = profile.mode === 'general' ? profile : profile.selection;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDegreeType(source.degreeType);
    setFacultyId(source.facultyId);
    const [year, term] = source.entrySemesterId.split('-');
    setEntryYear(year ?? '');
    setEntryTerm(term === 'summer' || term === 'winter' ? term : '');
    if (profile.mode === 'scoped') {
      setProgrammeId(profile.selection.programmeId);
      setTrackIds(profile.selection.programmeTrackIds);
      setPoVersionId(profile.selection.examinationRegulationVersionId);
      setPoConfirmed(true);
    }
  }, [profile]);

  const programmes = useMemo(
    () => academicData.programmes.filter((item) => item.degreeType === degreeType && item.facultyId === facultyId),
    [degreeType, facultyId],
  );
  const selectedProgramme = academicData.programmes.find((item) => item.id === programmeId);
  const programmeSources = useMemo(() => {
    if (!selectedProgramme) return [];
    const ids = new Set(selectedProgramme.websiteSourceIds);
    return academicData.academicSources.filter((source) => ids.has(source.id));
  }, [selectedProgramme]);
  const tracks = academicData.programmeTracks.filter((item) => item.programmeId === programmeId);
  const entrySemesterId = `${entryYear}-${entryTerm}`;
  const validEntrySemester = entrySemesterIdSchema.safeParse(entrySemesterId).success;
  const candidatePoVersions = useMemo(() => {
    if (!facultyId || !programmeId || !validEntrySemester) return [];
    return findCandidatePoVersions(academicData, { degreeType, facultyId, programmeId, entrySemesterId });
  }, [degreeType, entrySemesterId, facultyId, programmeId, validEntrySemester]);

  const scopedSelection: AcademicSelection | null = profile?.mode === 'scoped' ? profile.selection : null;
  const activeRules = scopedSelection ? getRequirementGroupsForSelection(academicData, scopedSelection) : [];
  const activePo = scopedSelection
    ? academicData.examinationRegulationVersions.find((item) => item.id === scopedSelection.examinationRegulationVersionId)
    : null;

  const resetDependentSelection = () => {
    setProgrammeId('');
    setTrackIds([]);
    setPoVersionId('');
    setPoConfirmed(false);
  };

  const saveGeneral = async () => {
    if (!facultyId || !validEntrySemester) {
      setMessage(t('degree.formIncomplete'));
      return;
    }
    const saved = await saveGeneralProfile({ degreeType, facultyId, entrySemesterId });
    setMessage(t(saved ? 'degree.generalSaved' : 'degree.storageFailed'));
  };

  const saveScoped = async () => {
    if (!facultyId || !programmeId || !poVersionId || !validEntrySemester || !poConfirmed) {
      setMessage(t('degree.poConfirmationRequired'));
      return;
    }
    const saved = await saveScopedProfile({
      degreeType,
      facultyId,
      programmeId,
      programmeTrackIds: trackIds,
      entrySemesterId,
      examinationRegulationVersionId: poVersionId,
      poConfirmedByUser: true,
    });
    setMessage(t(saved ? 'degree.scopedSaved' : 'degree.invalidCombination'));
  };

  return (
    <div>
      <PageHeader title={t('degree.title')} subtitle={t('degree.subtitle')} eyebrow={t('degree.phaseLabel')} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t('degree.selectionTitle')}</h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">{t('degree.selectionBody')}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {profile?.mode === 'scoped' ? t('degree.modeScoped') : t('degree.modeGeneral')}
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('degree.degreeType')}</span>
            <select
              value={degreeType}
              onChange={(event) => {
                setDegreeType(event.target.value as DegreeType);
                resetDependentSelection();
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="bachelor">{t('resources.bachelor')}</option>
              <option value="master">{t('resources.master')}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('degree.faculty')}</span>
            <select
              value={facultyId}
              onChange={(event) => {
                setFacultyId(event.target.value as FacultyId | '');
                resetDependentSelection();
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">{t('degree.chooseFaculty')}</option>
              {academicData.faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>{faculty.name[language]}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('degree.programme')}</span>
            <select
              value={programmeId}
              disabled={!facultyId || programmes.length === 0}
              onChange={(event) => {
                setProgrammeId(event.target.value);
                setTrackIds([]);
                setPoVersionId('');
                setPoConfirmed(false);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">{programmes.length === 0 ? t('degree.noProgrammes') : t('degree.chooseProgramme')}</option>
              {programmes.map((programme) => (
                <option key={programme.id} value={programme.id}>{programme.name[language]}</option>
              ))}
            </select>
          </label>

          {selectedProgramme && programmeSources.length > 0 ? (
            <section className="mt-5 rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/30 md:col-span-2">
              <h3 className="font-semibold text-sky-950 dark:text-sky-100">{t('degree.officialLinksTitle')}</h3>
              <p className="mt-1 text-sm leading-6 text-sky-900/80 dark:text-sky-200/80">{t('degree.officialLinksBody')}</p>
              <ul className="mt-3 grid gap-2">
                {programmeSources.map((source) => (
                  <li key={source.id}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex flex-wrap items-baseline gap-x-2 rounded-lg px-2 py-1.5 hover:bg-sky-100/70 dark:hover:bg-sky-900/40"
                    >
                      <span className="font-medium text-sky-900 underline decoration-sky-400 underline-offset-2 dark:text-sky-100">
                        {source.title[language]}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                        {t(`degree.verification.${source.verificationStatus}`)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t('degree.lastChecked')} {source.lastCheckedAt}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('degree.entrySemester')}</span>
            <div className="grid grid-cols-[1fr_1.2fr] gap-2">
              <input
                aria-label={t('degree.entryYear')}
                type="number"
                inputMode="numeric"
                min="1900"
                max="2200"
                value={entryYear}
                onChange={(event) => {
                  setEntryYear(event.target.value);
                  setPoVersionId('');
                  setPoConfirmed(false);
                }}
                placeholder={t('degree.entryYear')}
                className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              />
              <select
                aria-label={t('degree.entryTerm')}
                value={entryTerm}
                onChange={(event) => {
                  setEntryTerm(event.target.value as 'summer' | 'winter' | '');
                  setPoVersionId('');
                  setPoConfirmed(false);
                }}
                className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">{t('degree.entryTerm')}</option>
                <option value="summer">{t('degree.summerSemester')}</option>
                <option value="winter">{t('degree.winterSemester')}</option>
              </select>
            </div>
          </div>
        </div>

        {tracks.length > 0 ? (
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('degree.tracks')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {tracks.map((track) => (
                <label key={track.id} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={trackIds.includes(track.id)}
                    onChange={(event) => setTrackIds((current) => event.target.checked ? [...current, track.id] : current.filter((id) => id !== track.id))}
                  />
                  {track.name[language]}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <h3 className="font-semibold text-amber-950 dark:text-amber-100">{t('degree.poSelectionTitle')}</h3>
          <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">{t('degree.poSelectionBody')}</p>
          <select
            aria-label={t('degree.poVersion')}
            value={poVersionId}
            disabled={!selectedProgramme || !validEntrySemester || candidatePoVersions.length === 0}
            onChange={(event) => {
              setPoVersionId(event.target.value);
              setPoConfirmed(false);
            }}
            className="mt-3 h-11 w-full rounded-xl border border-amber-300 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-slate-950"
          >
            <option value="">{candidatePoVersions.length === 0 ? t('degree.noPoCandidates') : t('degree.choosePo')}</option>
            {candidatePoVersions.map((po) => <option key={po.id} value={po.id}>{po.code} — {po.title[language]}</option>)}
          </select>
          <label className="mt-3 flex items-start gap-2 text-sm leading-6 text-amber-950 dark:text-amber-100">
            <input type="checkbox" className="mt-1" checked={poConfirmed} disabled={!poVersionId} onChange={(event) => setPoConfirmed(event.target.checked)} />
            {t('degree.poConfirmLabel')}
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => void saveGeneral()} className="rounded-xl border border-sky-700 px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200 dark:hover:bg-sky-950">
            {t('degree.useGeneralMode')}
          </button>
          <button type="button" disabled={!poConfirmed} onClick={() => void saveScoped()} className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
            {t('degree.saveProgrammePo')}
          </button>
          {profile ? (
            <button type="button" onClick={() => void clearProfile().then((ok) => setMessage(t(ok ? 'degree.profileCleared' : 'degree.storageFailed')))} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              {t('degree.clearSelection')}
            </button>
          ) : null}
        </div>
        <p aria-live="polite" className="mt-3 min-h-6 text-sm font-semibold text-sky-800 dark:text-sky-200">
          {!hydrated ? t('degree.loadingLocalProfile') : storageError ? t('degree.storageFailed') : message}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-6 dark:border-sky-900 dark:bg-sky-950/40">
        <h2 className="font-semibold text-sky-950 dark:text-sky-100">{t('degree.guidanceTitle')}</h2>
        <p className="mt-2 leading-7 text-sky-900/80 dark:text-sky-200/80">{t('degree.guidanceBody')}</p>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t('degree.rulesTitle')}</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{activePo ? `${activePo.code} — ${activePo.title[language]}` : t('degree.rulesGeneralBody')}</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{academicDataSummary.dataReleaseId}</span>
        </div>
        {activeRules.length === 0 ? (
          <EmptyState title={t('degree.emptyTitle')} body={t('degree.emptyBody')} badge={t('common.unknown')} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2" data-testid="rule-cards">
            {activeRules
              .filter((rule) => {
                // Sub-groups are rendered inside their parent card, so they must not
                // also appear as standalone cards. A rule with no parent is never a
                // sub-group.
                if (!rule.parentRequirementGroupId) return true;
                return !activeRules.some((candidate) => candidate.id === rule.parentRequirementGroupId);
              })
              .map((rule) => (
              <article key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-950 dark:text-white">{rule.name[language]}</h3>
                  <StatusBadge status={rule.verificationStatus} label={t(statusKeys[rule.verificationStatus])} />
                </div>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{rule.ruleText[language]}</p>
                {(() => {
                  // Render the group hierarchy as a tree: a group shows the modules it
                  // owns plus a labelled block for each child group. A module that a
                  // child already lists is not repeated at the parent level.
                  type ModuleSection = {
                    key: string;
                    label: string;
                    moduleVersionIds: string[];
                    children: ModuleSection[];
                  };

                  const buildSection = (group: (typeof activeRules)[number]): ModuleSection => {
                    const children = activeRules.filter(
                      (candidate) => candidate.parentRequirementGroupId === group.id,
                    );
                    const covered = new Set(children.flatMap((child) => child.eligibleModuleVersionIds));
                    return {
                      key: group.id,
                      label: group.name[language],
                      moduleVersionIds: group.eligibleModuleVersionIds.filter((id) => !covered.has(id)),
                      children: children.map(buildSection),
                    };
                  };

                  const groupsToRender = [buildSection(rule)];

                  const resolve = (versionId: string) => {
                    const version = academicData.moduleVersions.find((item) => item.id === versionId);
                    const module = version
                      ? academicData.modules.find((item) => item.id === version.moduleId)
                      : undefined;
                    return module && version ? { id: versionId, name: module.name[language], ects: version.ects } : null;
                  };

                  type ResolvedModule = { id: string; name: string; ects: number | null };
                  type Section = { key: string; label: string; modules: ResolvedModule[]; children: Section[] };

                  const resolveSection = (group: (typeof groupsToRender)[number]): Section => ({
                    key: group.key,
                    label: group.label,
                    modules: group.moduleVersionIds
                      .map(resolve)
                      .filter((item): item is ResolvedModule => item !== null),
                    children: group.children.map(resolveSection),
                  });

                  const sectionTree = resolveSection(groupsToRender[0]!);
                  const countModules = (section: Section): number =>
                    section.modules.length + section.children.reduce((sum, child) => sum + countModules(child), 0);
                  const total = countModules(sectionTree);

                  if (total === 0) {
                    return <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('degree.modulesEmpty')}</p>;
                  }

                  const renderSection = (section: Section, depth: number) => (
                    <div key={section.key} className={depth > 0 ? 'mt-3 border-l-2 border-slate-200 pl-3 dark:border-slate-700' : ''}>
                      {section.modules.length > 0 ? (
                        <h4 className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${depth > 0 ? 'mt-1' : ''}`}>
                          {section.label}
                        </h4>
                      ) : null}
                      {section.modules.length > 0 ? (
                        <ul className="mt-1.5 space-y-1.5">
                          {section.modules.map((module) => (
                            <li key={module.id} className="flex items-baseline justify-between gap-3 text-sm">
                              <span className="text-slate-700 dark:text-slate-200">{module.name}</span>
                              <span className="shrink-0 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {module.ects ?? '—'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {section.children.map((child) => renderSection(child, depth + 1))}
                    </div>
                  );

                  return (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('degree.modulesTitle')} · {total}
                      </p>
                      <div className="mt-3">{renderSection(sectionTree, 0)}</div>
                      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('degree.modulesBody')}</p>
                    </div>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t('degree.sourcesTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('degree.sourcesBody')}</p>
        <div className="mt-5 space-y-3">
          {academicData.academicSources.map((source) => (
            <article key={source.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-white">{source.title[language]}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{source.publisher}</p>
                </div>
                <StatusBadge status={source.verificationStatus} label={t(statusKeys[source.verificationStatus])} />
              </div>
              {source.notes ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{source.notes[language]}</p> : null}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span>{t('degree.lastChecked')}: {source.lastCheckedAt ?? t('resources.notChecked')}</span>
                <span>{t('degree.lastVerified')}: {source.lastVerifiedAt ?? t('degree.neverVerified')}</span>
                <ExternalLink href={source.url} className="font-semibold text-sky-700 underline dark:text-sky-300">{t('degree.openSource')}</ExternalLink>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status, label }: { status: RuleVerificationStatus; label: string }) {
  const colors: Record<RuleVerificationStatus, string> = {
    verified: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    tentative: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
    needs_review: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    unverified: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    conflict: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${colors[status]}`}>{label}</span>;
}
