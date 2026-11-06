import { API_BASE_URL } from './api';

async function request(endpoint, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    if (!res.ok) {
      throw new Error(`API Error (${res.status}): Server tidak merespons JSON yang valid.`);
    }
    throw new Error('Format respons server tidak valid.');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Permintaan gagal (${res.status})`);
  }

  return data.data;
}

// -------------------------------------------------------------
// User Management
// -------------------------------------------------------------

export async function listUsers(token, page = 1, pageSize = 50) {
  return request(`/users?page=${page}&page_size=${pageSize}`, { method: 'GET' }, token);
}

export async function getUser(token, userId) {
  return request(`/users/${userId}`, { method: 'GET' }, token);
}

export async function createUser(token, payload) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateUser(token, userId, payload) {
  return request(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

// -------------------------------------------------------------
// Branch Management
// -------------------------------------------------------------

export async function listBranches(token, page = 1, pageSize = 50) {
  return request(`/branches?page=${page}&page_size=${pageSize}`, { method: 'GET' }, token);
}

export async function getBranch(token, branchId) {
  return request(`/branches/${branchId}`, { method: 'GET' }, token);
}

export async function createBranch(token, payload) {
  return request('/branches', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateBranch(token, branchId, payload) {
  return request(`/branches/${branchId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function assignUserBranch(token, payload) {
  return request('/branches/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getUserBranches(token, userId) {
  return request(`/branches/user/${userId}`, { method: 'GET' }, token);
}
