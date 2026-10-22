import rawAcademicData from './academic/academic-data.json';
import { academicDataPackageSchema } from '../domain/academic';

export const academicData = academicDataPackageSchema.parse(rawAcademicData);

export const academicDataSummary = {
  dataReleaseId: academicData.dataReleaseId,
  programmeCount: academicData.programmes.length,
  poVersionCount: academicData.examinationRegulationVersions.length,
  moduleVersionCount: academicData.moduleVersions.length,
  requirementGroupCount: academicData.requirementGroups.length,
};
