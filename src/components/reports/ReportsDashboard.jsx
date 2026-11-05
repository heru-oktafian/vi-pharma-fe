import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, DollarSign, TrendingUp, Award, Calendar, RefreshCw,
  ArrowLeft, Building2, HelpCircle, ArrowUpRight, Percent, Sparkles,
  PieChart, CreditCard, Layers, Tag, ShieldCheck, AlertCircle
} from 'lucide-react';
import {
  getStaffPerformanceReport,
  getSalesSummaryReport,
  getCategoryMarginsReport
} from '../../services/reportApi';

export default function ReportsDashboard({ user, branch, token, theme, onBack }) {
  const isLight = theme === 'light';
  const branchId = branch?.id || 'CBG000000000001';

  // Active Tab: 'staff' | 'sales' | 'categories'
  const [activeTab, setActiveTab] = useState('staff');

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Staff Performance state & Bonus Pool Simulator
  const [bonusPoolBudget, setBonusPoolBudget] = useState(5000000); // Rp 5.000.000 default simulator
  const [targetMarginPercent, setTargetMarginPercent] = useState(0);
  const [staffData, setStaffData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Reports
  const loadReports = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'staff') {
        const res = await getStaffPerformanceReport(
          token,
          {
            start_date: startDate,
            end_date: endDate,
            bonus_pool: bonusPoolBudget,
            target_margin: targetMarginPercent
          },
          branchId
        );
        setStaffData(res);
      } else if (activeTab === 'sales') {
        const res = await getSalesSummaryReport(
          token,
          { start_date: startDate, end_date: endDate },
          branchId
        );
        setSalesData(res);
      } else if (activeTab === 'categories') {
        const res = await getCategoryMarginsReport(
          token,
          { start_date: startDate, end_date: endDate },
          branchId
        );
        setCategoryData(res || []);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      setErrorMsg(err.message || 'Gagal memuat data laporan analitik');
    } finally {
      setLoading(false);
    }
  }, [token, branchId, activeTab, startDate, endDate, bonusPoolBudget, targetMarginPercent]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Preset date shortcuts
  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Top Header */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Kembali ke Dashboard Modul"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">Laporan & Keuangan Cabang</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{branch?.branch_name || 'Apotek Vi-Pharma Pusat'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Analisis omzet penjualan, laba kotor, margin HPP, serta kontribusi insentif kinerja petugas apotek
            </p>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={handleSetToday}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition text-[11px]"
            >
              Hari Ini
            </button>
            <button
              onClick={handleSetThisMonth}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 font-semibold border border-emerald-500/30 text-[11px]"
            >
              Bulan Ini
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <button
            onClick={loadReports}
            disabled={loading}
            className={`p-2 rounded-xl border transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Muat Ulang Laporan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-1">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'staff'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Kinerja & Kontribusi Petugas (Omzet, Margin & Reward)</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'sales'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Ringkasan Penjualan & Arus Kas</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Profitabilitas Kategori Obat</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
        {/* ============================================================== */}
        {/* TAB 1: KINERJA & KONTRIBUSI PETUGAS (OMZET, MARGIN & REWARD)   */}
        {/* ============================================================== */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            {/* Top Branch Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Total Omzet Cabang</span>
                  <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Rp {(staffData?.total_branch_revenue || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Penjualan kotor apotek</div>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Total Modal Beli (HPP)</span>
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Rp {(staffData?.total_branch_cogs || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Modal obat terjual dari batch</div>
              </div>

              <div className={`p-4 rounded-xl border-2 border-emerald-500/40 ${isLight ? 'bg-emerald-50/40' : 'bg-emerald-950/20'}`}>
                <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                  <span>Total Margin Laba (Value)</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  Rp {(staffData?.total_branch_margin || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-emerald-500/80 mt-0.5 font-medium">
                  Laba Kotor Riil Cabang
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Rata-rata Markup Cabang</span>
                  <Percent className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-black text-purple-400 mt-1">
                  {staffData?.average_branch_markup || 0}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Rasio laba terhadap modal</div>
              </div>
            </div>

            {/* Bonus Pool Simulator Box */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/15 border-amber-500/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Simulator Alokasi Bonus / Reward Kinerja Karyawan
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Sistem menghitung pembagian bonus secara matematis berdasarkan <strong>% Kontribusi Value Margin Riil</strong> yang disumbangkan oleh masing-masing petugas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Anggaran Bonus (Rp):</span>
                    <input
                      type="number"
                      step="500000"
                      value={bonusPoolBudget}
                      onChange={(e) => setBonusPoolBudget(parseFloat(e.target.value) || 0)}
                      className={`w-32 px-2.5 py-1 rounded-lg border text-xs font-bold text-right ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard & Contributor Table */}
            <div
              className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Peringkat & Rincian Kontribusi Petugas Apotek</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Data diurutkan berdasarkan kontribusi margin keuntungan terbesar ke apotek
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  Total Petugas Aktif: <strong>{staffData?.staff_contributions?.length || 0}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-800'
                    }`}>
                      <th className="py-3 px-4 text-center">Rank</th>
                      <th className="py-3 px-4">Nama Petugas & Role</th>
                      <th className="py-3 px-4 text-center">Trx</th>
                      <th className="py-3 px-4 text-right">Omzet Penjualan</th>
                      <th className="py-3 px-4 text-center">% Omzet</th>
                      <th className="py-3 px-4 text-right">Modal (HPP)</th>
                      <th className="py-3 px-4 text-right font-black text-emerald-400">Value Margin Laba</th>
                      <th className="py-3 px-4 text-center font-black text-emerald-400">% Kontribusi Margin</th>
                      <th className="py-3 px-4 text-center text-purple-400">Markup Keuntungan</th>
                      <th className="py-3 px-4 text-right font-bold text-amber-400">Estimasi Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                          Menghitung kontribusi margin dan omzet petugas...
                        </td>
                      </tr>
                    ) : (staffData?.staff_contributions || []).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          Belum ada data transaksi penjualan atau pelayanan resep pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      // Sort by GrossMargin descending
                      [...(staffData?.staff_contributions || [])]
                        .sort((a, b) => b.gross_margin - a.gross_margin)
                        .map((st, idx) => {
                          const isTop1 = idx === 0;
                          const isTop2 = idx === 1;
                          const isTop3 = idx === 2;

                          return (
                            <tr
                              key={st.user_id || idx}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                                isLight ? 'text-slate-800' : 'text-slate-200'
                              } ${isTop1 ? 'bg-amber-500/5' : ''}`}
                            >
                              {/* Rank */}
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                    isTop1
                                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                                      : isTop2
                                      ? 'bg-slate-300 text-slate-900'
                                      : isTop3
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              </td>

                              {/* Nama Petugas */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-xs flex items-center gap-1.5">
                                  <span>{st.user_name}</span>
                                  {isTop1 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      MVP Laba
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase">
                                  Role: {st.user_role}
                                </div>
                              </td>

                              {/* Total Trx */}
                              <td className="py-3 px-4 text-center font-mono">
                                {st.total_transactions}
                              </td>

                              {/* Omzet Penjualan */}
                              <td className="py-3 px-4 text-right font-medium">
                                Rp {st.total_revenue.toLocaleString('id-ID')}
                              </td>

                              {/* % Omzet */}
                              <td className="py-3 px-4 text-center font-semibold text-blue-400">
                                {st.revenue_contribution_percent}%
                              </td>

                              {/* Modal HPP */}
                              <td className="py-3 px-4 text-right text-slate-400">
                                Rp {st.total_cogs.toLocaleString('id-ID')}
                              </td>

                              {/* Value Margin Laba (Rp) */}
                              <td className="py-3 px-4 text-right font-extrabold text-emerald-400">
                                Rp {st.gross_margin.toLocaleString('id-ID')}
                              </td>

                              {/* % Kontribusi Margin (Basis Utama Pembagian Bonus) */}
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  {st.margin_contribution_percent}%
                                </span>
                              </td>

                              {/* Markup Keuntungan (%) */}
                              <td className="py-3 px-4 text-center font-bold text-purple-400">
                                +{st.markup_percent}%
                              </td>

                              {/* Estimasi Bonus (Rp) */}
                              <td className="py-3 px-4 text-right font-black text-amber-400">
                                Rp {(st.estimated_bonus || 0).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: RINGKASAN PENJUALAN & ARUS KAS KASIR                    */}
        {/* ============================================================== */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Methods Breakdown */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Komposisi Metode Pembayaran</span>
                </h3>

                <div className="space-y-3">
                  {(salesData?.payment_methods || []).map((pm, idx) => (
                    <div key={pm.payment_method || idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">{pm.payment_method} ({pm.count} transaksi)</span>
                        <span className="font-bold">Rp {pm.total_amount.toLocaleString('id-ID')} ({pm.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pm.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Summary Card */}
              <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Ringkasan Keuangan Periode</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Total Transaksi Kasir:</span>
                    <strong className="text-slate-200">{salesData?.total_transactions || 0} struk</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Total Omzet Penjualan:</span>
                    <strong className="text-blue-400">Rp {(salesData?.total_revenue || 0).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Total Modal HPP Barang:</span>
                    <strong className="text-slate-300">Rp {(salesData?.total_cogs || 0).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Laba Kotor Apotek:</span>
                    <strong className="text-emerald-400">Rp {(salesData?.total_margin || 0).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Margin terhadap Omzet:</span>
                    <strong className="text-purple-400">{salesData?.margin_percent || 0}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROFITABILITAS KATEGORI OBAT                            */}
        {/* ============================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Laporan Profitabilitas per Kategori Terapi Farmakologi</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mengetahui kategori obat yang menghasilkan persentase margin keuntungan tertinggi
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-800'
                    }`}>
                      <th className="py-3 px-4">Kategori Terapi</th>
                      <th className="py-3 px-4 text-center">Item Terjual</th>
                      <th className="py-3 px-4 text-right">Omzet (Rp)</th>
                      <th className="py-3 px-4 text-right">Modal HPP (Rp)</th>
                      <th className="py-3 px-4 text-right font-black text-emerald-400">Laba Kotor (Rp)</th>
                      <th className="py-3 px-4 text-center text-emerald-400">Margin (%)</th>
                      <th className="py-3 px-4 text-center text-purple-400">Markup Keuntungan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                          Memuat data profitabilitas kategori...
                        </td>
                      </tr>
                    ) : categoryData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Belum ada transaksi obat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      categoryData.map((cat, idx) => (
                        <tr
                          key={cat.category_id || idx}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                            isLight ? 'text-slate-800' : 'text-slate-200'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold">{cat.category_name}</td>
                          <td className="py-3 px-4 text-center font-mono">{cat.total_qty_sold}</td>
                          <td className="py-3 px-4 text-right">Rp {cat.total_revenue.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right text-slate-400">Rp {cat.total_cogs.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-400">
                            Rp {cat.gross_margin.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-400">
                            {cat.margin_percent}%
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-purple-400">
                            +{cat.markup_percent}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
