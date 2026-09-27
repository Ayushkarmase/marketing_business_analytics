const API_BASE_URL = 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers: options.body instanceof FormData ? undefined : headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'API Request Failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Auth
  getCurrentUser: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getUsers: () => request('/auth/users'),
  switchRole: (role) => request('/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),

  // Business & Data Sources
  getCurrentBusiness: () => request('/business/current'),
  setupBusiness: (bizData) => request('/business/setup', { method: 'POST', body: JSON.stringify(bizData) }),
  getDataSources: () => request('/datasources'),
  connectDataSource: (id, credentials = {}) => request(`/datasources/${id}/connect`, { method: 'POST', body: JSON.stringify(credentials) }),
  disconnectDataSource: (id) => request(`/datasources/${id}/disconnect`, { method: 'POST' }),
  syncDataSourceNow: (id) => request(`/datasources/${id}/sync`, { method: 'POST' }),
  getSyncLogs: () => request('/datasources/sync-logs'),
  uploadCSV: (formData) => request('/datasources/upload-csv', { method: 'POST', body: formData }),

  // Analytics
  getSalesSummary: (days = 30) => request(`/analytics/sales/summary?days=${days}`),
  getSalesTrend: (days = 30) => request(`/analytics/sales/trend?days=${days}`),
  getProductPerformance: (limit = 10) => request(`/analytics/sales/products?limit=${limit}`),
  getCustomerOverview: () => request('/analytics/customers/overview'),
  getCampaignSummary: () => request('/analytics/campaigns/summary'),
  getCampaignComparison: () => request('/analytics/campaigns/comparison'),
  getTrafficSources: () => request('/analytics/web/traffic-sources'),
  getRealtimeMetrics: () => request('/analytics/web/realtime'),
  getFunnel: () => request('/analytics/funnel'),

  // Machine Learning
  getSegmentation: (k) => request(`/ml/segmentation${k ? `?k=${k}` : ''}`),
  runSegmentation: (k) => request('/ml/segmentation', { method: 'POST', body: JSON.stringify({ k }) }),
  getForecast: (model = 'RandomForest', horizon = 14) => request(`/ml/forecast?model=${model}&horizon=${horizon}`),
  runForecast: (model, horizon) => request('/ml/forecast', { method: 'POST', body: JSON.stringify({ model, horizon }) }),

  // Reports & Insights
  getExecutiveReport: () => request('/reports/summary'),
  getActionableInsights: () => request('/reports/actionable-insights')
};
