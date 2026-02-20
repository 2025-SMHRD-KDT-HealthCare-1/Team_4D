export interface HealthResponse {
  status: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    userId: string;
    name: string;
    email?: string;
    role?: 'GUARDIAN' | 'ADMIN';
  };
}

export interface SignupRequest {
  userId: string;
  name: string;
  password: string;
  email: string;
}

export interface SignupResponse {
  userId: string;
  createdAt: string;
}

export interface FindIdRequest {
  name: string;
  email: string;
}

export interface FindIdResponse {
  userId: string;
}

export interface FindPasswordRequest {
  userId: string;
  name: string;
  email: string;
}

export interface FindPasswordResponse {
  temporaryPasswordIssued: boolean;
}

export interface WithdrawResponse {
  deleted: boolean;
}

export interface GuardianOverviewResponse {
  subjectId: string;
  subjectName: string;
  status: 'SAFE' | 'WARNING' | 'DANGER';
  deviceStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  temperature: number;
  humidity: number;
  recentEventCount: number;
}

export interface AlertListItem {
  id: string;
  type: 'FALL' | 'WANDER' | 'INACTIVITY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  location: string;
  occurredAt: string;
  isRead: boolean;
}

export interface AlertListResponse {
  items: AlertListItem[];
}

export interface MarkAlertReadResponse {
  alertId: string;
  isRead: true;
}

export interface SubjectItem {
  targetId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  isDeleted: boolean;
}

export interface SubjectListResponse {
  items: SubjectItem[];
}

export interface CreateSubjectRequest {
  name: string;
  age?: number;
  gender?: 'M' | 'F';
}

export interface CreateSubjectResponse {
  targetId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  isDeleted: boolean;
}

export interface DeviceConnectRequest {
  targetId: string;
  serialNumber: string;
}

export interface DeviceConnectResponse {
  deviceId: string;
  targetId: string;
  status: 'ONLINE' | 'OFFLINE';
  installedAt: string;
}

export interface DeleteSubjectResponse {
  subjectId: string;
  isDeleted: boolean;
  deletedAt: string;
  devicesDeleted?: boolean;
}

export interface DeleteDeviceResponse {
  deviceId: string;
  isDeleted: boolean;
  deletedAt: string;
}

export interface ActivityReportResponse {
  date: string;
  timeline: Array<{
    id: string;
    time: string;
    title: string;
    type: 'normal' | 'warning' | 'success';
  }>;
  chart: Array<{
    time: string;
    activity: number;
  }>;
}
