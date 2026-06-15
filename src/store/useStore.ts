import { create } from 'zustand';
import {
  Drill,
  Personnel,
  Scenario,
  Device,
  Score,
  Hazard,
  Announcement,
  DepartmentStats,
} from '@/types';
import { drillsData } from '@/data/drills';
import { personnelData } from '@/data/personnel';
import { scenariosData } from '@/data/scenarios';
import { devicesData } from '@/data/devices';
import { scoresData } from '@/data/scores';
import { hazardsData } from '@/data/hazards';
import { announcementsData } from '@/data/announcements';

interface AppState {
  drills: Drill[];
  personnel: Personnel[];
  scenarios: Scenario[];
  devices: Device[];
  scores: Score[];
  hazards: Hazard[];
  announcements: Announcement[];
  sidebarCollapsed: boolean;
  selectedDrill: Drill | null;
  selectedPersonnel: Personnel | null;
  showDrillCreate: boolean;
  showHazardCreate: boolean;
  showAnnouncementCreate: boolean;
  showErrorReplayScore: Score | null;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedDrill: (drill: Drill | null) => void;
  setSelectedPersonnel: (personnel: Personnel | null) => void;
  setShowDrillCreate: (show: boolean) => void;
  setShowHazardCreate: (show: boolean) => void;
  setShowAnnouncementCreate: (show: boolean) => void;
  setShowErrorReplay: (score: Score | null) => void;

  addDrill: (drill: Drill) => void;
  updateDrill: (id: string, drill: Partial<Drill>) => void;
  deleteDrill: (id: string) => void;

  addHazard: (hazard: Hazard) => void;
  updateHazard: (id: string, hazard: Partial<Hazard>) => void;

  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;

  getDepartmentStats: () => DepartmentStats[];
}

export const useStore = create<AppState>((set, get) => ({
  drills: drillsData,
  personnel: personnelData,
  scenarios: scenariosData,
  devices: devicesData,
  scores: scoresData,
  hazards: hazardsData,
  announcements: announcementsData,
  sidebarCollapsed: false,
  selectedDrill: null,
  selectedPersonnel: null,
  showDrillCreate: false,
  showHazardCreate: false,
  showAnnouncementCreate: false,
  showErrorReplayScore: null,

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedDrill: (drill) => set({ selectedDrill: drill }),
  setSelectedPersonnel: (personnel) => set({ selectedPersonnel: personnel }),
  setShowDrillCreate: (show) => set({ showDrillCreate: show }),
  setShowHazardCreate: (show) => set({ showHazardCreate: show }),
  setShowAnnouncementCreate: (show) => set({ showAnnouncementCreate: show }),
  setShowErrorReplay: (score) => set({ showErrorReplayScore: score }),

  addDrill: (drill) =>
    set((state) => ({ drills: [...state.drills, drill] })),

  updateDrill: (id, drill) =>
    set((state) => ({
      drills: state.drills.map((d) => (d.id === id ? { ...d, ...drill } : d)),
    })),

  deleteDrill: (id) =>
    set((state) => ({
      drills: state.drills.filter((d) => d.id !== id),
    })),

  addHazard: (hazard) =>
    set((state) => ({ hazards: [hazard, ...state.hazards] })),

  updateHazard: (id, hazard) =>
    set((state) => ({
      hazards: state.hazards.map((h) => (h.id === id ? { ...h, ...hazard } : h)),
    })),

  addAnnouncement: (announcement) =>
    set((state) => ({ announcements: [announcement, ...state.announcements] })),

  updateAnnouncement: (id, announcement) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, ...announcement } : a
      ),
    })),

  deleteAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== id),
    })),

  getDepartmentStats: () => {
    const { personnel, scores } = get();
    const deptMap = new Map<string, { total: number; trained: number; passed: number }>();

    personnel.forEach((p) => {
      if (!deptMap.has(p.department)) {
        deptMap.set(p.department, { total: 0, trained: 0, passed: 0 });
      }
      const stats = deptMap.get(p.department)!;
      stats.total++;
      if (p.trainCount > 0) {
        stats.trained++;
      }
    });

    scores.forEach((s) => {
      const p = personnel.find((per) => per.id === s.personnelId);
      if (p) {
        const stats = deptMap.get(p.department);
        if (stats && s.passed) {
          stats.passed++;
        }
      }
    });

    return Array.from(deptMap.entries()).map(([name, stats]) => ({
      name,
      totalCount: stats.total,
      trainedCount: stats.trained,
      passCount: stats.passed,
      passRate: stats.trained > 0 ? Math.round((stats.passed / stats.trained) * 100) : 0,
    }));
  },
}));
