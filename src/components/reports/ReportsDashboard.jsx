import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, DollarSign, TrendingUp, Award, Calendar, RefreshCw,
  ArrowLeft, Building2, HelpCircle, ArrowUpRight, Percent, Sparkles,
  PieChart, CreditCard, Layers, Tag, ShieldCheck, AlertCircle, Save, CheckCircle2,
  Eye, X, Lock, Download, Printer
} from 'lucide-react';
import {
  getStaffPerformanceReport,
  getSalesSummaryReport,
  getCategoryMarginsReport,
  updateBranchBonusSetting
} from '../../services/reportApi';
import SipnapReportView from './SipnapReportView';

export default function ReportsDashboard({ user, branch, token, theme, onBack }) {
  const isLight = theme === 'light';
  const branchId = branch?.id || 'CBG000000000001';

  // Role authority check: only superadmin & admin have full authority to edit branch targets/bonuses
  const userRole = (user?.user_role || user?.role || '').toLowerCase();
  const hasFullAuthority = userRole === 'superadmin' || userRole === 'admin';

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

  // Staff Performance state & Threshold Bonus Settings
  const [dailyMarginTarget, setDailyMarginTarget] = useState(250000); // Default Rp 250.000 / hari
  const [dailyBonusReward, setDailyBonusReward] = useState(50000);   // Default Rp 50.000 flat per hari tercapai
  const [configInitialized, setConfigInitialized] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [selectedStaffDaily, setSelectedStaffDaily] = useState(null);
  const [isPrintSalesModalOpen, setIsPrintSalesModalOpen] = useState(false);

  const [staffData, setStaffData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // CSV Helpers
  const downloadCSV = (content, filename) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportStaffCSV = () => {
    if (!staffData || !staffData.staff_contributions?.length) {
      alert('Tidak ada data kinerja petugas untuk diekspor pada periode ini.');
      return;
    }
    const headers = [
      'No',
      'Nama Petugas',
      'Role',
      'Jumlah Transaksi',
      'Total Omzet (Rp)',
      'Total Modal HPP (Rp)',
      'Margin Laba Kotor (Rp)',
      'Markup (%)',
      'Kontribusi Margin (%)',
      'Hari Masuk',
      'Hari Capai Target',
      'Bonus Harian Tercapai (Rp)'
    ];
    const rows = staffData.staff_contributions.map((st, idx) => [
      idx + 1,
      `"${st.user_name.replace(/"/g, '""')}"`,
      `"${st.user_role}"`,
      st.transactions_handled,
      st.total_revenue,
      st.total_cogs,
      st.gross_margin,
      st.markup_percentage,
      st.contribution_margin_pct,
      st.active_days_count,
      st.days_achieved,
      st.total_bonus
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csvContent, `Laporan_Kinerja_Bonus_Petugas_${startDate}_sd_${endDate}.csv`);
  };

  const handleExportSalesCSV = () => {
    if (!salesData) {
      alert('Tidak ada data penjualan untuk diekspor pada periode ini.');
      return;
    }
    const summaryRows = [
      ['LAPORAN LABA RUGI & RINGKASAN PENJUALAN APOTEK'],
      [`Cabang: ${branch?.branch_name || 'Apotek Vi-Pharma'}`],
      [`Periode: ${startDate} s/d ${endDate}`],
      [''],
      ['Indikator Laba Rugi', 'Nominal / Nilai (Rp)'],
      ['Total Transaksi Kasir', salesData.total_transactions || 0],
      ['Omzet Penjualan Kotor (Gross)', salesData.total_revenue || 0],
      ['Retur Penjualan Pasien', salesData.total_returns || 0],
      ['Omzet Penjualan Bersih (Net Sales)', salesData.net_revenue !== undefined ? salesData.net_revenue : ((salesData.total_revenue || 0) - (salesData.total_returns || 0))],
      ['Total Modal Pokok (HPP)', salesData.total_cogs || 0],
      ['Laba Kotor Apotek (Gross Profit)', salesData.total_margin || 0],
      ['Margin terhadap Omzet Bersih (%)', `${salesData.margin_percent || 0}%`],
      [''],
      ['TREN PENJUALAN HARIAN'],
      ['Tanggal', 'Jumlah Transaksi', 'Omzet (Rp)', 'Modal HPP (Rp)', 'Laba Kotor (Rp)']
    ];
    (salesData.daily_trends || []).forEach((tr) => {
      summaryRows.push([
        tr.date,
        tr.transactions,
        tr.revenue,
        tr.cogs,
        tr.margin
      ]);
    });
    summaryRows.push(['']);
    summaryRows.push(['KOMPOSISI METODE PEMBAYARAN']);
    summaryRows.push(['Metode Pembayaran', 'Jumlah Transaksi', 'Total Nominal (Rp)', 'Persentase (%)']);
    (salesData.payment_methods || []).forEach((pm) => {
      summaryRows.push([
        pm.payment_method,
        pm.count,
        pm.total_amount,
        `${pm.percentage}%`
      ]);
    });

    const csvContent = summaryRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV(csvContent, `Laporan_Laba_Rugi_Penjualan_${startDate}_sd_${endDate}.csv`);
  };

  const handleExportCategoriesCSV = () => {
    if (!categoryData || !categoryData.length) {
      alert('Tidak ada data kategori untuk diekspor pada periode ini.');
      return;
    }
    const headers = [
      'No',
      'ID Kategori',
      'Nama Kategori',
      'Total Qty Terjual',
      'Omzet (Rp)',
      'Modal HPP (Rp)',
      'Laba Kotor (Rp)',
      'Margin (%)',
      'Markup (%)'
    ];
    const rows = categoryData.map((cat, idx) => [
      idx + 1,
      `"${cat.category_id}"`,
      `"${cat.category_name.replace(/"/g, '""')}"`,
      cat.total_qty_sold,
      cat.total_revenue,
      cat.total_cogs,
      cat.gross_margin,
      cat.margin_percent,
      cat.markup_percent
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csvContent, `Laporan_Profitabilitas_Kategori_${startDate}_sd_${endDate}.csv`);
  };

  // Fetch Reports
  const loadReports = useCallback(async () => {
    if (activeTab === 'sipnap') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'staff') {
        const res = await getStaffPerformanceReport(
          token,
          {
            start_date: startDate,
            end_date: endDate,
            daily_margin_target: dailyMarginTarget,
            daily_bonus_reward: dailyBonusReward,
          },
          branchId
        );
        setStaffData(res);
        if (res && !configInitialized) {
          if (res.daily_margin_target) setDailyMarginTarget(res.daily_margin_target);
          if (res.daily_bonus_reward) setDailyBonusReward(res.daily_bonus_reward);
          setConfigInitialized(true);
        }
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
  }, [token, branchId, activeTab, startDate, endDate, dailyMarginTarget, dailyBonusReward, configInitialized]);

  const handleSaveBranchConfig = async () => {
    setIsSavingConfig(true);
    setSaveSuccessMsg('');
    setErrorMsg('');
    try {
      await updateBranchBonusSetting(token, branchId, {
        daily_margin_target: Number(dailyMarginTarget),
        daily_bonus_reward: Number(dailyBonusReward),
      });
      setSaveSuccessMsg(`Konfigurasi target margin Rp ${Number(dailyMarginTarget).toLocaleString('id-ID')} & bonus Rp ${Number(dailyBonusReward).toLocaleString('id-ID')} berhasil disimpan untuk cabang ini.`);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
      loadReports();
    } catch (err) {
      console.error('Failed to save branch bonus setting:', err);
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan bonus cabang');
    } finally {
      setIsSavingConfig(false);
    }
  };

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
        {activeTab !== 'sipnap' && (
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
        )}
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

        <button
          onClick={() => setActiveTab('sipnap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'sipnap'
              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-300" />
          <span>Laporan Resmi SIPNAP Kemenkes (Narkotika & Psikotropika)</span>
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

              <div className={`p-4 rounded-xl border-2 border-amber-500/40 ${isLight ? 'bg-amber-50/30 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'}`}>
                <div className="text-[11px] text-amber-400 font-bold flex items-center justify-between">
                  <span>Total Bonus Penjualan Cabang</span>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-black text-amber-400 mt-1">
                  Rp {(staffData?.total_bonus_paid || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Akumulasi bonus reward tercapai</div>
              </div>
            </div>

            {/* Target Margin & Daily Bonus Config Box */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-amber-50/40 border-amber-200' : 'bg-amber-950/15 border-amber-500/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Pengaturan Target Margin & Bonus Penjualan Cabang</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {branch?.branch_name || 'Apotek Vi-Pharma'}
                      </span>
                      {hasFullAuthority ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Otoritas Penuh
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" /> Terkunci (Hanya Pemilik Otoritas)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      Sistem menghitung bonus secara <strong>flat per hari</strong> untuk setiap personal kasir/apoteker yang berhasil menghasilkan margin harian <strong className="text-amber-400">≥ Target Margin</strong>. Jika penjualan melebihi target margin, bonus harian <strong>tetap flat (tidak bertambah)</strong>.
                      {!hasFullAuthority && (
                        <span className="block text-[11px] text-amber-400/90 font-medium mt-1">
                          *Pengaturan target dan bonus dikunci. Hanya pemilik otoritas penuh (Superadmin / Admin) yang dapat mengubah nilai ini.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Form Inputs for Branch Target & Bonus */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      {!hasFullAuthority && <Lock className="w-3 h-3 text-slate-500" />}
                      <span>Target Margin Harian / Petugas (Rp):</span>
                    </label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      disabled={!hasFullAuthority}
                      readOnly={!hasFullAuthority}
                      value={dailyMarginTarget}
                      onChange={(e) => hasFullAuthority && setDailyMarginTarget(parseFloat(e.target.value) || 0)}
                      title={!hasFullAuthority ? "Hanya pemilik otoritas penuh yang dapat mengubah nilai ini" : undefined}
                      className={`w-40 px-3 py-1.5 rounded-xl border text-xs font-bold text-right transition ${
                        !hasFullAuthority
                          ? 'bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed opacity-80 select-none'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      {!hasFullAuthority && <Lock className="w-3 h-3 text-slate-500" />}
                      <span>Bonus per Hari Tercapai (Rp):</span>
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      disabled={!hasFullAuthority}
                      readOnly={!hasFullAuthority}
                      value={dailyBonusReward}
                      onChange={(e) => hasFullAuthority && setDailyBonusReward(parseFloat(e.target.value) || 0)}
                      title={!hasFullAuthority ? "Hanya pemilik otoritas penuh yang dapat mengubah nilai ini" : undefined}
                      className={`w-36 px-3 py-1.5 rounded-xl border text-xs font-bold text-right transition ${
                        !hasFullAuthority
                          ? 'bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed opacity-80 select-none'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-amber-400 focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {hasFullAuthority ? (
                      <>
                        <button
                          onClick={loadReports}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                          title="Hitung ulang dengan parameter target ini"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Simulasikan</span>
                        </button>

                        <button
                          onClick={handleSaveBranchConfig}
                          disabled={isSavingConfig}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                          title="Simpan target dan bonus ini permanen untuk cabang apotek ini"
                        >
                          {isSavingConfig ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Simpan untuk Cabang Ini</span>
                        </button>
                      </>
                    ) : (
                      <div
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium flex items-center gap-1.5 cursor-not-allowed select-none"
                        title="Pengaturan dikunci. Hanya pemilik otoritas penuh yang dapat mengubah target dan bonus cabang ini."
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Terkunci</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
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
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    Total Petugas Aktif: <strong>{staffData?.staff_contributions?.length || 0}</strong>
                  </span>
                  <button
                    onClick={handleExportStaffCSV}
                    disabled={!staffData?.staff_contributions?.length}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                    title="Ekspor CSV Kinerja & Bonus Petugas"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
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
                      <th className="py-3 px-4 text-center font-black text-emerald-400">% Margin</th>
                      <th className="py-3 px-4 text-center">Hari Kerja</th>
                      <th className="py-3 px-4 text-center">Target Tercapai</th>
                      <th className="py-3 px-4 text-right font-bold text-amber-400">Bonus Penjualan</th>
                      <th className="py-3 px-4 text-center">Rincian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                          Menghitung kontribusi margin dan omzet petugas...
                        </td>
                      </tr>
                    ) : (staffData?.staff_contributions || []).length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400">
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

                              {/* % Kontribusi Margin */}
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  {st.margin_contribution_percent}%
                                </span>
                              </td>

                              {/* Hari Kerja Aktif Bertransaksi */}
                              <td className="py-3 px-4 text-center font-medium">
                                {st.active_days_count || 1} hari
                              </td>

                              {/* Pencapaian Target Harian */}
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  (st.days_achieved || 0) > 0
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {(st.days_achieved || 0) > 0 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                  <span>{st.days_achieved || 0} hari tercapai</span>
                                </span>
                              </td>

                              {/* Bonus Penjualan Flat Tercapai (Rp) */}
                              <td className="py-3 px-4 text-right">
                                <div className="font-black text-amber-400 text-sm">
                                  Rp {(st.total_bonus || 0).toLocaleString('id-ID')}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {st.days_achieved || 0} hr x Rp {(st.daily_bonus_reward || dailyBonusReward).toLocaleString('id-ID')}
                                </div>
                              </td>

                              {/* Tombol Lihat Rincian Harian */}
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => setSelectedStaffDaily(st)}
                                  className="p-1.5 rounded-lg border bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 transition inline-flex items-center justify-center"
                                  title="Lihat rincian pencapaian target per tanggal"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
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
        {/* TAB 2: RINGKASAN PENJUALAN & LAPORAN LABA / RUGI (P&L)        */}
        {/* ============================================================== */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Laporan Laba / Rugi & Rekapitulasi Arus Kas Penjualan</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ikhtisar kinerja penjualan bersih, potongan retur, beban modal HPP barang, serta margin kotor apotek
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSalesCSV}
                  disabled={!salesData}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                  title="Ekspor CSV Laporan Laba/Rugi"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor CSV Laba/Rugi</span>
                </button>

                <button
                  onClick={() => setIsPrintSalesModalOpen(true)}
                  disabled={!salesData}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  } disabled:opacity-50 disabled:pointer-events-none`}
                  title="Cetak Laporan Laba/Rugi Resmi (A4)"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan (A4)</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400">Omzet Kotor (Gross)</div>
                <div className="text-lg font-black text-blue-400 mt-1">
                  Rp {(salesData?.total_revenue || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{salesData?.total_transactions || 0} struk kasir</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400">Retur Penjualan Pasien</div>
                <div className="text-lg font-black text-rose-400 mt-1">
                  -Rp {(salesData?.total_returns || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pengembalian dana / refund</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400">Omzet Bersih (Net Sales)</div>
                <div className="text-lg font-black text-cyan-400 mt-1">
                  Rp {(salesData?.net_revenue !== undefined ? salesData.net_revenue : ((salesData?.total_revenue || 0) - (salesData?.total_returns || 0))).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Penjualan kotor - retur</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400">Beban Pokok Modal (HPP)</div>
                <div className="text-lg font-black text-amber-400 mt-1">
                  Rp {(salesData?.total_cogs || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Harga beli distributor</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="text-[11px] text-slate-400">Laba Kotor Riil (Gross Profit)</div>
                <div className="text-lg font-black text-emerald-400 mt-1">
                  Rp {(salesData?.total_margin || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                  Margin: {salesData?.margin_percent || 0}%
                </div>
              </div>
            </div>

            {/* P&L Statement & Payment Methods Breakdown */}
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

              {/* Comprehensive P&L Statement Card */}
              <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Laporan Laba / Rugi Komprehensif</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Total Transaksi Kasir:</span>
                    <strong className="text-slate-200">{salesData?.total_transactions || 0} struk</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Omzet Penjualan Kotor (Gross):</span>
                    <strong className="text-blue-400">Rp {(salesData?.total_revenue || 0).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">(-) Retur Penjualan Pasien:</span>
                    <strong className="text-rose-400">-Rp {(salesData?.total_returns || 0).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 bg-emerald-500/5 px-2 rounded">
                    <span className="font-semibold text-slate-300">Omzet Penjualan Bersih (Net Sales):</span>
                    <strong className="text-cyan-400">
                      Rp {(salesData?.net_revenue !== undefined ? salesData.net_revenue : ((salesData?.total_revenue || 0) - (salesData?.total_returns || 0))).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">(-) Beban Pokok Penjualan (HPP):</span>
                    <strong className="text-amber-400">-Rp {(salesData?.total_cogs || 0).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-emerald-500/40 bg-emerald-500/10 px-2 rounded">
                    <span className="font-bold text-emerald-400">Laba Kotor Apotek (Gross Profit):</span>
                    <strong className="text-base text-emerald-400 font-black">
                      Rp {(salesData?.total_margin || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 text-[11px] text-slate-400">
                    <span>Margin terhadap Omzet Bersih:</span>
                    <span className="font-bold text-purple-400">{salesData?.margin_percent || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Sales Trend Table */}
            <div
              className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Rekapitulasi Tren Penjualan Harian</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Histori pergerakan omzet, beban modal HPP, dan margin laba harian apotek
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  Total Hari Aktif: <strong>{(salesData?.daily_trends || []).length} Hari</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-800'
                    }`}>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4 text-center">Jumlah Transaksi</th>
                      <th className="py-3 px-4 text-right">Omzet Harian</th>
                      <th className="py-3 px-4 text-right">Modal HPP</th>
                      <th className="py-3 px-4 text-right text-emerald-400 font-bold">Laba Kotor</th>
                      <th className="py-3 px-4 text-center text-purple-400 font-bold">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {(!salesData?.daily_trends || salesData.daily_trends.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Tidak ada histori transaksi penjualan harian pada rentang tanggal ini.
                        </td>
                      </tr>
                    ) : (
                      salesData.daily_trends.map((tr, idx) => {
                        const dayMarginPct = tr.revenue > 0 ? ((tr.margin / tr.revenue) * 100).toFixed(1) : 0;
                        return (
                          <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                            <td className="py-2.5 px-4 font-mono font-medium">{tr.date}</td>
                            <td className="py-2.5 px-4 text-center font-mono">{tr.transactions} struk</td>
                            <td className="py-2.5 px-4 text-right font-mono">Rp {tr.revenue.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-400">Rp {tr.cogs.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-400">
                              Rp {tr.margin.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-purple-400">
                              {dayMarginPct}%
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
        {/* TAB 3: PROFITABILITAS KATEGORI OBAT                            */}
        {/* ============================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Laporan Profitabilitas per Kategori Terapi Farmakologi</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mengetahui kategori obat yang menghasilkan persentase margin keuntungan tertinggi
                  </p>
                </div>

                <button
                  onClick={handleExportCategoriesCSV}
                  disabled={!categoryData?.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                  title="Ekspor CSV Margin Kategori"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
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

        {/* ============================================================== */}
        {/* TAB 4: LAPORAN RESMI SIPNAP KEMENKES RI                        */}
        {/* ============================================================== */}
        {activeTab === 'sipnap' && (
          <SipnapReportView
            user={user}
            branch={branch}
            token={token}
            theme={theme}
          />
        )}
      </div>

      {/* Daily Breakdown Modal */}
      {selectedStaffDaily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-3xl max-h-[85vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Rincian Pencapaian Target Harian & Bonus Petugas</span>
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="font-bold text-slate-200">{selectedStaffDaily.user_name}</span>
                  <span>•</span>
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    Role: {selectedStaffDaily.user_role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffDaily(null)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Summary Stats */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="text-[10px] text-slate-400">Total Hari Kerja</div>
                <div className="text-base font-black text-slate-200 mt-0.5">
                  {selectedStaffDaily.active_days_count || 1} Hari
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <div className="text-[10px] text-emerald-400 font-bold">Hari Target Tercapai</div>
                <div className="text-base font-black text-emerald-400 mt-0.5">
                  {selectedStaffDaily.days_achieved || 0} Hari
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="text-[10px] text-slate-400">Target Margin / Hari</div>
                <div className="text-base font-black text-slate-200 mt-0.5">
                  Rp {(selectedStaffDaily.daily_target_margin || dailyMarginTarget).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="text-[10px] text-amber-400 font-bold">Total Bonus Periode</div>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  Rp {(selectedStaffDaily.total_bonus || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3 text-center">Trx</th>
                    <th className="py-2.5 px-3 text-right">Omzet</th>
                    <th className="py-2.5 px-3 text-right">Modal (HPP)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Margin Laba Riil</th>
                    <th className="py-2.5 px-3 text-center">Status Target</th>
                    <th className="py-2.5 px-3 text-right text-amber-400">Bonus Harian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(!selectedStaffDaily.daily_breakdown || selectedStaffDaily.daily_breakdown.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada histori transaksi harian pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    selectedStaffDaily.daily_breakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-medium">{item.date}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.transactions}</td>
                        <td className="py-2.5 px-3 text-right">Rp {item.total_revenue.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">Rp {item.total_cogs.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                          Rp {item.gross_margin.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              item.target_achieved
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {item.target_achieved ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>TERCAPAI</span>
                              </>
                            ) : (
                              <span>BELUM</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                          Rp {item.bonus_earned.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
              <span>*Bonus harian bersifat flat dan tidak bertambah meskipun margin harian melampaui target.</span>
              <button
                onClick={() => setSelectedStaffDaily(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL PRINT RESMI A4: LAPORAN LABA / RUGI & RINGKASAN KEUANGAN */}
      {/* ============================================================== */}
      {isPrintSalesModalOpen && salesData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          {/* Print CSS for Formal P&L Statement */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 15mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-sales-pnl-doc,
              #printable-sales-pnl-doc * {
                visibility: visible !important;
              }
              #printable-sales-pnl-doc {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                display: block !important;
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 10pt !important;
                line-height: 1.35 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div
            className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Modal Controls Bar */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40 no-print">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Pratinjau Laporan Laba / Rugi & Rekapitulasi Penjualan (A4)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
                <button
                  onClick={() => setIsPrintSalesModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900">
              <div id="printable-sales-pnl-doc" className="max-w-3xl mx-auto space-y-4">
                {/* Official Letterhead (Kop Surat) */}
                <div className="border-b-2 border-black pb-3 text-center">
                  <h1 className="text-xl font-black uppercase tracking-wide">{branch?.branch_name || 'APOTEK VI-PHARMA'}</h1>
                  <p className="text-xs text-slate-700 mt-0.5">{branch?.address || 'Jl. Pemuda No. 10, Jakarta'}</p>
                  <div className="text-[11px] font-semibold text-slate-800 flex justify-center gap-6 mt-1">
                    <span>No. SIA: <b>{branch?.sia_id || 'SIA-198402/DKS/2024'}</b></span>
                    <span>No. SIPA: <b>{branch?.sipa || 'SIPA-199203/STRA/2024'}</b></span>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center pt-1">
                  <h2 className="text-sm font-bold uppercase tracking-wide">
                    LAPORAN LABA / RUGI & ARUS KAS PENJUALAN APOTEK
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    PERIODE: {startDate} s/d {endDate}
                  </p>
                </div>

                {/* P&L Statement Table */}
                <table className="w-full border-collapse border border-black text-[9.5pt] mt-3">
                  <thead>
                    <tr className="bg-slate-100 border border-black font-bold">
                      <th className="border border-black p-2 text-left">Deskripsi Akun / Indikator Keuangan</th>
                      <th className="border border-black p-2 text-right w-48">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border border-black">
                      <td className="border border-black p-2 font-semibold">1. Omzet Penjualan Kotor (Gross Sales)</td>
                      <td className="border border-black p-2 text-right font-mono font-bold">
                        Rp {(salesData.total_revenue || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="border border-black">
                      <td className="border border-black p-2 pl-6 text-rose-700">
                        (-) Retur Penjualan Pasien & Refund Kasir
                      </td>
                      <td className="border border-black p-2 text-right font-mono text-rose-700">
                        (Rp {(salesData.total_returns || 0).toLocaleString('id-ID')})
                      </td>
                    </tr>
                    <tr className="border border-black bg-slate-50 font-bold">
                      <td className="border border-black p-2 font-bold">2. Penjualan Bersih (Net Revenue)</td>
                      <td className="border border-black p-2 text-right font-mono font-bold">
                        Rp {(salesData.net_revenue !== undefined ? salesData.net_revenue : ((salesData.total_revenue || 0) - (salesData.total_returns || 0))).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="border border-black">
                      <td className="border border-black p-2 pl-6 text-slate-800">
                        (-) Beban Pokok Penjualan (HPP Barang Pembelian PBF)
                      </td>
                      <td className="border border-black p-2 text-right font-mono">
                        (Rp {(salesData.total_cogs || 0).toLocaleString('id-ID')})
                      </td>
                    </tr>
                    <tr className="border-t-2 border-b-2 border-black bg-slate-100 font-black">
                      <td className="border border-black p-2 font-black">
                        3. Laba Kotor Apotek (Gross Operating Profit)
                      </td>
                      <td className="border border-black p-2 text-right font-mono font-black text-emerald-800">
                        Rp {(salesData.total_margin || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="border border-black text-[9pt]">
                      <td className="border border-black p-2 italic text-slate-600">
                        *Persentase Margin Keuntungan terhadap Penjualan Bersih
                      </td>
                      <td className="border border-black p-2 text-right font-mono font-bold">
                        {salesData.margin_percent || 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment Methods Breakdown */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1">Rincian Arus Kas Berdasarkan Metode Pembayaran:</h3>
                  <table className="w-full border-collapse border border-black text-[9pt]">
                    <thead>
                      <tr className="bg-slate-100 border border-black font-bold">
                        <th className="border border-black p-1.5 text-left">Metode Pembayaran</th>
                        <th className="border border-black p-1.5 text-center w-28">Jumlah Struk</th>
                        <th className="border border-black p-1.5 text-right w-44">Total Masuk (Rp)</th>
                        <th className="border border-black p-1.5 text-center w-24">Porsi (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(salesData.payment_methods || []).map((pm, idx) => (
                        <tr key={idx} className="border border-black">
                          <td className="border border-black p-1.5 font-medium">{pm.payment_method}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{pm.count}</td>
                          <td className="border border-black p-1.5 text-right font-mono">Rp {pm.total_amount.toLocaleString('id-ID')}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{pm.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signature Section */}
                <div className="pt-6 grid grid-cols-2 text-xs">
                  <div className="text-center w-60">
                    <p className="text-slate-800">Dibuat Oleh,</p>
                    <p className="font-bold text-slate-800 mt-0.5">Petugas Kasir / Keuangan</p>
                    <div className="h-16 flex items-center justify-center text-slate-300 italic text-[10px]">
                      (Tanda Tangan)
                    </div>
                    <p className="font-black text-slate-900 underline">{user?.name || user?.username || 'Staff Keuangan'}</p>
                    <p className="text-[10px] text-slate-600">Vi-Pharma Pos System</p>
                  </div>

                  <div className="text-center ml-auto w-60">
                    <p className="text-slate-800">
                      Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-800 mt-0.5">Apoteker Pengelola Apotek (APJ)</p>
                    <div className="h-16 flex items-center justify-center text-slate-300 italic text-[10px]">
                      (Tanda Tangan & Cap)
                    </div>
                    <p className="font-black text-slate-900 underline">{branch?.sipa_name || 'apt. Heru Oktafian, S.Farm.'}</p>
                    <p className="text-[10px] text-slate-600">SIPA: {branch?.sipa || 'SIPA-199203/STRA/2024'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
