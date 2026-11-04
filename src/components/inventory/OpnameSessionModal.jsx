import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, Plus, Trash2, Check, AlertCircle, Warehouse, ShoppingCart, HelpCircle, ArrowRight, Package } from 'lucide-react';
import { getStockSummaries, createOpnameSession, submitOpnameSession } from '../../services/inventoryApi';
import { getMedicines } from '../../services/masterDataApi';

export default function OpnameSessionModal({ isOpen, onClose, theme = 'dark', branchId, token, onSuccess }) {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const [location, setLocation] = useState('RAK'); // 'RAK' or 'GUDANG'
  const [rackName, setRackName] = useState('');
  const [notes, setNotes] = useState('');

  // Stock catalog & Master medicines
  const [stockCatalog, setStockCatalog] = useState([]);
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Opname counted items
  const [items, setItems] = useState([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const [stockRes, medRes] = await Promise.all([
          getStockSummaries(token, '', branchId).catch(() => []),
          getMedicines(token, { limit: 150 }).catch(() => ({ data: [] })),
        ]);
        setStockCatalog(stockRes || []);
        const mList = medRes?.data || (Array.isArray(medRes) ? medRes : []);
        setMasterMedicines(mList);
      } catch (err) {
        console.error('Failed to load stock catalog & medicines for opname:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, [token, branchId]);

  // 1. Existing Batches in Database
  const existingBatches = stockCatalog.flatMap(med => {
    return (med.batches || []).map(b => ({
      type: 'EXISTING_BATCH',
      id: b.id,
      medicine_id: med.medicine_id,
      medicine_name: med.name,
      item_code: med.item_code,
      base_unit_name: med.base_unit_name,
      batch_number: b.batch_number,
      expired_date: b.expired_date,
      qty_warehouse: b.qty_warehouse || 0,
      qty_shelf: b.qty_shelf || 0,
    }));
  });

  // 2. Master medicines for adding physical count (even if 0 batch yet)
  const masterList = masterMedicines.map(m => ({
    type: 'MASTER_MEDICINE',
    id: `new-${m.id}`,
    medicine_id: m.id,
    medicine_name: m.name,
    item_code: m.item_code,
    base_unit_name: m.base_unit?.name || 'Pcs',
  }));

  const handleSelectItem = (val) => {
    if (!val) return;

    if (val.startsWith('batch:')) {
      const batchId = val.replace('batch:', '');
      const found = existingBatches.find(b => b.id === batchId);
      if (!found) return;

      if (items.some(it => it.batch_id === batchId)) {
        return;
      }

      const sysQty = location === 'GUDANG' ? (found.qty_warehouse || 0) : (found.qty_shelf || 0);

      setItems([
        ...items,
        {
          key: `batch-${found.id}`,
          medicine_id: found.medicine_id,
          medicine_name: found.medicine_name,
          batch_id: found.id,
          batch_number: found.batch_number,
          expired_date: found.expired_date ? found.expired_date.slice(0, 10) : '',
          base_unit_name: found.base_unit_name,
          system_qty: sysQty,
          physical_qty: sysQty,
          is_new_batch: false,
          notes: '',
        }
      ]);
    } else if (val.startsWith('med:')) {
      const medId = val.replace('med:', '');
      const found = masterList.find(m => m.medicine_id === medId);
      if (!found) return;

      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 1);

      setItems([
        ...items,
        {
          key: `new-${found.medicine_id}-${Date.now()}`,
          medicine_id: found.medicine_id,
          medicine_name: found.medicine_name,
          batch_id: '',
          batch_number: '',
          expired_date: defaultExp.toISOString().slice(0, 10),
          base_unit_name: found.base_unit_name,
          system_qty: 0,
          physical_qty: 0,
          is_new_batch: true,
          notes: 'Stok awal fisik',
        }
      ]);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Submit flow
  const handleSaveDraft = async () => {
    if (!rackName.trim()) {
      setError('Nama Rak / Zona wajib ditentukan (misal: "Rak 01 - Sirup")');
      return;
    }

    setLoadingSubmit(true);
    setError('');

    try {
      await createOpnameSession({
        location: location,
        rack_name: rackName.trim(),
        notes: notes,
        items: items.map(it => ({
          medicine_id: it.medicine_id,
          batch_id: it.batch_id || undefined,
          batch_number: it.batch_number ? it.batch_number.trim() : undefined,
          expired_date: it.expired_date || undefined,
          physical_qty: parseFloat(it.physical_qty) || 0,
          notes: it.notes,
        })),
      }, token, branchId);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal membuat sesi opname draft');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCommitInstant = async () => {
    if (!rackName.trim()) {
      setError('Nama Rak / Zona wajib ditentukan');
      return;
    }
    if (items.length === 0) {
      setError('Pilih minimal satu obat/batch di rak yang dihitung');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.is_new_batch && !it.batch_number?.trim()) {
        setError(`Baris #${i + 1} (${it.medicine_name}): Nomor batch fisik wajib diisi`);
        return;
      }
    }

    if (!window.confirm(`Konfirmasi penyesuaian stok fisik untuk ${items.length} item pada ${rackName} (${location})?\n\nSaldo stok akan disesuaikan seketika tanpa mengganggu kasir di rak lain.`)) {
      return;
    }

    setLoadingSubmit(true);
    setError('');

    try {
      // 1. Create session
      const created = await createOpnameSession({
        location: location,
        rack_name: rackName.trim(),
        notes: notes,
        items: [],
      }, token, branchId);

      // 2. Submit & Commit adjustment
      await submitOpnameSession(created.id, {
        items: items.map(it => ({
          medicine_id: it.medicine_id,
          batch_id: it.batch_id || undefined,
          batch_number: it.batch_number ? it.batch_number.trim() : undefined,
          expired_date: it.expired_date || undefined,
          physical_qty: parseFloat(it.physical_qty) || 0,
          notes: it.notes,
        })),
      }, token, branchId);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menerapkan penyesuaian stok opname');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-4xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-token-emerald/20 text-token-emerald border-token-emerald/30'
            }`}>
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold leading-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                Stok Opname Bergulir (Cycle Counting)
              </h3>
              <p className={`text-xs leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Hitung parsial per rak (10-15 menit). Apotek tetap buka & melayani kasir tanpa downtime!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition ${
              isLight ? 'hover:bg-slate-200 border-slate-200' : 'hover:bg-slate-700 border-token-border'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Location & Rack Configuration */}
          <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
          }`}>
            {/* Location Selector */}
            <div className="md:col-span-4">
              <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                Lokasi Fisik Opname *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLocation('RAK')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    location === 'RAK'
                      ? 'bg-token-emerald text-white border-token-emerald shadow-xs'
                      : (isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-token-card text-slate-400 border-token-border')
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Rak Penjualan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocation('GUDANG')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    location === 'GUDANG'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : (isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-token-card text-slate-400 border-token-border')
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Gudang Belakang</span>
                </button>
              </div>
            </div>

            {/* Rack / Zone Name */}
            <div className="md:col-span-5">
              <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                Nama Rak / Zona Yang Dihitung *
              </label>
              <input
                type="text"
                required
                value={rackName}
                onChange={(e) => setRackName(e.target.value)}
                placeholder="Contoh: Rak 01 - Obat Batuk & Flu"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border font-bold ${
                  isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>

            {/* Quick Notes */}
            <div className="md:col-span-3">
              <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                Catatan Sesi
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opname rutin..."
                className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                  isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>
          </div>

          {/* Quick Picker: Dropdown Obat & Batch */}
          <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3 shrink-0 ${
            isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            <span className="text-xs font-bold text-blue-400 shrink-0 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Pilih Obat di Rak Ini:</span>
            </span>

            <select
              onChange={(e) => {
                handleSelectItem(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className={`flex-1 w-full px-3 py-1.5 text-xs rounded-lg border font-medium ${
                isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
              }`}
            >
              <option value="" disabled>-- Klik untuk memilih obat / batch yang ada di rak ini --</option>

              {/* 1. Group: Batch Yang Sudah Ada di Database */}
              {existingBatches.length > 0 && (
                <optgroup label="📦 Batch Aktif di Sistem">
                  {existingBatches.map(b => (
                    <option key={`batch-${b.id}`} value={`batch:${b.id}`}>
                      {b.medicine_name} | Batch: {b.batch_number} (ED: {b.expired_date?.slice(0, 10)}) — Sistem {location}: {location === 'GUDANG' ? b.qty_warehouse : b.qty_shelf} {b.base_unit_name}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* 2. Group: Seluruh Katalog Master Obat (Untuk Stok Awal / Batch Baru) */}
              <optgroup label="📋 Katalog Master Obat (Hitung Fisik / Batch Baru)">
                {masterList.map(m => (
                  <option key={`med-${m.medicine_id}`} value={`med:${m.medicine_id}`}>
                    {m.medicine_name} ({m.item_code}) — [+ Input Hitung Fisik Rak]
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Opname Count Table */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Item Dalam Sesi Hitung Ini ({items.length} item)
              </span>
              <span className="text-[11px] text-slate-400">
                * Masukkan hasil hitung fisik pada kolom "Hasil Hitung Fisik"
              </span>
            </div>

            {items.length === 0 ? (
              <div className={`p-8 rounded-xl border text-center ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-token-inner/30 border-token-border text-slate-400'
              }`}>
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-400" />
                <p className="text-xs font-semibold">Belum ada obat yang dimasukkan ke sesi hitung ini.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih obat dari dropdown di atas. Anda dapat memilih batch yang sudah tercatat atau langsung memilih obat dari katalog master untuk menghitung stok awal fisik rak!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((it, idx) => {
                  const sys = parseFloat(it.system_qty) || 0;
                  const phys = parseFloat(it.physical_qty) || 0;
                  const diff = phys - sys;

                  return (
                    <div
                      key={it.key || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Medicine Info & Batch Edit if new (5 cols) */}
                        <div className="sm:col-span-5">
                          <span className={`text-xs font-bold block ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                            {it.medicine_name}
                          </span>

                          {it.is_new_batch ? (
                            <div className="flex items-center gap-2 mt-1.5">
                              <input
                                type="text"
                                required
                                placeholder="No. Batch Fisik (e.g. B2401)"
                                value={it.batch_number}
                                onChange={(e) => handleUpdateItem(idx, 'batch_number', e.target.value)}
                                className={`w-32 px-2 py-0.5 text-[11px] font-mono font-bold rounded border uppercase ${
                                  isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                                }`}
                              />
                              <input
                                type="date"
                                required
                                value={it.expired_date}
                                onChange={(e) => handleUpdateItem(idx, 'expired_date', e.target.value)}
                                title="Expired Date"
                                className={`w-32 px-2 py-0.5 text-[11px] rounded border ${
                                  isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                                }`}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                              <span>Batch: <strong>{it.batch_number}</strong></span>
                              <span>•</span>
                              <span>ED: {it.expired_date}</span>
                            </div>
                          )}
                        </div>

                        {/* System Qty (2 cols) */}
                        <div className="sm:col-span-2 text-center">
                          <span className="text-[10px] text-slate-400 block font-semibold">Stok Sistem</span>
                          <span className="text-sm font-bold font-mono text-slate-300">
                            {sys}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">{it.base_unit_name}</span>
                        </div>

                        {/* Physical Qty Input (3 cols) */}
                        <div className="sm:col-span-3">
                          <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                            Hasil Hitung Fisik *
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.physical_qty}
                              onChange={(e) => handleUpdateItem(idx, 'physical_qty', e.target.value)}
                              className={`w-full px-2.5 py-1 text-xs font-mono font-bold rounded-lg border text-right ${
                                diff === 0
                                  ? (isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white')
                                  : diff < 0
                                    ? 'bg-red-500/15 border-red-500/50 text-red-400 font-extrabold'
                                    : 'bg-blue-500/15 border-blue-500/50 text-blue-400 font-extrabold'
                              }`}
                            />
                            <span className="text-[11px] text-slate-400 shrink-0">{it.base_unit_name}</span>
                          </div>
                        </div>

                        {/* Difference & Delete (2 cols) */}
                        <div className="sm:col-span-2 flex items-center justify-between pl-2 border-l border-slate-200/50 dark:border-token-border">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Selisih</span>
                            <span className={`text-xs font-mono font-bold ${
                              diff === 0 ? 'text-token-emerald' : diff < 0 ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                            title="Hapus dari daftar opname"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Actions Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
        }`}>
          <div className="text-xs text-slate-400">
            Apotek tetap aktif: kasir tidak terganggu selama proses opname.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingSubmit}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-slate-500/10 transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loadingSubmit || !rackName.trim()}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-slate-500/30 hover:bg-slate-500/15 transition text-slate-200 disabled:opacity-40"
            >
              Simpan Draft
            </button>

            <button
              type="button"
              onClick={handleCommitInstant}
              disabled={loadingSubmit || items.length === 0 || !rackName.trim()}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
            >
              {loadingSubmit ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Terapkan Penyesuaian</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
