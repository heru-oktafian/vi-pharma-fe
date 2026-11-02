import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import QRLoginCard from './components/QRLoginCard';
import BranchSelector from './components/BranchSelector';
import WorkstationDashboard from './components/WorkstationDashboard';

export default function App() {
  const [step, setStep] = useState('LOGIN'); // 'LOGIN' | 'SELECT_BRANCH' | 'WORKSTATION'
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [webToken, setWebToken] = useState(null);
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

    // Save to localStorage
    localStorage.setItem('vipharma_token', token);
    localStorage.setItem('vipharma_user', JSON.stringify(authedUser));
    localStorage.setItem('vipharma_branch', JSON.stringify(branch));
  };

  // Switch Branch (keeps user logged in if they have more branches)
  const handleSwitchBranch = () => {
    setStep('SELECT_BRANCH');
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setBranches([]);
    setSessionId(null);
    setSelectedBranch(null);
    setWebToken(null);
    setStep('LOGIN');
  };

  const isLight = theme === 'light';

  return (
    <div className={`h-screen h-dvh w-screen flex flex-col justify-between overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#F4F7F6] text-slate-800' : 'bg-slate-950 text-slate-100'
    } selection:bg-vimedika-green selection:text-white`}>
      {step === 'WORKSTATION' ? (
        <WorkstationDashboard
          user={user}
          branch={selectedBranch}
          token={webToken}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchBranch={handleSwitchBranch}
          onLogout={handleLogout}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden">
          {/* Top Floating Theme Switcher */}
          <div className="absolute top-3 right-4 z-30">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 border ${
                isLight 
                  ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200 hover:border-vimedika-green shadow-slate-200' 
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700 shadow-black'
              }`}
              title="Ganti Tema Tampilan"
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[11px]">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-vimedika-orange" />
                  <span className="text-[11px]">Light Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Background Ambient Glow */}
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            isLight ? 'bg-vimedika-green/15' : 'bg-emerald-500/10'
          }`} />
          <div className={`absolute bottom-1/4 left-1/3 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            isLight ? 'bg-vimedika-orange/15' : 'bg-blue-500/10'
          }`} />

          {/* App Header Branding (Compact) */}
          <div className="text-center relative z-10 shrink-0 mt-1 sm:mt-2">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full shadow-sm border transition-colors ${
              isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <img src="/vimedika-logo.png" alt="Vimedika Logo" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className={`font-bold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Vi-Pharma System</span>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                isLight ? 'bg-vimedika-green-light text-vimedika-green-dark' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                v1.0
              </span>
            </div>
            <p className={`text-[11px] mt-1 max-w-xs mx-auto line-clamp-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Sistem Informasi Manajemen Apotek & Jaringan Multi-Cabang
            </p>
          </div>

          {/* Main Card Switcher (Centered & Scaled) */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-0 my-auto py-2">
            {step === 'LOGIN' && (
              <QRLoginCard onAuthorized={handleAuthorized} theme={theme} />
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

          {/* Compact Footer */}
          <footer className={`text-center text-[11px] relative z-10 shrink-0 pb-1 transition-colors ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            © 2026 Vi-Pharma. Powered by <span className={isLight ? 'text-vimedika-green font-semibold' : 'text-slate-400'}>Vimedika</span>.
          </footer>
        </div>
      )}
    </div>
  );
}
