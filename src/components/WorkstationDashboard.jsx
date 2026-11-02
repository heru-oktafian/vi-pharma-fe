import React, { useState, useEffect } from 'react';
import { 
  Building2, Pill, ShoppingCart, Package, FileText, 
  BarChart3, LogOut, ArrowLeftRight, ShieldCheck 
} from 'lucide-react';
import { getBranchDetail } from '../services/api';

export default function WorkstationDashboard({ user, branch, token, onSwitchBranch, onLogout }) {
  const [branchDetail, setBranchDetail] = useState(null);

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
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'Apoteker',
      roleAccess: ['superadmin', 'admin', 'pharmacist']
    },
    {
      title: 'Kasir & Penjualan (POS)',
      desc: 'Transaksi obat bebas (OTC), resep tunai, dan cetak struk penjualan',
      icon: ShoppingCart,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badge: 'Kasir',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'cashier']
    },
    {
      title: 'Gudang & Inventori Obat',
      desc: 'Kartu stok, pelacakan batch & expired date, opname stok harian',
      icon: Package,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'Gudang',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'inventory']
    },
    {
      title: 'Pengadaan & Faktur (PBF)',
      desc: 'Surat Pesanan (SP obat/narkotika/prekursor) dan verifikasi faktur masuk',
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badge: 'Purchasing',
      roleAccess: ['superadmin', 'admin', 'pharmacist', 'inventory']
    },
    {
      title: 'Laporan & Keuangan Cabang',
      desc: 'Omzet harian, laporan laba rugi, dan rekonsiliasi kas cabang',
      icon: BarChart3,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      badge: 'Manajemen',
      roleAccess: ['superadmin', 'admin']
    }
  ];

  return (
    <div className="h-screen h-dvh w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navbar (Compact - 52px) */}
      <header className="h-[52px] shrink-0 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg shadow-inner">
            💊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">Vi-Pharma</h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Workstation
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 leading-none mt-0.5">
              <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <strong className="text-slate-200 truncate max-w-[150px] sm:max-w-xs">{branch?.branch_name}</strong>
              <span className="font-mono text-slate-500">({branch?.branch_code})</span>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-white block leading-tight">{user?.name}</span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
              {user?.user_role}
            </span>
          </div>

          <button
            onClick={onSwitchBranch}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
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

      {/* Main Content Area (Strict 1-Screen Responsive) */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-5 flex flex-col gap-3 overflow-hidden">
        {/* Branch Info Banner (Compact Single Row on Desktop) */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-md shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Izin Resmi Apotek Terverifikasi
            </div>
            <h2 className="text-base sm:text-lg font-black text-white leading-tight">{branch?.branch_name}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl line-clamp-1">{branch?.address}</p>
          </div>

          {/* Quick Badges */}
          <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 shrink-0">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">No. SIA</span>
              <span className="font-mono text-xs font-bold text-slate-200">{branchDetail?.sia_id || 'SIA-101/2026'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Apoteker (SIPA)</span>
              <span className="font-semibold text-xs text-slate-200 truncate block">{branchDetail?.sipa_name || 'apt. Hendra, S.Farm'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Status Jurnal</span>
              <span className="font-mono text-xs text-emerald-400 uppercase font-bold">{branchDetail?.journal_method || 'Perpetual'}</span>
            </div>
          </div>
        </div>

        {/* Division Modules Grid (Fills remaining height, never pushes outside viewport) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Modul Operasional Cabang</h3>
            <span className="text-[11px] text-slate-400">
              Role: <strong className="text-emerald-400 font-mono">{user?.user_role}</strong>
            </span>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-0.5">
            {modules.map((m, idx) => {
              const isAllowed = m.roleAccess.includes(user?.user_role || '');
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isAllowed
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg cursor-pointer group'
                      : 'bg-slate-900/20 border-slate-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border ${m.color} ${isAllowed ? 'group-hover:scale-105' : ''} transition shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {m.badge}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold mb-1 leading-snug ${isAllowed ? 'text-white group-hover:text-emerald-300' : 'text-slate-400'}`}>
                      {m.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {m.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold">
                    {isAllowed ? (
                      <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        Buka Modul →
                      </span>
                    ) : (
                      <span className="text-slate-600">Akses Dibatasi</span>
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
