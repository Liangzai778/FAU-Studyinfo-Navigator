import { describe, expect, it } from 'vitest';
import { academicData } from '../data/academicData';
import type { RequirementGroup } from './academic';
import { buildCourseCatalogue, defaultGroupForEntry, searchCatalogue } from './courseCatalogue';

const ilsPo = 'po-ils-2026';

function groupsFor(poId: string) {
  return academicData.requirementGroups.filter((group) => group.examinationRegulationVersionId === poId);
}

function visibleGroups(poId: string, trackIds: string[]): RequirementGroup[] {
  return groupsFor(poId).filter(
    (group) => group.programmeTrackIds.length === 0 || group.programmeTrackIds.some((id) => trackIds.includes(id)),
  );
}

describe('course catalogue', () => {
  it('offers every module version of the selected PO and nothing from another PO', () => {
    const entries = buildCourseCatalogue({
      data: academicData,
      poVersionId: ilsPo,
      groups: visibleGroups(ilsPo, ['ils-track-mg1', 'ils-track-mg2']),
      language: 'zh-CN',
    });
    const expected = academicData.moduleVersions.filter((version) => version.applicablePoVersionIds.includes(ilsPo));
    expect(entries).toHaveLength(expected.length);
    expect(entries.some((entry) => entry.moduleVersionId.startsWith('zmb-'))).toBe(false);
  });

  it('returns nothing without a confirmed PO, so a course is never recorded against no rules', () => {
    expect(buildCourseCatalogue({ data: academicData, poVersionId: null, groups: [], language: 'zh-CN' })).toEqual([]);
  });

  it('maps each ILS module to the requirement group that accepts it', () => {
    const entries = buildCourseCatalogue({
      data: academicData,
      poVersionId: ilsPo,
      groups: visibleGroups(ilsPo, ['ils-track-mg1', 'ils-track-mg2']),
      language: 'zh-CN',
    });
    const stats = entries.find((entry) => entry.moduleVersionId === 'ils-m1-statistics-v1');
    expect(stats?.groupIds).toEqual(['rg-ils-abschluss']);
    expect(defaultGroupForEntry(stats)).toBe('rg-ils-abschluss');
    expect(stats?.ects).toBe(5);

    const thesis = entries.find((entry) => entry.moduleVersionId === 'ils-masterarbeit-v1');
    expect(thesis?.ects).toBe(30);
    expect(thesis?.groupIds).toContain('rg-ils-abschluss');

    const mg1Core = entries.find((entry) => entry.moduleVersionId === 'ils-m2-biomathematik-v1');
    expect(mg1Core?.groupIds).toContain('rg-ils-mg1-wahlpflicht');
  });

  it('hides module groups that belong to an unselected track', () => {
    const onlyMg1 = buildCourseCatalogue({
      data: academicData,
      poVersionId: ilsPo,
      groups: visibleGroups(ilsPo, ['ils-track-mg1']),
      language: 'zh-CN',
    });
    const mg2Core = onlyMg1.find((entry) => entry.moduleVersionId === 'ils-i1a-bioimaging-v1');
    // The module is still listed (it belongs to the PO) but no visible group accepts it.
    expect(mg2Core?.groupIds).toEqual([]);
    expect(onlyMg1.every((entry) => !entry.groupIds.includes('rg-ils-mg2-wahlpflicht'))).toBe(true);
  });

  it('searches by Chinese, English and module code', () => {
    const entries = buildCourseCatalogue({
      data: academicData,
      poVersionId: ilsPo,
      groups: visibleGroups(ilsPo, ['ils-track-mg1']),
      language: 'zh-CN',
    });
    expect(searchCatalogue(entries, '生物数学', 'zh-CN')[0]?.title).toContain('生物数学');
    expect(searchCatalogue(entries, 'bioimaging', 'zh-CN').some((entry) => /bioimaging/i.test(entry.titleEn))).toBe(true);
    expect(searchCatalogue(entries, 'ils-mod-48241', 'zh-CN')[0]?.moduleId).toBe('ils-mod-48241');
    expect(searchCatalogue(entries, 'zzz-no-match', 'zh-CN')).toEqual([]);
  });
});
