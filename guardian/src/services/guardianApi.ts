import apiClient from '../lib/apiClient';
import type {
  ActivityReportResponse,
  AlertListItem,
  AlertListResponse,
  CreateSubjectRequest,
  CreateSubjectResponse,
  DeleteDeviceResponse,
  DeleteSubjectResponse,
  DeviceConnectRequest,
  DeviceConnectResponse,
  FindIdRequest,
  FindIdResponse,
  FindPasswordRequest,
  FindPasswordResponse,
  GuardianOverviewResponse,
  HealthResponse,
  LoginRequest,
  LoginResponse,
  SessionResponse,
  MarkAlertReadResponse,
  SignupRequest,
  SignupResponse,
  SubjectListResponse,
  WithdrawResponse,
} from '../types/dto';

function toError(error: unknown, fallback: string): Error {
  const casted = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return new Error(casted?.response?.data?.message ?? casted?.response?.data?.error ?? casted?.message ?? fallback);
}

async function getFirstSubjectId(): Promise<string | null> {
  const subjects = await getSubjects();
  return subjects.items[0]?.targetId ?? null;
}

function toAlertItem(row: any): AlertListItem {
  return {
    id: String(row.notification_id ?? row.analysis_id),
    analysisId: String(row.analysis_id),
    type: String(row.event_type || 'EVENT'),
    riskLevel: (row.risk_level || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
    title: row.message ? String(row.message) : `${String(row.event_type || 'EVENT')} 알림`,
    description: row.message ? String(row.message) : '분석 결과 알림',
    location: row.channel ? String(row.channel) : 'UNKNOWN',
    occurredAt: String(row.analyzed_at || row.sent_at || new Date().toISOString()),
    isRead: Boolean(row.is_read),
  };
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiClient.get<HealthResponse>('/api/health');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to check health.');
  }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      login_id: String(payload.login_id || '').trim(),
      password: String(payload.password || ''),
    });
    return response.data;
  } catch (error) {
    throw toError(error, 'Login failed.');
  }
}

export async function getMe(): Promise<SessionResponse> {
  try {
    const response = await apiClient.get<SessionResponse>('/api/auth/me', {
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    });
    return response.data;
  } catch (error) {
    throw toError(error, 'Session restore failed.');
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    throw toError(error, 'Logout failed.');
  }
}

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  try {
    const response = await apiClient.post<SignupResponse>('/api/auth/signup', {
      login_id: String(payload.login_id || '').trim(),
      name: String(payload.name || '').trim(),
      password: String(payload.password || ''),
      email: String(payload.email || '').trim(),
      role: payload.role,
    });
    return response.data;
  } catch (error) {
    throw toError(error, 'Signup failed.');
  }
}

export async function findId(payload: FindIdRequest): Promise<FindIdResponse> {
  try {
    const response = await apiClient.post<FindIdResponse>('/api/auth/find-id', payload);
    return response.data;
  } catch (error) {
    throw toError(error, 'Find-id failed.');
  }
}

export async function findPassword(payload: FindPasswordRequest): Promise<FindPasswordResponse> {
  try {
    const response = await apiClient.post<FindPasswordResponse>('/api/auth/find-password', payload);
    return response.data;
  } catch (error) {
    throw toError(error, 'Find-password failed.');
  }
}

export async function withdrawAccount(): Promise<WithdrawResponse> {
  try {
    await apiClient.post('/api/auth/logout');
    return { deleted: true };
  } catch (error) {
    throw toError(error, 'Withdraw failed.');
  }
}

export async function getSubjects(): Promise<SubjectListResponse> {
  try {
    const response = await apiClient.get<{ items: any[] }>('/api/subjects');
    return {
      items: response.data.items.map((item) => ({
        targetId: String(item.subject_id),
        name: String(item.name),
        age: Number(item.age),
        gender: item.gender as 'M' | 'F',
        isDeleted: false,
      })),
    };
  } catch (error) {
    throw toError(error, 'Failed to load subjects.');
  }
}

export async function createSubject(payload: CreateSubjectRequest): Promise<CreateSubjectResponse> {
  try {
    const response = await apiClient.post<{ subject: any }>('/api/subjects', {
      name: payload.name,
      age: payload.age ?? 75,
      gender: payload.gender ?? 'F',
      role: 'MAIN',
    });

    return {
      targetId: String(response.data.subject.subject_id),
      name: String(response.data.subject.name),
      age: Number(response.data.subject.age),
      gender: response.data.subject.gender as 'M' | 'F',
      isDeleted: false,
    };
  } catch (error) {
    throw toError(error, 'Failed to create subject.');
  }
}

