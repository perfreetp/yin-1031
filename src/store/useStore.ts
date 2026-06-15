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
  DeviceBooking,
  RetrainRecord,
} from '@/types';
import { drillsData } from '@/data/drills';
import { personnelData } from '@/data/personnel';
import { scenariosData } from '@/data/scenarios';
import { devicesData } from '@/data/devices';
import { scoresData } from '@/data/scores';
import { hazardsData } from '@/data/hazards';
import { announcementsData } from '@/data/announcements';
import { bookingsData } from '@/data/bookings';
import {
  loadFromStorage,
  saveToStorage,
  genId,
  formatDateTime,
} from '@/lib/utils';

const STORAGE_KEYS = {
  drills: 'drills',
  personnel: 'personnel',
  scenarios: 'scenarios',
  devices: 'devices',
  scores: 'scores',
  hazards: 'hazards',
  announcements: 'announcements',
  bookings: 'bookings',
  retrainRecords: 'retrainRecords',
  initialized: 'initialized_v1',
};

function initState() {
  const initialized = loadFromStorage<boolean>(STORAGE_KEYS.initialized, false);
  if (!initialized) {
    saveToStorage(STORAGE_KEYS.drills, drillsData);
    saveToStorage(STORAGE_KEYS.personnel, personnelData);
    saveToStorage(STORAGE_KEYS.scenarios, scenariosData);
    saveToStorage(STORAGE_KEYS.devices, devicesData);
    saveToStorage(STORAGE_KEYS.scores, scoresData);
    saveToStorage(STORAGE_KEYS.hazards, hazardsData);
    saveToStorage(STORAGE_KEYS.announcements, announcementsData);
    saveToStorage(STORAGE_KEYS.bookings, bookingsData);
    saveToStorage(STORAGE_KEYS.retrainRecords, [] as RetrainRecord[]);
    saveToStorage(STORAGE_KEYS.initialized, true);
  }
  return {
    drills: loadFromStorage<Drill[]>(STORAGE_KEYS.drills, drillsData),
    personnel: loadFromStorage<Personnel[]>(STORAGE_KEYS.personnel, personnelData),
    scenarios: loadFromStorage<Scenario[]>(STORAGE_KEYS.scenarios, scenariosData),
    devices: loadFromStorage<Device[]>(STORAGE_KEYS.devices, devicesData),
    scores: loadFromStorage<Score[]>(STORAGE_KEYS.scores, scoresData),
    hazards: loadFromStorage<Hazard[]>(STORAGE_KEYS.hazards, hazardsData),
    announcements: loadFromStorage<Announcement[]>(STORAGE_KEYS.announcements, announcementsData),
    bookings: loadFromStorage<DeviceBooking[]>(STORAGE_KEYS.bookings, bookingsData),
    retrainRecords: loadFromStorage<RetrainRecord[]>(STORAGE_KEYS.retrainRecords, []),
  };
}

interface AppState {
  drills: Drill[];
  personnel: Personnel[];
  scenarios: Scenario[];
  devices: Device[];
  scores: Score[];
  hazards: Hazard[];
  announcements: Announcement[];
  bookings: DeviceBooking[];
  retrainRecords: RetrainRecord[];

  sidebarCollapsed: boolean;
  selectedDrill: Drill | null;
  selectedPersonnel: Personnel | null;
  showDrillCreate: boolean;
  showHazardCreate: boolean;
  showAnnouncementCreate: boolean;
  showAnnouncementEdit: Announcement | null;
  showErrorReplayScore: Score | null;
  showDeviceBooking: Device | null;
  showDeviceBookingCalendar: boolean;
  showHazardAssign: Hazard | null;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedDrill: (drill: Drill | null) => void;
  setSelectedPersonnel: (personnel: Personnel | null) => void;
  setShowDrillCreate: (show: boolean) => void;
  setShowHazardCreate: (show: boolean) => void;
  setShowAnnouncementCreate: (show: boolean) => void;
  setShowAnnouncementEdit: (ann: Announcement | null) => void;
  setShowErrorReplay: (score: Score | null) => void;
  setShowDeviceBooking: (device: Device | null) => void;
  setShowDeviceBookingCalendar: (show: boolean) => void;
  setShowHazardAssign: (hazard: Hazard | null) => void;

  addDrill: (drill: Omit<Drill, 'id' | 'createdAt' | 'checkedInCount'>) => Drill;
  updateDrill: (id: string, drill: Partial<Drill>) => void;
  deleteDrill: (id: string) => void;

  addHazard: (hazard: Omit<Hazard, 'id' | 'status' | 'createdAt'>) => Hazard;
  updateHazard: (id: string, hazard: Partial<Hazard>) => void;
  assignHazard: (id: string, responsibleId: string, responsibleName: string, deadline: string) => void;
  resolveHazard: (id: string) => void;
  verifyHazard: (id: string) => void;

  addAnnouncement: (ann: Omit<Announcement, 'id' | 'publishDate'>) => Announcement;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementPin: (id: string) => void;

