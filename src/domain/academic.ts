import { z } from 'zod';

export const localizedAcademicTextSchema = z.object({
  'zh-CN': z.string().min(1),
  en: z.string().min(1),
});

export const facultyIdSchema = z.enum(['phil', 'wiso', 'med', 'nat', 'tech']);
export type FacultyId = z.infer<typeof facultyIdSchema>;

export const degreeTypeSchema = z.enum(['bachelor', 'master']);
export type DegreeType = z.infer<typeof degreeTypeSchema>;

export const semesterTermSchema = z.enum(['summer', 'winter']);

export const entrySemesterIdSchema = z.string().regex(/^\d{4}-(summer|winter)$/);

export const entrySemesterSchema = z
  .object({
    id: entrySemesterIdSchema,
    year: z.number().int().min(1900).max(2200),
    term: semesterTermSchema,
  })
  .superRefine((semester, context) => {
    if (semester.id !== `${semester.year}-${semester.term}`) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entry semester id must match year and term.',
        path: ['id'],
      });
    }
  });
export type EntrySemester = z.infer<typeof entrySemesterSchema>;

export const ruleVerificationStatusSchema = z.enum([
  'verified',
  'tentative',
  'needs_review',
  'unverified',
  'conflict',
]);
export type RuleVerificationStatus = z.infer<typeof ruleVerificationStatusSchema>;

export const academicScopeSchema = z.object({
  level: z.enum(['university', 'faculty', 'programme', 'programme_track', 'po', 'module']),
  facultyIds: z.array(facultyIdSchema).max(5).default([]),
  programmeIds: z.array(z.string().min(1)).default([]),
  programmeTrackIds: z.array(z.string().min(1)).default([]),
  examinationRegulationVersionIds: z.array(z.string().min(1)).default([]),
  moduleVersionIds: z.array(z.string().min(1)).default([]),
});
export type AcademicScope = z.infer<typeof academicScopeSchema>;

export const academicSourceSchema = z.object({
  id: z.string().min(1).max(160),
  title: localizedAcademicTextSchema,
  publisher: z.string().min(1).max(160),
  url: z.string().url().refine((value) => value.startsWith('https://'), 'Academic sources must use HTTPS.'),
  documentType: z.enum([
    'examination_regulation',
    'transition_rule',
    'module_handbook',
    'campo',
    'official_notice',
    'official_index',
  ]),
  scope: academicScopeSchema,
  documentVersion: z.string().max(120).nullable(),
  sectionOrPage: z.string().max(240).nullable(),
  lastCheckedAt: z.string().date().nullable(),
  lastVerifiedAt: z.string().date().nullable(),
  verificationStatus: ruleVerificationStatusSchema,
  notes: localizedAcademicTextSchema.nullable(),
});
export type AcademicSource = z.infer<typeof academicSourceSchema>;

export const facultySchema = z.object({
  id: facultyIdSchema,
  name: localizedAcademicTextSchema,
});
export type Faculty = z.infer<typeof facultySchema>;

export const programmeSchema = z.object({
  id: z.string().min(1).max(160),
  facultyId: facultyIdSchema,
  degreeType: degreeTypeSchema,
  name: localizedAcademicTextSchema,
  programmeTrackIds: z.array(z.string().min(1)).default([]),
  examinationRegulationVersionIds: z.array(z.string().min(1)).default([]),
  dataStatus: z.enum(['verified', 'partial', 'unverified']),
  // Official department/programme pages the user can follow for the current rules.
  // Kept as source references rather than free-form URLs so every link stays traceable.
  websiteSourceIds: z.array(z.string().min(1)).default([]),
});
export type Programme = z.infer<typeof programmeSchema>;

export const programmeTrackSchema = z.object({
  id: z.string().min(1).max(160),
  programmeId: z.string().min(1),
  name: localizedAcademicTextSchema,
  sourceIds: z.array(z.string().min(1)).min(1),
  verificationStatus: ruleVerificationStatusSchema,
});
export type ProgrammeTrack = z.infer<typeof programmeTrackSchema>;

