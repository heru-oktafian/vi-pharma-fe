import React, { useState, useEffect } from 'react';
import {
  Building2, Pill, ShoppingCart, Package, FileText,
  BarChart3, LogOut, ArrowLeftRight, ShieldCheck, Sun, Moon,
  Database, Settings, Lock, ArrowRight, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { getBranchDetail } from '../services/api';
import MasterDataDashboard from './master/MasterDataDashboard';
import InventoryDashboard from './inventory/InventoryDashboard';

export default function WorkstationDashboard({ user, branch, token, theme = 'dark', onToggleTheme, onSwitchBranch, onLogout, onRemoteLogout }) {
  const [branchDetail, setBranchDetail] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [lockedNotice, setLockedNotice] = useState(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (branch?.id && token) {
      getBranchDetail(branch.id, token)
        .then((data) => setBranchDetail(data))
        .catch((err) => console.error('Failed to load full branch detail:', err));
    }
  }, [branch?.id, token]);

  const modules = [
    {
      id: 'pos',
      title: 'Kasir & Penjualan (POS)',
      desc: 'Transaksi obat bebas (OTC), resep tunai, kelola kas kasir, dan cetak struk penjualan',
      icon: ShoppingCart,
      color: isLight
        ? 'bg-vip-orange-light text-vip-orange border-vip-orange-border'
        : 'bg-orange-500/15 text-orange-400 border-orange-500/25',
      badge: 'Kasir',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'cashier'],
      roleLabels: 'Superadmin, Admin, Apoteker, Kasir'
    },
    {
      id: 'resep',
      title: 'Pelayanan Resep & Farmasi',
      desc: 'Screening klinis resep dokter, peracikan obat puyer/kapsul, etiket aturan pakai, dan copy resep',
      icon: Pill,
      color: isLight
        ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
        : 'bg-token-emerald/15 text-token-emerald border-token-emerald/25',
      badge: 'Apoteker',
      roleAccess: ['superadmin', 'admin', 'pharmacist'],
      roleLabels: 'Superadmin, Admin, Apoteker'
    },
    {
      id: 'gudang',
      title: 'Gudang & Inventori Stok',
      desc: 'Kartu stok digital, pelacakan Nomor Batch & Expired Date (FEFO/FIFO), dan stok opname harian',
      icon: Package,
      color: isLight
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      badge: 'Gudang',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'inventory'],
      roleLabels: 'Superadmin, Admin, Apoteker, Logistik'
    },
    {
      id: 'pengadaan',
      title: 'Pengadaan & Faktur (PBF)',
      desc: 'Surat Pesanan resmi (Reguler, Narkotika, Prekursor SIPA) dan verifikasi faktur PBF masuk',
      icon: FileText,
      color: isLight
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      badge: 'Purchasing',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'inventory'],
      roleLabels: 'Superadmin, Admin, Apoteker, Purchasing'
    },
    {
      id: 'master-data',
      title: 'Master Data Farmasi',
      desc: 'Katalog master obat, nomor NIE BPOM, konversi satuan multi-tingkat, supplier PBF, dan dokter',
      icon: Database,
      color: isLight
        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
        : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      badge: 'Katalog',
      roleAccess: ['superadmin', 'admin', 'pharmacist'],
      roleLabels: 'Superadmin, Admin, Apoteker'
    },
    {
      id: 'laporan',
      title: 'Laporan & Keuangan Cabang',
      desc: 'Omzet harian, laba/rugi cabang, buku kas, serta laporan regulasi resmi SIPNAP Kemenkes',
      icon: BarChart3,
      color: isLight
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      badge: 'Keuangan',
      roleAccess: ['superadmin', 'admin', 'pharmacist'],
      roleLabels: 'Superadmin, Admin, Apoteker'
    },
    {
      id: 'settings',
      title: 'Pengaturan Sistem & User',
      desc: 'Manajemen otorisasi pengguna vi-token, penugasan hak akses role, dan konfigurasi cabang',
      icon: Settings,
      color: isLight
        ? 'bg-slate-100 text-slate-700 border-slate-200'
        : 'bg-slate-700/30 text-slate-300 border-slate-600/30',
      badge: 'Admin Pusat',
      roleAccess: ['superadmin'],
      roleLabels: 'Khusus Superadmin'
    }
  ];

  const handleModuleClick = (moduleItem, isAllowed) => {
    if (!isAllowed) {
      setLockedNotice(`Akses Dibatasi: Modul "${moduleItem.title}" hanya dapat diakses oleh peran: ${moduleItem.roleLabels}. Akun Anda saat ini memiliki peran "${user?.user_role?.toUpperCase()}".`);
      setTimeout(() => setLockedNotice(null), 5000);
      return;
    }
    setActiveModule(moduleItem.id);
  };

  return (
    <div className={`h-screen h-dvh w-screen flex flex-col overflow-hidden transition-colors duration-200 ${
      isLight ? 'bg-vip-navy-light text-slate-800' : 'bg-token-bg text-slate-100'
    }`}>
      {/* Top Navbar (Compact - 52px) */}
      <header className={`h-[52px] shrink-0 border-b px-4 sm:px-6 flex items-center justify-between z-20 transition-colors ${
        isLight
          ? 'bg-white border-vip-navy-border shadow-xs'
          : 'bg-token-card border-token-border shadow-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-8 flex items-center justify-center">
            <img src="/vimedika-logo.png" alt="APOTEK Sistem Informasi" className="h-8 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm sm:text-base font-bold tracking-tight leading-none ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                Vi-<span className={isLight ? 'text-vip-orange' : 'text-token-emerald font-bold'}>Pharma</span>
              </h1>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                isLight
                  ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
                  : 'bg-token-emerald/15 text-token-emerald border-token-emerald/25'
              }`}>
                Workstation
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 leading-none mt-0.5">
              <Building2 className={`w-3 h-3 shrink-0 ${isLight ? 'text-vip-orange' : 'text-token-emerald'}`} />
              <strong className={`truncate max-w-[150px] sm:max-w-xs ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {branch?.branch_name}
              </strong>
              <span className="font-mono text-slate-400">({branch?.branch_code})</span>
            </div>
          </div>
        </div>

        {/* Right: user info + actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
              {user?.name}
            </span>
            <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? 'text-vip-orange' : 'text-token-emerald'}`}>
              {user?.user_role}
            </span>
          </div>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'bg-white hover:bg-vip-orange-light text-vip-navy border-vip-navy-border hover:border-vip-orange hover:text-vip-orange'
                  : 'bg-token-inner hover:bg-slate-700 text-slate-300 border-token-border hover:border-token-emerald'
              }`}
              title={isLight ? 'Ganti ke Dark Mode' : 'Ganti ke Light Mode'}
            >
              {isLight
                ? <Moon className="w-3.5 h-3.5 text-vip-navy" />
                : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          )}

          <button
            onClick={onSwitchBranch}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              isLight
                ? 'bg-white hover:bg-vip-navy-light text-slate-700 border-vip-navy-border hover:text-vip-navy'
                : 'bg-token-inner hover:bg-slate-700 text-slate-300 hover:text-white border-token-border hover:border-token-emerald'
            }`}
            title="Ganti Cabang"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ganti Cabang</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium border border-red-500/20 transition"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-5 flex flex-col gap-2.5 overflow-hidden">
        {activeModule === 'master-data' ? (
          <MasterDataDashboard
            user={user}
            branch={branch}
            token={token}
            theme={theme}
            onBack={() => setActiveModule(null)}
          />
        ) : activeModule === 'gudang' ? (
          <InventoryDashboard
            user={user}
            branch={branch}
            token={token}
            theme={theme}
            onBack={() => setActiveModule(null)}
          />
        ) : activeModule ? (
          <div className={`flex-1 min-h-0 rounded-2xl border p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-auto ${
            isLight ? 'bg-white border-vip-navy-border shadow-md' : 'bg-token-card border-token-border shadow-xl'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
              isLight ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border' : 'bg-token-inner text-token-emerald border-token-border'
            }`}>
              <Clock className="w-7 h-7" />
            </div>
            <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Modul Sedang Dalam Pengerjaan
            </h3>
            <p className={`text-xs max-w-sm mb-5 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Modul <strong className={isLight ? 'text-vip-navy' : 'text-token-emerald'}>{modules.find((m) => m.id === activeModule)?.title}</strong> sedang dalam antrian pengembangan fase berikutnya. Silakan kembali ke menu atau buka modul <strong>Master Data Farmasi</strong>.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModule(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-token-inner hover:bg-slate-700 text-slate-200 border-token-border'
                }`}
              >
                ← Kembali ke Menu Modul
              </button>
              <button
                onClick={() => setActiveModule('master-data')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  isLight
                    ? 'bg-vip-navy hover:bg-vip-navy-dark text-white'
                    : 'bg-token-emerald hover:bg-token-emerald-dark text-slate-950'
                }`}
              >
                Buka Master Data Farmasi →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Branch Info Banner */}
            <div className={`rounded-xl p-2.5 sm:p-3 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 transition-colors ${
              isLight
                ? 'bg-white border border-vip-navy-border border-l-4 border-l-vip-navy shadow-xs text-slate-800'
                : 'bg-token-card border border-token-border shadow-md text-slate-100'
            }`}>
              <div>
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                  isLight ? 'text-vip-navy' : 'text-token-emerald'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Izin Resmi Apotek Terverifikasi
                </div>
                <h2 className={`text-base sm:text-lg font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {branch?.branch_name}
                </h2>
                <p className={`text-[11px] mt-0.5 max-w-2xl line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {branch?.address}
                </p>
              </div>

              {/* Quick Badges */}
              <div className={`grid grid-cols-3 gap-2 text-xs p-2 rounded-lg border shrink-0 ${
                isLight ? 'bg-vip-navy-light border-vip-navy-border' : 'bg-token-inner border-token-border'
              }`}>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">No. SIA</span>
                  <span className={`font-mono text-xs font-bold ${isLight ? 'text-vip-navy' : 'text-slate-200'}`}>
                    {branchDetail?.sia_id || 'SIA-101/2026'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Apoteker (SIPA)</span>
                  <span className={`font-semibold text-xs truncate block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {branchDetail?.sipa_name || 'apt. Hendra, S.Farm'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Status Jurnal</span>
                  <span className={`font-mono text-xs font-bold uppercase ${isLight ? 'text-vip-orange' : 'text-token-emerald'}`}>
                    {branchDetail?.journal_method || 'Perpetual'}
                  </span>
                </div>
              </div>
            </div>

            {/* Locked Notice Alert Banner */}
            {lockedNotice && (
              <div className="shrink-0 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lockedNotice}</span>
                </div>
                <button
                  onClick={() => setLockedNotice(null)}
                  className="text-[10px] font-bold underline shrink-0 hover:text-amber-400"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Module Cards Grid Section */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-1.5 shrink-0">
                <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                  Modul Operasional Cabang
                </h3>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Login Sebagai: <strong className={`font-mono uppercase ${isLight ? 'text-vip-orange font-bold' : 'text-token-emerald font-bold'}`}>{user?.user_role}</strong>
                </span>
              </div>

              {/* Responsive 7-Module Grid */}
              <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto pr-0.5 pb-2">
                {modules.map((m) => {
                  const isAllowed = m.roleAccess.includes(user?.user_role || '');
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleModuleClick(m, isAllowed)}
                      className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                        isAllowed
                          ? isLight
                            ? 'bg-white border-vip-navy-border hover:border-vip-orange hover:shadow-md cursor-pointer group'
                            : 'bg-token-card border-token-border hover:border-token-emerald/80 hover:bg-[#223046] hover:shadow-lg cursor-pointer group'
                          : isLight
                            ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
                            : 'bg-token-card/25 border-token-border/40 opacity-50 cursor-not-allowed select-none'
                      }`}
                    >
                      <div>
                        {/* Header Card: Icon + Status Badge */}
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border ${m.color} ${isAllowed ? 'group-hover:scale-105' : 'grayscale opacity-60'} transition shrink-0`}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>

                          {isAllowed ? (
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                              isLight
                                ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
                                : 'bg-token-inner text-slate-300 border-token-border'
                            }`}>
                              {m.badge}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border bg-slate-200/80 text-slate-600 border-slate-300 dark:bg-slate-800/90 dark:text-slate-400 dark:border-slate-700">
                              <Lock className="w-2.5 h-2.5" /> Dibatasi
                            </span>
                          )}
                        </div>

                        <h4 className={`text-xs sm:text-sm font-bold mb-1 leading-snug transition-colors ${
                          isAllowed
                            ? isLight ? 'text-slate-900 group-hover:text-vip-navy' : 'text-white group-hover:text-token-emerald'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {m.title}
                        </h4>
                        <p className={`text-[10px] sm:text-[11px] leading-relaxed line-clamp-2 ${
                          isAllowed
                            ? isLight ? 'text-slate-500' : 'text-slate-400'
                            : 'text-slate-400/80 dark:text-slate-500/80'
                        }`}>
                          {m.desc}
                        </p>
                      </div>

                      {/* Footer Card: Action / Access Notice */}
                      <div className={`pt-2 mt-2 border-t flex items-center justify-between text-[11px] font-semibold ${
                        isLight ? 'border-vip-navy-border/50' : 'border-token-border/60'
                      }`}>
                        {isAllowed ? (
                          <span className={`flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                            isLight ? 'text-vip-navy group-hover:text-vip-orange font-semibold' : 'text-token-emerald group-hover:text-emerald-300'
                          }`}>
                            Buka Modul →
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <Lock className="w-3 h-3" />
                            <span>Perlu Akses Khusus</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
