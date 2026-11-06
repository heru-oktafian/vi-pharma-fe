import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Plus, Printer, Eye, Trash2, RotateCcw, AlertTriangle, ArrowLeftRight, CheckCircle2, Clock, XCircle, FileSpreadsheet } from 'lucide-react';
import { getPurchaseReturns, deletePurchaseReturn } from '../../services/procurementApi';

export default function PurchaseReturnsListView({
  token,
  userRole,
  theme = 'dark',
  branch,
  refreshKey = 0,
  onOpenCreate,
  onOpenDetail,
  onOpenPrint,
}) {
  const isLight = theme === 'light';
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [compensationFilter, setCompensationFilter] = useState('ALL');

  const loadReturns = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
        search: search,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (reasonFilter !== 'ALL') params.reason = reasonFilter;
      if (compensationFilter !== 'ALL') params.compensation_type = compensationFilter;

      const res = await getPurchaseReturns(token, params, branch?.id);
      setReturns(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load purchase returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReturns();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, reasonFilter, compensationFilter, branch?.id, token, refreshKey]);

  const handleDelete = async (ret) => {
    if (!window.confirm(`Yakin ingin menghapus berkas retur ${ret.return_number}? Draft ini belum diproses.`)) {
      return;
    }
    try {
      await deletePurchaseReturn(ret.id, token, branch?.id);
      loadReturns();
    } catch (err) {
      alert(`Gagal menghapus retur: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 justify-center">
            <Clock className="w-3 h-3" />
            <span>DRAFT</span>
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 justify-center">
            <ArrowLeftRight className="w-3 h-3" />
            <span>DIAJUKAN</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 justify-center">
            <CheckCircle2 className="w-3 h-3" />
            <span>SELESAI (STOK DIPOTONG)</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 justify-center">
            <XCircle className="w-3 h-3" />
            <span>DIBATALKAN</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getCompensationBadge = (comp) => {
    switch (comp) {
      case 'POTONG_FAKTUR':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25">Potong Faktur</span>;
      case 'TUKAR_BARANG':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">Tukar Barang</span>;
      case 'REFUND_DANA':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Refund Kas</span>;
      default:
        return <span className="text-[10px] text-slate-400">{comp || '-'}</span>;
    }
  };

  const getReasonBadge = (reason) => {
    switch (reason) {
      case 'KADALUARSA_ED':
        return <span className="text-[10px] font-semibold text-rose-400">Kadaluarsa (ED)</span>;
      case 'RUSAK_KEMASAN':
        return <span className="text-[10px] font-semibold text-amber-400">Kemasan Rusak</span>;
      case 'SALAH_KIRIM':
        return <span className="text-[10px] font-semibold text-blue-400">Salah Kirim PBF</span>;
      case 'RECALL_BPOM':
        return <span className="text-[10px] font-semibold text-red-500">Recall BPOM</span>;
      default:
        return <span className="text-[10px] text-slate-400">{reason || 'Lainnya'}</span>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Filter & Action Bar */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col lg:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor retur, nama PBF, nomor faktur..."
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
              }`}
            />
          </div>

          {/* Quick Filter: Alasan & Kompensasi */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className={`text-xs py-1.5 px-2.5 rounded-xl border transition ${
              isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-token-inner border-token-border text-slate-200'
            }`}
          >
            <option value="ALL">Semua Alasan</option>
            <option value="KADALUARSA_ED">Kadaluarsa (ED)</option>
            <option value="RUSAK_KEMASAN">Rusak Kemasan</option>
            <option value="SALAH_KIRIM">Salah Kirim PBF</option>
            <option value="RECALL_BPOM">Recall Resmi BPOM</option>
            <option value="LAINNYA">Lainnya</option>
          </select>

          <select
            value={compensationFilter}
            onChange={(e) => setCompensationFilter(e.target.value)}
            className={`text-xs py-1.5 px-2.5 rounded-xl border transition ${
              isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-token-inner border-token-border text-slate-200'
            }`}
          >
            <option value="ALL">Semua Kompensasi</option>
            <option value="POTONG_FAKTUR">Potong Faktur / Utang</option>
            <option value="TUKAR_BARANG">Tukar Guling Barang</option>
            <option value="REFUND_DANA">Refund Dana</option>
          </select>
        </div>

        {/* Status Filters & Action Buttons */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto justify-end">
          {['ALL', 'DRAFT', 'REQUESTED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'text-slate-400 border-slate-700/50 hover:bg-slate-700/30'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}

          <button
            onClick={loadReturns}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition ml-1"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreate}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-md ml-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Retur PBF</span>
          </button>
        </div>
      </div>

      {/* Returns Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Nomor Nota Retur</th>
                <th className="py-2.5 px-3">Distributor PBF</th>
                <th className="py-2.5 px-3">Tanggal Retur</th>
                <th className="py-2.5 px-3">Alasan & Kompensasi</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Jumlah Item</th>
                <th className="py-2.5 px-3 text-right">Nilai Retur</th>
                <th className="py-2.5 px-3">Petugas Pembuat</th>
                <th className="py-2.5 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && returns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-400" />
                    <span>Memuat berkas retur pembelian...</span>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40 text-rose-400" />
                    <span>Belum ada data Retur Pembelian ke PBF untuk filter ini.</span>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const isDraft = ret.status === 'DRAFT';
                  return (
                    <tr
                      key={ret.id}
                      className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-token-inner/40'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>{ret.return_number}</span>
                        </div>
                        {ret.invoice_number && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Faktur Asal: <span className="font-mono text-slate-300">{ret.invoice_number}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {ret.supplier?.name || ret.supplier_id}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {ret.supplier?.phone || ret.supplier?.address || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        {ret.return_date ? new Date(ret.return_date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          {getReasonBadge(ret.reason)}
                          {getCompensationBadge(ret.compensation_type)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {getStatusBadge(ret.status)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-200">
                        {ret.total_items} Obat
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        Rp {Math.round(ret.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {ret.created_by?.name || 'Petugas Apotek'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenDetail(ret)}
                            className="p-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                            title="Lihat Detail & Status"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenPrint(ret)}
                            className="p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Cetak Nota Retur PBF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {isDraft && ['superadmin', 'admin', 'pharmacist'].includes(userRole) && (
                            <button
                              onClick={() => handleDelete(ret)}
                              className="p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 transition"
                              title="Hapus Draft Retur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
