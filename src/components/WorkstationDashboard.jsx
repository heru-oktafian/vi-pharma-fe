import React, { useState, useEffect } from 'react';
import { 
  Building2, Pill, ShoppingCart, Package, FileText, 
  BarChart3, LogOut, ArrowLeftRight, ShieldCheck, 
  User, CheckCircle, ExternalLink 
} from 'lucide-react';
import { getBranchDetail } from '../services/api';

export default function WorkstationDashboard({ user, branch, token, onSwitchBranch, onLogout }) {
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branch?.id && token) {
      setLoading(true);
      getBranchDetail(branch.id, token)
        .then((data) => setBranchDetail(data))
        .catch((err) => console.error('Failed to load full branch detail:', err))
        .finally(() => setLoading(false));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl shadow-inner">
            💊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Vi-Pharma</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Workstation Aktif
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-slate-200">{branch?.branch_name}</strong>
              <span className="font-mono text-slate-500">({branch?.branch_code})</span>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-white block">{user?.name}</span>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">
              {user?.user_role}
            </span>
          </div>

          <button
            onClick={onSwitchBranch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
            title="Ganti Cabang"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ganti Cabang</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Branch Info Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" /> Izin Resmi Apotek Terverifikasi
              </div>
              <h2 className="text-2xl font-black text-white">{branch?.branch_name}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">{branch?.address}</p>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">No. SIA</span>
                <span className="font-mono font-bold text-slate-200">{branchDetail?.sia_id || 'SIA-101/2026'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Apoteker (SIPA)</span>
                <span className="font-semibold text-slate-200 truncate block">{branchDetail?.sipa_name || 'apt. Hendra, S.Farm'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Status Jurnal</span>
                <span className="font-mono text-emerald-400 uppercase font-bold">{branchDetail?.journal_method || 'Perpetual'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Division Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white tracking-tight">Modul Operasional Cabang</h3>
            <span className="text-xs text-slate-400">Hak akses otomatis disaring sesuai role <strong className="text-emerald-400 font-mono">{user?.user_role}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m, idx) => {
              const isAllowed = m.roleAccess.includes(user?.user_role || '');
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border transition-all ${
                    isAllowed
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl cursor-pointer group'
                      : 'bg-slate-900/20 border-slate-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${m.color} ${isAllowed ? 'group-hover:scale-105' : ''} transition`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {m.badge}
                    </span>
                  </div>

                  <h4 className={`text-base font-bold mb-1 ${isAllowed ? 'text-white group-hover:text-emerald-300' : 'text-slate-400'}`}>
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {m.desc}
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
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
