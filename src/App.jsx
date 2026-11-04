import React, { useState, useEffect } from 'react';
import { Sun, Moon, ShieldAlert, X } from 'lucide-react';
import QRLoginCard from './components/QRLoginCard';
import BranchSelector from './components/BranchSelector';
import WorkstationDashboard from './components/WorkstationDashboard';
import { WS_BASE_URL } from './services/api';

export default function App() {
  const [step, setStep] = useState('LOGIN'); // 'LOGIN' | 'SELECT_BRANCH' | 'WORKSTATION'
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [webToken, setWebToken] = useState(null);
  const [remoteNotice, setRemoteNotice] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('vipharma_theme') || 'dark');

  // Sync theme with DOM and localStorage
  useEffect(() => {
    localStorage.setItem('vipharma_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('vipharma_token');
    const savedUser = localStorage.getItem('vipharma_user');
    const savedBranch = localStorage.getItem('vipharma_branch');

    if (savedToken && savedUser && savedBranch) {
      try {
        setWebToken(savedToken);
        setUser(JSON.parse(savedUser));
        setSelectedBranch(JSON.parse(savedBranch));
        setStep('WORKSTATION');
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  // Called when vi-token scans QR and backend pushes QR_AUTHORIZED
  const handleAuthorized = ({ user: authedUser, branches: userBranches, sessionId: currentSessionId }) => {
    setUser(authedUser);
    setBranches(userBranches);
    setSessionId(currentSessionId);
    setStep('SELECT_BRANCH');
  };

  // Called when user selects a branch from the list
  const handleBranchSelected = (response) => {
    const token = response.token;
    const branch = response.branch;
    const authedUser = response.user;

    setWebToken(token);
    setSelectedBranch(branch);
    setUser(authedUser);
    setStep('WORKSTATION');

    localStorage.setItem('vipharma_token', token);
    localStorage.setItem('vipharma_user', JSON.stringify(authedUser));
    localStorage.setItem('vipharma_branch', JSON.stringify(branch));
  };

  const handleSwitchBranch = () => { setStep('SELECT_BRANCH'); };

  const handleLogout = () => {
    setRemoteNotice(null);
    localStorage.clear();
    setUser(null); setBranches([]); setSessionId(null);
    setSelectedBranch(null); setWebToken(null);
    setStep('LOGIN');
  };

  const handleRemoteLogout = (noticeMsg) => {
    localStorage.clear();
    setUser(null); setBranches([]); setSessionId(null);
    setSelectedBranch(null); setWebToken(null);
    setStep('LOGIN');
    setRemoteNotice(noticeMsg || 'Sesi workstation telah diakhiri secara remote dari aplikasi vi-token. Silakan scan QR ulang untuk masuk kembali.');
  };

  // Real-time Workstation WebSocket connection: listen for remote logout events
  useEffect(() => {
    if (step !== 'WORKSTATION' || !webToken) return;

    let ws = null;
    let pingInterval = null;

    try {
      const wsUrl = `${WS_BASE_URL}/workstation/ws?token=${encodeURIComponent(webToken)}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'REMOTE_LOGOUT') {
            const msg = payload.data?.message || 'Sesi workstation telah diakhiri secara remote dari aplikasi vi-token.';
            handleRemoteLogout(msg);
          }
        } catch (_) {}
      };

      ws.onerror = (err) => {
        console.warn('[Workstation WS] Warning/Error:', err);
      };

      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval);
      };
    } catch (err) {
      console.error('[Workstation WS] Init failed:', err);
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, [step, webToken]);

  const isLight = theme === 'light';

  return (
    <div className={`h-screen h-dvh w-screen flex flex-col justify-between overflow-hidden transition-colors duration-200 ${
      isLight ? 'bg-vip-navy-light text-slate-800' : 'bg-token-bg text-slate-100'
    } selection:bg-vip-navy selection:text-white`}>
      {step === 'WORKSTATION' ? (
        <WorkstationDashboard
          user={user}
          branch={selectedBranch}
          token={webToken}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchBranch={handleSwitchBranch}
          onLogout={handleLogout}
          onRemoteLogout={handleRemoteLogout}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-3 relative overflow-hidden">
          {/* Top Floating Theme Switcher */}
          <div className="absolute top-2.5 right-3.5 z-30">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-xs transition-all duration-150 border ${
                isLight
                  ? 'bg-white hover:bg-vip-orange-light text-slate-700 border-vip-navy-border hover:border-vip-orange hover:text-vip-orange'
                  : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border hover:border-token-emerald'
              }`}
              title="Ganti Tema Tampilan"
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-vip-navy" />
                  <span className="text-[11px] font-semibold text-vip-navy">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold text-slate-300">Light Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Ambient Glows — Dark Mode (Sleek Emerald & Slate) */}
          {!isLight && (
            <>
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-token-emerald/10" />
              <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none bg-slate-800/20" />
            </>
          )}

          {/* App Header Branding — Fixed shrink-0 with guaranteed spacing */}
          <div className="text-center relative z-10 shrink-0 flex flex-col items-center mt-0.5 sm:mt-1">
            <img
              src="/vimedika-logo.png"
              alt="APOTEK Sistem Informasi"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105 duration-200"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full shadow-xs border transition-colors ${
              isLight ? 'bg-white/90 border-vip-navy-border text-slate-800' : 'bg-token-card/90 border-token-border text-white'
            }`}>
              <span className={`font-semibold text-[11px] sm:text-xs tracking-tight ${isLight ? 'text-vip-navy' : 'text-slate-200'}`}>
                Vi-<span className={isLight ? 'text-vip-orange' : 'text-token-emerald font-bold'}>Pharma</span> Workstation
              </span>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                isLight
                  ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
                  : 'bg-token-emerald/15 text-token-emerald border-token-emerald/25'
              }`}>
                v1.0
              </span>
            </div>
          </div>

          {/* Main Card Switcher — Isolated flex-1 without my-auto to eliminate any vertical overflow/overlap */}
          <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center min-h-0 py-1">
            {step === 'LOGIN' && (
              <>
                {remoteNotice && (
                  <div className="w-full max-w-sm mb-2 p-2.5 px-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs shadow-lg backdrop-blur-md flex items-start justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-200 text-xs">Sesi Workstation Diakhiri</div>
                        <p className="text-[11px] text-rose-300/90 mt-0.5 leading-snug">{remoteNotice}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRemoteNotice(null)}
                      className="text-rose-400 hover:text-white shrink-0 p-0.5 rounded transition"
                      title="Tutup pesan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <QRLoginCard onAuthorized={handleAuthorized} theme={theme} />
              </>
            )}
            {step === 'SELECT_BRANCH' && (
              <BranchSelector
                user={user}
                branches={branches}
                sessionId={sessionId}
                onBranchSelected={handleBranchSelected}
                onCancel={handleLogout}
                theme={theme}
              />
            )}
          </div>

          {/* Footer — Fixed shrink-0 with guaranteed non-overlapping clearance */}
          <footer className={`text-center text-[10px] sm:text-[11px] relative z-10 shrink-0 py-1 ${
            isLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
            © 2026 Vi-Pharma — <span className={isLight ? 'text-vip-navy font-semibold' : 'text-token-emerald font-semibold'}>Apotek Sistem Informasi</span>
          </footer>
        </div>
      )}
    </div>
  );
}
