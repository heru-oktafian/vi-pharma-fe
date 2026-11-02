import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateQRSession, WS_BASE_URL } from '../services/api';

export default function QRLoginCard({ onAuthorized }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED'); // DISCONNECTED | CONNECTING | CONNECTED | AUTHORIZED

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  const initSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setWsStatus('CONNECTING');

      // 1. Close existing WS if any
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // 2. Fetch new QR session
      const newSession = await generateQRSession();
      setSession(newSession);
      setSecondsLeft(newSession.expires_in_seconds || 120);
      setLoading(false);

      // 3. Connect to WebSocket
      connectWebSocket(newSession.session_id, newSession);

      // 4. Start countdown
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setWsStatus('EXPIRED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Gagal terhubung ke backend Vi-Pharma');
      setLoading(false);
      setWsStatus('DISCONNECTED');
    }
  };

  const connectWebSocket = (sessionId, currentSession) => {
    const wsUrl = `${WS_BASE_URL}/auth/qr/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('CONNECTED');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'QR_AUTHORIZED') {
          setWsStatus('AUTHORIZED');
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Trigger parent callback
          if (onAuthorized) {
            onAuthorized({
              user: msg.data.user,
              branches: msg.data.branches,
              sessionId: sessionId,
            });
          }
        }
      } catch (e) {
        console.error('WS Parse Error:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };

    ws.onclose = () => {
      if (wsStatus !== 'AUTHORIZED') {
        setWsStatus((prev) => (prev === 'AUTHORIZED' ? 'AUTHORIZED' : 'DISCONNECTED'));
      }
    };
  };

  useEffect(() => {
    initSession();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-800/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-5 sm:p-6 max-w-xs sm:max-w-sm w-full text-center relative overflow-hidden flex flex-col justify-between">
      {/* Top Banner (Compact) */}
      <div className="mb-3.5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20 shadow-inner">
          <Smartphone className="w-5 h-5" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Login dengan vi-token</h2>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
          Buka <span className="text-emerald-400 font-semibold">vi-token</span> di ponsel Anda, lalu pindai QR code berikut.
        </p>
      </div>

      {/* QR Code Container (Responsive & Fit) */}
      <div className="relative inline-block p-2.5 sm:p-3 bg-white rounded-xl shadow-lg mx-auto">
        {loading ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 rounded-lg">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mb-1.5" />
            <span className="text-xs text-slate-500 font-medium">Membuat QR...</span>
          </div>
        ) : error ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-red-50 rounded-lg p-2.5 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
            <p className="text-[11px] text-red-600 font-medium line-clamp-3 leading-tight">{error}</p>
            <button
              onClick={initSession}
              className="mt-2 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        ) : secondsLeft <= 0 ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-100 rounded-lg p-2.5 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-1" />
            <span className="text-xs font-bold text-slate-700">QR Kedaluwarsa</span>
            <p className="text-[10px] text-slate-500 mt-0.5 mb-2">Masa berlaku 120 detik habis.</p>
            <button
              onClick={initSession}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> Perbarui QR
            </button>
          </div>
        ) : wsStatus === 'AUTHORIZED' ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-emerald-50 rounded-lg p-2.5 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce mb-1.5" />
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
            />
            {/* Center Pill Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center border border-slate-200">
                <span className="text-base">💊</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status & Timer Footer (Compact) */}
      {!loading && !error && secondsLeft > 0 && wsStatus !== 'AUTHORIZED' && (
        <div className="mt-3.5 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/60 border border-slate-600/50 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Menunggu scan vi-token</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Berlaku: <strong className="text-amber-400 font-mono font-bold">{formatTimer(secondsLeft)}</strong></span>
            <button
              onClick={initSession}
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Security Footnote */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-700/60 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Terenkripsi End-to-End dengan JWT & WebSocket</span>
      </div>
    </div>
  );
}
