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
// Purchase Orders / Surat Pesanan (SP)
// -------------------------------------------------------------

export async function getPurchaseOrders(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.supplier_id) query.set('supplier_id', params.supplier_id);
  if (params.sp_type) query.set('sp_type', params.sp_type);
  if (params.status) query.set('status', params.status);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/procurement/orders${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getPurchaseOrderDetail(id, token) {
  return request(`/procurement/orders/${id}`, { method: 'GET' }, token);
}

export async function createPurchaseOrder(data, token, branchId = '') {
  return request('/procurement/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function updatePurchaseOrder(id, data, token, branchId = '') {
  return request(`/procurement/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function updatePOStatus(id, status, notes = '', token, branchId = '') {
  return request(`/procurement/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  }, token, branchId);
}

export async function deletePurchaseOrder(id, token, branchId = '') {
  return request(`/procurement/orders/${id}`, {
    method: 'DELETE',
  }, token, branchId);
}
