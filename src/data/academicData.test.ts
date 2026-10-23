import { describe, expect, it } from 'vitest';
import { academicData, academicDataSummary } from './academicData';

// The package ships real FAU biology master data. These tests check that the
// data stays internally consistent and traceable rather than checking that it
// is absent. Anything claimed as verified must point at a source.

describe('production academic data package', () => {
  it('contains the five faculties and references only known entities', () => {
    expect(academicData.faculties).toHaveLength(5);

    const facultyIds = new Set(academicData.faculties.map((faculty) => faculty.id));
    const programmeIds = new Set(academicData.programmes.map((programme) => programme.id));
    const sourceIds = new Set(academicData.academicSources.map((source) => source.id));
    const poIds = new Set(academicData.examinationRegulationVersions.map((po) => po.id));
    const moduleIds = new Set(academicData.modules.map((module) => module.id));
    const moduleVersionIds = new Set(academicData.moduleVersions.map((version) => version.id));
    const trackIds = new Set(academicData.programmeTracks.map((track) => track.id));

    for (const programme of academicData.programmes) {
      expect(facultyIds.has(programme.facultyId)).toBe(true);
      for (const sourceId of programme.websiteSourceIds) expect(sourceIds.has(sourceId)).toBe(true);
      for (const poId of programme.examinationRegulationVersionIds) expect(poIds.has(poId)).toBe(true);
      for (const trackId of programme.programmeTrackIds) expect(trackIds.has(trackId)).toBe(true);
    }

    for (const po of academicData.examinationRegulationVersions) {
      expect(programmeIds.has(po.programmeId)).toBe(true);
      expect(po.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of po.sourceIds) expect(sourceIds.has(sourceId)).toBe(true);
    }

    for (const module of academicData.modules) {
      for (const programmeId of module.programmeIds) expect(programmeIds.has(programmeId)).toBe(true);
    }

    for (const version of academicData.moduleVersions) {
      expect(moduleIds.has(version.moduleId)).toBe(true);
      expect(version.applicablePoVersionIds.length).toBeGreaterThan(0);
      for (const poId of version.applicablePoVersionIds) expect(poIds.has(poId)).toBe(true);
      for (const sourceId of version.sourceIds) expect(sourceIds.has(sourceId)).toBe(true);
    }

    for (const group of academicData.requirementGroups) {
      expect(poIds.has(group.examinationRegulationVersionId)).toBe(true);
      expect(group.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of group.sourceIds) expect(sourceIds.has(sourceId)).toBe(true);
      for (const versionId of group.eligibleModuleVersionIds) {
        expect(moduleVersionIds.has(versionId)).toBe(true);
      }
    }
  });

  it('balances every programme against its 120 ECTS total', () => {
    // Each programme root must match the lower bound exactly and be reachable
    // from the children. The upper bound is a ceiling: ILS allows 60-65 ECTS of
    // module groups against a 60 ECTS requirement, so children may exceed it.
    const roots = academicData.requirementGroups.filter((group) => group.parentRequirementGroupId === null);

    for (const root of roots) {
      const children = academicData.requirementGroups.filter(
        (group) => group.parentRequirementGroupId === root.id,
      );
      expect(children.length).toBeGreaterThan(0);

      const sumMin = children.reduce((total, group) => total + (group.minEcts ?? 0), 0);
      const sumMax = children.reduce((total, group) => total + (group.maxEcts ?? 0), 0);
      expect(sumMin).toBe(root.minEcts);
      // Children may offer more than the root needs (ILS module groups can hold
      // 65 ECTS against a 60 ECTS requirement), but never less.
      expect(sumMax).toBeGreaterThanOrEqual(120);
      expect(root.minEcts).toBe(120);
    }
  });

  it('keeps every source official, traceable and HTTPS', () => {
    expect(academicData.academicSources.length).toBeGreaterThan(0);

    for (const source of academicData.academicSources) {
      expect(source.url.startsWith('https://')).toBe(true);
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // A source claiming verification must record when it was verified.
      if (source.verificationStatus === 'verified') {
        expect(source.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }

    expect(academicDataSummary.programmeCount).toBe(academicData.programmes.length);
  });

  it('does not claim verified status without something to verify against', () => {
    for (const programme of academicData.programmes) {
      if (programme.dataStatus !== 'verified') continue;
      expect(programme.websiteSourceIds.length).toBeGreaterThan(0);
      expect(programme.examinationRegulationVersionIds.length).toBeGreaterThan(0);
    }

    for (const group of academicData.requirementGroups) {
      if (group.verificationStatus !== 'verified') continue;
      expect(group.sourceIds.length).toBeGreaterThan(0);
    }
  });
});
