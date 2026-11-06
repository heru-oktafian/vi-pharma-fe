import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, RefreshCw, Pill, Sparkles, User, Calendar, CreditCard,
  Tag, Plus, CheckCircle2, AlertTriangle, ArrowRight, Clock, Check
} from 'lucide-react';
import { getPrescriptions } from '../../services/prescriptionApi';
import PrescriptionFormModal from '../prescription/PrescriptionFormModal';
import PrescriptionPaymentModal from '../prescription/PrescriptionPaymentModal';
import PrescriptionEtiketModal from '../prescription/PrescriptionEtiketModal';

export default function PrescriptionQueueModal({
  isOpen,
  onClose,
  branch,
  token,
  theme = 'dark',
  onSelectPrescriptionForPOS
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const branchId = branch?.id || 'CBG000000000001';

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('unpaid'); // 'all', 'unpaid', 'paid'
  const [errorMsg, setErrorMsg] = useState('');

  // Child Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState(null);
  const [selectedForEtiket, setSelectedForEtiket] = useState(null);

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        search: searchQuery,
        limit: 50
      };
      if (paymentFilter === 'unpaid') params.is_paid = false;
      if (paymentFilter === 'paid') params.is_paid = true;

      const res = await getPrescriptions(token, params, branchId);
      setPrescriptions(res?.data || []);
    } catch (err) {
      console.error('Failed to load prescription queue for POS:', err);
      setErrorMsg(err.message || 'Gagal memuat antrean resep dokter');
    } finally {
      setLoading(false);
    }
  }, [token, branchId, searchQuery, paymentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SCREENING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5" />
            <span>Skrining</span>
          </span>
        );
      case 'RACIK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Sedang Diracik</span>
          </span>
        );
      case 'SIAP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Check className="w-2.5 h-2.5" />
            <span>Siap Diserahkan</span>
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Selesai</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-5xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Antrean Resep Dokter & Formula Racikan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Pelayanan Farmasi
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pencatatan resep klinis, peracikan puyer/kapsul, etiket aturan pakai, dan kasir pembayaran
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Resep / Racikan Baru</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Payment Filter */}
        <div
          className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor resep (RXP/...), nama pasien, atau dokter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/60 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPaymentFilter('unpaid')}
                className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                  paymentFilter === 'unpaid'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Belum Bayar
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('paid')}
                className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                  paymentFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sudah Lunas
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                  paymentFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Resep
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className={`p-1.5 rounded-xl border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Refresh Antrean"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              Memuat data antrean resep dokter & racikan...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Pill className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
              <div>Tidak ada resep dokter dalam antrean saat ini.</div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition"
              >
                + Buat Resep / Formula Racikan Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prescriptions.map((rx) => {
                const racikItems = (rx.items || []).filter((i) => i.item_type === 'RACIKAN');
                const nonRacikItems = (rx.items || []).filter((i) => i.item_type === 'NON_RACIK');

                return (
                  <div
                    key={rx.id}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
                        : 'bg-slate-800/50 border-slate-700/70 hover:border-purple-500/50'
                    }`}
                  >
                    <div>
                      {/* Card Top: Rx number, status, payment */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-700/50">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-emerald-400">
                            {rx.prescription_number}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({new Date(rx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {renderStatusBadge(rx.status)}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              rx.is_paid
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {rx.is_paid ? 'Lunas' : 'Belum Bayar'}
                          </span>
                        </div>
                      </div>

                      {/* Patient & Doctor */}
                      <div className="pt-2 text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{rx.patient_name}</span>
                          {rx.patient_age > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">({rx.patient_age} Thn)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 pl-5">
                          Dokter: <span className="text-slate-300 font-medium">{rx.doctor_name}</span>
                        </div>
                      </div>

                      {/* Items Details */}
                      <div className="pt-2.5 space-y-1.5">
                        {racikItems.map((rc, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-purple-300 text-[11px]">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                <span>{rc.racikan_name}</span>
                              </span>
                              <span>{rc.racikan_qty} {rc.racikan_unit} ({rc.racikan_dose_form})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Aturan: <strong className="text-slate-300">{rc.signa}</strong> ({rc.usage_time || 'Sesudah Makan'})
                            </div>
                            {rc.compound_items?.length > 0 && (
                              <div className="text-[9.5px] text-slate-400 mt-1 pl-1 border-l-2 border-purple-500/40">
                                Bahan:{' '}
                                {rc.compound_items
                                  .map((c) => `${c.medicine?.name || 'Obat'} (${c.total_qty} ${c.unit?.name || 'Tab'})`)
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                        ))}

                        {nonRacikItems.map((nr, nIdx) => (
                          <div
                            key={nIdx}
                            className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-blue-300 text-[11px]">
                                {nr.medicine?.name || 'Obat Jadi'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {nr.qty} {nr.unit?.name || 'Pcs'} • {nr.signa}
                              </div>
                            </div>
                            <span className="font-mono text-[11px] text-slate-300 font-bold">
                              {formatIDR(nr.total || nr.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Bottom: Total & Action Buttons */}
                    <div className="pt-2.5 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-400">Total Biaya Resep</div>
                        <div className="font-mono font-black text-sm text-emerald-400">
                          {formatIDR(rx.grand_total)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Print Etiket */}
                        <button
                          type="button"
                          onClick={() => setSelectedForEtiket(rx)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 transition"
                          title="Cetak Etiket Aturan Pakai Obat Resep"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Etiket</span>
                        </button>

                        {/* Pay at Cashier Button */}
                        {!rx.is_paid ? (
                          <button
                            type="button"
                            onClick={() => setSelectedForPayment(rx)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar Kasir</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedForPayment(rx)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition"
                          >
                            <span>Struk Pembayaran</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 px-5 border-t flex items-center justify-between text-xs text-slate-400 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
          }`}
        >
          <div>
            Total antrean tercatat: <strong className="text-white font-mono">{prescriptions.length}</strong> resep
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Child Modal: Create Prescription & Compounding */}
      {showCreateModal && (
        <PrescriptionFormModal
          token={token}
          branch={branch}
          theme={theme}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Child Modal: Cashier Payment & Struk Thermal */}
      {selectedForPayment && (
        <PrescriptionPaymentModal
          isOpen={Boolean(selectedForPayment)}
          onClose={() => setSelectedForPayment(null)}
          prescription={selectedForPayment}
          branch={branch}
          token={token}
          theme={theme}
          onSuccess={() => {
            loadData();
          }}
          onOpenEtiket={(rx) => {
            setSelectedForEtiket(rx);
          }}
        />
      )}

      {/* Child Modal: Prescription Etiket Print */}
      {selectedForEtiket && (
        <PrescriptionEtiketModal
          isOpen={Boolean(selectedForEtiket)}
          onClose={() => setSelectedForEtiket(null)}
          prescription={selectedForEtiket}
          branch={branch}
          theme={theme}
        />
      )}
    </div>
  );
}
