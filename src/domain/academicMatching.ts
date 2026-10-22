import type {
  AcademicDataPackage,
  AcademicSelection,
  ExaminationRegulationVersion,
} from './academic';

function semesterOrdinal(id: string) {
  const [yearText, term] = id.split('-');
  const year = Number(yearText);
  return year * 2 + (term === 'winter' ? 1 : 0);
}

export function findCandidatePoVersions(
  data: AcademicDataPackage,
  input: Pick<AcademicSelection, 'degreeType' | 'facultyId' | 'programmeId' | 'entrySemesterId'>,
): ExaminationRegulationVersion[] {
  if (!/^\d{4}-(summer|winter)$/.test(input.entrySemesterId)) return [];
  const programme = data.programmes.find(
    (item) => item.id === input.programmeId && item.degreeType === input.degreeType && item.facultyId === input.facultyId,
  );
  if (!programme) return [];
  const target = semesterOrdinal(input.entrySemesterId);
  return data.examinationRegulationVersions.filter((po) => {
    if (po.programmeId !== programme.id || !programme.examinationRegulationVersionIds.includes(po.id)) return false;
    if (po.entrySemesterFrom && target < semesterOrdinal(po.entrySemesterFrom)) return false;
    if (po.entrySemesterUntil && target > semesterOrdinal(po.entrySemesterUntil)) return false;
    return true;
  });
}

export function validateAcademicSelection(data: AcademicDataPackage, selection: AcademicSelection) {
  const candidates = findCandidatePoVersions(data, selection);
  const programme = data.programmes.find((item) => item.id === selection.programmeId);
  const tracksValid = selection.programmeTrackIds.every(
    (id) => data.programmeTracks.some((track) => track.id === id && track.programmeId === programme?.id),
  );
  return Boolean(
    selection.poConfirmedByUser === true &&
      programme &&
      tracksValid &&
      candidates.some((po) => po.id === selection.examinationRegulationVersionId),
  );
}

export function getRequirementGroupsForSelection(data: AcademicDataPackage, selection: AcademicSelection) {
  if (!validateAcademicSelection(data, selection)) return [];
  const inScope = data.requirementGroups.filter(
    (group) => group.examinationRegulationVersionId === selection.examinationRegulationVersionId,
  );

  // A group scoped to a track only applies when that track is selected. Groups
  // that merely describe a parent group's contents (its children) are shown
  // whenever the parent is, so their scoping follows the parent, not the track.
  const scopedParentIds = new Set(
    inScope
      .filter(
        (group) =>
          group.programmeTrackIds.length > 0 &&
          !group.programmeTrackIds.some((id) => selection.programmeTrackIds.includes(id)),
      )
      .map((group) => group.id),
  );

  return inScope.filter((group) => {
    if (group.programmeTrackIds.length > 0) {
      return group.programmeTrackIds.some((id) => selection.programmeTrackIds.includes(id));
    }
    // Hide children whose parent is out of scope.
    return !(group.parentRequirementGroupId && scopedParentIds.has(group.parentRequirementGroupId));
  });
}
