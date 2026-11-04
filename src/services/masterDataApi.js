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

  if (!res.ok || (data.success === false)) {
    throw new Error(data.message || `Permintaan gagal (${res.status})`);
  }

  return data.data;
}

// ==========================================
// 1. UNITS (Satuan)
// ==========================================
export async function getUnits(token) {
  return request('/units', { method: 'GET' }, token);
}

export async function createUnit(data, token) {
  return request('/units', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateUnit(id, data, token) {
  return request(`/units/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function deleteUnit(id, token) {
  return request(`/units/${id}`, { method: 'DELETE' }, token);
}

// ==========================================
// 2. CATEGORIES (Kategori Terapi / Farmakologi)
// ==========================================
export async function getCategories(token) {
  return request('/categories', { method: 'GET' }, token);
}

export async function createCategory(data, token) {
  return request('/categories', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateCategory(id, data, token) {
  return request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function deleteCategory(id, token) {
  return request(`/categories/${id}`, { method: 'DELETE' }, token);
}

// ==========================================
// 3. SUPPLIERS (PBF / Distributor)
// ==========================================
export async function getSuppliers(token) {
  return request('/suppliers', { method: 'GET' }, token);
}

export async function createSupplier(data, token) {
  return request('/suppliers', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateSupplier(id, data, token) {
  return request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function deleteSupplier(id, token) {
  return request(`/suppliers/${id}`, { method: 'DELETE' }, token);
}

// ==========================================
// 4. DOCTORS (Dokter & Faskes)
// ==========================================
export async function getDoctors(token) {
  return request('/doctors', { method: 'GET' }, token);
}

export async function createDoctor(data, token) {
  return request('/doctors', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateDoctor(id, data, token) {
  return request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function deleteDoctor(id, token) {
  return request(`/doctors/${id}`, { method: 'DELETE' }, token);
}

// ==========================================
// 5. MEDICINES (Katalog Master Obat & Alkes)
// ==========================================
export async function getMedicines(params = {}, token) {
  let actualParams = params || {};
  let actualToken = token;

  // Handle flexible signature: getMedicines(token, params) or getMedicines(params, token)
  if (typeof params === 'string') {
    actualToken = params;
    actualParams = (token && typeof token === 'object') ? token : {};
  }

  const query = new URLSearchParams();
  if (actualParams.search) query.append('search', actualParams.search);
  if (actualParams.classification) query.append('classification', actualParams.classification);
  if (actualParams.category_id) query.append('category_id', actualParams.category_id);
  if (actualParams.active_only !== undefined) query.append('active_only', actualParams.active_only);
  if (actualParams.page) query.append('page', actualParams.page);
  if (actualParams.limit) query.append('limit', actualParams.limit);

  const qs = query.toString();
  return request(`/medicines${qs ? `?${qs}` : ''}`, { method: 'GET' }, actualToken);
}

export async function getMedicineById(id, token) {
  return request(`/medicines/${id}`, { method: 'GET' }, token);
}

export async function getMedicineByBarcode(barcode, token) {
  return request(`/medicines/barcode/${barcode}`, { method: 'GET' }, token);
}

export async function createMedicine(data, token) {
  return request('/medicines', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateMedicine(id, data, token) {
  return request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function deleteMedicine(id, token) {
  return request(`/medicines/${id}`, { method: 'DELETE' }, token);
}
