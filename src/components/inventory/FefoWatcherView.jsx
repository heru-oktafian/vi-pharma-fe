import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, ArrowRightLeft, ShieldAlert, CheckCircle2, Search, Warehouse, ShoppingCart } from 'lucide-react';
import { getFefoAlerts } from '../../services/inventoryApi';
import RefillShelfModal from './RefillShelfModal';

export default function FefoWatcherView({ token, userRole, theme = 'dark', branch }) {
  const isLight = theme === 'light';
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Refill Modal
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await getFefoAlerts(token, branch?.id);
      setAlerts(res || []);
    } catch (err) {
      console.error('Failed to load FEFO alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [token, branch?.id]);

  const handleOpenRefill = (item) => {
    setSelectedBatch({
      id: item.batch_id,
      batch_number: item.batch_number,
      expired_date: item.expired_date,
      qty_warehouse: item.qty_warehouse,
      qty_shelf: item.qty_shelf,
    });
    setSelectedMedicine({
      id: item.medicine_id,
      name: item.medicine_name,
      base_unit_name: 'Pcs',
    });
    setRefillModalOpen(true);
  };

  // Filter Data
  const filteredAlerts = alerts.filter(a => {
    if (filterStatus !== 'ALL' && a.alert_status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.medicine_name?.toLowerCase().includes(q) ||
        a.item_code?.toLowerCase().includes(q) ||
        a.batch_number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI counters
  const expiredCount = alerts.filter(a => a.alert_status === 'EXPIRED').length;
  const criticalCount = alerts.filter(a => a.alert_status === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.alert_status === 'WARNING').length;
  const safeCount = alerts.filter(a => a.alert_status === 'SAFE').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top KPI Cards (Single-line compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div
          onClick={() => setFilterStatus('EXPIRED')}
          className={`p-2.5 rounded-xl border cursor-pointer transition ${
            filterStatus === 'EXPIRED'
              ? 'ring-2 ring-red-500 shadow-md'
              : 'hover:border-red-500/50'
          } ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              Kadaluarsa (ED)
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          </div>
          <div className="text-xl font-mono font-extrabold text-red-500 mt-1">
            {expiredCount} <span className="text-xs font-normal text-slate-400">Batch</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('CRITICAL')}
          className={`p-2.5 rounded-xl border cursor-pointer transition ${
            filterStatus === 'CRITICAL'
              ? 'ring-2 ring-rose-500 shadow-md'
              : 'hover:border-rose-500/50'
          } ${isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Kritis (&lt; 90 Hari)
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-mono font-extrabold text-rose-400 mt-1">
            {criticalCount} <span className="text-xs font-normal text-slate-400">Batch</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('WARNING')}
          className={`p-2.5 rounded-xl border cursor-pointer transition ${
            filterStatus === 'WARNING'
              ? 'ring-2 ring-amber-500 shadow-md'
              : 'hover:border-amber-500/50'
          } ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Peringatan (&lt; 180 Hari)
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-extrabold text-amber-400 mt-1">
            {warningCount} <span className="text-xs font-normal text-slate-400">Batch</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('SAFE')}
          className={`p-2.5 rounded-xl border cursor-pointer transition ${
            filterStatus === 'SAFE'
              ? 'ring-2 ring-emerald-500 shadow-md'
              : 'hover:border-emerald-500/50'
          } ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-token-emerald/10 border-token-emerald/20'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-token-emerald">
              Aman (&gt; 180 Hari)
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-token-emerald" />
          </div>
          <div className="text-xl font-mono font-extrabold text-token-emerald mt-1">
            {safeCount} <span className="text-xs font-normal text-slate-400">Batch</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-3 rounded-xl border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari batch, nama obat, kode..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-token-inner border-token-border text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Reset Filter
            </button>
          )}

          <button
            onClick={loadAlerts}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEFO Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">No. Batch</th>
                <th className="py-2.5 px-3">Nama Obat</th>
                <th className="py-2.5 px-3">Tanggal Expired (ED)</th>
                <th className="py-2.5 px-3 text-center">Sisa Waktu</th>
                <th className="py-2.5 px-3 text-right text-amber-500">Stok Gudang</th>
                <th className="py-2.5 px-3 text-right text-token-emerald">Stok Rak</th>
                <th className="py-2.5 px-3 text-right font-bold">Total Stok</th>
                <th className="py-2.5 px-3 text-center">Status FEFO</th>
                <th className="py-2.5 px-3 text-center w-36">Prioritas Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && alerts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                    <span>Menganalisis urutan kadaluarsa FEFO...</span>
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-token-emerald" />
                    <span>Tidak ada data batch obat untuk kriteria filter ini.</span>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => {
                  const isExp = a.alert_status === 'EXPIRED';
                  const isCrit = a.alert_status === 'CRITICAL';
                  const isWarn = a.alert_status === 'WARNING';

                  return (
                    <tr key={a.batch_id} className="hover:bg-slate-500/5 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {a.batch_number}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {a.medicine_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {a.expired_date?.slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {isExp ? (
                          <span className="text-red-500">Expired ({Math.abs(a.days_to_expiry)} hari lalu)</span>
                        ) : (
                          <span className={isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-slate-300'}>
                            {a.days_to_expiry} hari lagi
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-500">
                        {a.qty_warehouse || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-token-emerald">
                        {a.qty_shelf || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-100">
                        {a.total_stock || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExp
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                            : isCrit
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isWarn
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-token-emerald border border-token-emerald/30'
                        }`}>
                          {a.alert_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {/* If batch still in warehouse, give quick button to move to shelf so it gets sold first! */}
                        {(a.qty_warehouse || 0) > 0 && !isExp ? (
                          <button
                            onClick={() => handleOpenRefill(a)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition flex items-center justify-center gap-1 mx-auto"
                            title="Pajang di Rak Kasir agar segera terjual (FEFO)"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Pajang di Rak</span>
                          </button>
                        ) : isExp ? (
                          <span className="text-[10px] text-red-400 font-bold">Karantina / Retur</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Sudah di Rak</span>
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

      {/* Refill Modal */}
      <RefillShelfModal
        isOpen={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
        batch={selectedBatch}
        medicine={selectedMedicine}
        theme={theme}
        branchId={branch?.id}
        token={token}
        onSuccess={loadAlerts}
      />
    </div>
  );
}
