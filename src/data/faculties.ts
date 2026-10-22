import { academicData } from './academicData';
import { facultyIdSchema, type FacultyId } from '../domain/academic';

export { facultyIdSchema, type FacultyId };

export const faculties = academicData.faculties;

export const allFacultyIds: FacultyId[] = [...facultyIdSchema.options];
