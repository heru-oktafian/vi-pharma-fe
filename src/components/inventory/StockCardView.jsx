import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Filter, Warehouse, ShoppingCart, Calendar, ArrowDownRight, ArrowUpRight, Search } from 'lucide-react';
import { getStockCard, getStockSummaries } from '../../services/inventoryApi';

export default function StockCardView({ token, userRole, theme = 'dark', branch, initialMedicineId }) {
  const isLight = theme === 'light';

  const [medicines, setMedicines] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState(initialMedicineId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync initialMedicineId when passed from parent tabs
  useEffect(() => {
    if (initialMedicineId) {
      setSelectedMedicineId(initialMedicineId);
    }
  }, [initialMedicineId]);

  // Load medicine list for dropdown
  useEffect(() => {
    async function loadMeds() {
      try {
        const res = await getStockSummaries(token, '', branch?.id);
        setMedicines(res || []);
        if (initialMedicineId) {
          setSelectedMedicineId(initialMedicineId);
        } else if (!selectedMedicineId && res?.length > 0) {
          setSelectedMedicineId(res[0].medicine_id);
        }
      } catch (err) {
        console.error('Failed to load medicines for stock card:', err);
      }
    }
    loadMeds();
  }, [token, branch?.id, initialMedicineId]);

  const loadStockCard = async () => {
    if (!selectedMedicineId) return;
    try {
      setLoading(true);
      const [resMutations, resMeds] = await Promise.all([
        getStockCard(selectedMedicineId, token, startDate, endDate, branch?.id),
        getStockSummaries(token, '', branch?.id).catch(() => []),
      ]);
      setMutations(resMutations || []);
      if (resMeds && resMeds.length > 0) {
        setMedicines(resMeds);
      }
    } catch (err) {
      console.error('Failed to load stock card mutations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMedicineId) {
      loadStockCard();
    }
  }, [selectedMedicineId, startDate, endDate, token, branch?.id]);

  // Selected Medicine Info
  const selectedMedObj = medicines.find(m => m.medicine_id === selectedMedicineId);

  // Compute Stats
  const totalIn = mutations.reduce((acc, m) => acc + (parseFloat(m.qty_in) || 0), 0);
  const totalOut = mutations.reduce((acc, m) => acc + (parseFloat(m.qty_out) || 0), 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Filter Bar */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col md:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Medicine Selector */}
          <div className="w-full sm:w-72">
            <label className="text-[10px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
              Pilih Obat *
            </label>
            <select
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
              className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
              }`}
            >
              {medicines.map(m => (
                <option key={m.medicine_id} value={m.medicine_id}>
                  {m.name} ({m.item_code}) — Total: {m.total_stock}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div>
              <label className="text-[10px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`px-2.5 py-1 text-xs rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`px-2.5 py-1 text-xs rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Current Stock Indicators */}
        {selectedMedObj && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-right">
              <span className="text-[9px] text-slate-400 block leading-tight">Gudang</span>
              <span className="text-xs font-mono font-bold text-amber-500">{selectedMedObj.total_warehouse || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-token-emerald/30 bg-token-emerald/10 text-right">
              <span className="text-[9px] text-slate-400 block leading-tight">Rak Kasir</span>
              <span className="text-xs font-mono font-bold text-token-emerald">{selectedMedObj.total_shelf || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-right">
              <span className="text-[9px] text-slate-400 block leading-tight">Total Gabungan</span>
              <span className="text-xs font-mono font-extrabold text-blue-400">{selectedMedObj.total_stock || 0}</span>
            </div>
            <button
              onClick={loadStockCard}
              disabled={loading}
              className={`p-2 rounded-lg border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-300 border-token-border'
              }`}
              title="Refresh Kartu Stok"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-token-emerald' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Ledger Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Tanggal & Waktu</th>
                <th className="py-2.5 px-3">No. Referensi</th>
                <th className="py-2.5 px-3">Batch & Expired</th>
                <th className="py-2.5 px-3 text-center">Jenis Mutasi</th>
                <th className="py-2.5 px-3 text-center">Lokasi</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Masuk (+)</th>
                <th className="py-2.5 px-3 text-right text-rose-400">Keluar (-)</th>
                <th className="py-2.5 px-3 text-right">Saldo Lokasi</th>
                <th className="py-2.5 px-3 text-right font-bold">Total Gabungan</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                    <span>Memuat buku mutasi kartu stok...</span>
                  </td>
                </tr>
              ) : mutations.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <span>Belum ada mutasi stok untuk obat ini pada periode yang dipilih.</span>
                  </td>
                </tr>
              ) : (
                mutations.map((m) => {
                  const isPurch = m.mutation_type === 'PEMBELIAN';
                  const isSale = m.mutation_type === 'PENJUALAN' || m.mutation_type === 'RESEP';
                  const isRefill = m.mutation_type === 'REFILL_RAK';
                  const isReturn = m.mutation_type === 'KEMBALI_GUDANG';
                  const isOpname = m.mutation_type === 'OPNAME';

                  return (
                    <tr key={m.id} className="hover:bg-slate-500/5 transition">
                      {/* Date & Time */}
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {m.created_at?.slice(0, 16).replace('T', ' ')}
                      </td>

                      {/* Reference No */}
                      <td className="py-2 px-3 font-mono font-semibold text-slate-300">
                        {m.reference_no || '-'}
                      </td>

                      {/* Batch & ED */}
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                        <span>{m.batch?.batch_number || '-'}</span>
                      </td>

                      {/* Mutation Type */}
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPurch
                            ? 'bg-emerald-500/15 text-token-emerald border border-token-emerald/30'
                            : isSale
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isRefill
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : isReturn
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}>
                          {m.mutation_type}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          m.location === 'GUDANG'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-token-emerald'
                        }`}>
                          {m.location === 'GUDANG' ? '📦 Gudang' : '🛒 Rak'}
                        </span>
                      </td>

                      {/* Qty In */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                        {m.qty_in > 0 ? `+${m.qty_in}` : '-'}
                      </td>

                      {/* Qty Out */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                        {m.qty_out > 0 ? `-${m.qty_out}` : '-'}
                      </td>

                      {/* Balance After Location */}
                      <td className="py-2 px-3 text-right font-mono text-slate-300">
                        {m.balance_after}
                      </td>

                      {/* Total Combined After */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                        {m.total_after}
                      </td>

                      {/* Notes */}
                      <td className="py-2 px-3 text-slate-400 text-[11px] max-w-xs truncate" title={m.notes}>
                        {m.notes || '-'}
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
