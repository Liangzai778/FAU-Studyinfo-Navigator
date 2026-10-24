import { describe, expect, it } from 'vitest';
import { academicData } from './academicData';

/**
 * Regression pins for the three biology master programmes.
 *
 * These exist because the data was checked against the official PDFs on
 * 2026-10-24 and two real defects were found:
 *
 *  - `iimmun-m7` carried 25 ECTS and the theoretical project work was a null
 *    seminar; the 2026 FPO Appendix 2 splits them into 15 + 10.
 *  - `po-zmb-2019` was an empty shell even though its Anlage 2 is identical to
 *    the 2026 one, which left every student who enrolled before winter 2026/27
 *    without a module table.
 */
const groupsFor = (poVersionId: string) =>
  academicData.requirementGroups.filter((group) => group.examinationRegulationVersionId === poVersionId);
const versionById = (id: string) => academicData.moduleVersions.find((version) => version.id === id);

describe('biology master programmes match their official regulations', () => {
  it('transcribes the 2019 ZMB module table for students who enrolled earlier', () => {
    const groups = groupsFor('po-zmb-2019');
    expect(groups).toHaveLength(5);
    expect(groups.find((group) => group.id === 'rg-zmb-2019-gesamt')?.minEcts).toBe(120);

    const moduleVersions = new Set(groups.flatMap((group) => group.eligibleModuleVersionIds));
    expect(moduleVersions.size).toBe(13);
    expect(groups.every((group) => group.verificationStatus === 'verified')).toBe(true);
  });

  it('keeps the 2026 ZMB structure alongside it', () => {
    const groups = groupsFor('po-zmb-2026');
    expect(groups).toHaveLength(5);
    expect(groups.find((group) => group.id === 'rg-zmb-gesamt')?.minEcts).toBe(120);
  });

  it('splits the iImmun project work into 15 + 10 ECTS as Appendix 2 states', () => {
    expect(versionById('iimmun-m7-v1')?.ects).toBe(15);
    expect(versionById('iimmun-m8-v1')?.ects).toBe(10);

    const projectGroup = groupsFor('po-iimmune-2026').find((group) => group.id === 'rg-iimmun-projekt');
    expect(projectGroup).toBeDefined();
    const total = (projectGroup?.eligibleModuleVersionIds ?? []).reduce(
      (sum, id) => sum + (versionById(id)?.ects ?? 0),
      0,
    );
    expect(total).toBe(35);
  });

  it('registers the 2022 iImmun version for earlier cohorts without inventing modules', () => {
    const po = academicData.examinationRegulationVersions.find((item) => item.id === 'po-iimmune-2022');
    expect(po?.entrySemesterUntil).toBe('2026-summer');
    expect(po?.verificationStatus).toBe('needs_review');
    expect(groupsFor('po-iimmune-2022')).toHaveLength(0);
  });

  it('keeps the iImmun 2026 PO starting at winter 2026/27', () => {
    const po = academicData.examinationRegulationVersions.find((item) => item.id === 'po-iimmune-2026');
    expect(po?.entrySemesterFrom).toBe('2026-winter');
  });

  it('gives every programme with transcribed rules a 120 ECTS root', () => {
    for (const po of academicData.examinationRegulationVersions) {
      const groups = groupsFor(po.id);
      if (groups.length === 0) continue;
      const root = groups.find((group) => group.parentRequirementGroupId === null);
      expect(root, `${po.id} has no root group`).toBeDefined();
      expect(root?.minEcts, `${po.id} root is not 120 ECTS`).toBe(120);
    }
  });
});
