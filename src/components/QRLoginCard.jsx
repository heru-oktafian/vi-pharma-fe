import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateQRSession, WS_BASE_URL } from '../services/api';

export default function QRLoginCard({ onAuthorized, theme = 'dark' }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED'); // DISCONNECTED | CONNECTING | CONNECTED | AUTHORIZED

  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const isLight = theme === 'light';

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
    <div className={`rounded-2xl p-5 sm:p-6 max-w-xs sm:max-w-sm w-full text-center relative overflow-hidden flex flex-col justify-between transition-all duration-200 border ${
      isLight 
        ? 'bg-white border-blue-100 shadow-md text-slate-800' 
        : 'bg-slate-800/85 backdrop-blur-xl border-slate-700/60 shadow-2xl text-slate-100'
    }`}>
      {/* Top Banner (Compact) */}
      <div className="mb-3.5">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 border transition-colors ${
          isLight
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          <Smartphone className="w-5 h-5" />
        </div>
        <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Login dengan vi-token
        </h2>
        <p className={`text-xs mt-0.5 leading-snug ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          Buka <span className={`font-semibold ${isLight ? 'text-blue-600' : 'text-emerald-400'}`}>vi-token</span> di ponsel Anda, lalu pindai QR code berikut.
        </p>
      </div>

      {/* QR Code Container (Responsive & Fit) */}
      <div className={`relative inline-block p-2.5 sm:p-3 rounded-xl mx-auto transition-colors ${
        isLight ? 'bg-white border border-slate-200 shadow-xs' : 'bg-white shadow-lg'
      }`}>
        {loading ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 rounded-lg">
            <RefreshCw className={`w-7 h-7 animate-spin mb-1.5 ${isLight ? 'text-blue-600' : 'text-emerald-600'}`} />
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
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2.5 text-center">
            <AlertCircle className="w-8 h-8 mb-1 text-orange-500" />
            <span className="text-xs font-bold text-slate-700">QR Kedaluwarsa</span>
            <p className="text-[10px] text-slate-500 mt-0.5 mb-2">Masa berlaku 120 detik habis.</p>
            <button
              onClick={initSession}
              className={`px-3 py-1.5 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-all duration-200 ${
                isLight 
                  ? 'bg-blue-600 hover:bg-orange-500' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> Perbarui QR
            </button>
          </div>
        ) : wsStatus === 'AUTHORIZED' ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2.5 text-center">
            <CheckCircle2 className={`w-10 h-10 animate-bounce mb-1.5 ${isLight ? 'text-blue-600' : 'text-emerald-500'}`} />
            <span className={`text-sm font-bold ${isLight ? 'text-blue-700' : 'text-emerald-800'}`}>Scan Berhasil!</span>
            <span className="text-[11px] text-blue-600 mt-0.5">Memuat cabang...</span>
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
            {/* Center Brand Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 bg-white rounded-lg shadow-xs flex items-center justify-center border border-slate-200">
                <img src="/vimedika-logo.png" alt="Logo" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status & Timer Footer (Compact) */}
      {!loading && !error && secondsLeft > 0 && wsStatus !== 'AUTHORIZED' && (
        <div className="mt-3.5 space-y-1.5">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
            isLight
              ? 'bg-blue-50/70 border-blue-100 text-blue-900 font-medium'
              : 'bg-slate-700/60 border-slate-600/50 text-slate-300 font-medium'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLight ? 'bg-blue-600' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isLight ? 'bg-blue-600' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span>Menunggu scan vi-token</span>
          </div>

          <div className={`flex items-center justify-between text-[11px] px-1 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>
              Berlaku: <strong className={`font-mono font-bold ${
                isLight ? 'text-orange-500' : 'text-amber-400'
              }`}>{formatTimer(secondsLeft)}</strong>
            </span>
            <button
              onClick={initSession}
              className={`flex items-center gap-1 transition text-[11px] ${
                isLight ? 'text-slate-500 hover:text-orange-500' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Security Footnote */}
      <div className={`mt-3.5 pt-2.5 border-t flex items-center justify-center gap-1.5 text-[10px] transition-colors ${
        isLight ? 'border-slate-100 text-slate-400' : 'border-slate-700/60 text-slate-400'
      }`}>
        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-blue-600' : 'text-emerald-400'}`} />
        <span>Terenkripsi End-to-End dengan JWT & WebSocket</span>
      </div>
    </div>
  );
}
