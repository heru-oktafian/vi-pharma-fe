import React, { useState, useEffect } from 'react';
import {
  X, RotateCcw, Search, RefreshCw, Printer, Calendar, User, CheckCircle2,
  AlertCircle, ChevronRight, Hash, DollarSign
} from 'lucide-react';
import { getSalesReturns, getSalesReturnDetail } from '../../services/posApi';
import SalesReturnReceiptModal from './SalesReturnReceiptModal';

export default function SalesReturnsHistoryModal({
  isOpen,
  onClose,
  token,
  branchId,
  theme = 'dark',
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRefundType, setSelectedRefundType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReturnForReceipt, setSelectedReturnForReceipt] = useState(null);

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

  const getItemNames = (ret) => {
    if (!ret?.items || ret.items.length === 0) {
      return ret?.reason?.replace(/_/g, ' ') || 'RETUR PENJUALAN PASIEN';
    }
    const names = ret.items
      .map((it) => it.medicine?.name || it.name || it.medicine_id)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : (ret?.reason?.replace(/_/g, ' ') || 'RETUR PENJUALAN PASIEN');
  };

  const loadReturns = async () => {
    try {
      setLoading(true);
      const res = await getSalesReturns(token, {
        search: search.trim() || undefined,
        refund_type: selectedRefundType || undefined,
        start_date: selectedDate || undefined,
        end_date: selectedDate || undefined,
        limit: 50,
      }, branchId);

      const items = res?.data || (Array.isArray(res) ? res : []);
      setReturns(items);
      setTotalCount(res?.total_items || items.length);
    } catch (err) {
      console.error('Failed to load sales returns history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [token, branchId, selectedRefundType, selectedDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReturns();
  };

  const handlePrintReceipt = async (ret) => {
    try {
      const full = await getSalesReturnDetail(ret.id, token, branchId);
      setSelectedReturnForReceipt(full || ret);
      setReceiptModalOpen(true);
    } catch (err) {
      setSelectedReturnForReceipt(ret);
      setReceiptModalOpen(true);
    }
  };

  const getRefundBadge = (type) => {
    switch (type) {
      case 'REFUND_KAS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Kas Tunai</span>;
      case 'REFUND_TRANSFER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">Transfer Bank</span>;
      case 'TUKAR_BARANG':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">Tukar Obat</span>;
      default:
        return <span className="text-[10px] text-slate-400">{type}</span>;
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
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Riwayat Retur Penjualan Kasir (Pasien)
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Audit log pengembalian obat dari pasien dan pencetakan ulang nota retur
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
                placeholder="Cari no. retur, struk, obat, atau pelanggan..."
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
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
                  title="Filter Berdasarkan Tanggal Retur"
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
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-token-card border-token-border text-slate-300 hover:bg-slate-700'
                }`}
                title="Filter Retur Hari Ini"
              >
                Hari Ini
              </button>
            </div>

            <select
              value={selectedRefundType}
              onChange={(e) => setSelectedRefundType(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
              }`}
            >
              <option value="">Semua Metode Refund</option>
              <option value="REFUND_KAS">Kas Tunai Kasir</option>
              <option value="REFUND_TRANSFER">Transfer Bank</option>
              <option value="TUKAR_BARANG">Tukar Obat</option>
            </select>

            <button
              onClick={loadReturns}
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

        {/* Returns Table */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className={`sticky top-0 text-[10px] uppercase font-bold tracking-wider border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-token-inner border-token-border text-slate-400'
            }`}>
              <tr>
                <th className="py-2.5 px-4 text-left w-48 sm:w-56">No. Retur</th>
                <th className="py-2.5 px-4 text-left">Detail</th>
                <th className="py-2.5 px-4 text-center w-48 sm:w-56">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token-border/40">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-rose-400" />
                    <span>Memuat riwayat retur penjualan...</span>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    Belum ada transaksi retur penjualan yang tercatat.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr
                    key={ret.id}
                    className={`transition ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-token-inner/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-rose-400 align-top whitespace-nowrap">
                      <div>{ret.return_number}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-normal">
                        Struk: {ret.invoice_number}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className={`font-bold uppercase tracking-tight text-xs leading-snug ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {getItemNames(ret)}
                      </div>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className={`text-[11px] font-mono ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {formatDateTime(ret.created_at || ret.return_date)}
                        </span>
                        <span className="text-slate-500 text-[10px]">•</span>
                        {getRefundBadge(ret.refund_type)}
                        <span className="text-slate-500 text-[10px]">•</span>
                        <span className="font-mono font-bold text-rose-400 text-[11px]">
                          {formatIDR(ret.total_amount)}
                        </span>
                        {ret.reason && (
                          <>
                            <span className="text-slate-500 text-[10px]">•</span>
                            <span className="text-[10px] text-slate-400 italic">
                              ({ret.reason.replace(/_/g, ' ')})
                            </span>
                          </>
                        )}
                        {ret.customer_name && ret.customer_name !== 'Pelanggan Umum' && (
                          <>
                            <span className="text-slate-500 text-[10px]">•</span>
                            <span className="text-[10px] text-slate-300">
                              Pasien: {ret.customer_name}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <button
                        onClick={() => handlePrintReceipt(ret)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-500/30 hover:border-rose-400 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition inline-flex items-center gap-1.5 whitespace-nowrap"
                        title="Cetak Ulang Nota Retur Kasir"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Nota</span>
                      </button>
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
            Total tercatat: <strong className="text-white font-mono">{totalCount}</strong> retur
            {selectedDate && (
              <span className="ml-1 text-rose-400 font-semibold">
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

      {/* Sales Return Receipt Modal */}
      <SalesReturnReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        ret={selectedReturnForReceipt}
        branch={{ id: branchId }}
        theme={theme}
      />
    </div>
  );
}
