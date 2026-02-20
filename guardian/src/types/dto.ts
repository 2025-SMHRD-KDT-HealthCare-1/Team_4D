export interface HealthResponse {
  status: string;
}

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginResponse {
  user: {
    user_id: string;
    login_id: string;
    name: string;
    email: string;
    role: 'GUARDIAN' | 'ADMIN';
    status: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
    created_at: string;
    last_login_at: string | null;
  };
}

export interface SessionResponse {
  authenticated: boolean;
  user: LoginResponse['user'] | null;
}

export interface SignupRequest {
  login_id: string;
  name: string;
  password: string;
  email: string;
  role: 'GUARDIAN' | 'ADMIN';
}

export interface SignupResponse {
  user_id: string;
  login_id: string;
  created_at: string;
  email: string;
  name: string;
  role: 'GUARDIAN' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
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
  analysisId: string;
  type: string;
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
  isRead: boolean;
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
