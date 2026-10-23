import { describe, expect, it } from 'vitest';
import { academicData } from '../data/academicData';

/**
 * Expected values transcribed one by one from the official ILS module handbook
 * (Modulhandbuch M.Sc. Integrated Life Sciences, SoSe 2026, update 2026-03-02,
 * SHA-256 4a04ccdfc47cee2b4b3be1ffe7714b2c19422918e49212616712c542d24ac4a7).
 *
 * Every row was read from the printed field "1 Module name ... N ECTS" and the
 * field "12 Module frequency" on the page given. Nothing here is inferred: if
 * the handbook changes, this table has to change with it.
 */
const handbook: { code: string; moduleId: string; page: number; ects: number; terms: ('summer' | 'winter')[] | null }[] = [
  { code: '48071', moduleId: 'ils-m1-statistics', page: 3, ects: 5, terms: ['summer'] },
  { code: '48081', moduleId: 'ils-vertiefungsmodul', page: 5, ects: 20, terms: ['summer', 'winter'] },
  { code: '1999', moduleId: 'ils-masterarbeit', page: 6, ects: 30, terms: ['summer', 'winter'] },
  { code: '48091', moduleId: 'ils-m2-biomathematik', page: 9, ects: 10, terms: ['winter'] },
  { code: '48101', moduleId: 'ils-b1-systems-biology', page: 11, ects: 5, terms: ['winter'] },
  { code: '48131', moduleId: 'ils-mod-48131', page: 14, ects: 5, terms: ['winter'] },
  { code: '48142', moduleId: 'ils-mod-48142', page: 15, ects: 10, terms: ['winter'] },
  { code: '48161', moduleId: 'ils-mod-48161', page: 17, ects: 10, terms: ['winter'] },
  { code: '48181', moduleId: 'ils-mod-48181', page: 19, ects: 5, terms: ['summer'] },
  { code: '48151', moduleId: 'ils-mod-48151', page: 23, ects: 5, terms: ['summer'] },
  { code: '42291', moduleId: 'ils-mod-42291', page: 25, ects: 7.5, terms: ['summer'] },
  { code: '47582', moduleId: 'ils-mod-47582', page: 27, ects: 5, terms: ['winter'] },
  { code: '48111', moduleId: 'ils-i1a-bioimaging', page: 30, ects: 7.5, terms: ['winter'] },
  { code: '48112', moduleId: 'ils-i1b-bioimaging', page: 32, ects: 7.5, terms: ['summer'] },
  { code: '48500', moduleId: 'ils-mod-48500', page: 35, ects: 5, terms: ['winter'] },
  { code: '66122', moduleId: 'ils-mod-66122', page: 37, ects: 7.5, terms: ['winter'] },
  { code: '48331', moduleId: 'ils-mod-48331', page: 40, ects: 5, terms: ['summer'] },
  // Printed twice in the PDF (pp. 21 and 41), once per module group; same module.
  { code: '48241', moduleId: 'ils-mod-48241', page: 21, ects: 5, terms: null },
  { code: '48311', moduleId: 'ils-mod-48311', page: 43, ects: 5, terms: ['winter'] },
  { code: '48313', moduleId: 'ils-mod-48313', page: 45, ects: 5, terms: ['summer', 'winter'] },
  { code: '63301', moduleId: 'ils-mod-63301', page: 46, ects: 7.5, terms: ['winter'] },
  { code: '48121', moduleId: 'ils-i2a-macromolecules', page: 49, ects: 5, terms: ['winter'] },
  { code: '48122', moduleId: 'ils-i2b-macromolecules', page: 51, ects: 5, terms: ['summer'] },
  { code: '48251', moduleId: 'ils-mod-48251', page: 53, ects: 5, terms: ['winter'] },
  { code: '48261', moduleId: 'ils-mod-48261', page: 55, ects: 5, terms: ['summer'] },
  { code: '48301', moduleId: 'ils-mod-48301', page: 57, ects: 5, terms: ['summer'] },
  { code: '42241', moduleId: 'ils-mod-42241', page: 59, ects: 7.5, terms: ['winter'] },
  { code: '42201', moduleId: 'ils-mod-42201', page: 61, ects: 7.5, terms: ['winter'] },
  { code: '42211', moduleId: 'ils-mod-42211', page: 63, ects: 7.5, terms: ['summer'] },
  { code: '42062', moduleId: 'ils-mod-42062', page: 65, ects: 7.5, terms: ['summer'] },
  { code: '47841', moduleId: 'ils-mod-47841', page: 67, ects: 10, terms: ['winter'] },
  { code: '47861', moduleId: 'ils-mod-47861', page: 69, ects: 5, terms: ['winter'] },
];

