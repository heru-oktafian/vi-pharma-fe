import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Plus, Printer, Eye, Edit3, Trash2, FileText, CheckCircle2, Clock } from 'lucide-react';
import { getPurchaseOrders } from '../../services/procurementApi';

export default function PurchaseOrdersListView({
  token,
  userRole,
  theme = 'dark',
  branch,
  spTypeFilter = 'ALL',
  refreshKey = 0,
  onOpenCreate,
  onOpenDetail,
  onOpenPrint,
}) {
  const isLight = theme === 'light';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
        search: search,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (spTypeFilter !== 'ALL') params.sp_type = spTypeFilter;

      const res = await getPurchaseOrders(token, params, branch?.id);
      setOrders(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, spTypeFilter, branch?.id, token, refreshKey]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Filter & Action Bar */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor SP, nama PBF, apoteker..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
            }`}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'DRAFT', 'ORDERED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'text-slate-400 border-slate-700/50 hover:bg-slate-700/30'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}

          <button
            onClick={loadOrders}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition ml-1"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreate}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md ml-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Surat Pesanan</span>
          </button>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Nomor Surat Pesanan</th>
                <th className="py-2.5 px-3">Distributor PBF</th>
                <th className="py-2.5 px-3">Tanggal Pesan</th>
                <th className="py-2.5 px-3 text-center">Jenis SP</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Jumlah Item</th>
                <th className="py-2.5 px-3 text-right">Estimasi Total</th>
                <th className="py-2.5 px-3">Apoteker APJ</th>
                <th className="py-2.5 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Memuat daftar Surat Pesanan...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                    <span>Belum ada Surat Pesanan yang tercatat untuk filter ini.</span>
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const isDone = po.status === 'COMPLETED';
                  const isOrdered = po.status === 'ORDERED';
                  const isDraft = po.status === 'DRAFT';

                  return (
                    <tr key={po.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-500/5'}`}>
                      <td className={`py-2.5 px-3 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        {po.po_number}
                      </td>
                      <td className={`py-2.5 px-3 font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {po.supplier?.name || '-'}
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {po.order_date?.slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          po.sp_type === 'NARKOTIKA'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : po.sp_type === 'PSIKOTROPIKA'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {po.sp_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-500/15 text-token-emerald border border-token-emerald/30'
                            : isOrdered
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : isDraft
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-center font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                        {po.total_items}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-token-emerald">
                        Rp {(po.total_estimated_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className={`py-2.5 px-3 text-[11px] truncate max-w-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {po.pharmacist_name}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenDetail?.(po)}
                            className="p-1 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white hover:bg-slate-500/20 transition"
                            title="Detail SP"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenPrint?.(po)}
                            className="p-1 rounded-lg border border-purple-500/30 text-purple-400 hover:text-white hover:bg-purple-500/20 transition"
                            title="Cetak SP Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
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
    </div>
  );
}