export const examinationRegulationVersionSchema = z.object({
  id: z.string().min(1).max(160),
  programmeId: z.string().min(1),
  code: z.string().min(1).max(120),
  title: localizedAcademicTextSchema,
  entrySemesterFrom: entrySemesterIdSchema.nullable(),
  entrySemesterUntil: entrySemesterIdSchema.nullable(),
  applicabilityNotes: localizedAcademicTextSchema,
  sourceIds: z.array(z.string().min(1)).min(1),
  verificationStatus: ruleVerificationStatusSchema,
});
export type ExaminationRegulationVersion = z.infer<typeof examinationRegulationVersionSchema>;

export const moduleSchema = z.object({
  id: z.string().min(1).max(160),
  programmeIds: z.array(z.string().min(1)).min(1),
  name: localizedAcademicTextSchema,
});
export type Module = z.infer<typeof moduleSchema>;

export const moduleVersionSchema = z.object({
  id: z.string().min(1).max(160),
  moduleId: z.string().min(1),
  versionLabel: z.string().min(1).max(120),
  validFromSemester: entrySemesterIdSchema.nullable(),
  validUntilSemester: entrySemesterIdSchema.nullable(),
  applicablePoVersionIds: z.array(z.string().min(1)).min(1),
  ects: z.number().positive().max(300).nullable(),
  offeringTerms: z.array(semesterTermSchema).max(2).nullable(),
  sourceIds: z.array(z.string().min(1)).min(1),
  verificationStatus: ruleVerificationStatusSchema,
});
export type ModuleVersion = z.infer<typeof moduleVersionSchema>;

export const requirementGroupKindSchema = z.enum([
  'mandatory',
  'restricted_elective',
  'free_elective',
  'thesis',
  'internship',
  'additional',
]);
export type RequirementGroupKind = z.infer<typeof requirementGroupKindSchema>;

export const requirementGroupSchema = z
  .object({
    id: z.string().min(1).max(160),
    examinationRegulationVersionId: z.string().min(1),
    programmeTrackIds: z.array(z.string().min(1)).default([]),
    parentRequirementGroupId: z.string().min(1).nullable(),
    name: localizedAcademicTextSchema,
    kind: requirementGroupKindSchema,
    ruleText: localizedAcademicTextSchema,
    minEcts: z.number().nonnegative().max(600).nullable(),
    maxEcts: z.number().nonnegative().max(600).nullable(),
    eligibleModuleVersionIds: z.array(z.string().min(1)).default([]),
    exclusiveCounting: z.boolean(),
    sourceIds: z.array(z.string().min(1)).min(1),
    verificationStatus: ruleVerificationStatusSchema,
  })
  .superRefine((group, context) => {
    if (group.minEcts !== null && group.maxEcts !== null && group.minEcts > group.maxEcts) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum ECTS cannot exceed maximum ECTS.',
        path: ['minEcts'],
      });
    }
  });
export type RequirementGroup = z.infer<typeof requirementGroupSchema>;

const academicDataPackageShapeSchema = z.object({
  schemaVersion: z.literal(1),
  dataReleaseId: z.string().min(1),
  createdAt: z.string().date(),
  faculties: z.array(facultySchema).length(5),
  programmes: z.array(programmeSchema),
  programmeTracks: z.array(programmeTrackSchema),
  examinationRegulationVersions: z.array(examinationRegulationVersionSchema),
  modules: z.array(moduleSchema),
  moduleVersions: z.array(moduleVersionSchema),
  requirementGroups: z.array(requirementGroupSchema),
  academicSources: z.array(academicSourceSchema),
});

function semesterOrdinal(id: string) {
  const [yearText, term] = id.split('-');
  const year = Number(yearText);
  return year * 2 + (term === 'winter' ? 1 : 0);
}

