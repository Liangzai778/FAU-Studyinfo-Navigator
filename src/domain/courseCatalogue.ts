import type {
  AcademicDataPackage,
  ModuleVersion,
  ProgrammeTrack,
  RequirementGroup,
} from './academic';

export type CatalogueEntry = {
  moduleVersionId: string;
  moduleId: string;
  title: string;
  titleEn: string;
  ects: number | null;
  offeringTerms: ('summer' | 'winter')[] | null;
  /** Requirement groups that accept this module in the current PO/track selection. */
  groupIds: string[];
  trackIds: string[];
};

type CatalogueInput = {
  data: AcademicDataPackage;
  poVersionId: string | null;
  /** Groups visible for the current selection (already track-filtered). */
  groups: readonly RequirementGroup[];
  language: 'zh-CN' | 'en';
};

/**
 * Flattens the academic package into selectable courses for the planner.
 *
 * A student should never type a module name by hand: the name and the ECTS
 * must come from the catalogue, otherwise the planner records a course the
 * degree rules cannot recognise. Only modules that belong to the selected PO
 * are offered, and each entry carries the requirement groups that accept it so
 * the form can preselect a group instead of asking the student to map modules
 * to rules.
 */
export function buildCourseCatalogue({ data, poVersionId, groups, language }: CatalogueInput): CatalogueEntry[] {
  if (!poVersionId) return [];
  const moduleById = new Map(data.modules.map((module) => [module.id, module] as const));
  const groupIdsByModuleVersion = new Map<string, string[]>();
  groups.forEach((group) => {
    group.eligibleModuleVersionIds.forEach((moduleVersionId) => {
      const current = groupIdsByModuleVersion.get(moduleVersionId) ?? [];
      if (!current.includes(group.id)) current.push(group.id);
      groupIdsByModuleVersion.set(moduleVersionId, current);
    });
  });

  return data.moduleVersions
    .filter((version) => version.applicablePoVersionIds.includes(poVersionId))
    .map((version) => {
      const module = moduleById.get(version.moduleId);
      const groupIds = groupIdsByModuleVersion.get(version.id) ?? [];
      return {
        moduleVersionId: version.id,
        moduleId: version.moduleId,
        title: module?.name[language] ?? version.id,
        titleEn: module?.name.en ?? version.id,
        ects: version.ects,
        offeringTerms: version.offeringTerms,
        groupIds,
        trackIds: trackIdsForGroups(groups, groupIds),
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title, language === 'zh-CN' ? 'zh-Hans-CN' : 'en'));
}

function trackIdsForGroups(groups: readonly RequirementGroup[], groupIds: readonly string[]) {
  const ids = new Set<string>();
  groups
    .filter((group) => groupIds.includes(group.id))
    .forEach((group) => group.programmeTrackIds.forEach((trackId) => ids.add(trackId)));
  return [...ids];
}

/** Ranked search over module titles in both languages, including the module code. */
export function searchCatalogue(entries: readonly CatalogueEntry[], query: string, language: 'zh-CN' | 'en') {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  const scored = entries
    .map((entry) => ({ entry, score: matchScore(entry, needle, language) }))
    .filter((item) => item.score > 0);
  scored.sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title));
  return scored.map((item) => item.entry);
}

function matchScore(entry: CatalogueEntry, needle: string, language: 'zh-CN' | 'en') {
  const primary = (language === 'zh-CN' ? entry.title : entry.titleEn).toLowerCase();
  const secondary = (language === 'zh-CN' ? entry.titleEn : entry.title).toLowerCase();
  const code = entry.moduleId.toLowerCase();
  if (primary === needle) return 100;
  if (primary.startsWith(needle)) return 80;
  if (primary.includes(needle)) return 60;
  if (code.includes(needle)) return 50;
  if (secondary.includes(needle)) return 40;
  // Allow "bio image" to match "Bioimaging" without a full-text index.
  const compactPrimary = primary.replace(/[\s\-_/()]+/g, '');
  const compactNeedle = needle.replace(/[\s\-_/()]+/g, '');
  if (compactNeedle.length >= 3 && compactPrimary.includes(compactNeedle)) return 30;
  return 0;
}

/** The group a student most likely means: the first one that accepts the module. */
export function defaultGroupForEntry(entry: CatalogueEntry | undefined) {
  if (!entry) return '';
  return entry.groupIds[0] ?? '';
}

export function trackLabel(track: ProgrammeTrack, language: 'zh-CN' | 'en') {
  return track.name[language];
}


export function moduleVersionTitle(version: ModuleVersion, moduleById: Map<string, { name: { 'zh-CN': string; en: string } }>, language: 'zh-CN' | 'en') {
  return moduleById.get(version.moduleId)?.name[language] ?? version.id;
}
