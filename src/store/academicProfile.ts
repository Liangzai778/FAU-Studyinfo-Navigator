import { create } from 'zustand';
import { academicData } from '../data/academicData';
import {
  validateAcademicSelection,
  type AcademicSelection,
  type DegreeType,
  type FacultyId,
} from '../domain/academic';
import {
  deleteAcademicProfile,
  readAcademicProfile,
  writeAcademicProfile,
  type StoredAcademicProfile,
} from '../storage/academicProfileStorage';
import { broadcastSync, subscribeSync } from '../storage/crossTab';

type GeneralProfileInput = {
  degreeType: DegreeType;
  facultyId: FacultyId;
  entrySemesterId: string;
};

type AcademicProfileState = {
  profile: StoredAcademicProfile | null;
  hydrated: boolean;
  storageError: boolean;
  hydrate: (force?: boolean) => Promise<void>;
  saveGeneralProfile: (input: GeneralProfileInput) => Promise<boolean>;
  saveScopedProfile: (selection: AcademicSelection) => Promise<boolean>;
  clearProfile: () => Promise<boolean>;
};

export const useAcademicProfileStore = create<AcademicProfileState>((set, get) => ({
  profile: null,
  hydrated: false,
  storageError: false,
  hydrate: async (force = false) => {
    if (get().hydrated && !force) return;
    try {
      const profile = await readAcademicProfile();
      set({ profile, hydrated: true, storageError: false });
    } catch {
      set({ hydrated: true, storageError: true });
    }
  },
  saveGeneralProfile: async (input) => {
    const profile: StoredAcademicProfile = {
      mode: 'general',
      ...input,
      savedAt: new Date().toISOString(),
    };
    try {
      await writeAcademicProfile(profile);
      set({ profile, storageError: false });
      broadcastSync('profile');
      return true;
    } catch {
      set({ storageError: true });
      return false;
    }
  },
  saveScopedProfile: async (selection) => {
    if (!validateAcademicSelection(academicData, selection)) return false;
    const profile: StoredAcademicProfile = {
      mode: 'scoped',
      selection,
      savedAt: new Date().toISOString(),
    };
    try {
      await writeAcademicProfile(profile);
      set({ profile, storageError: false });
      broadcastSync('profile');
      return true;
    } catch {
      set({ storageError: true });
      return false;
    }
  },
  clearProfile: async () => {
    try {
      await deleteAcademicProfile();
      set({ profile: null, storageError: false });
      broadcastSync('profile');
      return true;
    } catch {
      set({ storageError: true });
      return false;
    }
  },
}));

// The degree selection changed in another tab.
subscribeSync((area) => {
  if (area === 'profile') void useAcademicProfileStore.getState().hydrate(true);
});
