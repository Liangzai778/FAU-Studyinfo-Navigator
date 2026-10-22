import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findCandidatePoVersions,
  getRequirementGroupsForSelection,
  validateAcademicSelection,
} from '../src/domain/academicMatching.ts';

const data = {
  programmes: [{
    id: 'synthetic-test-only-programme',
    facultyId: 'tech',
    degreeType: 'master',
    programmeTrackIds: ['synthetic-test-only-track'],
    examinationRegulationVersionIds: ['synthetic-test-only-po-old', 'synthetic-test-only-po-new'],
  }],
  programmeTracks: [{ id: 'synthetic-test-only-track', programmeId: 'synthetic-test-only-programme' }],
  examinationRegulationVersions: [
    {
      id: 'synthetic-test-only-po-old',
      programmeId: 'synthetic-test-only-programme',
      entrySemesterFrom: '2024-winter',
      entrySemesterUntil: '2026-summer',
    },
    {
      id: 'synthetic-test-only-po-new',
      programmeId: 'synthetic-test-only-programme',
      entrySemesterFrom: '2025-winter',
      entrySemesterUntil: null,
    },
  ],
  requirementGroups: [
    {
      id: 'synthetic-test-only-general-rule',
      examinationRegulationVersionId: 'synthetic-test-only-po-new',
      programmeTrackIds: [],
    },
    {
      id: 'synthetic-test-only-track-rule',
      examinationRegulationVersionId: 'synthetic-test-only-po-new',
      programmeTrackIds: ['synthetic-test-only-track'],
    },
  ],
};

const baseSelection = {
  degreeType: 'master',
  facultyId: 'tech',
  programmeId: 'synthetic-test-only-programme',
  programmeTrackIds: ['synthetic-test-only-track'],
  entrySemesterId: '2025-winter',
  examinationRegulationVersionId: 'synthetic-test-only-po-new',
  poConfirmedByUser: true,
};

test('returns overlapping PO versions as candidates without choosing one', () => {
  assert.deepEqual(findCandidatePoVersions(data, baseSelection).map((item) => item.id), [
    'synthetic-test-only-po-old',
    'synthetic-test-only-po-new',
  ]);
});

test('requires explicit confirmation and rejects mismatched programme scope', () => {
  assert.equal(validateAcademicSelection(data, baseSelection), true);
  assert.equal(validateAcademicSelection(data, { ...baseSelection, poConfirmedByUser: false }), false);
  assert.equal(validateAcademicSelection(data, { ...baseSelection, facultyId: 'nat' }), false);
  assert.equal(validateAcademicSelection(data, { ...baseSelection, examinationRegulationVersionId: 'missing' }), false);
});

test('applies programme-track requirements only to the selected track', () => {
  assert.deepEqual(getRequirementGroupsForSelection(data, baseSelection).map((item) => item.id), [
    'synthetic-test-only-general-rule',
    'synthetic-test-only-track-rule',
  ]);
  assert.deepEqual(
    getRequirementGroupsForSelection(data, { ...baseSelection, programmeTrackIds: [] }).map((item) => item.id),
    ['synthetic-test-only-general-rule'],
  );
});
