const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8088';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8088/api/v1' : `${protocol}//${host}/api/v1`);
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (isLocalhost ? 'ws://localhost:8088/api/v1' : `${wsProtocol}//${host}/api/v1`);

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: Route backend tidak ditemukan di port ini. Pastikan Caddy me-reverse_proxy /api/* ke port 8088.`);
    }
    throw new Error('Respons backend bukan format JSON yang valid');
  }
}

export async function generateQRSession() {
  const res = await fetch(`${API_BASE_URL}/auth/qr/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal membuat sesi QR');
  }
  return data.data;
}

export async function checkQRSessionStatus(sessionId) {
  const res = await fetch(`${API_BASE_URL}/auth/qr/status/${sessionId}`);
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memeriksa status sesi QR');
  }
  return data.data;
}

export async function selectBranch(sessionId, branchId) {
  const res = await fetch(`${API_BASE_URL}/auth/qr/select-branch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, branch_id: branchId }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memilih cabang');
  }
  return data.data;
}

export async function checkWorkstation(token) {
  const res = await fetch(`${API_BASE_URL}/workstation/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Sesi workstation tidak valid');
  }
  return data.data;
}

export async function getBranchDetail(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/branches/${branchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memuat data cabang');
  }
  return data.data;
}
