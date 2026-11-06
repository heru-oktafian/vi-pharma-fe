import React, { useState, useEffect } from 'react';
import {
  X, Search, RefreshCw, Printer, Calendar, User, CheckCircle2,
  AlertCircle, ChevronRight, Hash, DollarSign, Tag, RotateCcw
} from 'lucide-react';
import { getSalesHistory, getSaleDetail } from '../../services/posApi';
import SaleEtiketModal from './SaleEtiketModal';
import SalesReturnModal from './SalesReturnModal';
import SalesReturnReceiptModal from './SalesReturnReceiptModal';

export default function SalesHistoryModal({
  isOpen,
  onClose,
  token,
  branchId,
  theme = 'dark',
  onPrintReceipt,
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Sale Etiket Modal State
  const [etiketModalOpen, setEtiketModalOpen] = useState(false);
  const [selectedSaleForEtiket, setSelectedSaleForEtiket] = useState(null);

  // Sales Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState(null);
  const [returnReceiptOpen, setReturnReceiptOpen] = useState(false);
  const [createdReturn, setCreatedReturn] = useState(null);

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const getItemNames = (sale) => {
    if (!sale?.items || sale.items.length === 0) {
      return sale?.notes || 'PENJUALAN KASIR POS';
    }
    const names = sale.items
      .map((it) => it.medicine?.name || it.name || it.medicine_id)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : (sale?.notes || 'PENJUALAN KASIR POS');
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await getSalesHistory(token, {
        search: search.trim() || undefined,
        payment_method: selectedMethod || undefined,
        start_date: selectedDate || undefined,
        end_date: selectedDate || undefined,
        limit: 50,
      }, branchId);

      const items = res?.data || (Array.isArray(res) ? res : []);
      setSales(items);
      setTotalCount(res?.total_items || items.length);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [token, branchId, selectedMethod, selectedDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  const handleSelectToPrint = async (sale) => {
    try {
      const full = await getSaleDetail(sale.id, token, branchId);
      onPrintReceipt(full);
    } catch (err) {
      onPrintReceipt(sale);
    }
  };

  const handleOpenSaleEtiket = async (sale) => {
    try {
      const full = await getSaleDetail(sale.id, token, branchId);
      setSelectedSaleForEtiket(full);
      setEtiketModalOpen(true);
    } catch (err) {
      console.error('Failed to get sale details for etiket:', err);
      setSelectedSaleForEtiket(sale);
      setEtiketModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-token-emerald" />
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Riwayat Transaksi Penjualan Kasir
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Audit log transaksi penjualan POS dan pencetakan ulang struk thermal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-token-inner/50 border-token-border'
        }`}>
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari no. transaksi, obat, atau pelanggan..."
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-token-emerald hover:bg-token-emerald-dark text-slate-950 transition"
            >
              Cari
            </button>
          </form>

          <div className="flex items-center flex-wrap gap-2">
            {/* Filter Tanggal */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`pl-8 pr-2 py-1.5 text-xs rounded-xl border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                  }`}
                  title="Filter Berdasarkan Tanggal Transaksi"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="ml-1 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition text-xs"
                    title="Hapus Filter Tanggal (Tampilkan Semua)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  setSelectedDate(selectedDate === todayStr ? '' : todayStr);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-token-emerald text-slate-950 border-token-emerald font-bold'
                    : isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-token-card border-token-border text-slate-300 hover:bg-slate-700'
                }`}
                title="Filter Transaksi Hari Ini"
              >
                Hari Ini
              </button>
            </div>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
              }`}
            >
              <option value="">Semua Metode Pembayaran</option>
              <option value="TUNAI">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
              <option value="DEBIT">Kartu Debit</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>

            <button
              onClick={loadHistory}
              disabled={loading}
              className={`p-1.5 rounded-xl border text-xs transition ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-token-card border-token-border text-slate-300 hover:bg-slate-700'
              }`}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className={`sticky top-0 text-[10px] uppercase font-bold tracking-wider border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-token-inner border-token-border text-slate-400'
            }`}>
              <tr>
                <th className="py-2.5 px-4 text-left w-48 sm:w-56">No. Transaksi</th>
                <th className="py-2.5 px-4 text-left">Detail</th>
                <th className="py-2.5 px-4 text-center w-64">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token-border/40">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-token-emerald" />
                    <span>Memuat riwayat transaksi kasir...</span>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    Belum ada transaksi penjualan yang tercatat.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s.id}
                    className={`transition ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-token-inner/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-token-emerald align-top whitespace-nowrap">
                      {s.invoice_number}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className={`font-bold uppercase tracking-tight text-xs leading-snug ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {getItemNames(s)}
                      </div>
                      <div className={`text-[11px] font-mono mt-1 ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {formatDateTime(s.created_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        <button
                          onClick={() => handleSelectToPrint(s)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-500/30 hover:border-token-emerald text-token-emerald transition inline-flex items-center gap-1.5 whitespace-nowrap"
                          title="Cetak Ulang Struk Kasir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Struk</span>
                        </button>
                        <button
                          onClick={() => handleOpenSaleEtiket(s)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-500/30 hover:border-blue-400 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition inline-flex items-center gap-1.5 whitespace-nowrap"
                          title="Cetak Etiket Obat Transaksi Ini"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Etiket</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSaleForReturn(s);
                            setReturnModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-500/30 hover:border-rose-400 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition inline-flex items-center gap-1.5 whitespace-nowrap"
                          title="Proses Retur Penjualan Pasien"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retur</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={`p-3 px-5 border-t flex items-center justify-between text-xs text-slate-400 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div>
            Total tercatat: <strong className="text-white font-mono">{totalCount}</strong> transaksi
            {selectedDate && (
              <span className="ml-1 text-token-emerald font-semibold">
                (Filter Tanggal: {selectedDate})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sale Etiket Modal */}
      <SaleEtiketModal
        isOpen={etiketModalOpen}
        onClose={() => setEtiketModalOpen(false)}
        sale={selectedSaleForEtiket}
        branch={{ id: branchId }}
        theme={theme}
      />

      {/* Sales Return Modal */}
      <SalesReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        initialSale={selectedSaleForReturn}
        branch={{ id: branchId }}
        token={token}
        theme={theme}
        onSuccess={(created) => {
          loadHistory();
          setCreatedReturn(created);
          setReturnReceiptOpen(true);
        }}
      />

      {/* Return Thermal Receipt Modal */}
      <SalesReturnReceiptModal
        isOpen={returnReceiptOpen}
        onClose={() => setReturnReceiptOpen(false)}
        ret={createdReturn}
        branch={{ id: branchId }}
        theme={theme}
      />
    </div>
  );
}
