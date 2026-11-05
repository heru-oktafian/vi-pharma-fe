import React, { useState, useEffect } from 'react';
import {
  Search, RefreshCw, ArrowRightLeft, Warehouse, ShoppingCart,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  Package, Calendar, BookOpen, QrCode, Layers, PlusCircle
} from 'lucide-react';
import { getStockSummaries } from '../../services/inventoryApi';
import RefillShelfModal from './RefillShelfModal';
import InitialStockModal from './InitialStockModal';
import ItemBarcodeLabelModal from '../master/ItemBarcodeLabelModal';

export default function StockOverviewView({ token, userRole, theme = 'dark', branch, onOpenStockCard }) {
  const isLight = theme === 'light';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'OUT_OF_STOCK', 'LOW_STOCK', 'SAFE'
  const [expandedMeds, setExpandedMeds] = useState({});

  // Modal State
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Initial Stock Modal State
  const [initialStockModalOpen, setInitialStockModalOpen] = useState(false);
  const [initialStockMed, setInitialStockMed] = useState(null);

  // Barcode Label Modal State
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeMedicine, setBarcodeMedicine] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getStockSummaries(token, search, branch?.id);
      setData(res || []);
    } catch (err) {
      console.error('Failed to load 3-level stock summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, branch?.id, token]);

  const toggleExpand = (medId) => {
    setExpandedMeds(prev => ({
      ...prev,
      [medId]: !prev[medId]
    }));
  };

  const handleOpenRefill = (med, batch) => {
    setSelectedMedicine(med);
    setSelectedBatch(batch);
    setRefillModalOpen(true);
  };

  // Filter Data
  const filteredData = data.filter(med => {
    const total = med.total_stock || 0;
    const min = med.min_stock || 0;

    if (filterStatus === 'OUT_OF_STOCK') return total <= 0;
    if (filterStatus === 'LOW_STOCK') return total > 0 && total <= min;
    if (filterStatus === 'SAFE') return total > min;
    return true;
  });

  // Calculate high-level counters
  const totalMeds = data.length;
  const outOfStockCount = data.filter(m => (m.total_stock || 0) <= 0).length;
  const lowStockCount = data.filter(m => (m.total_stock || 0) > 0 && (m.total_stock || 0) <= (m.min_stock || 0)).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Bar: Search, Filters & Stats */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari obat, kode item, barcode..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
            }`}
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-token-emerald text-white border-token-emerald'
                : 'text-slate-400 border-slate-700/50 hover:bg-slate-700/30'
            }`}
          >
            Semua ({totalMeds})
          </button>
          <button
            onClick={() => setFilterStatus('LOW_STOCK')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
              filterStatus === 'LOW_STOCK'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            Menipis ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStatus('OUT_OF_STOCK')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
              filterStatus === 'OUT_OF_STOCK'
                ? 'bg-red-500 text-white border-red-500'
                : 'text-red-400 border-red-500/30 hover:bg-red-500/10'
            }`}
          >
            Habis ({outOfStockCount})
          </button>

          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition ml-1"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Quick Input Saldo Awal / Batch Baru */}
          <button
            onClick={() => {
              setInitialStockMed(null);
              setInitialStockModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition whitespace-nowrap ml-1.5"
            title="Input Saldo Awal / Batch Baru Obat"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Saldo Awal Batch</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3 w-8 text-center"></th>
                <th className="py-2.5 px-3">Kode & Nama Obat</th>
                <th className="py-2.5 px-3 text-center w-24">Satuan Dasar</th>
                <th className="py-2.5 px-3 text-right w-28 bg-amber-500/5">
                  <div className="flex items-center justify-end gap-1 text-amber-500">
                    <Warehouse className="w-3 h-3" />
                    <span>Gudang</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right w-28 bg-emerald-500/5">
                  <div className="flex items-center justify-end gap-1 text-token-emerald">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Rak Kasir</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right w-28 font-extrabold">Stok Total</th>
                <th className="py-2.5 px-3 text-center w-24">Status</th>
                <th className="py-2.5 px-3 text-center w-36">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                    <span>Memuat katalog stok 3-level...</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>Tidak ada data obat yang sesuai dengan pencarian atau filter.</span>
                  </td>
                </tr>
              ) : (
                filteredData.map((med) => {
                  const isExpanded = !!expandedMeds[med.medicine_id];
                  const total = med.total_stock || 0;
                  const min = med.min_stock || 0;
                  const batches = med.batches || [];
                  const isLow = total > 0 && total <= min;
                  const isOut = total <= 0;

                  return (
                    <React.Fragment key={med.medicine_id}>
                      {/* Main Row */}
                      <tr className={`transition-colors ${
                        isExpanded
                          ? (isLight ? 'bg-slate-50' : 'bg-token-inner/50')
                          : (isLight ? 'hover:bg-slate-50/70' : 'hover:bg-token-inner/30')
                      }`}>
                        {/* Expand Toggle */}
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => toggleExpand(med.medicine_id)}
                            className="p-1 rounded hover:bg-slate-500/20 text-slate-400 transition"
                            title={isExpanded ? 'Tutup rincian batch' : 'Buka rincian batch'}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-token-emerald" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* Medicine Name & Code */}
                        <td className="py-2 px-3">
                          <span className={`font-bold block ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                            {med.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {med.item_code}
                          </span>
                        </td>

                        {/* Base Unit */}
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 border border-slate-500/20">
                            {med.base_unit_name || 'Pcs'}
                          </span>
                        </td>

                        {/* Warehouse Stock */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-500 bg-amber-500/5">
                          {med.total_warehouse || 0}
                        </td>

                        {/* Shelf Stock */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-token-emerald bg-emerald-500/5">
                          {med.total_shelf || 0}
                        </td>

                        {/* Total Combined Stock */}
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-sm text-slate-100">
                          {total}
                        </td>

                        {/* Min Stock Status */}
                        <td className="py-2 px-3 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Menipis (&lt;{min})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-token-emerald border border-token-emerald/30">
                              Aman
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Refill Button (if warehouse has stock) */}
                            {batches.some(b => (b.qty_warehouse || 0) > 0) && (
                              <button
                                onClick={() => {
                                  // Pick first batch that has warehouse stock
                                  const targetBatch = batches.find(b => (b.qty_warehouse || 0) > 0);
                                  handleOpenRefill(med, targetBatch);
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition flex items-center gap-1"
                                title="Refill ke Rak Kasir"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Refill Rak</span>
                              </button>
                            )}

                            {/* Input Saldo Awal / Batch Baru for this medicine */}
                            <button
                              onClick={() => {
                                setInitialStockMed({
                                  id: med.medicine_id,
                                  name: med.name,
                                  item_code: med.item_code,
                                  base_unit_name: med.base_unit_name,
                                });
                                setInitialStockModalOpen(true);
                              }}
                              className="p-1 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition"
                              title="Input Saldo Awal / Tambah Batch Baru"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>

                            {/* Barcode & Shelf Label Print */}
                            <button
                              onClick={() => {
                                setBarcodeMedicine({
                                  id: med.medicine_id,
                                  item_code: med.item_code,
                                  name: med.name,
                                  base_unit_name: med.base_unit_name,
                                  storage_location: med.storage_location || 'Rak Penjualan',
                                });
                                setBarcodeModalOpen(true);
                              }}
                              className="p-1 rounded-lg border border-slate-500/30 text-slate-400 hover:text-token-emerald hover:bg-slate-500/10 transition"
                              title="Cetak Label Barcode & Rak"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Stock Card Button */}
                            <button
                              onClick={() => onOpenStockCard?.(med.medicine_id, med.name)}
                              className="p-1 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white hover:bg-slate-500/10 transition"
                              title="Lihat Kartu Mutasi Stok"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Drawer: Batch Breakdown (FEFO) */}
                      {isExpanded && (
                        <tr className={isLight ? 'bg-slate-100/60' : 'bg-token-inner/25'}>
                          <td colSpan="8" className="p-3 pl-12 pr-6">
                            <div className="rounded-xl border border-slate-200 dark:border-token-border overflow-hidden bg-token-card/60">
                              <div className="px-3 py-1.5 bg-slate-500/10 border-b border-token-border flex items-center justify-between text-[11px] font-bold text-slate-400">
                                <span>Rincian Nomor Batch & Expired Date (Urutan FEFO):</span>
                                <span>{batches.length} Batch Aktif</span>
                              </div>

                              {batches.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                  <p className="mb-2">Obat ini belum memiliki batch fisik terdaftar di rak maupun gudang.</p>
                                  <button
                                    onClick={() => {
                                      setInitialStockMed({
                                        id: med.medicine_id,
                                        name: med.name,
                                        item_code: med.item_code,
                                        base_unit_name: med.base_unit_name,
                                      });
                                      setInitialStockModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>Input Saldo Awal Batch Sekarang</span>
                                  </button>
                                </div>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead className="text-[10px] text-slate-500 uppercase border-b border-token-border/50">
                                    <tr>
                                      <th className="py-1 px-3">No. Batch</th>
                                      <th className="py-1 px-3">Expired Date</th>
                                      <th className="py-1 px-3 text-right">Stok Gudang</th>
                                      <th className="py-1 px-3 text-right">Stok Rak</th>
                                      <th className="py-1 px-3 text-right">Total Batch</th>
                                      <th className="py-1 px-3 text-center">Aksi Refill</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-token-border/30">
                                    {batches.map((b) => (
                                      <tr key={b.id} className="hover:bg-slate-500/5">
                                        <td className="py-1.5 px-3 font-mono font-bold text-slate-200">
                                          {b.batch_number}
                                        </td>
                                        <td className="py-1.5 px-3 font-mono text-slate-400">
                                          {b.expired_date?.slice(0, 10)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-amber-400">
                                          {b.qty_warehouse || 0}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-token-emerald">
                                          {b.qty_shelf || 0}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-200">
                                          {b.total_stock || 0}
                                        </td>
                                        <td className="py-1.5 px-3 text-center">
                                          <button
                                            onClick={() => handleOpenRefill(med, b)}
                                            className="px-2 py-0.5 text-[10px] font-bold rounded bg-token-inner hover:bg-slate-700 text-slate-200 border border-token-border transition"
                                          >
                                            Transfer Gudang ⇄ Rak
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refill Modal */}
      <RefillShelfModal
        isOpen={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
        batch={selectedBatch}
        medicine={selectedMedicine}
        theme={theme}
        branchId={branch?.id}
        token={token}
        onSuccess={loadData}
      />

      {/* Barcode & Shelf Tag Print Modal */}
      <ItemBarcodeLabelModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        medicine={barcodeMedicine}
        branch={branch}
        theme={theme}
      />

      {/* Initial Stock / Batch Modal */}
      <InitialStockModal
        isOpen={initialStockModalOpen}
        onClose={() => setInitialStockModalOpen(false)}
        token={token}
        branch={branch}
        theme={theme}
        initialMedicine={initialStockMed}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