export async function connectDevice(payload: DeviceConnectRequest): Promise<DeviceConnectResponse> {
  try {
    const response = await apiClient.post<any>(`/api/subjects/${payload.targetId}/devices`, {
      device_type: 'CAMERA',
      location: payload.serialNumber,
    });

    return {
      deviceId: String(response.data.device_id),
      targetId: String(response.data.subject_id),
      status: (response.data.status || 'OFFLINE') as 'ONLINE' | 'OFFLINE',
      installedAt: String(response.data.created_at || new Date().toISOString()),
    };
  } catch (error) {
    throw toError(error, 'Failed to connect device.');
  }
}

export async function removeSubject(subjectId: string): Promise<DeleteSubjectResponse> {
  try {
    const response = await apiClient.delete<any>(`/api/subjects/${subjectId}`);
    return {
      subjectId: String(response.data.subject_id),
      isDeleted: Boolean(response.data.deleted),
      deletedAt: new Date().toISOString(),
      devicesDeleted: true,
    };
  } catch (error) {
    throw toError(error, 'Failed to delete subject.');
  }
}

export async function removeDevice(deviceId: string): Promise<DeleteDeviceResponse> {
  try {
    const response = await apiClient.delete<any>(`/api/devices/${deviceId}`);
    return {
      deviceId: String(response.data.device_id),
      isDeleted: Boolean(response.data.deleted),
      deletedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw toError(error, 'Failed to delete device.');
  }
}

export async function getAlerts(): Promise<AlertListResponse> {
  try {
    const subjectId = await getFirstSubjectId();
    if (!subjectId) {
      return { items: [] };
    }

    const response = await apiClient.get<{ items: any[] }>(`/api/subjects/${subjectId}/alerts`);
    return { items: response.data.items.map(toAlertItem) };
  } catch (error) {
    throw toError(error, 'Failed to load alerts.');
  }
}

export async function markAlertAsRead(alertId: string): Promise<MarkAlertReadResponse> {
  try {
    const response = await apiClient.patch<any>(`/api/notifications/${alertId}/read`);
    return { alertId: String(response.data.notification_id), isRead: Boolean(response.data.is_read) };
  } catch (error) {
    throw toError(error, 'Failed to mark alert as read.');
  }
}

export async function getOverview(): Promise<GuardianOverviewResponse> {
  try {
    const [subjects, alerts] = await Promise.all([getSubjects(), getAlerts()]);
    const first = subjects.items[0];

    if (!first) {
      return {
        subjectId: '',
        subjectName: '',
        status: 'SAFE',
        deviceStatus: 'OFFLINE',
        lastSeenAt: new Date().toISOString(),
        temperature: 0,
        humidity: 0,
        recentEventCount: 0,
      };
    }

    const envResponse = await apiClient.get<{ items: any[] }>(`/api/subjects/${first.targetId}/env`, {
      params: { limit: 1 },
    });
    const deviceResponse = await apiClient.get<{ items: any[] }>(`/api/subjects/${first.targetId}/devices`);

    const unread = alerts.items.filter((a) => !a.isRead).length;
    const hasHigh = alerts.items.some((a) => a.riskLevel === 'HIGH' && !a.isRead);
    const hasMedium = alerts.items.some((a) => a.riskLevel === 'MEDIUM' && !a.isRead);

    return {
      subjectId: first.targetId,
      subjectName: first.name,
      status: hasHigh ? 'DANGER' : hasMedium ? 'WARNING' : 'SAFE',
      deviceStatus: (deviceResponse.data.items[0]?.status || 'OFFLINE') as 'ONLINE' | 'OFFLINE',
      lastSeenAt: String(deviceResponse.data.items[0]?.last_seen_at || new Date().toISOString()),
      temperature: Number(envResponse.data.items[0]?.temperature ?? 0),
      humidity: Number(envResponse.data.items[0]?.humidity ?? 0),
      recentEventCount: unread,
    };
  } catch (error) {
    throw toError(error, 'Failed to load overview.');
  }
}

export async function getActivityReport(date: string): Promise<ActivityReportResponse> {
  const alerts = await getAlerts();
  const timeline = alerts.items
    .filter((item) => item.occurredAt.slice(0, 10) === date)
    .slice(0, 20)
    .map((item) => ({
      id: item.id,
      time: new Date(item.occurredAt).toTimeString().slice(0, 5),
      title: item.title,
      type: item.riskLevel === 'HIGH' ? 'warning' : item.riskLevel === 'LOW' ? 'success' : 'normal',
    })) as ActivityReportResponse['timeline'];

  const chartMap = new Map<string, number>();
  for (let hour = 0; hour < 24; hour += 3) {
    chartMap.set(String(hour).padStart(2, '0'), 0);
  }

  alerts.items
    .filter((item) => item.occurredAt.slice(0, 10) === date)
    .forEach((item) => {
      const hour = new Date(item.occurredAt).getHours();
      const bucket = String(Math.floor(hour / 3) * 3).padStart(2, '0');
      chartMap.set(bucket, (chartMap.get(bucket) || 0) + 1);
    });

  const chart = Array.from(chartMap.entries()).map(([time, activity]) => ({ time, activity }));

  return { date, timeline, chart };
}

