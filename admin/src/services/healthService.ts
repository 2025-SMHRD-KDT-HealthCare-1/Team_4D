import apiClient from '../lib/apiClient';

export async function fetchHealth() {
  const response = await apiClient.get('/api/health');
  return response.data;
}
