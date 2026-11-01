const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

export const API_BASE_URL = import.meta.env.VITE_API_URL || `${isHttps ? 'https:' : 'http:'}//${host}:8088/api/v1`;
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || `${isHttps ? 'wss:' : 'ws:'}//${host}:8088/api/v1`;

export async function generateQRSession() {
  const res = await fetch(`${API_BASE_URL}/auth/qr/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal membuat sesi QR');
  }
  return data.data;
}

export async function selectBranch(sessionId, branchId) {
  const res = await fetch(`${API_BASE_URL}/auth/qr/select-branch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, branch_id: branchId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memilih cabang');
  }
  return data.data;
}

export async function checkWorkstation(token) {
  const res = await fetch(`${API_BASE_URL}/workstation/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Sesi workstation tidak valid');
  }
  return data.data;
}

export async function getBranchDetail(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/branches/${branchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memuat data cabang');
  }
  return data.data;
}
