import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Download, Printer, ShieldCheck, AlertCircle, RefreshCw,
  Search, Eye, X, Building2, Calendar, Pill, ChevronDown, CheckCircle2,
  FileSpreadsheet, Stethoscope, User, HelpCircle
} from 'lucide-react';
import { getSIPNAPReport } from '../../services/reportApi';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function SipnapReportView({ user, branch, token, theme = 'dark' }) {
  const isLight = theme === 'light';
  const branchId = branch?.id || 'CBG000000000001';

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected item for detail transaction drawer/modal
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('in'); // 'in' | 'out'

  // Printable modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Fetch SIPNAP data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getSIPNAPReport(
        token,
        {
          month: selectedMonth,
          year: selectedYear,
          classification: selectedClassification,
        },
        branchId
      );
      setReportData(res);
    } catch (err) {
      console.error('Failed to fetch SIPNAP report:', err);
      setErrorMsg(err.message || 'Gagal memuat data laporan SIPNAP Kemenkes');
    } finally {
      setLoading(false);
    }
  }, [token, branchId, selectedMonth, selectedYear, selectedClassification]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!reportData?.items) return [];
    if (!searchQuery.trim()) return reportData.items;
    const q = searchQuery.toLowerCase();
    return reportData.items.filter(
      (it) =>
        it.medicine_name.toLowerCase().includes(q) ||
        it.classification.toLowerCase().includes(q) ||
        it.dosage_form.toLowerCase().includes(q)
    );
  }, [reportData, searchQuery]);

  // Totals calculation
  const summaryTotals = useMemo(() => {
    const items = reportData?.items || [];
    return {
      totalMedicines: items.length,
      initialStock: items.reduce((sum, it) => sum + (it.initial_stock || 0), 0),
      totalIn: items.reduce((sum, it) => sum + (it.total_in || 0), 0),
      totalOut: items.reduce((sum, it) => sum + (it.total_out || 0), 0),
      finalStock: items.reduce((sum, it) => sum + (it.final_stock || 0), 0),
    };
  }, [reportData]);

  // Classification badge helper
  const renderClassificationBadge = (cls) => {
    switch (cls) {
      case 'narkotika':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wide">
            Narkotika
          </span>
        );
      case 'psikotropika':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wide">
            Psikotropika
          </span>
        );
      case 'prekursor':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
            Prekursor
          </span>
        );
      case 'oot':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
            OOT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 uppercase">
            {cls}
          </span>
        );
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!reportData || !reportData.items || reportData.items.length === 0) {
      alert('Tidak ada data obat terkontrol untuk diekspor pada periode ini.');
      return;
    }

    const headers = [
      'No',
      'Kode Obat',
      'Nama Obat',
      'Golongan',
      'Bentuk Sediaan',
      'Satuan',
      'Saldo Awal',
      'Pemasukan (Faktur PBF)',
      'Pengeluaran (Resep/Pasien)',
      'Penyesuaian',
      'Saldo Akhir'
    ];

    const rows = reportData.items.map((it, idx) => [
      idx + 1,
      `"${it.medicine_id}"`,
      `"${it.medicine_name.replace(/"/g, '""')}"`,
      it.classification.toUpperCase(),
      `"${it.dosage_form}"`,
      `"${it.unit_name}"`,
      it.initial_stock,
      it.total_in,
      it.total_out,
      it.adjustment,
      it.final_stock
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SIPNAP_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}_${branch?.branch_name || 'Apotek'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger A4 Print
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const branchName = reportData?.branch_name || branch?.branch_name || 'Apotek Vi-Pharma';
  const branchAddress = reportData?.branch_address || branch?.address || 'Jl. Pemuda No. 10, Jakarta';
  const siaNumber = reportData?.sia_number || branch?.sia_id || 'SIA-198402/DKS/2024';
  const sipaNumber = reportData?.sipa_number || branch?.sipa || 'SIPA-199203/STRA/2024';
  const pharmacistName = reportData?.pharmacist_name || branch?.sipa_name || 'apt. Heru Oktafian, S.Farm.';

  return (
    <div className="space-y-4">
      {/* Information Header & Regulatory Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Laporan Resmi SIPNAP Kemenkes RI
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Permenkes No. 3 / 2015
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem Informasi Pelaporan Narkotika, Psikotropika, Prekursor & OOT untuk Kementerian Kesehatan RI & Dinkes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading || !reportData?.items?.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            title="Ekspor CSV Format Portal SIPNAP Kemenkes"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV SIPNAP</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || !reportData?.items?.length}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            } disabled:opacity-50 disabled:pointer-events-none`}
            title="Cetak Berita Acara / Laporan Resmi A4 APJ"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi (A4)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Classification Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Golongan:</span>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Semua Golongan Terkontrol</option>
              <option value="narkotika">Narkotika (Gol I, II, III)</option>
              <option value="psikotropika">Psikotropika</option>
              <option value="prekursor">Prekursor Farmasi</option>
              <option value="oot">Obat-Obat Tertentu (OOT)</option>
            </select>
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama obat / sediaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs w-56 ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className={`p-2 rounded-xl border transition ${
              isLight ? 'bg-white hover:bg-slate-100 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
            title="Muat Ulang Laporan"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="text-[11px] text-slate-400">Total Item Terdaftar</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {summaryTotals.totalMedicines} Item
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Narkotik / Psikotropik / Prekursor</div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="text-[11px] text-slate-400">Saldo Awal (Tgl 1)</div>
          <div className="text-xl font-black text-blue-400 mt-1">
            {summaryTotals.initialStock.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Stok awal bulan</div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="text-[11px] text-slate-400">Pemasukan PBF</div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            +{summaryTotals.totalIn.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Faktur distributor resmi</div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="text-[11px] text-slate-400">Pengeluaran Resep</div>
          <div className="text-xl font-black text-amber-400 mt-1">
            -{summaryTotals.totalOut.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dispensasi dokter & pasien</div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="text-[11px] text-slate-400">Saldo Akhir Bulan</div>
          <div className="text-xl font-black text-purple-400 mt-1">
            {summaryTotals.finalStock.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sisa stok opname fisik</div>
        </div>
      </div>

      {/* Main Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/40">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">Nama Obat / Sediaan</th>
                <th className="py-3 px-3 text-center">Golongan</th>
                <th className="py-3 px-3 text-center">Bentuk & Satuan</th>
                <th className="py-3 px-3 text-right">Saldo Awal</th>
                <th className="py-3 px-3 text-right text-emerald-400">Masuk (PBF)</th>
                <th className="py-3 px-3 text-right text-amber-400">Keluar (Resep)</th>
                <th className="py-3 px-3 text-right font-black text-purple-400">Saldo Akhir</th>
                <th className="py-3 px-3 text-center w-28">Rincian Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Memuat data pelaporan SIPNAP dari database...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <span>Tidak ada data obat terkontrol pada periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.medicine_id}
                    className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}`}
                  >
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      <div>{item.medicine_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {item.medicine_id}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderClassificationBadge(item.classification)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-medium text-slate-300">{item.dosage_form}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">({item.unit_name})</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {item.initial_stock.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {item.total_in > 0 ? `+${item.total_in.toLocaleString('id-ID')}` : '0'}
                      {item.in_transactions?.length > 0 && (
                        <span className="text-[10px] text-slate-500 block">
                          ({item.in_transactions.length} Faktur)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      {item.total_out > 0 ? `-${item.total_out.toLocaleString('id-ID')}` : '0'}
                      {item.out_transactions?.length > 0 && (
                        <span className="text-[10px] text-slate-500 block">
                          ({item.out_transactions.length} Resep)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-purple-400">
                      {item.final_stock.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedItemDetail(item);
                          setDetailTab('in');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center gap-1 ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Lihat Rincian Faktur PBF & Resep Pasien"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div
          className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          <span>
            Menampilkan <b>{filteredItems.length}</b> obat terkontrol untuk pelaporan SIPNAP Periode{' '}
            <b>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</b>
          </span>
          <span className="font-mono text-[11px]">
            Apotek Pengampu: <b>{branchName}</b> | APJ: <b>{pharmacistName}</b>
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DRAWER / MODAL: RINCIAN TRANSAKSI (FAKTUR PBF & RESEP PASIEN)  */}
      {/* ============================================================== */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-3xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {selectedItemDetail.medicine_name}
                    </h4>
                    {renderClassificationBadge(selectedItemDetail.classification)}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Bentuk: <b>{selectedItemDetail.dosage_form}</b> ({selectedItemDetail.unit_name})</span>
                    <span>•</span>
                    <span>Periode: <b>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</b></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Masuk (PBF) vs Keluar (Resep) */}
            <div className="flex items-center border-b border-slate-800 px-4 bg-slate-950/20">
              <button
                onClick={() => setDetailTab('in')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  detailTab === 'in'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>Pemasukan dari PBF ({selectedItemDetail.in_transactions?.length || 0})</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
                  +{selectedItemDetail.total_in}
                </span>
              </button>

              <button
                onClick={() => setDetailTab('out')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  detailTab === 'out'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>Pengeluaran Resep & Pasien ({selectedItemDetail.out_transactions?.length || 0})</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400">
                  -{selectedItemDetail.total_out}
                </span>
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailTab === 'in' ? (
                // Pemasukan Table
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="py-2 px-3">Tanggal Faktur</th>
                      <th className="py-2 px-3">No. Faktur PBF</th>
                      <th className="py-2 px-3">Nama Distributor (PBF)</th>
                      <th className="py-2 px-3 font-mono">No. Batch</th>
                      <th className="py-2 px-3 text-right text-emerald-400">Qty Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(!selectedItemDetail.in_transactions || selectedItemDetail.in_transactions.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Tidak ada mutasi pemasukan faktur PBF untuk obat ini pada periode terpilih.
                        </td>
                      </tr>
                    ) : (
                      selectedItemDetail.in_transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-slate-300">{tx.invoice_date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{tx.invoice_number}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-200">{tx.supplier_name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{tx.batch_number || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400">
                            +{tx.qty} {selectedItemDetail.unit_name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                // Pengeluaran Table
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">No. Resep / Nota</th>
                      <th className="py-2 px-3">Dokter & SIP</th>
                      <th className="py-2 px-3">Nama & Alamat Pasien</th>
                      <th className="py-2 px-3 text-right text-amber-400">Qty Keluar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(!selectedItemDetail.out_transactions || selectedItemDetail.out_transactions.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Tidak ada mutasi pengeluaran resep dokter untuk obat ini pada periode terpilih.
                        </td>
                      </tr>
                    ) : (
                      selectedItemDetail.out_transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-slate-300">{tx.transaction_date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{tx.transaction_number}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-200">{tx.doctor_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">SIP: {tx.doctor_sip}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-200">{tx.patient_name}</div>
                            <div className="text-[10px] text-slate-400">{tx.patient_address}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-amber-400">
                            -{tx.qty} {selectedItemDetail.unit_name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                Formula: Saldo Awal ({selectedItemDetail.initial_stock}) + Masuk ({selectedItemDetail.total_in}) - Keluar ({selectedItemDetail.total_out}) = <b>{selectedItemDetail.final_stock}</b>
              </span>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL PRINT RESMI A4 (SESUAI PERMENKES RI)                      */}
      {/* ============================================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          {/* Print CSS for Formal A4 Document */}
          <style>{`
            @media print {
              @page {
                size: A4 landscape;
                margin: 10mm 12mm;
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
              #printable-sipnap-doc,
              #printable-sipnap-doc * {
                visibility: visible !important;
              }
              #printable-sipnap-doc {
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
                font-size: 9.5pt !important;
                line-height: 1.3 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div
            className={`w-full max-w-5xl max-h-[92vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Modal Controls Bar (Hidden during actual print) */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40 no-print">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Pratinjau Lembar Pelaporan Resmi SIPNAP (A4 Standar Kemenkes RI)</span>
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
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900">
              <div id="printable-sipnap-doc" className="max-w-4xl mx-auto space-y-4">
                {/* Official Letterhead (Kop Surat) */}
                <div className="border-b-2 border-black pb-3 text-center">
                  <h1 className="text-xl font-black uppercase tracking-wide">{branchName}</h1>
                  <p className="text-xs text-slate-700 mt-0.5">{branchAddress}</p>
                  <div className="text-[11px] font-semibold text-slate-800 flex justify-center gap-6 mt-1">
                    <span>No. SIA: <b>{siaNumber}</b></span>
                    <span>No. SIPA APJ: <b>{sipaNumber}</b></span>
                  </div>
                </div>

                {/* Report Header Title */}
                <div className="text-center pt-1">
                  <h2 className="text-sm font-bold uppercase tracking-wide">
                    LAPORAN PENGGUNAAN NARKOTIKA, PSIKOTROPIKA DAN PREKURSOR FARMASI
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    PERIODE PELAPORAN: BULAN {MONTH_NAMES[selectedMonth - 1].toUpperCase()} TAHUN {selectedYear}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Sesuai Peraturan Menteri Kesehatan RI Nomor 3 Tahun 2015
                  </p>
                </div>

                {/* Report Table */}
                <table className="w-full border-collapse border border-black text-[9.5pt] mt-3">
                  <thead>
                    <tr className="bg-slate-100 border border-black font-bold text-center">
                      <th className="border border-black p-1.5 w-8">No</th>
                      <th className="border border-black p-1.5 text-left">Nama Obat</th>
                      <th className="border border-black p-1.5 w-24">Golongan</th>
                      <th className="border border-black p-1.5 w-24">Bentuk & Satuan</th>
                      <th className="border border-black p-1.5 w-20 text-right">Saldo Awal</th>
                      <th className="border border-black p-1.5 w-24 text-right">Masuk (PBF)</th>
                      <th className="border border-black p-1.5 w-24 text-right">Keluar (Resep)</th>
                      <th className="border border-black p-1.5 w-20 text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.items?.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-black p-4 text-center text-slate-500 italic">
                          Nihil (Tidak ada mutasi obat terkontrol pada periode ini)
                        </td>
                      </tr>
                    ) : (
                      reportData?.items?.map((item, idx) => (
                        <tr key={idx} className="border border-black">
                          <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-black p-1 font-semibold">{item.medicine_name}</td>
                          <td className="border border-black p-1 text-center uppercase text-[8.5pt]">
                            {item.classification}
                          </td>
                          <td className="border border-black p-1 text-center text-[8.5pt]">
                            {item.dosage_form} ({item.unit_name})
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.initial_stock.toLocaleString('id-ID')}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.total_in.toLocaleString('id-ID')}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.total_out.toLocaleString('id-ID')}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-bold">
                            {item.final_stock.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border border-black">
                      <td colSpan={4} className="border border-black p-1.5 text-center">
                        TOTAL AKUMULASI
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {summaryTotals.initialStock.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {summaryTotals.totalIn.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {summaryTotals.totalOut.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {summaryTotals.finalStock.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signature / Pengesahan Section */}
                <div className="pt-6 grid grid-cols-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">Tembusan disampaikan kepada:</p>
                    <ol className="list-decimal list-inside text-[10px] text-slate-600 mt-1 space-y-0.5">
                      <li>Kepala Dinas Kesehatan Provinsi</li>
                      <li>Kepala Dinas Kesehatan Kabupaten/Kota</li>
                      <li>Kepala Balai Besar Pengawas Obat dan Makanan (BBPOM)</li>
                      <li>Arsip Apotek</li>
                    </ol>
                  </div>

                  <div className="text-center ml-auto w-64">
                    <p className="text-slate-800">
                      Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-800 mt-0.5">Apoteker Penanggung Jawab (APJ)</p>
                    
                    {/* Space for physical signature & pharmacy stamp */}
                    <div className="h-20 flex items-center justify-center text-slate-300 italic text-[10px]">
                      (Tanda Tangan & Cap Stempel Apotek)
                    </div>

                    <p className="font-black text-slate-900 underline">{pharmacistName}</p>
                    <p className="text-[10px] text-slate-700">SIPA: {sipaNumber}</p>
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
