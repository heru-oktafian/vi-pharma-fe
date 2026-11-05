import { API_BASE_URL } from './api';

async function request(endpoint, options = {}, token, branchId) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(branchId ? { 'X-Branch-Id': branchId } : {}),
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
// Prescription & Compounding APIs
// -------------------------------------------------------------

export async function createPrescription(data, token, branchId = '') {
  return request('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function getPrescriptions(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (params.is_paid !== undefined && params.is_paid !== null && params.is_paid !== '') {
    query.set('is_paid', String(params.is_paid));
  }
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/prescriptions${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getPrescriptionDetail(id, token, branchId = '') {
  return request(`/prescriptions/${id}`, { method: 'GET' }, token, branchId);
}

export async function updatePrescriptionStatus(id, data, token, branchId = '') {
  return request(`/prescriptions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function dispensePrescription(id, token, branchId = '') {
  return request(`/prescriptions/${id}/dispense`, {
    method: 'POST',
  }, token, branchId);
}
