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
  DrillExecutionState,
  ErrorRecord,
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

function migrateDrills(drills: Drill[]): Drill[] {
  return drills.map((d) => ({
    isArchived: false,
    ...d,
  }));
}
function migrateAnnouncements(anns: Announcement[]): Announcement[] {
  return anns.map((a) => ({
    isRead: false,
    ...a,
  }));
}

function initState() {
  const initialized = loadFromStorage<boolean>(STORAGE_KEYS.initialized, false);
  const version = loadFromStorage<string>('schema_version', 'v1');
  if (!initialized) {
    saveToStorage(STORAGE_KEYS.drills, migrateDrills(drillsData));
    saveToStorage(STORAGE_KEYS.personnel, personnelData);
    saveToStorage(STORAGE_KEYS.scenarios, scenariosData);
    saveToStorage(STORAGE_KEYS.devices, devicesData);
    saveToStorage(STORAGE_KEYS.scores, scoresData);
    saveToStorage(STORAGE_KEYS.hazards, hazardsData);
    saveToStorage(STORAGE_KEYS.announcements, migrateAnnouncements(announcementsData));
    saveToStorage(STORAGE_KEYS.bookings, bookingsData);
    saveToStorage(STORAGE_KEYS.retrainRecords, [] as RetrainRecord[]);
    saveToStorage(STORAGE_KEYS.initialized, true);
    saveToStorage('schema_version', 'v2');
  } else if (version !== 'v2') {
    const drills = migrateDrills(loadFromStorage<Drill[]>(STORAGE_KEYS.drills, drillsData));
    const anns = migrateAnnouncements(loadFromStorage<Announcement[]>(STORAGE_KEYS.announcements, announcementsData));
    saveToStorage(STORAGE_KEYS.drills, drills);
    saveToStorage(STORAGE_KEYS.announcements, anns);
    saveToStorage('schema_version', 'v2');
    return {
      drills,
      personnel: loadFromStorage<Personnel[]>(STORAGE_KEYS.personnel, personnelData),
      scenarios: loadFromStorage<Scenario[]>(STORAGE_KEYS.scenarios, scenariosData),
      devices: loadFromStorage<Device[]>(STORAGE_KEYS.devices, devicesData),
      scores: loadFromStorage<Score[]>(STORAGE_KEYS.scores, scoresData),
      hazards: loadFromStorage<Hazard[]>(STORAGE_KEYS.hazards, hazardsData),
      announcements: anns,
      bookings: loadFromStorage<DeviceBooking[]>(STORAGE_KEYS.bookings, bookingsData),
      retrainRecords: loadFromStorage<RetrainRecord[]>(STORAGE_KEYS.retrainRecords, []),
    };
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
  activeExecution: DrillExecutionState | null;
  showDrillDetail: Drill | null;

  setShowDrillDetail: (drill: Drill | null) => void;

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
  setActiveExecution: (ex: DrillExecutionState | null) => void;

  startDrillExecution: (drillId: string) => void;
  executionCheckIn: (personnelId: string, deviceId?: string) => void;
  executionSetParticipantResult: (
    personnelId: string,
    result: { escapeTime?: number; errors?: ErrorRecord[]; deviceId?: string; deviceName?: string }
  ) => void;
  executionGenerateScores: () => Score[];

  addDrill: (drill: Omit<Drill, 'id' | 'createdAt' | 'checkedInCount' | 'isArchived'>) => Drill;
  updateDrill: (id: string, drill: Partial<Drill>) => void;
  deleteDrill: (id: string) => void;

  addHazard: (hazard: Omit<Hazard, 'id' | 'status' | 'createdAt'>) => Hazard;
  updateHazard: (id: string, hazard: Partial<Hazard>) => void;
  assignHazard: (id: string, responsibleId: string, responsibleName: string, deadline: string) => void;
  resolveHazard: (id: string) => void;
  verifyHazard: (id: string) => void;

  addAnnouncement: (ann: Omit<Announcement, 'id' | 'publishDate' | 'isRead'>) => Announcement;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementPin: (id: string) => void;
  markAnnouncementRead: (id: string) => void;
  markAllAnnouncementsRead: () => void;

  archiveDrill: (id: string) => void;
  unarchiveDrill: (id: string) => void;

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
    activeExecution: null,
    showDrillDetail: null,

    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setShowDrillDetail: (drill) => set({ showDrillDetail: drill }),
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
    setActiveExecution: (ex) => set({ activeExecution: ex }),

    startDrillExecution: (drillId) => {
      const { drills, personnel, devices } = get();
      const drill = drills.find((d) => d.id === drillId);
      if (!drill) return;
      const participants = drill.participantIds
        .map((pid) => personnel.find((p) => p.id === pid))
        .filter(Boolean) as Personnel[];
      const participantResults = participants.map((p) => ({
        personnelId: p.id,
        personnelName: p.name,
        escapeTime: 0,
        errors: [],
      }));
      const availableDeviceIds = devices.filter((d) => d.status === 'available').map((d) => d.id);
      set({
        activeExecution: {
          drillId,
          step: 'signin',
          checkIns: [],
          participantResults,
          startedAt: formatDateTime(),
        },
      });
      const updatedDevices = devices.map((d, i) =>
        participants[i] && availableDeviceIds.includes(d.id)
          ? { ...d, status: 'in-use' as const, currentUser: participants[i].name }
          : d
      );
      const anyInUse = updatedDevices.some((d, i) => participants[i] && d.status === 'in-use');
      if (anyInUse) {
        set({ devices: updatedDevices });
        persist('devices', updatedDevices);
      }
      const updatedDrills = get().drills.map((d) =>
        d.id === drillId ? { ...d, status: 'ongoing' as const } : d
      );
      set({ drills: updatedDrills });
      persist('drills', updatedDrills);
    },

    executionCheckIn: (personnelId, deviceId) => {
      const ex = get().activeExecution;
      if (!ex) return;
      const person = get().personnel.find((p) => p.id === personnelId);
      let deviceName: string | undefined;
      if (deviceId) {
        const dev = get().devices.find((d) => d.id === deviceId);
        deviceName = dev?.name;
      }
      const already = ex.checkIns.find((c) => c.personnelId === personnelId);
      if (already) return;
      const newCheckIns = [
        ...ex.checkIns,
        { personnelId, personnelName: person?.name || '', deviceId, deviceName, checkedInAt: formatDateTime() },
      ];
      set({
        activeExecution: { ...ex, checkIns: newCheckIns },
      });
      const { drills } = get();
      const updatedDrills = drills.map((d) =>
        d.id === ex.drillId ? { ...d, checkedInCount: newCheckIns.length } : d
      );
      set({ drills: updatedDrills });
      persist('drills', updatedDrills);
    },

    executionSetParticipantResult: (personnelId, result) => {
      const ex = get().activeExecution;
      if (!ex) return;
      const newResults = ex.participantResults.map((r) =>
        r.personnelId === personnelId ? { ...r, ...result } : r
      );
      set({ activeExecution: { ...ex, participantResults: newResults } });
    },

    executionGenerateScores: () => {
      const ex = get().activeExecution;
      if (!ex) return [];
      const drill = get().drills.find((d) => d.id === ex.drillId);
      const newScores: Score[] = ex.participantResults
        .filter((r) => r.escapeTime > 0 || r.errors.length > 0)
        .map((r) => {
          const baseScore = Math.max(0, 100 - r.escapeTime * 0.15 - r.errors.length * 10);
          const totalScore = Math.min(100, Math.round(baseScore));
          const passed = totalScore >= 70;
          return {
            id: genId('sc'),
            personnelId: r.personnelId,
            personnelName: r.personnelName,
            drillId: ex.drillId,
            drillName: drill?.name,
            totalScore,
            escapeTime: r.escapeTime,
            errors: r.errors,
            passed,
            completedAt: formatDateTime(),
            retrainCount: 0,
          };
        });
      if (newScores.length > 0) {
        const scores = [...get().scores, ...newScores];
        set({ scores });
        persist('scores', scores);
      }
      const usedDeviceIds = ex.checkIns.map((c) => c.deviceId).filter(Boolean) as string[];
      if (usedDeviceIds.length > 0) {
        const { devices } = get();
        const updatedDevices = devices.map((d) =>
          usedDeviceIds.includes(d.id)
            ? { ...d, status: 'available' as const, currentUser: undefined, lastUsed: formatDateTime(), usageCount: d.usageCount + 1 }
            : d
        );
        set({ devices: updatedDevices });
        persist('devices', updatedDevices);
      }
      const { drills } = get();
      const updatedDrills = drills.map((d) =>
        d.id === ex.drillId ? { ...d, status: 'completed' as const } : d
      );
      set({ drills: updatedDrills, activeExecution: null });
      persist('drills', updatedDrills);
      return newScores;
    },

    addDrill: (drillData) => {
      const newDrill: Drill = {
        ...drillData,
        id: genId('dr'),
        createdAt: formatDateTime(),
        checkedInCount: 0,
        isArchived: false,
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
        isRead: false,
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
    markAnnouncementRead: (id) => {
      const announcements = get().announcements.map((a) =>
        a.id === id && !a.isRead ? { ...a, isRead: true, readAt: formatDateTime() } : a
      );
      set({ announcements });
      persist('announcements', announcements);
    },
    markAllAnnouncementsRead: () => {
      const announcements = get().announcements.map((a) =>
        !a.isRead ? { ...a, isRead: true, readAt: formatDateTime() } : a
      );
      set({ announcements });
      persist('announcements', announcements);
    },

    archiveDrill: (id) => {
      const drills = get().drills.map((d) =>
        d.id === id ? { ...d, isArchived: true, archivedAt: formatDateTime() } : d
      );
      set({ drills });
      persist('drills', drills);
    },
    unarchiveDrill: (id) => {
      const drills = get().drills.map((d) =>
        d.id === id ? { ...d, isArchived: false, archivedAt: undefined } : d
      );
      set({ drills });
      persist('drills', drills);
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
        isArchived: false,
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