function ilsVersion(moduleId: string) {
  return academicData.moduleVersions.find(
    (version) => version.moduleId === moduleId && version.applicablePoVersionIds.includes('po-ils-2026'),
  );
}

describe('ILS module handbook coverage', () => {
  it('has a handbook entry for every ILS module version in the data package', () => {
    const ilsModules = academicData.moduleVersions.filter((version) => version.applicablePoVersionIds.includes('po-ils-2026'));
    // 33 module entries in the handbook; the PDF prints 48241 twice, so 32 distinct versions.
    expect(ilsModules).toHaveLength(32);
    const covered = new Set(handbook.map((row) => row.moduleId));
    const missing = ilsModules.filter((version) => !covered.has(version.moduleId)).map((version) => version.id);
    expect(missing).toEqual([]);
  });

  it.each(handbook.map((row) => [row.code, row] as const))('%s: ECTS and offering terms match the handbook', (code, row) => {
    const version = ilsVersion(row.moduleId);
    expect(version, `no module version for ${code} (${row.moduleId})`).toBeDefined();
    expect(version?.ects).toBe(row.ects);
    expect(version?.offeringTerms).toEqual(row.terms);
    // 48241 is printed on two pages; either page is a valid citation for it.
    expect(version?.versionLabel).toMatch(row.code === '48241' ? /S\. (21|41)/ : new RegExp(`S\\. ${row.page}`));
  });

  it('records the handbook as a verified source covering all ILS module versions', () => {
    const source = academicData.academicSources.find((item) => item.id === 'fau-ils-module-handbook-sose26');
    expect(source?.verificationStatus).toBe('verified');
    expect(source?.documentVersion).toContain('SoSe 2026');
    expect(source?.scope.moduleVersionIds).toHaveLength(32);
  });

  it('sums each module group exactly as the handbook describes it', () => {
    const groups = academicData.requirementGroups.filter((group) => group.examinationRegulationVersionId === 'po-ils-2026');
    const total = (groupId: string) =>
      (groups.find((group) => group.id === groupId)?.eligibleModuleVersionIds ?? []).reduce(
        (sum, id) => sum + (academicData.moduleVersions.find((version) => version.id === id)?.ects ?? 0),
        0,
      );

    // MG1: 48091 (10) + 48101 (5) core; MG2: 48111 (7.5) + 48112 (7.5) core;
    // MG3: 48121 (5) + 48122 (5) core. Elective courses fill the rest to 30 ECTS.
    expect(total('rg-ils-mg1-wahlpflicht')).toBeGreaterThanOrEqual(30);
    expect(total('rg-ils-mg2-wahlpflicht')).toBeGreaterThanOrEqual(30);
    expect(total('rg-ils-mg3-wahlpflicht')).toBeGreaterThanOrEqual(30);
    const abschluss = groups.find((group) => group.id === 'rg-ils-abschluss');
    expect(abschluss?.eligibleModuleVersionIds.sort()).toEqual(['ils-m1-statistics-v1', 'ils-masterarbeit-v1', 'ils-vertiefungsmodul-v1'].sort());
  });
});
