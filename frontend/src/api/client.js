const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Token storage helpers
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('authcore_access_token'),
  getRefreshToken: () => localStorage.getItem('authcore_refresh_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('authcore_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setTokens: (accessToken, refreshToken, user) => {
    if (accessToken) localStorage.setItem('authcore_access_token', accessToken);
    if (refreshToken) localStorage.setItem('authcore_refresh_token', refreshToken);
    if (user) localStorage.setItem('authcore_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('authcore_access_token');
    localStorage.removeItem('authcore_refresh_token');
    localStorage.removeItem('authcore_user');
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Main fetch wrapper with auto-retry on 401
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new ApiError(`Network connection failed: ${netErr.message}`, 0, null);
  }

  // Handle 401 with Token Rotation
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('authcore_logout'));
      throw new ApiError('Session expired. Please log in again.', 401, null);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers }).then(r => r.json());
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.data?.accessToken) {
        throw new Error('Refresh failed');
      }

      const newAccess = refreshData.data.accessToken;
      const newRefresh = refreshData.data.refreshToken;
      tokenStorage.setTokens(newAccess, newRefresh);
      processQueue(null, newAccess);

      headers['Authorization'] = `Bearer ${newAccess}`;
      const retryRes = await fetch(url, { ...options, headers });
      return handleResponse(retryRes);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      tokenStorage.clear();
      window.dispatchEvent(new Event('authcore_logout'));
      throw new ApiError('Your session has expired. Please log in again.', 401, null);
    } finally {
      isRefreshing = false;
    }
  }

  return handleResponse(response);
}

async function handleResponse(response) {
  let json;
  try {
    json = await response.json();
  } catch {
    json = { message: response.statusText };
  }

  if (!response.ok) {
    const msg = json.message || json.error || `Request failed with status ${response.status}`;
    throw new ApiError(msg, response.status, json);
  }

  return json;
}

// Complete API Methods
export const authApi = {
  login: (email, password) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getCurrentUser: () =>
    apiRequest('/auth/me'),

  logout: (refreshToken) =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }),

  logoutAll: () =>
    apiRequest('/auth/logout-all', {
      method: 'POST'
    }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (token, newPassword) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    }),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  getHealth: () =>
    apiRequest('/health')
};

export const usersApi = {
  getUsers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', params.page);
    if (params.size !== undefined) q.set('size', params.size);
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    return apiRequest(`/users?${q.toString()}`);
  },

  getUserById: (id) =>
    apiRequest(`/users/${id}`),

  updateProfile: (id, payload) =>
    apiRequest(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  updateStatus: (id, status) =>
    apiRequest(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getUserSessions: (id) =>
    apiRequest(`/users/${id}/sessions`),

  revokeSession: (id, sessionId) =>
    apiRequest(`/users/${id}/sessions/${sessionId}`, {
      method: 'DELETE'
    }),

  getUserAuditLogs: (id, params = {}) => {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', params.page);
    if (params.size !== undefined) q.set('size', params.size);
    return apiRequest(`/users/${id}/audit-logs?${q.toString()}`);
  },

  assignRole: (id, roleName) =>
    apiRequest(`/users/${id}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleName })
    }),

  removeRole: (id, roleId) =>
    apiRequest(`/users/${id}/roles/${roleId}`, {
      method: 'DELETE'
    }),

  deleteUser: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE'
    })
};

export const rolesApi = {
  getRoles: () =>
    apiRequest('/roles'),

  getRoleById: (id) =>
    apiRequest(`/roles/${id}`),

  createRole: (payload) =>
    apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateRole: (id, payload) =>
    apiRequest(`/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  deleteRole: (id) =>
    apiRequest(`/roles/${id}`, {
      method: 'DELETE'
    })
};
