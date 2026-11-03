import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateQRSession, checkQRSessionStatus, WS_BASE_URL } from '../services/api';

export default function QRLoginCard({ onAuthorized, theme = 'dark' }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [secondsLeft, setSecondsLeft] = useState(120);

  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const authorizedRef = useRef(false);
  const isLight = theme === 'light';

  const cleanup = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleSuccessAuth = (authData) => {
    if (authorizedRef.current) return;
    authorizedRef.current = true;
    setWsStatus('AUTHORIZED');
    cleanup();

    setTimeout(() => {
      if (onAuthorized) {
        onAuthorized(authData);
      }
    }, 600);
  };

  const initSession = async () => {
    try {
      cleanup();
      authorizedRef.current = false;
      setLoading(true);
      setError(null);
      setWsStatus('CONNECTING');
      setSecondsLeft(120);

      const data = await generateQRSession();
      setSession(data);
      const expiresIn = data.expires_in_seconds || 120;
      setSecondsLeft(expiresIn);
      setLoading(false);

      // 1. Countdown timer
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            cleanup();
            setWsStatus('EXPIRED');
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      // 2. WebSocket listener
      connectWS(data.session_id);

      // 3. Fallback Polling (checks every 2 seconds in case WebSocket fails or is blocked)
      pollRef.current = setInterval(async () => {
        if (authorizedRef.current) return;
        try {
          const statusRes = await checkQRSessionStatus(data.session_id);
          if (statusRes && statusRes.status === 'AUTHORIZED') {
            handleSuccessAuth({
              user: statusRes.user,
              branches: statusRes.branches,
              sessionId: data.session_id,
            });
          }
        } catch (_) {
          // Silent polling error (WS is primary)
        }
      }, 2000);

    } catch (err) {
      cleanup();
      setError(err.message || 'Gagal membuat sesi QR');
      setLoading(false);
    }
  };

  const connectWS = (sessionId) => {
    try {
      const wsUrl = `${WS_BASE_URL}/auth/qr/ws/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!authorizedRef.current) setWsStatus('WAITING');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // Backend sends: { event: "QR_AUTHORIZED", data: { session_id, user, branches } }
          if (msg.event === 'QR_AUTHORIZED' || msg.type === 'QR_AUTHORIZED' || msg.status === 'AUTHORIZED') {
            const payload = msg.data || msg;
            handleSuccessAuth({
              user: payload.user,
              branches: payload.branches,
              sessionId: payload.session_id || sessionId,
            });
          }
        } catch (e) {
          console.error('WS Parse Error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection warning:', err);
      };

      ws.onclose = () => {
        if (!authorizedRef.current && wsStatus !== 'AUTHORIZED') {
          setWsStatus((prev) => (prev === 'AUTHORIZED' ? 'AUTHORIZED' : 'WAITING'));
        }
      };
    } catch (e) {
      console.warn('Failed to establish WebSocket, relying on HTTP polling:', e);
    }
  };

  useEffect(() => {
    initSession();
    return () => cleanup();
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`rounded-2xl p-5 sm:p-6 max-w-xs sm:max-w-sm w-full text-center relative overflow-hidden flex flex-col justify-between transition-all duration-200 border ${
      isLight
        ? 'bg-white border-vip-navy-border shadow-lg text-slate-800'
        : 'bg-token-card border-token-border shadow-2xl text-slate-100'
    }`}>
      {/* Top Banner */}
      <div className="mb-3.5">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 border transition-colors ${
          isLight
            ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
            : 'bg-token-emerald/15 text-token-emerald border-token-emerald/25'
        }`}>
          <Smartphone className="w-5 h-5" />
        </div>
        <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
          Login dengan vi-token
        </h2>
        <p className={`text-xs mt-0.5 leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Buka <span className={`font-semibold ${isLight ? 'text-vip-orange' : 'text-token-emerald'}`}>vi-token</span> di ponsel Anda, lalu pindai QR code berikut.
        </p>
      </div>

      {/* QR Code Container */}
      <div className={`relative inline-block p-2.5 sm:p-3 rounded-xl mx-auto transition-colors ${
        isLight ? 'bg-white border border-vip-navy-border shadow-xs' : 'bg-white shadow-lg'
      }`}>
        {loading ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 rounded-lg">
            <RefreshCw className={`w-7 h-7 animate-spin mb-1.5 ${isLight ? 'text-vip-navy' : 'text-token-emerald'}`} />
            <span className="text-xs text-slate-500 font-medium">Membuat QR...</span>
          </div>
        ) : error ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-red-50 rounded-lg p-2.5 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
            <p className="text-[11px] text-red-600 font-medium line-clamp-3 leading-tight">{error}</p>
            <button onClick={initSession} className="mt-2 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-sm">
              <RefreshCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        ) : secondsLeft <= 0 ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-orange-50 rounded-lg p-2.5 text-center">
            <AlertCircle className="w-8 h-8 mb-1 text-vip-orange" />
            <span className="text-xs font-bold text-slate-700">QR Kedaluwarsa</span>
            <p className="text-[10px] text-slate-500 mt-0.5 mb-2">Masa berlaku 120 detik habis.</p>
            <button
              onClick={initSession}
              className={`px-3 py-1.5 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition ${
                isLight ? 'bg-vip-navy hover:bg-vip-navy-dark' : 'bg-token-emerald hover:bg-token-emerald-dark'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> Perbarui QR
            </button>
          </div>
        ) : wsStatus === 'AUTHORIZED' ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-emerald-50 rounded-lg p-2.5 text-center">
            <CheckCircle2 className="w-10 h-10 animate-bounce mb-1.5 text-token-emerald" />
            <span className="text-sm font-bold text-emerald-800">Scan Berhasil!</span>
            <span className="text-[11px] text-emerald-600 mt-0.5">Memuat cabang...</span>
          </div>
        ) : (
          <div className="relative">
            <QRCodeSVG
              value={session?.qr_string || ''}
              size={176}
              level="M"
              includeMargin={false}
              className="rounded"
              fgColor={isLight ? '#00287E' : '#0F172A'}
            />
            {/* Center Brand Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 bg-white rounded-lg shadow-xs flex items-center justify-center border border-slate-200 p-0.5">
                <img src="/vimedika-logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status & Timer Footer */}
      {!loading && !error && secondsLeft > 0 && wsStatus !== 'AUTHORIZED' && (
        <div className="mt-3.5 space-y-1.5">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
            isLight
              ? 'bg-vip-navy-light border-vip-navy-border text-vip-navy font-medium'
              : 'bg-token-inner border-token-border text-slate-300 font-medium'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLight ? 'bg-vip-navy' : 'bg-token-emerald'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLight ? 'bg-vip-navy' : 'bg-token-emerald'}`}></span>
            </span>
            <span>Menunggu scan vi-token</span>
          </div>

          <div className={`flex items-center justify-between text-[11px] px-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>
              Berlaku: <strong className={`font-mono font-bold ${isLight ? 'text-vip-orange' : 'text-token-emerald'}`}>{formatTimer(secondsLeft)}</strong>
            </span>
            <button
              onClick={initSession}
              className={`flex items-center gap-1 transition text-[11px] ${isLight ? 'text-slate-500 hover:text-vip-orange' : 'text-slate-400 hover:text-token-emerald'}`}
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Security Footnote */}
      <div className={`mt-3.5 pt-2.5 border-t flex items-center justify-center gap-1.5 text-[10px] transition-colors ${
        isLight ? 'border-vip-navy-border text-slate-400' : 'border-token-border text-slate-400'
      }`}>
        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-vip-navy' : 'text-token-emerald'}`} />
        <span>Terenkripsi End-to-End dengan JWT & WebSocket</span>
      </div>
    </div>
  );
}
