import React, { useState, useEffect } from 'react';
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

  return (
    <div className="h-screen h-dvh w-screen bg-slate-950 flex flex-col justify-between overflow-hidden selection:bg-emerald-500 selection:text-white">
      {step === 'WORKSTATION' ? (
        <WorkstationDashboard
          user={user}
          branch={selectedBranch}
          token={webToken}
          onSwitchBranch={handleSwitchBranch}
          onLogout={handleLogout}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* App Header Branding (Compact) */}
          <div className="text-center relative z-10 shrink-0 mt-1 sm:mt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 shadow-md">
              <span className="text-base">💊</span>
              <span className="font-bold text-white text-sm tracking-tight">Vi-Pharma System</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto line-clamp-1">
              Sistem Informasi Manajemen Apotek & Jaringan Multi-Cabang
            </p>
          </div>

          {/* Main Card Switcher (Centered & Scaled) */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-0 my-auto py-2">
            {step === 'LOGIN' && (
              <QRLoginCard onAuthorized={handleAuthorized} />
            )}

            {step === 'SELECT_BRANCH' && (
              <BranchSelector
                user={user}
                branches={branches}
                sessionId={sessionId}
                onBranchSelected={handleBranchSelected}
                onCancel={handleLogout}
              />
            )}
          </div>

          {/* Compact Footer */}
          <footer className="text-center text-[11px] text-slate-500 relative z-10 shrink-0 pb-1">
            © 2026 Vi-Pharma. Terhubung dengan Ekosistem <span className="text-slate-400">vi-token</span>.
          </footer>
        </div>
      )}
    </div>
  );
}
