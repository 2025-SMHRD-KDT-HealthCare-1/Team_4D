import apiClient, { clearAccessToken, setAccessToken } from '../lib/apiClient';
import type {
  ActivityReportResponse,
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
    const response = await apiClient.post<LoginResponse>('/api/auth/login', payload);
    setAccessToken(response.data.accessToken);
    return response.data;
  } catch (error) {
    throw toError(error, 'Login failed.');
  }
}

export function logout(): void {
  clearAccessToken();
}

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  try {
    const response = await apiClient.post<SignupResponse>('/api/auth/signup', payload);
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
    const response = await apiClient.delete<WithdrawResponse>('/api/auth/me');
    return response.data;
  } catch (error) {
    throw toError(error, 'Withdraw failed.');
  }
}

export async function getOverview(): Promise<GuardianOverviewResponse> {
  try {
    const response = await apiClient.get<GuardianOverviewResponse>('/api/guardian/overview');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load overview.');
  }
}

export async function getAlerts(): Promise<AlertListResponse> {
  try {
    const response = await apiClient.get<AlertListResponse>('/api/guardian/alerts');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load alerts.');
  }
}

export async function markAlertAsRead(alertId: string): Promise<MarkAlertReadResponse> {
  try {
    const response = await apiClient.patch<MarkAlertReadResponse>(`/api/guardian/alerts/${alertId}/read`);
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to mark alert as read.');
  }
}

export async function getActivityReport(date: string): Promise<ActivityReportResponse> {
  try {
    const response = await apiClient.get<ActivityReportResponse>('/api/guardian/activity', { params: { date } });
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load activity report.');
  }
}

export async function getSubjects(): Promise<SubjectListResponse> {
  try {
    const response = await apiClient.get<SubjectListResponse>('/api/guardian/subjects');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load subjects.');
  }
}

export async function createSubject(payload: CreateSubjectRequest): Promise<CreateSubjectResponse> {
  try {
    const response = await apiClient.post<CreateSubjectResponse>('/api/subjects', payload);
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to create subject.');
  }
}

export async function connectDevice(payload: DeviceConnectRequest): Promise<DeviceConnectResponse> {
  try {
    const response = await apiClient.post<DeviceConnectResponse>('/api/devices', payload);
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to connect device.');
  }
}

export async function removeSubject(subjectId: string): Promise<DeleteSubjectResponse> {
  try {
    const response = await apiClient.delete<DeleteSubjectResponse>(`/api/subjects/${subjectId}`);
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to delete subject.');
  }
}

export async function removeDevice(deviceId: string): Promise<DeleteDeviceResponse> {
  try {
    const response = await apiClient.delete<DeleteDeviceResponse>(`/api/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to delete device.');
  }
}
