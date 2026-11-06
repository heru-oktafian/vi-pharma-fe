import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, RefreshCw, Eye, Warehouse, ShoppingCart, CheckCircle2, Clock, X, Printer, FileText } from 'lucide-react';
import { getOpnameList, getOpnameDetail } from '../../services/inventoryApi';
import OpnameSessionModal from './OpnameSessionModal';
import PrintableOpnameModal from './PrintableOpnameModal';

export default function StockOpnameView({ token, userRole, theme = 'dark', branch }) {
  const isLight = theme === 'light';
  const [opnames, setOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Detail Modal
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printOpname, setPrintOpname] = useState(null);

  const loadOpnames = async () => {
    try {
      setLoading(true);
      const res = await getOpnameList(token, 1, 50, branch?.id);
      setOpnames(res?.items || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load opname list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpnames();
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

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Banner & Action */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-token-emerald" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Riwayat Sesi Stok Opname Bergulir (Cycle Count)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dicicil 10-15 menit per rak secara rutin. Frontliner kasir tetap dapat melayani penjualan tanpa tutup apotek!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadOpnames}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Mulai Opname Rak Baru</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
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
                <th className="py-2.5 px-3">Nama Rak / Zona</th>
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
                    <span>Memuat sesi opname bergulir...</span>
                  </td>
                </tr>
              ) : opnames.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-token-emerald" />
                    <span>Belum ada riwayat sesi opname parsial di cabang ini.</span>
                  </td>
                </tr>
              ) : (
                opnames.map((sop) => {
                  const isDone = sop.status === 'COMPLETED';
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
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isDone ? 'Selesai (Terapkan)' : 'Draft'}
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

      {/* Opname Create Modal */}
      <OpnameSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        theme={theme}
        branchId={branch?.id}
        token={token}
        onSuccess={loadOpnames}
      />

      {/* Detail Modal */}
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
      {/* Printable Berita Acara Opname Modal */}
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
