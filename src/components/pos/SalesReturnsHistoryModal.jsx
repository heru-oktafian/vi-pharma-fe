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

  const loadReturns = async () => {
    try {
      setLoading(true);
      const res = await getSalesReturns(token, {
        search: search.trim() || undefined,
        refund_type: selectedRefundType || undefined,
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
  }, [token, branchId, selectedRefundType]);

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
                placeholder="Cari no. retur, no. struk asal, atau nama pelanggan..."
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

          <div className="flex items-center gap-2">
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
                <th className="py-2.5 px-4 text-left">No. Retur & Struk Asal</th>
                <th className="py-2.5 px-4 text-left">Tanggal Retur</th>
                <th className="py-2.5 px-4 text-left">Pelanggan</th>
                <th className="py-2.5 px-4 text-left">Alasan</th>
                <th className="py-2.5 px-4 text-center">Bentuk Refund</th>
                <th className="py-2.5 px-4 text-right">Nilai Refund</th>
                <th className="py-2.5 px-4 text-left">Kasir</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token-border/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-rose-400" />
                    <span>Memuat riwayat retur penjualan...</span>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
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
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-bold text-rose-400">
                        {ret.return_number}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Struk: {ret.invoice_number}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(ret.created_at || ret.return_date).toLocaleString('id-ID')}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-slate-200">
                      {ret.customer_name}
                    </td>

                    <td className="py-2.5 px-4 text-slate-300 text-[11px]">
                      {ret.reason?.replace(/_/g, ' ')}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      {getRefundBadge(ret.refund_type)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono font-extrabold text-rose-400 whitespace-nowrap">
                      {formatIDR(ret.total_amount)}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400 capitalize">
                      {ret.cashier?.name || 'Kasir'}
                    </td>

                    <td className="py-2.5 px-4 text-center">
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
