export interface AdminLoginRequest {
  userId: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  user: {
    userId: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'GUARDIAN';
  };
}

export interface AdminOverviewResponse {
  totalGuardians: number;
  totalTargets: number;
  totalDevices: number;
  onlineDevices: number;
  todayAlertCount: number;
  highRiskAlertCount: number;
  alertFailureCount: number;
  errorDevices: number;
  offlineDevices: number;
}

export interface AdminEventHistoryItem {
  at: string;
  status: 'UNCONFIRMED' | 'CONFIRMED' | 'RESOLVED';
  note: string;
}

export interface AdminEventItem {
  alertId: string;
  targetId: string;
  deviceId: string;
  alertType: 'FALL' | 'WANDER' | 'INACTIVITY';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedAt: string;
  isRead: boolean;
  status: 'UNCONFIRMED' | 'CONFIRMED' | 'RESOLVED';
  description: string;
  targetName: string;
  memo: string;
  guardianNotified: boolean;
  history: AdminEventHistoryItem[];
}

export interface AdminEventListResponse {
  items: AdminEventItem[];
}

export interface AdminTargetEventHistoryItem {
  id: string;
  type: 'FALL' | 'WANDER' | 'INACTIVITY';
  at: string;
  status: 'UNCONFIRMED' | 'CONFIRMED' | 'RESOLVED';
}

export interface AdminTargetItem {
  targetId: string;
  guardianId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  createdAt: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  currentStatus: 'SAFE' | 'WARNING' | 'DANGER';
  lastActivityAt: string;
  activeAlertCount: number;
  lastEventSummary: string;
  imageUrl: string;
  notes: string;
  isActive: boolean;
  guardianLinked: boolean;
  riskCriteria: string;
  eventHistory: AdminTargetEventHistoryItem[];
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface AdminTargetListResponse {
  items: AdminTargetItem[];
}

export interface AdminDeviceEventStat {
  type: 'FALL' | 'WANDER' | 'INACTIVITY';
  count: number;
}

export interface AdminDeviceErrorHistory {
  at: string;
  code: string;
  detail: string;
}

export interface AdminDeviceItem {
  deviceId: string;
  targetId: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  installedAt: string;
  targetName: string;
  cameraCount: number;
  firmware: string;
  uptime: string;
  deviceHealth: 'OK' | 'ERROR';
  errorHistory: AdminDeviceErrorHistory[];
  eventStats: AdminDeviceEventStat[];
  restartRequestedAt?: string | null;
  isRegistered: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface AdminDeviceListResponse {
  items: AdminDeviceItem[];
}

export interface AdminStatisticsResponse {
  period: 'day' | 'week' | 'month';
  timeData: Array<{ time: string; events: number }>;
  typeData: Array<{ name: 'FALL' | 'WANDER' | 'INACTIVITY'; value: number }>;
  trendData: Array<{ label: string; fall: number; wander: number; inactivity: number }>;
  errorData: Array<{ name: string; value: number }>;
  targetStats: Array<{ id: string; name: string; total: number; highRisk: number; devices: number }>;
}

export interface FalsePositiveReportResponse {
  alertId: string;
  reported: boolean;
  reason: string;
  reportedAt: string;
}
