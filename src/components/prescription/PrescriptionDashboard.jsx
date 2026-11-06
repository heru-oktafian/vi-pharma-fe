import React, { useState, useEffect, useCallback } from 'react';
import {
  Pill, Plus, Search, RefreshCw, Filter, FileText, Printer, CheckCircle2,
  Clock, AlertTriangle, ChevronRight, User, Stethoscope, ArrowLeft, Tag,
  Eye, Check, Sparkles, Building2, CreditCard
} from 'lucide-react';
import {
  getPrescriptions,
  updatePrescriptionStatus,
  dispensePrescription
} from '../../services/prescriptionApi';
import PrescriptionFormModal from './PrescriptionFormModal';
import CopyReceiptModal from './CopyReceiptModal';
import PrescriptionEtiketModal from './PrescriptionEtiketModal';
import PrescriptionPaymentModal from './PrescriptionPaymentModal';

export default function PrescriptionDashboard({ user, branch, token, theme, onBack }) {
  const isLight = theme === 'light';
  const branchId = branch?.id || 'CBG000000000001';

  // State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedForCopy, setSelectedForCopy] = useState(null);
  const [selectedForEtiket, setSelectedForEtiket] = useState(null);
  const [selectedForPayment, setSelectedForPayment] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch prescriptions list
  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getPrescriptions(
        token,
        {
          search: searchQuery,
          status: statusFilter,
          limit: 50
        },
        branchId
      );
      setPrescriptions(res?.data || []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar antrean resep dokter');
    } finally {
      setLoading(false);
    }
  }, [token, branchId, searchQuery, statusFilter]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  // Handle Workflow Status Updates
  const handleProceedStatus = async (rx, nextStatus) => {
    setActionLoadingId(rx.id);
    try {
      if (nextStatus === 'SIAP') {
        // Dispense: Deduct physical shelf stock & record mutations
        await dispensePrescription(rx.id, token, branchId);
      } else {
        await updatePrescriptionStatus(
          rx.id,
          { status: nextStatus },
          token,
          branchId
        );
      }
      loadPrescriptions();
    } catch (err) {
      alert(`Gagal memperbarui alur resep: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SCREENING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Skrining Klinis</span>
          </span>
        );
      case 'RACIK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-3 h-3" />
            <span>Sedang Diracik</span>
          </span>
        );
      case 'SIAP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Check className="w-3 h-3" />
            <span>Siap Diserahkan</span>
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Selesai</span>
          </span>
        );
      case 'BATAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  // Metrics count
  const countScreening = prescriptions.filter((p) => p.status === 'SCREENING').length;
  const countRacik = prescriptions.filter((p) => p.status === 'RACIK').length;
  const countSiap = prescriptions.filter((p) => p.status === 'SIAP').length;
  const countSelesai = prescriptions.filter((p) => p.status === 'SELESAI').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Top Bar Header */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Kembali ke Dashboard Modul"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xs">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">Pelayanan Resep & Farmasi</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{branch?.branch_name || 'Apotek Vi-Pharma Pusat'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Antrean skrining klinis resep dokter, formula peracikan puyer/kapsul, salinan resep, & etiket dispensing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPrescriptions}
            disabled={loading}
            className={`p-2 rounded-xl border transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Muat Ulang Antrean"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Resep Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setStatusFilter(statusFilter === 'SCREENING' ? '' : 'SCREENING')}
          className={`p-3 rounded-xl border cursor-pointer transition select-none ${
            statusFilter === 'SCREENING'
              ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500/40'
              : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">1. Menunggu Skrining</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">{countScreening} Resep</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'RACIK' ? '' : 'RACIK')}
          className={`p-3 rounded-xl border cursor-pointer transition select-none ${
            statusFilter === 'RACIK'
              ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/40'
              : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">2. Sedang Diracik</div>
          <div className="text-xl font-black text-blue-400 mt-0.5">{countRacik} Resep</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'SIAP' ? '' : 'SIAP')}
          className={`p-3 rounded-xl border cursor-pointer transition select-none ${
            statusFilter === 'SIAP'
              ? 'ring-2 ring-purple-500 bg-purple-500/10 border-purple-500/40'
              : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">3. Siap Diserahkan</div>
          <div className="text-xl font-black text-purple-400 mt-0.5">{countSiap} Resep</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'SELESAI' ? '' : 'SELESAI')}
          className={`p-3 rounded-xl border cursor-pointer transition select-none ${
            statusFilter === 'SELESAI'
              ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40'
              : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">4. Selesai / Terlayani</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{countSelesai} Resep</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor resep, nama pasien, atau dokter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs transition ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-xs ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="">Semua Status Resep</option>
            <option value="SCREENING">1. Skrining Klinis</option>
            <option value="RACIK">2. Sedang Diracik</option>
            <option value="SIAP">3. Siap Diserahkan</option>
            <option value="SELESAI">4. Selesai</option>
          </select>
        </div>
      </div>

      {/* Main Table / List Container */}
      <div
        className={`flex-1 min-h-0 rounded-2xl border overflow-hidden flex flex-col ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
              Memuat data antrean resep...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Tidak ada data resep yang sesuai dengan filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-800'
                }`}>
                  <th className="py-3 px-4">No. Resep & Waktu</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Dokter Preskriptor</th>
                  <th className="py-3 px-4">Rincian Obat & Racikan</th>
                  <th className="py-3 px-4">Status Alur</th>
                  <th className="py-3 px-4 text-right">Total Biaya</th>
                  <th className="py-3 px-4 text-center">Aksi Dokumen & Alur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {prescriptions.map((rx) => {
                  const isLoadingThis = actionLoadingId === rx.id;
                  const racikCount = (rx.items || []).filter((i) => i.item_type === 'RACIKAN').length;
                  const nonRacikCount = (rx.items || []).filter((i) => i.item_type === 'NON_RACIK').length;

                  return (
                    <tr
                      key={rx.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      {/* No. Resep */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-emerald-400">{rx.prescription_number}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(rx.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Pasien */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs">{rx.patient_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {rx.patient_age > 0 ? `${rx.patient_age} Thn` : '-'}
                          {rx.patient_weight > 0 ? ` (${rx.patient_weight} kg)` : ''}
                        </div>
                      </td>

                      {/* Dokter */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs">{rx.doctor_name}</div>
                        <div className="text-[10px] text-slate-400">{rx.doctor_sip || 'Dokter Praktek'}</div>
                      </td>

                      {/* Rincian */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {nonRacikCount > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {nonRacikCount} Obat Jadi
                            </span>
                          )}
                          {racikCount > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>{racikCount} Racikan</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">
                          {rx.items?.map((it) => it.item_type === 'RACIKAN' ? it.racikan_name : it.medicine?.name).join(', ')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{renderStatusBadge(rx.status)}</td>

                      {/* Total Biaya */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-xs">
                          Rp {(rx.grand_total || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                              rx.is_paid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {rx.is_paid ? 'LUNAS (POS)' : 'BELUM BAYAR'}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Workflow Trigger Button */}
                          {rx.status === 'SCREENING' && (
                            <button
                              onClick={() => handleProceedStatus(rx, 'RACIK')}
                              disabled={isLoadingThis}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition"
                            >
                              Mulai Racik →
                            </button>
                          )}

                          {rx.status === 'RACIK' && (
                            <button
                              onClick={() => handleProceedStatus(rx, 'SIAP')}
                              disabled={isLoadingThis}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-xs transition"
                              title="Selesai meracik & otomatis potong stok fisik di rak"
                            >
                              Selesai Racik (Potong Stok) →
                            </button>
                          )}

                          {rx.status === 'SIAP' && (
                            <button
                              onClick={() => handleProceedStatus(rx, 'SELESAI')}
                              disabled={isLoadingThis}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition"
                            >
                              Serahkan ke Pasien ✓
                            </button>
                          )}

                          {/* Cetak Copy Resep */}
                          <button
                            onClick={() => setSelectedForCopy(rx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                            title="Cetak Salinan Resep (Apograph)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Cetak Etiket */}
                          <button
                            onClick={() => setSelectedForEtiket(rx)}
                            className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:text-white transition"
                            title="Cetak Etiket Aturan Pakai"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Bayar Kasir Button */}
                          <button
                            onClick={() => setSelectedForPayment(rx)}
                            className={`p-1.5 rounded-lg border transition ${
                              rx.is_paid
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                            }`}
                            title={rx.is_paid ? 'Lihat / Cetak Struk Pembayaran Kasir' : 'Proses Pembayaran Kasir Resep Ini'}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Input Resep Baru */}
      {showFormModal && (
        <PrescriptionFormModal
          token={token}
          branch={branch}
          theme={theme}
          onClose={() => setShowFormModal(false)}
          onSuccess={loadPrescriptions}
        />
      )}

      {/* Modal: Salinan Resep (Apograph) */}
      {selectedForCopy && (
        <CopyReceiptModal
          prescription={selectedForCopy}
          branch={branch}
          theme={theme}
          onClose={() => setSelectedForCopy(null)}
        />
      )}

      {/* Modal: Cetak Etiket */}
      {selectedForEtiket && (
        <PrescriptionEtiketModal
          prescription={selectedForEtiket}
          branch={branch}
          theme={theme}
          onClose={() => setSelectedForEtiket(null)}
        />
      )}

      {/* Modal: Kasir & Struk Pembayaran Resep */}
      {selectedForPayment && (
        <PrescriptionPaymentModal
          isOpen={Boolean(selectedForPayment)}
          onClose={() => setSelectedForPayment(null)}
          prescription={selectedForPayment}
          branch={branch}
          token={token}
          theme={theme}
          onSuccess={loadPrescriptions}
          onOpenEtiket={(rx) => {
            setSelectedForEtiket(rx);
          }}
        />
      )}
    </div>
  );
}
