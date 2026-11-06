import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2, Clock, AlertCircle, Trash2, Edit3, RotateCcw, ArrowRight, ArrowLeftRight, XCircle, Building2, Calendar, FileSpreadsheet, Package } from 'lucide-react';
import { updateReturnStatus, deletePurchaseReturn, getPurchaseReturnDetail } from '../../services/procurementApi';

export default function PurchaseReturnDetailModal({
  isOpen,
  onClose,
  ret,
  branch,
  token,
  theme = 'dark',
  onPrint,
  onEdit,
  onRefresh
}) {
  if (!isOpen || !ret) return null;

  const isLight = theme === 'light';
  const [returnDetail, setReturnDetail] = useState(ret);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDetail() {
      if (!ret?.id) return;
      try {
        setLoadingDetail(true);
        const data = await getPurchaseReturnDetail(ret.id, token);
        if (data) {
          setReturnDetail(data);
        }
      } catch (err) {
        console.warn('Could not load full return detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    fetchDetail();
  }, [ret?.id, token]);

  const currentRet = returnDetail || ret;

  const handleStatusChange = async (newStatus) => {
    let confirmMsg = `Konfirmasi ubah status berkas retur menjadi "${newStatus}"?`;
    if (newStatus === 'COMPLETED') {
      confirmMsg = `PERINGATAN: Mengubah status menjadi COMPLETED akan secara otomatis MEMOTONG STOK OBAT dari inventori apotek (${currentRet.items?.length || 0} item). Tindakan ini tidak dapat dibatalkan. Lanjutkan?`;
    }

    if (!window.confirm(confirmMsg)) return;

    setLoadingAction(true);
    setError('');
    try {
      await updateReturnStatus(currentRet.id, newStatus, '', token, branch?.id);
      onRefresh?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengubah status retur');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Konfirmasi hapus draft berkas retur "${currentRet.return_number}"?`)) return;

    setLoadingAction(true);
    setError('');
    try {
      await deletePurchaseReturn(currentRet.id, token, branch?.id);
      onRefresh?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menghapus draft retur');
    } finally {
      setLoadingAction(false);
    }
  };

  const isDraft = currentRet.status === 'DRAFT';
  const isRequested = currentRet.status === 'REQUESTED';
  const isCompleted = currentRet.status === 'COMPLETED';
  const isCancelled = currentRet.status === 'CANCELLED';

  const getReasonLabel = (r) => {
    switch (r) {
      case 'KADALUARSA_ED': return 'Kadaluarsa (ED / Mendekati Expired)';
      case 'RUSAK_KEMASAN': return 'Kemasan Rusak / Cacat Fisik';
      case 'SALAH_KIRIM': return 'Salah Kirim / Tidak Sesuai SP';
      case 'RECALL_BPOM': return 'Recall Penarikan Batch Resmi BPOM';
      default: return r || 'Lainnya';
    }
  };

  const getCompensationLabel = (c) => {
    switch (c) {
      case 'POTONG_FAKTUR': return 'Potong Faktur / Saldo Tagihan Hutang';
      case 'TUKAR_BARANG': return 'Tukar Guling Barang Batch Baru';
      case 'REFUND_DANA': return 'Refund Dana Tunai / Transfer';
      default: return c || '-';
    }
  };

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
              <h3 className={`text-base font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>{currentRet.return_number}</span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isRequested
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : isCancelled
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {currentRet.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Berkas Resmi Retur Pembelian ke Distributor PBF
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPrint?.(currentRet)}
              className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1.5"
              title="Cetak Nota Retur Resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Nota Retur</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isCompleted && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Retur ini telah selesai. Seluruh stok obat fisik telah dipotong dari data inventori apotek dengan tipe mutasi <strong>RETUR_PBF</strong>.</span>
            </div>
          )}

          {/* Metadata Cards */}
          <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
          }`}>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distributor PBF Tujuan</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                {currentRet.supplier?.name || currentRet.supplier_id}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {currentRet.supplier?.address || 'Alamat tidak terdata'}
              </div>
              <div className="text-slate-400 text-[11px]">
                Telp: {currentRet.supplier?.phone || '-'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Informasi Retur & Faktur</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Retur:</span>
                  <span className="font-semibold text-slate-200">
                    {currentRet.return_date ? new Date(currentRet.return_date).toLocaleDateString('id-ID', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">No. Faktur Asal:</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {currentRet.invoice_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Alasan Utama:</span>
                  <span className="font-semibold text-amber-400">
                    {getReasonLabel(currentRet.reason)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kompensasi:</span>
                  <span className="font-semibold text-cyan-400">
                    {getCompensationLabel(currentRet.compensation_type)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {currentRet.notes && (
            <div className={`p-3 rounded-xl border text-xs ${
              isLight ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}>
              <span className="font-bold">Catatan Retur: </span>
              <span>{currentRet.notes}</span>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-rose-400" />
                <span>Rincian Obat & Batch yang Diretur</span>
              </h4>
              <span className="text-xs text-slate-400">
                {currentRet.items?.length || 0} Jenis Obat
              </span>
            </div>

            <div className={`rounded-xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-token-inner/30 border-token-border'
            }`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-token-inner/80 text-slate-400 border-token-border'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Nama Obat</th>
                    <th className="py-2.5 px-3">Batch & Expired</th>
                    <th className="py-2.5 px-3 text-center">Lokasi Ambil</th>
                    <th className="py-2.5 px-3 text-center">Qty Retur</th>
                    <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-token-border/50">
                  {currentRet.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/20 transition">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-200">
                          {item.medicine?.name || item.medicine_id}
                        </div>
                        {item.item_reason && (
                          <div className="text-[10px] text-amber-400/90 italic mt-0.5">
                            Ket: {item.item_reason}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-slate-300">
                          {item.batch?.batch_number || item.batch_id}
                        </div>
                        {item.batch?.expired_date && (
                          <div className="text-[10px] text-slate-400">
                            ED: {new Date(item.batch.expired_date).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.location === 'GUDANG'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                            : 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                        }`}>
                          {item.location || 'GUDANG'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-200">
                        {item.qty} {item.unit?.name || 'Satuan'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        Rp {Math.round(item.unit_price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        Rp {Math.round(item.subtotal || (item.qty * item.unit_price) || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className={`border-t font-bold ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-token-inner/90 text-slate-200'
                }`}>
                  <tr>
                    <td colSpan="6" className="py-2.5 px-3 text-right text-xs uppercase">
                      Total Nilai Retur:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-rose-400 font-bold whitespace-nowrap">
                      Rp {Math.round(currentRet.total_amount || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div>
            {isDraft && (
              <button
                onClick={handleDelete}
                disabled={loadingAction}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Draft</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <button
                  onClick={() => handleStatusChange('REQUESTED')}
                  disabled={loadingAction}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Ajukan ke PBF</span>
                </button>
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={loadingAction}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesaikan & Potong Stok Sekarang</span>
                </button>
              </>
            )}

            {isRequested && (
              <>
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={loadingAction}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Batalkan Retur</span>
                </button>
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={loadingAction}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Barang Diambil PBF (Potong Stok)</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition ${
                isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-token-border text-slate-300 hover:bg-slate-800'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
