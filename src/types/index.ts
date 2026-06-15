export interface Drill {
  id: string;
  name: string;
  scenarioId: string;
  scenarioName?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  isArchived: boolean;
  archivedAt?: string;
  participantIds: string[];
  participantCount: number;
  checkedInCount: number;
  deviceIds?: string[];
  createdAt: string;
}

export interface Personnel {
  id: string;
  name: string;
  department: string;
  position: string;
  phone: string;
  avatar: string;
  trainCount: number;
  passRate: number;
  lastTrainDate?: string;
}

export interface EscapeRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  description: string;
}

export interface ExtinguisherStep {
  id: string;
  step: number;
  description: string;
  isCorrect: boolean;
}

export interface SmokeQuestion {
  id: string;
  question: string;
  image: string;
  options: string[];
  correctAnswer: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  coverImage: string;
  escapeRoutes: EscapeRoute[];
  extinguisherSteps: ExtinguisherStep[];
  smokeQuestions: SmokeQuestion[];
}

export interface Device {
  id: string;
  name: string;
  model: string;
  status: 'available' | 'in-use' | 'maintenance' | 'offline';
  location: string;
  lastUsed?: string;
  usageCount: number;
  currentUser?: string;
}

export interface ErrorRecord {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

export interface Score {
  id: string;
  personnelId: string;
  personnelName?: string;
  drillId: string;
  drillName?: string;
  totalScore: number;
  escapeTime: number;
  errors: ErrorRecord[];
  passed: boolean;
  completedAt: string;
  retrainCount: number;
}

export interface Hazard {
  id: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'resolved' | 'verified';
  photoUrl: string;
  responsibleId?: string;
  responsibleName?: string;
  deadline?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'training' | 'notice' | 'warning' | 'info';
  isPinned: boolean;
  isRead: boolean;
  readAt?: string;
  publishDate: string;
  expireDate?: string;
  author: string;
}

export interface DeviceBooking {
  id: string;
  deviceId: string;
  deviceName?: string;
  personnelId: string;
  personnelName: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface HazardAssignmentData {
  responsibleId: string;
  responsibleName: string;
  deadline: string;
}

export interface RetrainRecord {
  id: string;
  originalScoreId: string;
  personnelId: string;
  personnelName: string;
  originalDrillId: string;
  newDrillId: string;
  newDrillName: string;
  reason: string;
  createdAt: string;
}

export interface CheckInRecord {
  personnelId: string;
  personnelName: string;
  checkedInAt: string;
  deviceId?: string;
  deviceName?: string;
}

export interface DrillExecutionState {
  drillId: string;
  step: 'signin' | 'running' | 'scoring' | 'done';
  checkIns: CheckInRecord[];
  participantResults: {
    personnelId: string;
    personnelName: string;
    deviceId?: string;
    deviceName?: string;
    escapeTime: number;
    errors: ErrorRecord[];
    startTime?: string;
  }[];
  startedAt?: string;
  endedAt?: string;
}

export const DEFAULT_ERROR_TYPES = [
  { type: '逃生路线错误', description: '未按照指定逃生路线疏散' },
  { type: '未低姿前行', description: '在烟雾区域未采取低姿或匍匐前进' },
  { type: '灭火器使用错误', description: '灭火器使用步骤错误（拔-瞄-握-压）' },
  { type: '未关闭防火门', description: '逃生后未及时关闭防火门阻断烟雾蔓延' },
  { type: '烟雾识别错误', description: '未能正确识别有毒烟雾类型' },
  { type: '未报警', description: '发现火情未第一时间按下手动报警按钮' },
  { type: '未断电', description: '未及时切断相关区域电源和气源' },
  { type: '乘电梯逃生', description: '火灾情况下错误选择乘坐电梯' },
];

export interface DepartmentStats {
  name: string;
  totalCount: number;
  trainedCount: number;
  passCount: number;
  passRate: number;
}