  updateDevice: (id: string, device: Partial<Device>) => void;
  addBooking: (booking: Omit<DeviceBooking, 'id' | 'createdAt' | 'status'>) => DeviceBooking;
  completeBooking: (bookingId: string) => void;
  cancelBooking: (bookingId: string) => void;

  addScore: (score: Omit<Score, 'id'>) => Score;
  updateScore: (id: string, score: Partial<Score>) => void;
  scheduleRetrain: (originalScoreId: string) => { retrain: RetrainRecord; drill: Drill } | null;

  getDepartmentStats: () => DepartmentStats[];
}

export const useStore = create<AppState>((set, get) => {
  const initial = initState();

  const persist = (key: keyof typeof STORAGE_KEYS, value: any) => {
    saveToStorage(STORAGE_KEYS[key], value);
  };

  return {
    ...initial,
    sidebarCollapsed: false,
    selectedDrill: null,
    selectedPersonnel: null,
    showDrillCreate: false,
    showHazardCreate: false,
    showAnnouncementCreate: false,
    showAnnouncementEdit: null,
    showErrorReplayScore: null,
    showDeviceBooking: null,
    showDeviceBookingCalendar: false,
    showHazardAssign: null,

    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setSelectedDrill: (drill) => set({ selectedDrill: drill }),
    setSelectedPersonnel: (personnel) => set({ selectedPersonnel: personnel }),
    setShowDrillCreate: (show) => set({ showDrillCreate: show }),
    setShowHazardCreate: (show) => set({ showHazardCreate: show }),
    setShowAnnouncementCreate: (show) => set({ showAnnouncementCreate: show }),
    setShowAnnouncementEdit: (ann) => set({ showAnnouncementEdit: ann }),
    setShowErrorReplay: (score) => set({ showErrorReplayScore: score }),
    setShowDeviceBooking: (device) => set({ showDeviceBooking: device }),
    setShowDeviceBookingCalendar: (show) => set({ showDeviceBookingCalendar: show }),
    setShowHazardAssign: (hazard) => set({ showHazardAssign: hazard }),

    addDrill: (drillData) => {
      const newDrill: Drill = {
        ...drillData,
        id: genId('dr'),
        createdAt: formatDateTime(),
        checkedInCount: 0,
      };
      const drills = [...get().drills, newDrill];
      set({ drills, showDrillCreate: false });
      persist('drills', drills);
      return newDrill;
    },
    updateDrill: (id, drill) => {
      const drills = get().drills.map((d) => (d.id === id ? { ...d, ...drill } : d));
      set({ drills });
      persist('drills', drills);
    },
    deleteDrill: (id) => {
      const drills = get().drills.filter((d) => d.id !== id);
      set({ drills });
      persist('drills', drills);
    },

    addHazard: (hazardData) => {
      const newHazard: Hazard = {
        ...hazardData,
        id: genId('hz'),
        status: 'pending',
        createdAt: formatDateTime(),
      };
      const hazards = [newHazard, ...get().hazards];
      set({ hazards, showHazardCreate: false });
      persist('hazards', hazards);
      return newHazard;
    },
    updateHazard: (id, hazard) => {
      const hazards = get().hazards.map((h) => (h.id === id ? { ...h, ...hazard } : h));
      set({ hazards });
      persist('hazards', hazards);
    },
    assignHazard: (id, responsibleId, responsibleName, deadline) => {
      const hazards = get().hazards.map((h) =>
        h.id === id
          ? { ...h, status: 'processing' as const, responsibleId, responsibleName, deadline }
          : h
      );
      set({ hazards, showHazardAssign: null });
      persist('hazards', hazards);
    },
    resolveHazard: (id) => {
      const hazards = get().hazards.map((h) =>
        h.id === id ? { ...h, status: 'resolved' as const, resolvedAt: formatDateTime() } : h
      );
      set({ hazards });
      persist('hazards', hazards);
    },
    verifyHazard: (id) => {
      const hazards = get().hazards.map((h) =>
        h.id === id ? { ...h, status: 'verified' as const } : h
      );
      set({ hazards });
      persist('hazards', hazards);
    },

    addAnnouncement: (annData) => {
      const newAnn: Announcement = {
        ...annData,
        id: genId('an'),
        publishDate: formatDateTime(),
      };
      const announcements = [newAnn, ...get().announcements];
      set({ announcements, showAnnouncementCreate: false });
      persist('announcements', announcements);
      return newAnn;
    },
    updateAnnouncement: (id, ann) => {
      const announcements = get().announcements.map((a) =>
        a.id === id ? { ...a, ...ann } : a
      );
      set({ announcements, showAnnouncementEdit: null });
      persist('announcements', announcements);
    },
    deleteAnnouncement: (id) => {
      const announcements = get().announcements.filter((a) => a.id !== id);
      set({ announcements });
      persist('announcements', announcements);
    },
    toggleAnnouncementPin: (id) => {
      const announcements = get().announcements.map((a) =>
        a.id === id ? { ...a, isPinned: !a.isPinned } : a
      );
      set({ announcements });
      persist('announcements', announcements);
    },

    updateDevice: (id, device) => {
      const devices = get().devices.map((d) => (d.id === id ? { ...d, ...device } : d));
      set({ devices });
      persist('devices', devices);
    },
    addBooking: (bookingData) => {
      const newBooking: DeviceBooking = {
        ...bookingData,
        id: genId('bk'),
        createdAt: formatDateTime(),
        status: 'upcoming',
      };
      const bookings = [newBooking, ...get().bookings];
      set({ bookings, showDeviceBooking: null, showDeviceBookingCalendar: false });
      persist('bookings', bookings);
      const { devices } = get();
      const now = formatDateTime();
      const isNow = bookingData.startTime <= now && bookingData.endTime >= now;
      if (isNow) {
        const updatedDevices = devices.map((d) =>
          d.id === bookingData.deviceId
            ? { ...d, status: 'in-use' as const, currentUser: bookingData.personnelName, lastUsed: now }
            : d
        );
        set({ devices: updatedDevices });
        persist('devices', updatedDevices);
        const updatedBookings = bookings.map((b) =>
          b.id === newBooking.id ? { ...b, status: 'active' as const } : b
        );
        set({ bookings: updatedBookings });
        persist('bookings', updatedBookings);
        return updatedBookings[0] || newBooking;
      }
      return newBooking;
    },
    completeBooking: (bookingId) => {
      const booking = get().bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      const bookings = get().bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'completed' as const } : b
      );
      set({ bookings });
      persist('bookings', bookings);
      const { devices } = get();
      const otherActive = bookings.some(
        (b) => b.deviceId === booking.deviceId && b.status === 'active' && b.id !== bookingId
      );
      if (!otherActive) {
        const updatedDevices = devices.map((d) =>
          d.id === booking.deviceId
            ? { ...d, status: 'available' as const, currentUser: undefined, lastUsed: formatDateTime(), usageCount: d.usageCount + 1 }
            : d
        );
        set({ devices: updatedDevices });
        persist('devices', updatedDevices);
      }
    },
    cancelBooking: (bookingId) => {
      const booking = get().bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      const bookings = get().bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      );
      set({ bookings });
      persist('bookings', bookings);
      if (booking.status === 'active') {
        const { devices } = get();
        const otherActive = bookings.some(
          (b) => b.deviceId === booking.deviceId && b.status === 'active' && b.id !== bookingId
        );
        if (!otherActive) {
          const updatedDevices = devices.map((d) =>
            d.id === booking.deviceId
              ? { ...d, status: 'available' as const, currentUser: undefined }
              : d
          );
          set({ devices: updatedDevices });
          persist('devices', updatedDevices);
        }
      }
    },

    addScore: (scoreData) => {
      const newScore: Score = { ...scoreData, id: genId('sc') };
      const scores = [...get().scores, newScore];
      set({ scores });
      persist('scores', scores);
      return newScore;
    },
    updateScore: (id, score) => {
      const scores = get().scores.map((s) => (s.id === id ? { ...s, ...score } : s));
      set({ scores });
      persist('scores', scores);
    },
    scheduleRetrain: (originalScoreId) => {
      const { scores, drills, personnel, scenarios } = get();
      const originalScore = scores.find((s) => s.id === originalScoreId);
      if (!originalScore) return null;
      const person = personnel.find((p) => p.id === originalScore.personnelId);
      if (!person) return null;
      const originalDrill = drills.find((d) => d.id === originalScore.drillId);
      const scenarioId = originalDrill?.scenarioId || scenarios[0]?.id || '';
      const scenarioName = originalDrill?.scenarioName || scenarios[0]?.name || '';

      const drillName = `【重训】${originalDrill?.name || person.name}-${formatDateTime().slice(0, 10)}`;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const startStr = formatDateTime(startDate);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);
      const endStr = formatDateTime(endDate);

      const newDrill: Drill = {
        id: genId('dr'),
        name: drillName,
        scenarioId,
        scenarioName,
        startTime: startStr,
        endTime: endStr,
        status: 'pending',
        participantIds: [person.id],
        participantCount: 1,
        checkedInCount: 0,
        deviceIds: [],
        createdAt: formatDateTime(),
      };
      const updatedDrills = [...drills, newDrill];
      set({ drills: updatedDrills });
      persist('drills', updatedDrills);

      const retrain: RetrainRecord = {
        id: genId('rt'),
        originalScoreId,
        personnelId: person.id,
        personnelName: person.name,
        originalDrillId: originalScore.drillId,
        newDrillId: newDrill.id,
        newDrillName: drillName,
        reason: `未通过 ${originalDrill?.name || ''} 演练，安排重训`,
        createdAt: formatDateTime(),
      };
      const retrainRecords = [...get().retrainRecords, retrain];
      set({ retrainRecords });
      persist('retrainRecords', retrainRecords);

      const updatedScores = scores.map((s) =>
        s.id === originalScoreId ? { ...s, retrainCount: s.retrainCount + 1 } : s
      );
      set({ scores: updatedScores });
      persist('scores', updatedScores);

      return { retrain, drill: newDrill };
    },

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
  };
});
