import React, { useState } from 'react';
import { X, ArrowRightLeft, Warehouse, ShoppingCart, AlertCircle, Check } from 'lucide-react';
import { refillShelf, returnToWarehouse } from '../../services/inventoryApi';

export default function RefillShelfModal({ isOpen, onClose, batch, medicine, theme = 'dark', branchId, token, onSuccess }) {
  if (!isOpen || !batch) return null;

  const isLight = theme === 'light';
  const [mode, setMode] = useState('refill'); // 'refill' (Gudang -> Rak) or 'return' (Rak -> Gudang)
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxQty = mode === 'refill' ? (batch.qty_warehouse || 0) : (batch.qty_shelf || 0);
  const numQty = parseFloat(qty) || 0;
  const isInvalid = numQty <= 0 || numQty > maxQty;

  const handleQuickAdd = (val) => {
    if (val === 'all') {
      setQty(String(maxQty));
    } else {
      const next = Math.min(maxQty, (parseFloat(qty) || 0) + val);
      setQty(String(next));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError('');

    try {
      if (mode === 'refill') {
        await refillShelf({
          batch_id: batch.id,
          qty: numQty,
          notes: notes || `Refill Rak dari Gudang (${numQty} ${medicine?.base_unit_name || 'Pcs'})`,
        }, token, branchId);
      } else {
        await returnToWarehouse({
          batch_id: batch.id,
          qty: numQty,
          notes: notes || `Pengembalian ke Gudang dari Rak (${numQty} ${medicine?.base_unit_name || 'Pcs'})`,
        }, token, branchId);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memproses mutasi stok');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isLight ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold leading-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                {mode === 'refill' ? 'Refill Rak Penjualan' : 'Kembalikan ke Gudang'}
              </h3>
              <p className={`text-[11px] leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Transfer Internal Gudang ⇄ Rak Kasir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg border transition ${
              isLight ? 'hover:bg-slate-200 border-slate-200' : 'hover:bg-slate-700 border-token-border'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle Switch */}
        <div className="p-4 pb-0">
          <div className={`flex rounded-xl p-1 border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-token-inner border-token-border'
          }`}>
            <button
              type="button"
              onClick={() => { setMode('refill'); setQty(''); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'refill'
                  ? isLight
                    ? 'bg-white text-vip-orange shadow-xs border border-vip-orange/30'
                    : 'bg-token-card text-token-emerald shadow-xs border border-token-emerald/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Gudang → Rak Kasir</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('return'); setQty(''); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'return'
                  ? isLight
                    ? 'bg-white text-vip-navy shadow-xs border border-vip-navy/30'
                    : 'bg-token-card text-amber-400 shadow-xs border border-amber-500/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Rak Kasir → Gudang</span>
            </button>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Medicine & Batch Info Card */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/60 border-token-border'
          }`}>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Informasi Obat & Batch
            </div>
            <div className={`text-sm font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
              {medicine?.name}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span>Batch: <strong className="font-mono text-slate-200">{batch.batch_number}</strong></span>
              <span>•</span>
              <span>ED: <strong className="font-mono text-slate-200">{batch.expired_date?.slice(0, 10)}</strong></span>
            </div>

            {/* Current Dual Stock Badges */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/50 dark:border-token-border">
              <div className={`p-2 rounded-lg border text-center ${
                mode === 'refill'
                  ? (isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/15 border-amber-500/30')
                  : (isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border')
              }`}>
                <span className="text-[10px] text-slate-400 block font-medium">Stok Gudang</span>
                <span className={`text-base font-bold font-mono ${
                  mode === 'refill' ? 'text-amber-500 font-extrabold' : 'text-slate-300'
                }`}>
                  {batch.qty_warehouse || 0}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">{medicine?.base_unit_name || 'Pcs'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-center ${
                mode === 'return'
                  ? (isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-token-emerald/15 border-token-emerald/30')
                  : (isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border')
              }`}>
                <span className="text-[10px] text-slate-400 block font-medium">Stok di Rak Kasir</span>
                <span className={`text-base font-bold font-mono ${
                  mode === 'return' ? 'text-token-emerald font-extrabold' : 'text-slate-300'
                }`}>
                  {batch.qty_shelf || 0}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">{medicine?.base_unit_name || 'Pcs'}</span>
              </div>
            </div>
          </div>

          {/* Qty Input & Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold">
                Jumlah Transfer ({medicine?.base_unit_name || 'Pcs'})
              </label>
              <span className="text-[11px] text-slate-400">
                Maksimal: <strong className="font-mono text-slate-200">{maxQty}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                max={maxQty}
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={`0 (maks ${maxQty})`}
                autoFocus
                className={`w-full px-3 py-2 rounded-xl text-base font-mono font-bold border transition ${
                  isLight
                    ? 'bg-white border-slate-300 focus:border-vip-orange focus:ring-1 focus:ring-vip-orange'
                    : 'bg-token-inner border-token-border focus:border-token-emerald text-white'
                }`}
              />
            </div>

            {/* Quick Fill Buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                disabled={maxQty < 5}
                className="px-2 py-1 text-[11px] font-bold rounded-lg border bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-30 border-slate-500/20"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                disabled={maxQty < 10}
                className="px-2 py-1 text-[11px] font-bold rounded-lg border bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-30 border-slate-500/20"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(25)}
                disabled={maxQty < 25}
                className="px-2 py-1 text-[11px] font-bold rounded-lg border bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-30 border-slate-500/20"
              >
                +25
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('all')}
                disabled={maxQty <= 0}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30 disabled:opacity-30 ml-auto"
              >
                Semua ({maxQty})
              </button>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-semibold block mb-1">Catatan / Alasan Transfer (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === 'refill' ? 'Contoh: Refill rak etalase depan' : 'Contoh: Rak penuh, simpan ke gudang'}
              className={`w-full px-3 py-1.5 text-xs rounded-xl border transition ${
                isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-token-border mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border hover:bg-slate-500/10 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isInvalid}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md ${
                mode === 'refill'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40'
                  : 'bg-vip-navy hover:bg-blue-900 text-white disabled:opacity-40'
              }`}
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{mode === 'refill' ? 'Pindahkan ke Rak Kasir' : 'Kembalikan ke Gudang'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
