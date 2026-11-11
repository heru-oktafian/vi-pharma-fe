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

export async function createInitialStockBatch(data, token, branchId = '') {
  return request('/inventory/batches/initial-stock', {
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

// Collaborative Multi-User Opname (Sesi Induk & Setor per Rak)
export async function getActiveParentOpname(token, branchId = '') {
  const qStr = branchId ? `?branch_id=${branchId}` : '';
  return request(`/inventory/opnames/parent/active${qStr}`, { method: 'GET' }, token, branchId);
}

export async function createParentOpnameSession(data, token, branchId = '') {
  return request('/inventory/opnames/parent', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function closeParentOpnameSession(opnameId, token, branchId = '') {
  return request(`/inventory/opnames/parent/${opnameId}/close`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, token, branchId);
}

export async function getOpnameRackDetail(opnameId, rackId, token, branchId = '') {
  return request(`/inventory/opnames/parent/${opnameId}/racks/${rackId}`, { method: 'GET' }, token, branchId);
}

export async function approveOpnameRack(opnameId, rackId, token, branchId = '') {
  return request(`/inventory/opnames/parent/${opnameId}/approve-rack/${rackId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, token, branchId);
}

export async function rejectOpnameRack(opnameId, rackId, data, token, branchId = '') {
  return request(`/inventory/opnames/parent/${opnameId}/reject-rack/${rackId}`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }, token, branchId);
}

// -------------------------------------------------------------
// 7. Accounts Payable & Invoice Payments (Hutang Faktur PBF)
// -------------------------------------------------------------
export async function getAccountsPayableSummary(token, branchId = '') {
  const qStr = branchId ? `?branch_id=${branchId}` : '';
  return request(`/inventory/accounts-payable/summary${qStr}`, { method: 'GET' }, token, branchId);
}

export async function getAccountsPayableInvoices(token, params = {}, branchId = '') {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.supplier_id) query.set('supplier_id', params.supplier_id);
  if (params.status) query.set('status', params.status);
  if (params.is_overdue) query.set('is_overdue', 'true');
  if (params.due_soon) query.set('due_soon', 'true');
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (branchId) query.set('branch_id', branchId);

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/inventory/accounts-payable/invoices${qStr}`, { method: 'GET' }, token, branchId);
}

export async function recordInvoicePayment(invoiceId, data, token, branchId = '') {
  return request(`/inventory/invoices/${invoiceId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token, branchId);
}

export async function getInvoicePayments(invoiceId, token) {
  return request(`/inventory/invoices/${invoiceId}/payments`, { method: 'GET' }, token);
}
