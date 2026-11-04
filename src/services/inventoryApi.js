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
// 1. Stock Summaries (3-Level Stock: Gudang, Rak, Total)
// -------------------------------------------------------------
export async function getStockSummaries(token, search = '', branchId = '') {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (branchId) query.set('branch_id', branchId);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/inventory/stock-summary${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getStockSummaryDetail(medicineId, token, branchId = '') {
  return request(`/inventory/stock-summary/${medicineId}`, { method: 'GET' }, token, branchId);
}

// -------------------------------------------------------------
// 2. Stock Transfers (Refill Rak & Return Gudang)
// -------------------------------------------------------------
export async function refillShelf(data, token, branchId = '') {
  return request('/inventory/refill-shelf', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function returnToWarehouse(data, token, branchId = '') {
  return request('/inventory/return-warehouse', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

// -------------------------------------------------------------
// 3. Digital Stock Card (Buku Mutasi Obat)
// -------------------------------------------------------------
export async function getStockCard(medicineId, token, startDate = '', endDate = '', branchId = '') {
  const query = new URLSearchParams();
  if (startDate) query.set('start_date', startDate);
  if (endDate) query.set('end_date', endDate);
  if (branchId) query.set('branch_id', branchId);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/inventory/stock-card/${medicineId}${qStr}`, { method: 'GET' }, token, branchId);
}

// -------------------------------------------------------------
// 4. FEFO & Expiration Watcher
// -------------------------------------------------------------
export async function getFefoAlerts(token, branchId = '') {
  const qStr = branchId ? `?branch_id=${branchId}` : '';
  return request(`/inventory/fefo-alerts${qStr}`, { method: 'GET' }, token, branchId);
}

// -------------------------------------------------------------
// 5. Purchase Invoices (Penerimaan Faktur PBF)
// -------------------------------------------------------------
export async function getPurchaseInvoices(token, page = 1, limit = 20, branchId = '') {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (branchId) query.set('branch_id', branchId);
  return request(`/inventory/invoices?${query.toString()}`, { method: 'GET' }, token, branchId);
}

export async function getPurchaseInvoiceDetail(invoiceId, token) {
  return request(`/inventory/invoices/${invoiceId}`, { method: 'GET' }, token);
}

export async function createPurchaseInvoice(data, token, branchId = '') {
  return request('/inventory/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

// -------------------------------------------------------------
// 6. Rolling Cycle Count (Stok Opname Bergulir)
// -------------------------------------------------------------
export async function getOpnameList(token, page = 1, limit = 20, branchId = '') {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (branchId) query.set('branch_id', branchId);
  return request(`/inventory/opnames?${query.toString()}`, { method: 'GET' }, token, branchId);
}

export async function getOpnameDetail(opnameId, token) {
  return request(`/inventory/opnames/${opnameId}`, { method: 'GET' }, token);
}

export async function createOpnameSession(data, token, branchId = '') {
  return request('/inventory/opnames', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function submitOpnameSession(opnameId, data, token, branchId = '') {
  return request(`/inventory/opnames/${opnameId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}
