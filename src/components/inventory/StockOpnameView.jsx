import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  Eye,
  Warehouse,
  ShoppingCart,
  CheckCircle2,
  Clock,
  X,
  Printer,
  FileText,
  AlertTriangle,
  Check,
  Layers,
  Smartphone,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  getOpnameList,
  getOpnameDetail,
  getActiveParentOpname,
  createParentOpnameSession,
  closeParentOpnameSession,
  getOpnameRackDetail,
  approveOpnameRack,
  rejectOpnameRack,
} from '../../services/inventoryApi';
import OpnameSessionModal from './OpnameSessionModal';
import PrintableOpnameModal from './PrintableOpnameModal';

export default function StockOpnameView({ token, userRole, theme = 'dark', branch }) {
  const isLight = theme === 'light';
  const isSupervisor = ['superadmin', 'admin', 'pharmacist'].includes(userRole?.toLowerCase());

  // Opname Single / Historical List
  const [opnames, setOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Collaborative Parent Opname State
  const [activeParentSummary, setActiveParentSummary] = useState(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [parentNotes, setParentNotes] = useState('Sesi Induk Stok Opname Bergulir');
  const [parentLocation, setParentLocation] = useState('RAK');
  const [isCreatingParent, setIsCreatingParent] = useState(false);

  // Rack Review & ACC Modal State
  const [selectedRack, setSelectedRack] = useState(null);
  const [rackModalOpen, setRackModalOpen] = useState(false);
  const [loadingRack, setLoadingRack] = useState(false);
  const [isProcessingRack, setIsProcessingRack] = useState(false);

  // Historical Detail Modal
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printOpname, setPrintOpname] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingParent(true);

      const [listRes, parentRes] = await Promise.all([
        getOpnameList(token, 1, 50, branch?.id).catch(() => null),
        getActiveParentOpname(token, branch?.id).catch(() => null),
      ]);

      setOpnames(listRes?.items || (Array.isArray(listRes) ? listRes : []));
      setActiveParentSummary(parentRes || null);
    } catch (err) {
      console.error('Failed to load opname data:', err);
    } finally {
      setLoading(false);
      setLoadingParent(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, branch?.id]);

  const handleOpenDetail = async (id) => {
    try {
      setLoadingDetail(true);
      setDetailModalOpen(true);
      const res = await getOpnameDetail(id, token);
      setSelectedOpname(res);
    } catch (err) {
      console.error('Failed to load opname detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Rack Review Modal
  const handleOpenRackReview = async (opnameId, rackId) => {
    try {
      setLoadingRack(true);
      setRackModalOpen(true);
      const res = await getOpnameRackDetail(opnameId, rackId, token, branch?.id);
      setSelectedRack(res);
    } catch (err) {
      console.error('Failed to load rack detail:', err);
    } finally {
      setLoadingRack(false);
    }
  };

  // Approve Rack
  const handleApproveRack = async () => {
    if (!selectedRack || !activeParentSummary?.opname?.id) return;
    if (!window.confirm(`Yakin ingin menyetujui hitungan rak "${selectedRack.rack_name}"? Saldo stok master akan langsung disesuaikan di sistem.`)) {
      return;
    }

    try {
      setIsProcessingRack(true);
      await approveOpnameRack(activeParentSummary.opname.id, selectedRack.id, token, branch?.id);
      setRackModalOpen(false);
      loadData();
    } catch (err) {
      alert('Gagal menyetujui rak: ' + (err.message || 'Error'));
    } finally {
      setIsProcessingRack(false);
    }
  };

  // Reject Rack
  const handleRejectRack = async () => {
    if (!selectedRack || !activeParentSummary?.opname?.id) return;
    const reason = window.prompt('Masukkan catatan penolakan untuk petugas (opsional):', 'Selisih terlalu besar, mohon hitung ulang...');
    if (reason === null) return; // User cancelled

    try {
      setIsProcessingRack(true);
      await rejectOpnameRack(activeParentSummary.opname.id, selectedRack.id, { notes: reason }, token, branch?.id);
      setRackModalOpen(false);
      loadData();
    } catch (err) {
      alert('Gagal menolak rak: ' + (err.message || 'Error'));
    } finally {
      setIsProcessingRack(false);
    }
  };

  // Create Parent Session
  const handleCreateParent = async (e) => {
    e.preventDefault();
    try {
      setIsCreatingParent(true);
      await createParentOpnameSession(
        { notes: parentNotes, location: parentLocation },
        token,
        branch?.id,
      );
      setParentModalOpen(false);
      loadData();
    } catch (err) {
      alert('Gagal membuat sesi induk: ' + (err.message || 'Error'));
    } finally {
      setIsCreatingParent(false);
    }
  };

  // Close Parent Session
  const handleCloseParent = async () => {
    if (!activeParentSummary?.opname?.id) return;
    const pendingCount = activeParentSummary.pending_racks || 0;
    const msg = pendingCount > 0
      ? `PERHATIAN: Masih ada ${pendingCount} rak yang statusnya MENUNGGU ACC. Rak yang belum di-ACC tidak akan mengubah stok master. Tetap tutup sesi induk?`
      : 'Sesi Induk Opname akan ditandai selesai (COMPLETED). Lanjutkan?';

    if (!window.confirm(msg)) return;

    try {
      setLoadingParent(true);
      await closeParentOpnameSession(activeParentSummary.opname.id, token, branch?.id);
      loadData();
    } catch (err) {
      alert('Gagal menutup sesi induk: ' + (err.message || 'Error'));
    } finally {
      setLoadingParent(false);
    }
  };

  const parentOpname = activeParentSummary?.opname;
  const racks = activeParentSummary?.racks || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
      {/* 1. HERO BANNER: Collaborative Multi-User Opname Status */}
      <div className={`p-4 rounded-2xl border shrink-0 transition ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
          : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-token-card border-token-emerald/30 shadow-lg'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-token-emerald/20 border border-token-emerald/40 flex items-center justify-center shrink-0 text-token-emerald">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                  Stok Opname Kolaboratif Multi-User
                </span>
                {parentOpname ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-token-emerald border border-token-emerald/40 animate-pulse">
                    ● SESI INDUK AKTIF: {parentOpname.opname_code}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                    Tidak Ada Sesi Induk Terbuka
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {parentOpname
                  ? `${parentOpname.notes || 'Opname berjalan'} • Dimulai: ${parentOpname.opname_date?.slice(0, 10)} • Personil dapat menyetor per rak dari vi-token tablet.`
                  : 'Buka satu Sesi Induk agar personil apotek dapat menyetor hitungan rak secara bersamaan dari tablet vi-token.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-500/30 text-slate-400 hover:text-white transition"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingParent ? 'animate-spin' : ''}`} />
            </button>

            {parentOpname ? (
              isSupervisor && (
                <button
                  onClick={handleCloseParent}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tutup Sesi Induk Opname</span>
                </button>
              )
            ) : (
              isSupervisor && (
                <button
                  onClick={() => setParentModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buka Sesi Induk Opname Baru</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Counters & Rack Grid (if parent is active) */}
        {parentOpname && (
          <div className="mt-4 pt-4 border-t border-slate-200/20 dark:border-white/10 flex flex-col gap-3">
            {/* 4 Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Rak Disetor</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">
                  {activeParentSummary?.total_racks || 0} Rak
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Menunggu ACC Apoteker</span>
                <span className="text-base font-extrabold text-amber-400 mt-0.5 block">
                  {activeParentSummary?.pending_racks || 0} Rak
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] text-token-emerald uppercase font-bold block">Disetujui & Stok Sesuai</span>
                <span className="text-base font-extrabold text-token-emerald mt-0.5 block">
                  {activeParentSummary?.approved_racks || 0} Rak
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Obat Dihitung</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">
                  {activeParentSummary?.total_items_counted || 0} Obat
                </span>
              </div>
            </div>

            {/* Sub-Rack Cards */}
            <div className="mt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Daftar Setoran per Rak (Sesi Berjalan):
              </span>

              {racks.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-400">
                  Belum ada rak yang disetor personil. Personil apotek dapat memilih sesi ini dan menyetor rak dari aplikasi vi-token di tablet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {racks.map((rack) => {
                    const isPending = rack.status === 'PENDING';
                    const isApproved = rack.status === 'APPROVED';
                    const itemCount = (rack.items || []).length;

                    return (
                      <div
                        key={rack.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                          isPending
                            ? 'bg-amber-500/5 border-amber-500/30 shadow-xs'
                            : isApproved
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-red-500/5 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {rack.rack_name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {rack.location === 'GUDANG' ? '📦 Gudang' : '🛒 Rak Kasir'} • Oleh: {rack.counted_by?.name || 'Petugas'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-500/15 text-token-emerald border border-token-emerald/30'
                              : isPending
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            {rack.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                          <span className="text-slate-400">{itemCount} obat dihitung</span>

                          <button
                            onClick={() => handleOpenRackReview(parentOpname.id, rack.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isPending
                                ? 'bg-token-emerald hover:bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Review & ACC Rak</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Rincian</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. HISTORICAL SESSIONS & SINGLE OPNAME ACTIONS */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-token-emerald" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Riwayat Seluruh Sesi Stok Opname (Arsip & Cetak Berita Acara)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daftar sesi opname yang pernah dilaksanakan di cabang ini.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-600 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Opname Tunggal Cepat (Draft)</span>
          </button>
        </div>
      </div>

      {/* 3. TABLE OF OPNAME SESSIONS */}
      <div className={`flex-1 min-h-[300px] rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Kode Sesi Opname</th>
                <th className="py-2.5 px-3">Tanggal Hitung</th>
                <th className="py-2.5 px-3 text-center">Lokasi</th>
                <th className="py-2.5 px-3">Nama Rak / Keterangan</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Petugas</th>
                <th className="py-2.5 px-3">Catatan</th>
                <th className="py-2.5 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && opnames.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                    <span>Memuat sesi opname...</span>
                  </td>
                </tr>
              ) : opnames.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-token-emerald" />
                    <span>Belum ada riwayat sesi opname di cabang ini.</span>
                  </td>
                </tr>
              ) : (
                opnames.map((sop) => {
                  const isDone = sop.status === 'COMPLETED';
                  const isOpen = sop.status === 'OPEN';
                  const isRack = sop.location === 'RAK';

                  return (
                    <tr key={sop.id} className="hover:bg-slate-500/5 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {sop.opname_code}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {sop.opname_date?.slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRack
                            ? 'bg-emerald-500/15 text-token-emerald'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {isRack ? '🛒 Rak' : '📦 Gudang'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        {sop.rack_name || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-500/15 text-token-emerald border border-token-emerald/30'
                            : isOpen
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isDone ? 'Selesai' : (isOpen ? 'Aktif (Open)' : 'Draft')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {sop.created_by?.name || 'Petugas'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                        {sop.notes || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(sop.id)}
                            className="p-1.5 rounded-lg border border-token-emerald/30 text-token-emerald hover:text-white hover:bg-token-emerald/20 transition"
                            title="Lihat Detail Hasil Hitung"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const detail = await getOpnameDetail(sop.id, token);
                                setPrintOpname(detail);
                                setPrintModalOpen(true);
                              } catch (e) {
                                console.error('Failed to load opname for print:', e);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:text-white hover:bg-blue-500/20 transition"
                            title="Cetak Berita Acara Stok Opname (A4)"
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

      {/* 4. MODAL: Review & ACC Rak */}
      {rackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                  Review Setoran: {selectedRack?.rack_name || 'Rak'}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedRack?.location === 'GUDANG' ? '📦 Gudang' : '🛒 Rak Kasir'} • Dihitung oleh: {selectedRack?.counted_by?.name || 'Petugas'} • Status: {selectedRack?.status}
                </p>
              </div>
              <button
                onClick={() => setRackModalOpen(false)}
                className="p-1 rounded-lg border hover:bg-slate-500/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
              {loadingRack ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                  <span>Memuat rincian obat di rak ini...</span>
                </div>
              ) : selectedRack ? (
                <>
                  {selectedRack.notes && (
                    <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs text-slate-300">
                      <strong>Catatan Petugas:</strong> {selectedRack.notes}
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 dark:border-token-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-500/10 text-[10px] text-slate-400 uppercase border-b border-token-border">
                        <tr>
                          <th className="py-2 px-3">Nama Obat</th>
                          <th className="py-2 px-3">No. Batch</th>
                          <th className="py-2 px-3 text-right">Stok Sistem</th>
                          <th className="py-2 px-3 text-right">Hitung Fisik</th>
                          <th className="py-2 px-3 text-center">Selisih</th>
                          <th className="py-2 px-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-token-border/40">
                        {(selectedRack.items || []).map((it) => {
                          const diff = parseFloat(it.difference_qty) || 0;
                          return (
                            <tr key={it.id}>
                              <td className="py-2 px-3 font-semibold">
                                {it.medicine?.name || '-'}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-400">
                                {it.batch?.batch_number || it.batch_number || '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                {it.system_qty}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                                {it.physical_qty}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  diff === 0
                                    ? 'bg-emerald-500/15 text-token-emerald'
                                    : diff < 0
                                      ? 'bg-red-500/15 text-red-400'
                                      : 'bg-blue-500/15 text-blue-400'
                                }`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-400 text-[11px]">
                                {it.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Actions */}
            {selectedRack?.status === 'PENDING' && isSupervisor && (
              <div className={`p-4 border-t flex items-center justify-end gap-2.5 shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
              }`}>
                <button
                  type="button"
                  disabled={isProcessingRack}
                  onClick={handleRejectRack}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"
                >
                  Tolak / Minta Hitung Ulang
                </button>
                <button
                  type="button"
                  disabled={isProcessingRack}
                  onClick={handleApproveRack}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessingRack ? 'Memproses...' : 'ACC & Sesuaikan Stok Sekarang'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: Buka Sesi Induk Opname Baru */}
      {parentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <form onSubmit={handleCreateParent}>
              <div className="px-5 py-3.5 border-b flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-token-emerald" />
                  Buka Sesi Induk Opname
                </h3>
                <button type="button" onClick={() => setParentModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-3.5">
                <p className="text-xs text-slate-400">
                  Sesi Induk ini akan menampung setoran hitungan dari berbagai personil apotek selama 1 hingga beberapa hari:
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Keterangan Sesi Opname:
                  </label>
                  <input
                    type="text"
                    required
                    value={parentNotes}
                    onChange={(e) => setParentNotes(e.target.value)}
                    placeholder="Contoh: Stok Opname Semester 1 - Seluruh Rak"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-token-emerald"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Lokasi Default:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setParentLocation('RAK')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                        parentLocation === 'RAK'
                          ? 'bg-token-emerald text-white border-token-emerald'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      🛒 Rak Penjualan Kasir
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentLocation('GUDANG')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                        parentLocation === 'GUDANG'
                          ? 'bg-token-emerald text-white border-token-emerald'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      📦 Gudang Belakang
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t flex items-center justify-end gap-2 bg-token-inner border-token-border">
                <button
                  type="button"
                  onClick={() => setParentModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingParent}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreatingParent ? 'Membuka...' : 'Buka Sesi Induk Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Single / Draft Opname Create Modal */}
      <OpnameSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        theme={theme}
        branchId={branch?.id}
        token={token}
        onSuccess={loadData}
      />

      {/* 7. MODAL: Detail Opname (Historical) */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                  Rincian Hasil Opname: {selectedOpname?.opname_code}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedOpname?.rack_name} ({selectedOpname?.location}) • Tanggal: {selectedOpname?.opname_date?.slice(0, 10)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintOpname(selectedOpname);
                    setPrintModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Berita Acara</span>
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg border hover:bg-slate-500/20 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                  <span>Memuat hasil hitung opname...</span>
                </div>
              ) : selectedOpname ? (
                <div className="rounded-xl border border-slate-200 dark:border-token-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-500/10 text-[10px] text-slate-400 uppercase border-b border-token-border">
                      <tr>
                        <th className="py-2 px-3">Nama Obat</th>
                        <th className="py-2 px-3">No. Batch</th>
                        <th className="py-2 px-3 text-right">Stok Sistem</th>
                        <th className="py-2 px-3 text-right">Hitung Fisik</th>
                        <th className="py-2 px-3 text-center">Selisih</th>
                        <th className="py-2 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-token-border/40">
                      {(selectedOpname.items || []).map((it) => {
                        const diff = parseFloat(it.difference_qty) || 0;
                        return (
                          <tr key={it.id}>
                            <td className="py-2 px-3 font-semibold">
                              {it.medicine?.name || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              {it.batch?.batch_number || '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {it.system_qty}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                              {it.physical_qty}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                diff === 0
                                  ? 'bg-emerald-500/15 text-token-emerald'
                                  : diff < 0
                                    ? 'bg-red-500/15 text-red-400'
                                    : 'bg-blue-500/15 text-blue-400'
                              }`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[11px]">
                              {it.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Printable Berita Acara Opname */}
      <PrintableOpnameModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        opname={printOpname}
        branch={branch}
        theme={theme}
      />
    </div>
  );
}
