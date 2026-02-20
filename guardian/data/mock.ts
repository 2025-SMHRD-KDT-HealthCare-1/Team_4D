export type UserRole = 'GUARDIAN' | 'ADMIN';
export type Gender = 'M' | 'F';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type AlertType = 'FALL' | 'WANDER' | 'INACTIVITY';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type TargetStatus = 'SAFE' | 'WARNING' | 'DANGER';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}

export interface Target {
  targetId: string;
  guardianId: string;
  name: string;
  age: number;
  gender: Gender;
  createdAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface Device {
  deviceId: string;
  targetId: string;
  status: DeviceStatus;
  lastSeenAt: string;
  installedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface Alert {
  alertId: string;
  targetId: string;
  deviceId: string;
  alertType: AlertType;
  riskLevel: RiskLevel;
  detectedAt: string;
  isRead: boolean;
  location: string;
  description: string;
}

export interface TargetStatusSummary {
  targetId: string;
  currentStatus: TargetStatus;
  lastActivityAt: string;
  activeAlertCount: number;
}

export interface AggregateStats {
  totalGuardians: number;
  totalTargets: number;
  onlineDevices: number;
  todayAlertCount: number;
}

export interface EnvironmentMetrics {
  temperature: number;
  humidity: number;
  measuredAt: string;
}

export interface ActivityByHour {
  hour: string;
  activity: number;
}

export interface ActivityByDay {
  day: string;
  activity: number;
  inactive: number;
}

export interface DailySummaryStat {
  label: string;
  value: string;
  iconKey: 'activity' | 'inactive' | 'outings';
}

export const users: User[] = [
  {
    userId: 'user-guardian-001',
    name: '김보호',
    email: 'guardian@example.com',
    role: 'GUARDIAN',
    createdAt: '2025-11-10T09:30:00+09:00',
    lastLoginAt: '2026-02-05T08:45:00+09:00',
  },
];

export const targets: Target[] = [
  {
    targetId: 'target-001',
    guardianId: 'user-guardian-001',
    name: '어머니',
    age: 78,
    gender: 'F',
    createdAt: '2025-12-01T10:00:00+09:00',
    isDeleted: false,
    deletedAt: null,
  },
  {
    targetId: 'target-002',
    guardianId: 'user-guardian-001',
    name: '아버지',
    age: 82,
    gender: 'M',
    createdAt: '2025-12-10T09:20:00+09:00',
    isDeleted: false,
    deletedAt: null,
  },
  {
    targetId: 'target-003',
    guardianId: 'user-guardian-001',
    name: '외할머니',
    age: 85,
    gender: 'F',
    createdAt: '2026-01-05T14:40:00+09:00',
    isDeleted: false,
    deletedAt: null,
  },
];

export const devices: Device[] = [
  {
    deviceId: 'device-001',
    targetId: 'target-001',
    status: 'ONLINE',
    lastSeenAt: '2026-02-05T10:02:00+09:00',
    installedAt: '2025-12-05T11:00:00+09:00',
    isDeleted: false,
    deletedAt: null,
  },
  {
    deviceId: 'device-002',
    targetId: 'target-002',
    status: 'ONLINE',
    lastSeenAt: '2026-02-05T09:40:00+09:00',
    installedAt: '2025-12-12T15:30:00+09:00',
    isDeleted: false,
    deletedAt: null,
  },
  {
    deviceId: 'device-003',
    targetId: 'target-003',
    status: 'OFFLINE',
    lastSeenAt: '2026-02-04T23:10:00+09:00',
    installedAt: '2026-01-10T13:20:00+09:00',
    isDeleted: false,
    deletedAt: null,
  },
];

export const alerts: Alert[] = [
  {
    alertId: 'alert-001',
    targetId: 'target-001',
    deviceId: 'device-001',
    alertType: 'FALL',
    riskLevel: 'HIGH',
    detectedAt: '2026-02-04T14:35:00+09:00',
    isRead: false,
    location: '거실',
    description: '낙상이 감지되었습니다. 확인이 필요합니다.',
  },
  {
    alertId: 'alert-002',
    targetId: 'target-001',
    deviceId: 'device-001',
    alertType: 'INACTIVITY',
    riskLevel: 'MEDIUM',
    detectedAt: '2026-02-04T14:15:00+09:00',
    isRead: false,
    location: '침실',
    description: '3시간 이상 움직임이 감지되지 않았습니다.',
  },
  {
    alertId: 'alert-003',
    targetId: 'target-001',
    deviceId: 'device-001',
    alertType: 'WANDER',
    riskLevel: 'LOW',
    detectedAt: '2026-02-04T12:45:00+09:00',
    isRead: true,
    location: '현관',
    description: '정상적인 외출이 감지되었습니다.',
  },
  {
    alertId: 'alert-004',
    targetId: 'target-001',
    deviceId: 'device-001',
    alertType: 'WANDER',
    riskLevel: 'LOW',
    detectedAt: '2026-02-04T11:30:00+09:00',
    isRead: true,
    location: '현관',
    description: '정상적인 귀가가 확인되었습니다.',
  },
  {
    alertId: 'alert-005',
    targetId: 'target-001',
    deviceId: 'device-001',
    alertType: 'INACTIVITY',
    riskLevel: 'MEDIUM',
    detectedAt: '2026-02-03T02:15:00+09:00',
    isRead: true,
    location: '거실',
    description: '심야 시간대에 활동이 감지되었습니다.',
  },
];

export const targetStatuses: TargetStatusSummary[] = [
  {
    targetId: 'target-001',
    currentStatus: 'SAFE',
    lastActivityAt: '2026-02-05T09:58:00+09:00',
    activeAlertCount: 2,
  },
  {
    targetId: 'target-002',
    currentStatus: 'WARNING',
    lastActivityAt: '2026-02-05T08:20:00+09:00',
    activeAlertCount: 1,
  },
  {
    targetId: 'target-003',
    currentStatus: 'DANGER',
    lastActivityAt: '2026-02-04T22:10:00+09:00',
    activeAlertCount: 3,
  },
];

export const aggregateStats: AggregateStats = {
  totalGuardians: 128,
  totalTargets: 312,
  onlineDevices: 297,
  todayAlertCount: 18,
};

export const environmentMetrics: EnvironmentMetrics = {
  temperature: 22,
  humidity: 55,
  measuredAt: '2026-02-05T10:00:00+09:00',
};

export const activityByHour: ActivityByHour[] = [
  { hour: '00시', activity: 0 },
  { hour: '03시', activity: 0 },
  { hour: '06시', activity: 2 },
  { hour: '09시', activity: 8 },
  { hour: '12시', activity: 6 },
  { hour: '15시', activity: 5 },
  { hour: '18시', activity: 7 },
  { hour: '21시', activity: 4 },
];

export const activityByDay: ActivityByDay[] = [
  { day: '월', activity: 45, inactive: 2 },
  { day: '화', activity: 52, inactive: 1 },
  { day: '수', activity: 38, inactive: 3 },
  { day: '목', activity: 48, inactive: 2 },
  { day: '금', activity: 55, inactive: 1 },
  { day: '토', activity: 42, inactive: 4 },
  { day: '일', activity: 35, inactive: 5 },
];

export const dailySummaryStats: DailySummaryStat[] = [
  { label: '활동 시간', value: '6.5시간', iconKey: 'activity' },
  { label: '무활동 시간', value: '2.0시간', iconKey: 'inactive' },
  { label: '외출 횟수', value: '1회', iconKey: 'outings' },
];

export const alertTypeLabelMap = {
  FALL: '낙상 감지',
  WANDER: '이동 감지',
  INACTIVITY: '장시간 무활동 감지',
} as const;

export const alertTypeToNotificationType = {
  FALL: 'fall',
  WANDER: 'movement',
  INACTIVITY: 'activity',
} as const;

export const riskLevelToSeverity = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
} as const;

export const targetStatusToUiStatus = {
  SAFE: 'normal',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

export const deviceStatusToUiStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
} as const;

export const formatRelativeTime = (iso: string) => {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) {
    return iso;
  }

  const now = new Date();
  const diffMs = now.getTime() - time.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return '어제';

  return `${diffDays}일 전`;
};

export const formatTimestamp = (iso: string) => {
  if (!iso.includes('T')) return iso;
  return iso.replace('T', ' ').slice(0, 16);
};
