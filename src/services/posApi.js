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
// POS Cashier Transactions
// -------------------------------------------------------------

export async function createSaleTransaction(data, token, branchId = '') {
  return request('/pos/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function getSalesHistory(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.payment_method) query.set('payment_method', params.payment_method);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/pos/transactions${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getSaleDetail(id, token, branchId = '') {
  return request(`/pos/transactions/${id}`, { method: 'GET' }, token, branchId);
}

export async function getTodaySummary(token, branchId = '') {
  const qStr = branchId ? `?branch_id=${branchId}` : '';
  return request(`/pos/summary-today${qStr}`, { method: 'GET' }, token, branchId);
}

// -------------------------------------------------------------
// Customer Sales Returns (Retur Penjualan Pasien)
// -------------------------------------------------------------

export async function getSaleReturnableInfo(saleId, token, branchId = '') {
  const qStr = branchId ? `?branch_id=${branchId}` : '';
  return request(`/pos/sales/${saleId}/returnable${qStr}`, { method: 'GET' }, token, branchId);
}

export async function createSalesReturn(data, token, branchId = '') {
  return request('/pos/returns', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function getSalesReturns(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.refund_type) query.set('refund_type', params.refund_type);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/pos/returns${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getSalesReturnDetail(returnId, token, branchId = '') {
  const qStr = branchId ? `?branch_id=${branchId}` : '';
  return request(`/pos/returns/${returnId}${qStr}`, { method: 'GET' }, token, branchId);
}
