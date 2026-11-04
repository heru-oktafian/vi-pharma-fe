import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, RefreshCw, ShoppingCart, CheckSquare, Square, Package, ArrowRight } from 'lucide-react';
import { getStockSummaries } from '../../services/inventoryApi';

export default function AutoReorderView({
  token,
  userRole,
  theme = 'dark',
  branch,
  onFastCreateSP
}) {
  const isLight = theme === 'light';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getStockSummaries(token, '', branch?.id);
      // Filter items where total_stock <= min_stock
      const lowStock = (res || []).filter(m => (m.total_stock || 0) <= (m.min_stock || 0));
      setItems(lowStock);
      // Pre-select all low stock items by default
      setSelectedIds(lowStock.map(m => m.medicine_id));
    } catch (err) {
      console.error('Failed to load auto-reorder recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, branch?.id]);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(m => m.medicine_id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleGenerateSP = () => {
    const selectedMeds = items.filter(m => selectedIds.includes(m.medicine_id));
    onFastCreateSP?.(selectedMeds);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Banner */}
      <div className={`p-3.5 rounded-xl border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
              Rekomendasi Pemesanan Otomatis (Reorder Point / ROP)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ditemukan <strong>{items.length} obat</strong> yang stoknya sudah di bawah atau sama dengan Batas Minimum Stok.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleGenerateSP}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat SP Cepat ({selectedIds.length} Obat)</span>
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
                <th className="py-2.5 px-3 w-8 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 rounded text-purple-400 hover:text-purple-300"
                    title={selectedIds.length === items.length ? 'Batal pilih semua' : 'Pilih semua'}
                  >
                    {selectedIds.length === items.length && items.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">Kode & Nama Obat</th>
                <th className="py-2.5 px-3 text-center">Satuan Dasar</th>
                <th className="py-2.5 px-3 text-right">Stok Gudang</th>
                <th className="py-2.5 px-3 text-right">Stok Rak</th>
                <th className="py-2.5 px-3 text-right font-bold">Stok Total</th>
                <th className="py-2.5 px-3 text-center">Min. Stock</th>
                <th className="py-2.5 px-3 text-right text-rose-400 font-extrabold">Defisit (Kekurangan)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Menganalisis stok minimum obat...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-token-emerald" />
                    <span className="font-bold text-token-emerald block">Seluruh Stok Obat Masih Aman!</span>
                    <span className="text-xs text-slate-500 mt-1">Tidak ada obat yang berada di bawah ambang batas minimum.</span>
                  </td>
                </tr>
              ) : (
                items.map((m) => {
                  const isChecked = selectedIds.includes(m.medicine_id);
                  const deficit = Math.max(0, (m.min_stock || 0) - (m.total_stock || 0));

                  return (
                    <tr
                      key={m.medicine_id}
                      onClick={() => toggleSelect(m.medicine_id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked
                          ? (isLight ? 'bg-purple-50/50' : 'bg-purple-500/10')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-token-inner/20')
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(m.medicine_id)}
                          className="p-1 rounded text-purple-400 hover:text-purple-300"
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold block ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                          {m.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {m.item_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 border border-slate-500/20">
                          {m.base_unit_name || 'Pcs'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-500">
                        {m.total_warehouse || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-token-emerald">
                        {m.total_shelf || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-100">
                        {m.total_stock || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {m.min_stock || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-400">
                        -{deficit} {m.base_unit_name}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {m.total_stock <= 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            Habis (0)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Di Bawah Min
                          </span>
                        )}
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
