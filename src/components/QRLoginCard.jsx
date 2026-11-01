import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, ShieldCheck, AlertCircle, Wifi, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
      {/* Top Banner */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20 shadow-inner">
          <Smartphone className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Login dengan vi-token</h2>
        <p className="text-sm text-slate-400 mt-1">
          Buka aplikasi mobile <span className="text-emerald-400 font-semibold">vi-token</span> di ponsel Anda, lalu pindai kode QR di bawah ini.
        </p>
      </div>

      {/* QR Code Container */}
      <div className="relative inline-block p-4 bg-white rounded-2xl shadow-xl transition-all duration-300">
        {loading ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-50 rounded-xl">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
            <span className="text-xs text-slate-500 font-medium">Menghasilkan QR...</span>
          </div>
        ) : error ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center bg-red-50 rounded-xl p-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button
              onClick={initSession}
              className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        ) : secondsLeft <= 0 ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <span className="text-sm font-semibold text-slate-700">QR Kedaluwarsa</span>
            <p className="text-xs text-slate-500 mt-1 mb-3">Masa berlaku QR (120 detik) telah habis.</p>
            <button
              onClick={initSession}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Perbarui QR
            </button>
          </div>
        ) : wsStatus === 'AUTHORIZED' ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center bg-emerald-50 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mb-2" />
            <span className="text-base font-bold text-emerald-800">Scan Berhasil!</span>
            <span className="text-xs text-emerald-600 mt-1">Memuat daftar cabang...</span>
          </div>
        ) : (
          <div className="relative">
            <QRCodeSVG
              value={session?.qr_string || ''}
              size={224}
              level="M"
              includeMargin={false}
              className="rounded-lg"
            />
            {/* Center Pill Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center border border-slate-200">
                <span className="text-xl">💊</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status & Timer Footer */}
      {!loading && !error && secondsLeft > 0 && wsStatus !== 'AUTHORIZED' && (
        <div className="mt-5 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/60 border border-slate-600/50 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Menunggu scan dari vi-token</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Berlaku: <strong className="text-amber-400">{formatTimer(secondsLeft)}</strong></span>
            <button
              onClick={initSession}
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Manual
            </button>
          </div>
        </div>
      )}

      {/* Security Footnote */}
      <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Terenkripsi End-to-End dengan JWT & WebSocket</span>
      </div>
    </div>
  );
}
