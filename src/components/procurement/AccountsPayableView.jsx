import React, { useState, useEffect } from 'react';
import {
  DollarSign, AlertTriangle, Clock, CheckCircle2, Search, RefreshCw,
  Calendar, Building2, Filter, ArrowUpDown, ChevronRight, Eye, CreditCard
} from 'lucide-react';
import { getAccountsPayableSummary, getAccountsPayableInvoices, getPurchaseInvoiceDetail } from '../../services/inventoryApi';
import { getSuppliers } from '../../services/masterDataApi';
import InvoicePaymentModal from './InvoicePaymentModal';

export default function AccountsPayableView({
  token,
  userRole,
  theme = 'dark',
  branch,
  refreshKey = 0
}) {
  const isLight = theme === 'light';

  // KPI Summary
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Invoices List
  const [invoices, setInvoices] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [suppliers, setSuppliers] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UNPAID, PARTIAL, OVERDUE, DUE_SOON, PAID
  const [sortBy, setSortBy] = useState('due_date_asc');

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load initial suppliers
  useEffect(() => {
    getSuppliers(token)
      .then(res => setSuppliers(Array.isArray(res) ? res : []))
      .catch(err => console.warn('Could not load suppliers for AP filter:', err));
  }, [token]);

  // Load Summary
  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await getAccountsPayableSummary(token, branch?.id);
      setSummary(res);
    } catch (err) {
      console.error('Failed to load accounts payable summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Load Invoices with filters
  const loadInvoices = async () => {
    try {
      setLoadingList(true);
      const params = {
        page: 1,
        limit: 100,
        search: search,
        supplier_id: selectedSupplier,
        sort_by: sortBy,
      };

      if (statusFilter === 'UNPAID') params.status = 'UNPAID';
      else if (statusFilter === 'PARTIAL') params.status = 'PARTIAL';
      else if (statusFilter === 'PAID') params.status = 'PAID';
      else if (statusFilter === 'OVERDUE') params.is_overdue = true;
      else if (statusFilter === 'DUE_SOON') params.due_soon = true;

      const res = await getAccountsPayableInvoices(token, params, branch?.id);
      setInvoices(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load AP invoices:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [branch?.id, token, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedSupplier, statusFilter, sortBy, branch?.id, token, refreshKey]);

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  const handleOpenDetail = async (inv) => {
    try {
      setLoadingDetail(true);
      setDetailModalOpen(true);
      const full = await getPurchaseInvoiceDetail(inv.id, token);
      setDetailInvoice(full || inv);
    } catch (err) {
      console.warn('Failed to load invoice items:', err);
      setDetailInvoice(inv);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefreshAll = () => {
    loadSummary();
    loadInvoices();
  };

  // Due Date calculation helper
  const getDueStatus = (dueDateStr, paymentStatus) => {
    if (paymentStatus === 'PAID') {
      return {
        label: 'Lunas',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
      };
    }
    if (!dueDateStr) {
      return {
        label: 'Tanpa Jatuh Tempo',
        badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        icon: Clock,
      };
    }

    const due = new Date(dueDateStr);
    const now = new Date();
    // Reset time components for clean day diff
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Lewat ${Math.abs(diffDays)} Hari!`,
        badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
        icon: AlertTriangle,
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return {
        label: 'Jatuh Tempo Hari Ini!',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold',
        icon: AlertTriangle,
        isOverdue: true,
      };
    } else if (diffDays <= 7) {
      return {
        label: `${diffDays} Hari Lagi`,
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/35',
        icon: Clock,
        isDueSoon: true,
      };
    } else {
      return {
        label: `${diffDays} Hari Lagi`,
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
        icon: Clock,
      };
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Outstanding Debt */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-token-card border-token-border'
        }`}>
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Hutang Berjalan (PBF)
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-purple-400 block truncate">
              Rp {Math.round(summary?.total_outstanding_debt || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {summary?.unpaid_invoices_count || 0} faktur belum lunas
            </span>
          </div>
        </div>

        {/* Card 2: Overdue Invoices (Macet) */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          summary?.overdue_count > 0
            ? 'bg-rose-500/10 border-rose-500/30'
            : isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
        }`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${
            summary?.overdue_count > 0
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
              <span>Jatuh Tempo (Lewat Batas)</span>
              {summary?.overdue_count > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-400 block truncate">
              Rp {Math.round(summary?.overdue_debt || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-rose-300 font-semibold block truncate">
              {summary?.overdue_count || 0} faktur macet / resiko stop supply!
            </span>
          </div>
        </div>

        {/* Card 3: Due Soon (< 7 Days) */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          summary?.due_soon_count > 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
        }`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${
            summary?.due_soon_count > 0
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Jatuh Tempo dlm 7 Hari
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-400 block truncate">
              Rp {Math.round(summary?.due_soon_debt || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-amber-300 font-semibold block truncate">
              {summary?.due_soon_count || 0} faktur mendekati tempo
            </span>
          </div>
        </div>

        {/* Card 4: Total Paid This Month */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-token-card border-token-border'
        }`}>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Pelunasan Hutang Bulan Ini
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-400 block truncate">
              Rp {Math.round(summary?.total_paid_this_month || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              Kas keluar apotek terverifikasi
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Filter Bar */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col lg:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Faktur atau Nama PBF..."
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
              }`}
            />
          </div>

          {/* Supplier Dropdown */}
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className={`text-xs py-1.5 px-2.5 rounded-xl border transition w-full sm:w-56 truncate ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-slate-200'
            }`}
          >
            <option value="">Semua Distributor PBF</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`text-xs py-1.5 px-2.5 rounded-xl border transition w-full sm:w-48 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-slate-200'
            }`}
          >
            <option value="due_date_asc">Jatuh Tempo Terdekat</option>
            <option value="due_date_desc">Jatuh Tempo Terjauh</option>
            <option value="debt_desc">Sisa Hutang Terbesar</option>
            <option value="date_desc">Tanggal Faktur Terbaru</option>
          </select>
        </div>

        {/* Quick Filter Tabs & Action */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto justify-end">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'UNPAID', label: 'Belum Lunas' },
            { id: 'PARTIAL', label: 'Cicilan' },
            { id: 'OVERDUE', label: 'Lewat Tempo' },
            { id: 'DUE_SOON', label: '< 7 Hari' },
            { id: 'PAID', label: 'Lunas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'text-slate-400 border-slate-700/50 hover:bg-slate-700/30'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={handleRefreshAll}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition ml-1"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Invoices Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">No. Faktur PBF</th>
                <th className="py-2.5 px-3">Distributor PBF</th>
                <th className="py-2.5 px-3">Tanggal Faktur</th>
                <th className="py-2.5 px-3">Jatuh Tempo & Status</th>
                <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                <th className="py-2.5 px-3 text-right">Terbayar</th>
                <th className="py-2.5 px-3 text-right">Sisa Hutang</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loadingList && invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Memuat data hutang faktur PBF...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                    <span>Tidak ada data faktur hutang PBF yang cocok dengan kriteria filter.</span>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const total = parseFloat(inv.total_amount) || 0;
                  const paid = parseFloat(inv.paid_amount) || 0;
                  const remaining = Math.max(0, total - paid);
                  const isPaid = inv.payment_status === 'PAID';
                  const isPartial = inv.payment_status === 'PARTIAL';
                  const dueInfo = getDueStatus(inv.due_date, inv.payment_status);
                  const DueIcon = dueInfo.icon;

                  return (
                    <tr
                      key={inv.id}
                      className={`transition ${
                        dueInfo.isOverdue
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : isLight ? 'hover:bg-slate-50' : 'hover:bg-token-inner/40'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                          <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>{inv.invoice_number}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Metode: <span className="font-semibold">{inv.payment_type || 'CREDIT'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {inv.supplier?.name || '-'}
                        </div>
                        {inv.supplier?.phone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Telp: {inv.supplier.phone}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap text-[11px]">
                        {inv.invoice_date ? inv.invoice_date.slice(0, 10) : '-'}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="font-mono text-slate-200 text-xs">
                            {inv.due_date ? inv.due_date.slice(0, 10) : '-'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${dueInfo.badgeClass}`}>
                            <DueIcon className="w-3 h-3" />
                            <span>{dueInfo.label}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300 whitespace-nowrap">
                        Rp {Math.round(total).toLocaleString('id-ID')}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        Rp {Math.round(paid).toLocaleString('id-ID')}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={remaining > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          Rp {Math.round(remaining).toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Lunas
                          </span>
                        ) : isPartial ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Dicicil
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Belum Bayar
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                            title="Catat Pembayaran / Pelunasan Hutang"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>{isPaid ? 'Riwayat' : 'Bayar'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenDetail(inv)}
                            className="p-1 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
                            title="Lihat Detail Item Obat Faktur"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Payment Modal */}
      <InvoicePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={selectedInvoice}
        branch={branch}
        token={token}
        theme={theme}
        onSuccess={handleRefreshAll}
      />

      {/* Invoice Detail Quick Modal */}
      {detailModalOpen && detailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Rincian Item Faktur: {detailInvoice.invoice_number}
                </h3>
                <p className="text-xs text-slate-400">
                  Distributor: {detailInvoice.supplier?.name} • Tanggal: {detailInvoice.invoice_date?.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1 rounded-lg border hover:bg-slate-500/20 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-token-inner/80 text-slate-400 border-token-border'
                }`}>
                  <tr>
                    <th className="py-2 px-2.5 w-8">#</th>
                    <th className="py-2 px-2.5">Nama Obat</th>
                    <th className="py-2 px-2.5">No. Batch & ED</th>
                    <th className="py-2 px-2.5 text-center">Jumlah Beli</th>
                    <th className="py-2 px-2.5 text-right">Harga Beli</th>
                    <th className="py-2 px-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-token-border/50">
                  {detailInvoice.items?.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-2 px-2.5 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-semibold text-slate-200">{it.medicine?.name || it.medicine_id}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-300">
                        {it.batch_number} {it.expired_date ? `(ED: ${it.expired_date.slice(0, 10)})` : ''}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold">
                        {it.qty_purchased} {it.unit?.name || 'Satuan'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono">
                        Rp {Math.round(it.buy_price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-purple-400">
                        Rp {Math.round(it.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`p-4 border-t flex justify-end shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-token-border text-slate-300 hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
