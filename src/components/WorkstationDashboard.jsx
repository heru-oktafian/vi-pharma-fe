import React, { useState, useEffect } from 'react';
import {
  Building2, Pill, ShoppingCart, Package, FileText,
  BarChart3, LogOut, ArrowLeftRight, ShieldCheck, Sun, Moon
} from 'lucide-react';
import { getBranchDetail } from '../services/api';

export default function WorkstationDashboard({ user, branch, token, theme = 'dark', onToggleTheme, onSwitchBranch, onLogout }) {
  const [branchDetail, setBranchDetail] = useState(null);
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
      title: 'Pelayanan Resep & Farmasi',
      desc: 'Screening resep dokter, peracikan obat, dan etiket aturan pakai',
      icon: Pill,
      color: isLight
        ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
        : 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      badge: 'Apoteker',
      roleAccess: ['superadmin', 'admin', 'pharmacist']
    },
    {
      title: 'Kasir & Penjualan (POS)',
      desc: 'Transaksi obat bebas (OTC), resep tunai, dan cetak struk penjualan',
      icon: ShoppingCart,
      color: isLight
        ? 'bg-vip-orange-light text-vip-orange border-vip-orange-border'
        : 'bg-orange-500/10 text-orange-300 border-orange-500/20',
      badge: 'Kasir',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'cashier']
    },
    {
      title: 'Gudang & Inventori Obat',
      desc: 'Kartu stok, pelacakan batch & expired date, opname stok harian',
      icon: Package,
      color: isLight
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'Gudang',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'inventory']
    },
    {
      title: 'Pengadaan & Faktur (PBF)',
      desc: 'Surat Pesanan (SP obat/narkotika/prekursor) dan verifikasi faktur masuk',
      icon: FileText,
      color: isLight
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badge: 'Purchasing',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'inventory']
    },
    {
      title: 'Laporan & Keuangan Cabang',
      desc: 'Omzet harian, laporan laba rugi, dan rekonsiliasi kas cabang',
      icon: BarChart3,
      color: isLight
        ? 'bg-slate-100 text-slate-700 border-slate-200'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      badge: 'Manajemen',
      roleAccess: ['superadmin', 'admin']
    }
  ];

  return (
    <div className={`h-screen h-dvh w-screen flex flex-col overflow-hidden transition-colors duration-200 ${
      isLight ? 'bg-vip-navy-light text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Navbar (Compact - 52px) */}
      <header className={`h-[52px] shrink-0 border-b px-4 sm:px-6 flex items-center justify-between z-20 transition-colors ${
        isLight
          ? 'bg-white border-vip-navy-border shadow-xs'
          : 'bg-slate-900/90 border-slate-800 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-8 flex items-center justify-center">
            <img src="/vimedika-logo.png" alt="APOTEK Sistem Informasi" className="h-8 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm sm:text-base font-bold tracking-tight leading-none ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                Vi-<span className="text-vip-orange">Pharma</span>
              </h1>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                isLight
                  ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
              }`}>
                Workstation
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 leading-none mt-0.5">
              <Building2 className={`w-3 h-3 shrink-0 ${isLight ? 'text-vip-orange' : 'text-blue-300'}`} />
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
            <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? 'text-vip-orange' : 'text-blue-300'}`}>
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
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
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
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Ganti Cabang"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ganti Cabang</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 text-xs font-medium border border-red-500/20 transition"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-5 flex flex-col gap-3 overflow-hidden">

        {/* Branch Info Banner */}
        <div className={`rounded-xl p-3 sm:p-3.5 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
          isLight
            ? 'bg-white border border-vip-navy-border border-l-4 border-l-vip-navy shadow-xs text-slate-800'
            : 'bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-800 shadow-md text-slate-100'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
              isLight ? 'text-vip-navy' : 'text-blue-300'
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
            isLight ? 'bg-vip-navy-light border-vip-navy-border' : 'bg-slate-950/60 border-slate-800/80'
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
              <span className={`font-mono text-xs font-bold uppercase ${isLight ? 'text-vip-orange' : 'text-blue-300'}`}>
                {branchDetail?.journal_method || 'Perpetual'}
              </span>
            </div>
          </div>
        </div>

        {/* Module Cards Grid */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
              Modul Operasional Cabang
            </h3>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Role: <strong className={`font-mono ${isLight ? 'text-vip-orange font-bold' : 'text-blue-300'}`}>{user?.user_role}</strong>
            </span>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-0.5">
            {modules.map((m, idx) => {
              const isAllowed = m.roleAccess.includes(user?.user_role || '');
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    isAllowed
                      ? isLight
                        ? 'bg-white border-vip-navy-border hover:border-vip-orange hover:shadow-md cursor-pointer group'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg cursor-pointer group'
                      : isLight
                        ? 'bg-vip-navy-light/50 border-vip-navy-border/50 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900/20 border-slate-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border ${m.color} ${isAllowed ? 'group-hover:scale-105' : ''} transition shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                        isLight
                          ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {m.badge}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold mb-1 leading-snug transition-colors ${
                      isAllowed
                        ? isLight ? 'text-slate-900 group-hover:text-vip-navy' : 'text-white group-hover:text-blue-300'
                        : 'text-slate-400'
                    }`}>
                      {m.title}
                    </h4>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {m.desc}
                    </p>
                  </div>

                  <div className={`pt-2.5 mt-2 border-t flex items-center justify-between text-[11px] font-semibold ${
                    isLight ? 'border-vip-navy-border/50' : 'border-slate-800/80'
                  }`}>
                    {isAllowed ? (
                      <span className={`flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                        isLight ? 'text-vip-navy group-hover:text-vip-orange font-semibold' : 'text-blue-300'
                      }`}>
                        Buka Modul →
                      </span>
                    ) : (
                      <span className="text-slate-400">Akses Dibatasi</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