function addReferenceIssue(context: z.RefinementCtx, path: (string | number)[], message: string) {
  context.addIssue({ code: z.ZodIssueCode.custom, path, message });
}

function findDuplicateIds(items: readonly { id: string }[]) {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? true : !seen.add(item.id))).map((item) => item.id);
}

export const academicDataPackageSchema = academicDataPackageShapeSchema.superRefine((data, context) => {
  const collections = [
    ['faculties', data.faculties],
    ['programmes', data.programmes],
    ['programmeTracks', data.programmeTracks],
    ['examinationRegulationVersions', data.examinationRegulationVersions],
    ['modules', data.modules],
    ['moduleVersions', data.moduleVersions],
    ['requirementGroups', data.requirementGroups],
    ['academicSources', data.academicSources],
  ] as const;
  const allIds = new Set<string>();
  for (const [collectionName, items] of collections) {
    for (const duplicateId of findDuplicateIds(items)) {
      addReferenceIssue(context, [collectionName], `Duplicate id: ${duplicateId}`);
    }
    for (const item of items) {
      if (allIds.has(item.id)) addReferenceIssue(context, [collectionName], `Id is not globally unique: ${item.id}`);
      allIds.add(item.id);
    }
  }

  const facultyIds = new Set(data.faculties.map((item) => item.id));
  const programmes = new Map(data.programmes.map((item) => [item.id, item]));
  const tracks = new Map(data.programmeTracks.map((item) => [item.id, item]));
  const poVersions = new Map(data.examinationRegulationVersions.map((item) => [item.id, item]));
  const modules = new Map(data.modules.map((item) => [item.id, item]));
  const moduleVersions = new Map(data.moduleVersions.map((item) => [item.id, item]));
  const requirements = new Map(data.requirementGroups.map((item) => [item.id, item]));
  const sources = new Set(data.academicSources.map((item) => item.id));

  data.programmes.forEach((programme, index) => {
    if (!facultyIds.has(programme.facultyId)) addReferenceIssue(context, ['programmes', index, 'facultyId'], 'Unknown faculty.');
    programme.programmeTrackIds.forEach((id) => {
      if (tracks.get(id)?.programmeId !== programme.id) addReferenceIssue(context, ['programmes', index, 'programmeTrackIds'], 'Track does not belong to programme.');
    });
    programme.examinationRegulationVersionIds.forEach((id) => {
      if (poVersions.get(id)?.programmeId !== programme.id) addReferenceIssue(context, ['programmes', index, 'examinationRegulationVersionIds'], 'PO version does not belong to programme.');
    });
  });

  data.programmeTracks.forEach((track, index) => {
    if (!programmes.get(track.programmeId)?.programmeTrackIds.includes(track.id)) addReferenceIssue(context, ['programmeTracks', index, 'programmeId'], 'Programme does not reference track.');
    track.sourceIds.forEach((id) => {
      if (!sources.has(id)) addReferenceIssue(context, ['programmeTracks', index, 'sourceIds'], `Unknown source: ${id}`);
    });
  });

  data.examinationRegulationVersions.forEach((po, index) => {
    if (!programmes.get(po.programmeId)?.examinationRegulationVersionIds.includes(po.id)) addReferenceIssue(context, ['examinationRegulationVersions', index, 'programmeId'], 'Programme does not reference PO version.');
    if (po.entrySemesterFrom && po.entrySemesterUntil && semesterOrdinal(po.entrySemesterFrom) > semesterOrdinal(po.entrySemesterUntil)) addReferenceIssue(context, ['examinationRegulationVersions', index, 'entrySemesterFrom'], 'PO entry-semester range is reversed.');
    po.sourceIds.forEach((id) => {
      if (!sources.has(id)) addReferenceIssue(context, ['examinationRegulationVersions', index, 'sourceIds'], `Unknown source: ${id}`);
    });
  });

  data.modules.forEach((module, index) => {
    module.programmeIds.forEach((id) => {
      if (!programmes.has(id)) addReferenceIssue(context, ['modules', index, 'programmeIds'], `Unknown programme: ${id}`);
    });
  });

  data.moduleVersions.forEach((version, index) => {
    if (!modules.has(version.moduleId)) addReferenceIssue(context, ['moduleVersions', index, 'moduleId'], 'Unknown module.');
    version.applicablePoVersionIds.forEach((id) => {
      if (!poVersions.has(id)) addReferenceIssue(context, ['moduleVersions', index, 'applicablePoVersionIds'], `Unknown PO version: ${id}`);
    });
    version.sourceIds.forEach((id) => {
      if (!sources.has(id)) addReferenceIssue(context, ['moduleVersions', index, 'sourceIds'], `Unknown source: ${id}`);
    });
  });

  data.requirementGroups.forEach((group, index) => {
    const po = poVersions.get(group.examinationRegulationVersionId);
    if (!po) addReferenceIssue(context, ['requirementGroups', index, 'examinationRegulationVersionId'], 'Unknown PO version.');
    group.programmeTrackIds.forEach((id) => {
      if (tracks.get(id)?.programmeId !== po?.programmeId) addReferenceIssue(context, ['requirementGroups', index, 'programmeTrackIds'], 'Track is outside the PO programme.');
    });
    if (group.parentRequirementGroupId && requirements.get(group.parentRequirementGroupId)?.examinationRegulationVersionId !== group.examinationRegulationVersionId) addReferenceIssue(context, ['requirementGroups', index, 'parentRequirementGroupId'], 'Parent group must belong to the same PO version.');
    group.eligibleModuleVersionIds.forEach((id) => {
      if (!moduleVersions.has(id)) addReferenceIssue(context, ['requirementGroups', index, 'eligibleModuleVersionIds'], `Unknown module version: ${id}`);
    });
    group.sourceIds.forEach((id) => {
      if (!sources.has(id)) addReferenceIssue(context, ['requirementGroups', index, 'sourceIds'], `Unknown source: ${id}`);
    });
  });

  data.academicSources.forEach((source, index) => {
    source.scope.facultyIds.forEach((id) => {
      if (!facultyIds.has(id)) addReferenceIssue(context, ['academicSources', index, 'scope', 'facultyIds'], `Unknown faculty: ${id}`);
    });
    source.scope.programmeIds.forEach((id) => {
      if (!programmes.has(id)) addReferenceIssue(context, ['academicSources', index, 'scope', 'programmeIds'], `Unknown programme: ${id}`);
    });
    source.scope.programmeTrackIds.forEach((id) => {
      if (!tracks.has(id)) addReferenceIssue(context, ['academicSources', index, 'scope', 'programmeTrackIds'], `Unknown track: ${id}`);
    });
    source.scope.examinationRegulationVersionIds.forEach((id) => {
      if (!poVersions.has(id)) addReferenceIssue(context, ['academicSources', index, 'scope', 'examinationRegulationVersionIds'], `Unknown PO version: ${id}`);
    });
    source.scope.moduleVersionIds.forEach((id) => {
      if (!moduleVersions.has(id)) addReferenceIssue(context, ['academicSources', index, 'scope', 'moduleVersionIds'], `Unknown module version: ${id}`);
    });
  });
});

export type AcademicDataPackage = z.infer<typeof academicDataPackageShapeSchema>;

export const academicSelectionSchema = z.object({
  degreeType: degreeTypeSchema,
  facultyId: facultyIdSchema,
  programmeId: z.string().min(1),
  programmeTrackIds: z.array(z.string().min(1)),
  entrySemesterId: entrySemesterIdSchema,
  examinationRegulationVersionId: z.string().min(1),
  poConfirmedByUser: z.literal(true),
});
export type AcademicSelection = z.infer<typeof academicSelectionSchema>;

export { findCandidatePoVersions, getRequirementGroupsForSelection, validateAcademicSelection } from './academicMatching';
