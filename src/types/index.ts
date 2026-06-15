export interface Drill {
  id: string;
  name: string;
  scenarioId: string;
  scenarioName?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  participantIds: string[];
  participantCount: number;
  checkedInCount: number;
  deviceIds: string[];
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
  publishDate: string;
  expireDate?: string;
  author: string;
}

export interface DepartmentStats {
  name: string;
  totalCount: number;
  trainedCount: number;
  passCount: number;
  passRate: number;
}
