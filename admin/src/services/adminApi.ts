import apiClient from '../lib/apiClient';
import type {
  AdminDeviceListResponse,
  AdminEventListResponse,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminSessionResponse,
  AdminOverviewResponse,
  AdminStatisticsResponse,
  AdminTargetListResponse,
  FalsePositiveReportResponse,
} from '../types/dto';

function toError(error: unknown, fallback: string): Error {
  const casted = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return new Error(casted?.response?.data?.message ?? casted?.response?.data?.error ?? casted?.message ?? fallback);
}

export async function adminLogin(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
  try {
    const response = await apiClient.post<AdminLoginResponse>('/api/auth/login', {
      login_id: String(payload.login_id || '').trim(),
      password: String(payload.password || ''),
    });
    return response.data;
  } catch (error) {
    throw toError(error, 'Login failed.');
  }
}

export async function getMe(): Promise<AdminSessionResponse> {
  try {
    const response = await apiClient.get<AdminSessionResponse>('/api/auth/me', {
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    });
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to restore session.');
  }
}

export async function adminLogout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    throw toError(error, 'Logout failed.');
  }
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  try {
    const response = await apiClient.get<AdminOverviewResponse>('/api/admin/overview');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load admin overview.');
  }
}

export async function getAdminEvents(): Promise<AdminEventListResponse> {
  try {
    const response = await apiClient.get<AdminEventListResponse>('/api/admin/events');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load admin events.');
  }
}

export async function getAdminTargets(): Promise<AdminTargetListResponse> {
  try {
    const response = await apiClient.get<AdminTargetListResponse>('/api/admin/targets');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load admin targets.');
  }
}

export async function getAdminDevices(): Promise<AdminDeviceListResponse> {
  try {
    const response = await apiClient.get<AdminDeviceListResponse>('/api/admin/devices');
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load admin devices.');
  }
}

export async function getAdminStatistics(period: 'day' | 'week' | 'month'): Promise<AdminStatisticsResponse> {
  try {
    const response = await apiClient.get<AdminStatisticsResponse>('/api/admin/statistics', { params: { period } });
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to load admin statistics.');
  }
}

export async function reportFalsePositive(alertId: string, reason: string): Promise<FalsePositiveReportResponse> {
  try {
    const response = await apiClient.post<FalsePositiveReportResponse>(`/api/admin/events/${alertId}/false-positive`, {
      reason,
    });
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to report false positive.');
  }
}

export async function deleteTarget(subjectId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/subjects/${subjectId}`);
  } catch (error) {
    throw toError(error, 'Failed to delete target.');
  }
}

export async function deleteDevice(deviceId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/devices/${deviceId}`);
  } catch (error) {
    throw toError(error, 'Failed to delete device.');
  }
}

export async function createTarget(payload: { name: string; age: number; gender: 'M' | 'F' }): Promise<void> {
  try {
    await apiClient.post('/api/subjects', payload);
  } catch (error) {
    throw toError(error, 'Failed to create target.');
  }
}

export async function connectDevice(payload: { targetId: string; serialNumber: string }): Promise<void> {
  try {
    await apiClient.post('/api/devices', payload);
  } catch (error) {
    throw toError(error, 'Failed to connect device.');
  }
}
