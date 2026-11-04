import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Clock, AlertCircle, Trash2, Edit3, ShieldAlert, ArrowRight } from 'lucide-react';
import { updatePOStatus, deletePurchaseOrder } from '../../services/procurementApi';

export default function PurchaseOrderDetailModal({
  isOpen,
  onClose,
  po,
  branch,
  token,
  theme = 'dark',
  onPrint,
  onEdit,
  onRefresh
}) {
  if (!isOpen || !po) return null;

  const isLight = theme === 'light';
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Konfirmasi ubah status Surat Pesanan menjadi "${newStatus}"?`)) return;

    setLoadingAction(true);
    setError('');
    try {
      await updatePOStatus(po.id, newStatus, '', token, branch?.id);
      onRefresh?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengubah status SP');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Konfirmasi hapus draft Surat Pesanan "${po.po_number}"?`)) return;

    setLoadingAction(true);
    setError('');
    try {
      await deletePurchaseOrder(po.id, token, branch?.id);
      onRefresh?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menghapus draft SP');
    } finally {
      setLoadingAction(false);
    }
  };

  const isDraft = po.status === 'DRAFT';
  const isOrdered = po.status === 'ORDERED';
  const isCompleted = po.status === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-3xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                {po.po_number}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                po.sp_type === 'NARKOTIKA'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : po.sp_type === 'PSIKOTROPIKA'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                SP {po.sp_type}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCompleted
                  ? 'bg-emerald-500/20 text-token-emerald border border-token-emerald/40'
                  : isOrdered
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {po.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Distributor PBF: <strong>{po.supplier?.name}</strong> • Tanggal: {po.order_date?.slice(0, 10)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint?.(po)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md"
              title="Cetak Format Resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak SP</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border hover:bg-slate-500/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* APJ & Distributor Info Card */}
          <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
          }`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Apoteker Pemesan (APJ)
              </span>
              <p className="font-bold text-sm">{po.pharmacist_name}</p>
              <p className="font-mono text-slate-400 mt-0.5">SIPA: {po.pharmacist_sipa}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Distributor PBF
              </span>
              <p className="font-bold text-sm">{po.supplier?.name}</p>
              <p className="text-slate-400 mt-0.5">{po.supplier?.address || 'Alamat PBF'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-slate-200 dark:border-token-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-500/10 text-[10px] text-slate-400 uppercase border-b border-token-border">
                <tr>
                  <th className="py-2.5 px-3">Nama Obat</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Qty Pesan</th>
                  <th className="py-2.5 px-3 text-right">Estimasi Harga</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-token-border/40">
                {(po.items || []).map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 font-semibold">
                      {it.medicine?.name || '-'}
                      {it.medicine?.item_code && (
                        <span className="block text-[10px] text-slate-500 font-mono">
                          Kode: {it.medicine.item_code}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 border border-slate-500/20">
                        {it.unit?.name || 'Pcs'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                      {it.qty_ordered}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      Rp {(it.estimated_price || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-token-emerald">
                      Rp {(it.subtotal || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {it.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-500/10 font-bold border-t border-token-border">
                  <td colSpan="4" className="py-2 px-3 text-right text-slate-400">
                    Total Estimasi Tagihan:
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-token-emerald font-extrabold text-sm">
                    Rp {(po.total_estimated_amount || 0).toLocaleString('id-ID')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {po.notes && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-token-border text-xs">
              <span className="font-bold text-slate-400 block mb-1">Catatan Tambahan:</span>
              <p className="text-slate-300">{po.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
        }`}>
          <div>
            {isDraft && (
              <button
                onClick={handleDelete}
                disabled={loadingAction}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Draft SP</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDraft && (
              <button
                onClick={() => {
                  onEdit?.(po);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border hover:bg-slate-500/10 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit SP</span>
              </button>
            )}

            {isDraft && (
              <button
                onClick={() => handleStatusChange('ORDERED')}
                disabled={loadingAction}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-md"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Tandai Sudah Dipesan ke PBF</span>
              </button>
            )}

            {isOrdered && (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={loadingAction}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Selesai Diterima</span>
              </button>
            )}

            {!isCompleted && po.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={loadingAction}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
              >
                Batalkan SP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
