import { describe, expect, it } from 'vitest';
import {
  academicDataPackageSchema,
  findCandidatePoVersions,
  getRequirementGroupsForSelection,
  validateAcademicSelection,
  type AcademicDataPackage,
} from './academic';

const source = {
  id: 'synthetic-test-only-source',
  title: { 'zh-CN': '仅测试来源', en: 'Synthetic test-only source' },
  publisher: 'Synthetic test fixture',
  url: 'https://example.invalid/regulation',
  documentType: 'examination_regulation' as const,
  scope: {
    level: 'programme' as const,
    facultyIds: ['tech' as const],
    programmeIds: ['synthetic-test-only-programme'],
    programmeTrackIds: [],
    examinationRegulationVersionIds: [],
    moduleVersionIds: [],
  },
  documentVersion: null,
  sectionOrPage: null,
  lastCheckedAt: null,
  lastVerifiedAt: null,
  verificationStatus: 'unverified' as const,
  notes: null,
};

const syntheticPackage: AcademicDataPackage = {
  schemaVersion: 1,
  dataReleaseId: 'synthetic-test-only',
  createdAt: '2026-10-22',
  faculties: [
    { id: 'phil', name: { 'zh-CN': '测试学院一', en: 'Test faculty one' } },
    { id: 'wiso', name: { 'zh-CN': '测试学院二', en: 'Test faculty two' } },
    { id: 'med', name: { 'zh-CN': '测试学院三', en: 'Test faculty three' } },
    { id: 'nat', name: { 'zh-CN': '测试学院四', en: 'Test faculty four' } },
    { id: 'tech', name: { 'zh-CN': '测试学院五', en: 'Test faculty five' } },
  ],
  programmes: [{
    id: 'synthetic-test-only-programme',
    facultyId: 'tech',
    degreeType: 'master',
    name: { 'zh-CN': '仅测试专业', en: 'Synthetic test-only programme' },
    programmeTrackIds: ['synthetic-test-only-track'],
    examinationRegulationVersionIds: ['synthetic-test-only-po-a', 'synthetic-test-only-po-b'],
    dataStatus: 'unverified',
  }],
  programmeTracks: [{
    id: 'synthetic-test-only-track',
    programmeId: 'synthetic-test-only-programme',
    name: { 'zh-CN': '仅测试方向', en: 'Synthetic test-only track' },
    sourceIds: [source.id],
    verificationStatus: 'unverified',
  }],
  examinationRegulationVersions: [
    {
      id: 'synthetic-test-only-po-a',
      programmeId: 'synthetic-test-only-programme',
      code: 'TEST-A',
      title: { 'zh-CN': '仅测试版本 A', en: 'Synthetic test-only version A' },
      entrySemesterFrom: '2024-winter',
      entrySemesterUntil: '2026-summer',
      applicabilityNotes: { 'zh-CN': '仅测试', en: 'Test only' },
      sourceIds: [source.id],
      verificationStatus: 'unverified',
    },
    {
      id: 'synthetic-test-only-po-b',
      programmeId: 'synthetic-test-only-programme',
      code: 'TEST-B',
      title: { 'zh-CN': '仅测试版本 B', en: 'Synthetic test-only version B' },
      entrySemesterFrom: '2025-winter',
      entrySemesterUntil: null,
      applicabilityNotes: { 'zh-CN': '仅测试', en: 'Test only' },
      sourceIds: [source.id],
      verificationStatus: 'unverified',
    },
  ],
  modules: [{
    id: 'synthetic-test-only-module',
    programmeIds: ['synthetic-test-only-programme'],
    name: { 'zh-CN': '仅测试模块', en: 'Synthetic test-only module' },
  }],
  moduleVersions: [
    {
      id: 'synthetic-test-only-module-v1',
      moduleId: 'synthetic-test-only-module',
      versionLabel: 'v1-test-only',
      validFromSemester: '2024-winter',
      validUntilSemester: '2025-summer',
      applicablePoVersionIds: ['synthetic-test-only-po-a'],
      ects: null,
      offeringTerms: null,
      sourceIds: [source.id],
      verificationStatus: 'unverified',
    },
    {
      id: 'synthetic-test-only-module-v2',
      moduleId: 'synthetic-test-only-module',
      versionLabel: 'v2-test-only',
      validFromSemester: '2025-winter',
      validUntilSemester: null,
      applicablePoVersionIds: ['synthetic-test-only-po-b'],
      ects: null,
      offeringTerms: null,
      sourceIds: [source.id],
      verificationStatus: 'unverified',
    },
  ],
  requirementGroups: [{
    id: 'synthetic-test-only-additional-rule',
    examinationRegulationVersionId: 'synthetic-test-only-po-b',
    programmeTrackIds: ['synthetic-test-only-track'],
    parentRequirementGroupId: null,
    name: { 'zh-CN': '仅测试附加要求', en: 'Synthetic test-only additional requirement' },
    kind: 'additional',
    ruleText: { 'zh-CN': '没有真实学术含义。', en: 'No real academic meaning.' },
    minEcts: null,
    maxEcts: null,
    eligibleModuleVersionIds: [],
    exclusiveCounting: true,
    sourceIds: [source.id],
    verificationStatus: 'unverified',
  }],
  academicSources: [source],
};

describe('academic data package integrity', () => {
  it('accepts a fully linked synthetic package', () => {
    expect(academicDataPackageSchema.safeParse(syntheticPackage).success).toBe(true);
  });

  it('rejects cross-programme and dangling PO references', () => {
    const invalid = structuredClone(syntheticPackage);
    invalid.programmes[0]!.examinationRegulationVersionIds = ['missing-po'];
    expect(academicDataPackageSchema.safeParse(invalid).success).toBe(false);
  });

  it('keeps module versions separate even when the base module is shared', () => {
    expect(syntheticPackage.moduleVersions.map((item) => item.id)).toEqual([
      'synthetic-test-only-module-v1',
      'synthetic-test-only-module-v2',
    ]);
  });
});

describe('PO candidate matching and explicit confirmation', () => {
  const baseInput = {
    degreeType: 'master' as const,
    facultyId: 'tech' as const,
    programmeId: 'synthetic-test-only-programme',
    entrySemesterId: '2025-winter',
  };

  it('returns every applicable candidate and does not pick a newest PO', () => {
    expect(findCandidatePoVersions(syntheticPackage, baseInput).map((item) => item.id)).toEqual([
      'synthetic-test-only-po-a',
      'synthetic-test-only-po-b',
    ]);
  });

  it('rejects an unconfirmed or cross-programme selection', () => {
    const selection = {
      ...baseInput,
      programmeTrackIds: ['synthetic-test-only-track'],
      examinationRegulationVersionId: 'synthetic-test-only-po-b',
      poConfirmedByUser: true as const,
    };
    expect(validateAcademicSelection(syntheticPackage, selection)).toBe(true);
    expect(validateAcademicSelection(syntheticPackage, { ...selection, examinationRegulationVersionId: 'missing-po' })).toBe(false);
  });

  it('filters programme-track-specific additional requirements', () => {
    const selection = {
      ...baseInput,
      programmeTrackIds: ['synthetic-test-only-track'],
      examinationRegulationVersionId: 'synthetic-test-only-po-b',
      poConfirmedByUser: true as const,
    };
    expect(getRequirementGroupsForSelection(syntheticPackage, selection).map((item) => item.kind)).toEqual(['additional']);
    expect(getRequirementGroupsForSelection(syntheticPackage, { ...selection, programmeTrackIds: [] })).toEqual([]);
  });
});
