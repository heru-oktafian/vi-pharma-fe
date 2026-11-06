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
// Reports & Financial Analytics
// -------------------------------------------------------------

export async function getStaffPerformanceReport(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (params.daily_margin_target !== undefined && params.daily_margin_target !== null) {
    query.set('daily_margin_target', String(params.daily_margin_target));
  }
  if (params.daily_bonus_reward !== undefined && params.daily_bonus_reward !== null) {
    query.set('daily_bonus_reward', String(params.daily_bonus_reward));
  }
  if (params.bonus_pool !== undefined && params.bonus_pool !== null) {
    query.set('bonus_pool', String(params.bonus_pool));
  }
  if (params.target_margin !== undefined && params.target_margin !== null) {
    query.set('target_margin', String(params.target_margin));
  }
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/reports/staff-performance${qStr}`, { method: 'GET' }, token, branchId);
}

export async function updateBranchBonusSetting(token, branchId = '', payload = {}) {
  return request('/reports/branch-bonus-setting', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token, branchId);
}

export async function getSalesSummaryReport(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/reports/sales-summary${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getCategoryMarginsReport(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/reports/category-margins${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getSIPNAPReport(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.month) query.set('month', String(params.month));
  if (params.year) query.set('year', String(params.year));
  if (params.classification) query.set('classification', params.classification);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/reports/sipnap${qStr}`, { method: 'GET' }, token, branchId);
}

