import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, DollarSign, Package, AlertCircle, CheckCircle2, Warehouse, ShoppingCart, Info } from 'lucide-react';
import { createInitialStockBatch, getStockSummaries } from '../../services/inventoryApi';

export default function InitialStockModal({
  isOpen,
  onClose,
  token,
  branch,
  theme = 'dark',
  initialMedicine = null,
  onSuccess,
}) {
  const isLight = theme === 'light';

  // Medicine list for selector if initialMedicine is not provided
  const [medicines, setMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState(initialMedicine?.id || initialMedicine?.medicine_id || '');

  // Form State
  const [batchNumber, setBatchNumber] = useState('');
  const [expiredDate, setExpiredDate] = useState('');
  const [qtyShelf, setQtyShelf] = useState('');
  const [qtyWarehouse, setQtyWarehouse] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [notes, setNotes] = useState('Saldo Awal Fisik Perdana');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load medicines catalog if not preselected
  useEffect(() => {
    if (!isOpen) return;

    if (initialMedicine?.id || initialMedicine?.medicine_id) {
      setSelectedMedId(initialMedicine?.id || initialMedicine?.medicine_id);
      return;
    }

    async function loadCatalog() {
      try {
        setLoadingMeds(true);
        const res = await getStockSummaries(token, '', branch?.id);
        setMedicines(res || []);
        if (res && res.length > 0 && !selectedMedId) {
          setSelectedMedId(res[0].medicine_id);
        }
      } catch (err) {
        console.error('Failed to load medicines for initial stock:', err);
      } finally {
        setLoadingMeds(false);
      }
    }
    loadCatalog();
  }, [isOpen, initialMedicine, token, branch?.id]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBatchNumber('');
      // Default ED to 2 years from now
      const defaultED = new Date();
      defaultED.setFullYear(defaultED.getFullYear() + 2);
      setExpiredDate(defaultED.toISOString().slice(0, 10));
      setQtyShelf('10');
      setQtyWarehouse('5');
      setBuyPrice('');
      setNotes('Saldo Awal Fisik Perdana');
      setErrorMsg('');
    }
  }, [isOpen, initialMedicine]);

  if (!isOpen) return null;

  // Selected Medicine details
  const activeMed = initialMedicine || medicines.find(m => (m.medicine_id === selectedMedId || m.id === selectedMedId));
  const baseUnit = activeMed?.base_unit_name || activeMed?.base_unit?.name || 'Item';

  const numShelf = parseFloat(qtyShelf) || 0;
  const numWarehouse = parseFloat(qtyWarehouse) || 0;
  const totalCombined = numShelf + numWarehouse;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedMedId) {
      setErrorMsg('Silakan pilih obat terlebih dahulu.');
      return;
    }
    if (!batchNumber.trim()) {
      setErrorMsg('Nomor batch / Lot obat wajib diisi.');
      return;
    }
    if (!expiredDate) {
      setErrorMsg('Tanggal kadaluarsa (Expired Date) wajib ditentukan.');
      return;
    }
    if (totalCombined <= 0) {
      setErrorMsg('Jumlah stok masuk (Rak Kasir atau Gudang Belakang) harus lebih dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        medicine_id: selectedMedId,
        batch_number: batchNumber.trim().toUpperCase(),
        expired_date: expiredDate,
        qty_warehouse: numWarehouse,
        qty_shelf: numShelf,
        buy_price: parseFloat(buyPrice) || 0,
        notes: notes.trim(),
      };

      await createInitialStockBatch(payload, token, branch?.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan saldo awal batch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-300' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Input Saldo Awal / Batch Baru</h3>
              <p className="text-[11px] text-slate-400">
                Pencatatan batch fisik perdana langsung ke rak kasir & gudang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-500/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Medicine Selection / Display */}
          <div>
            <label className="text-xs font-semibold block mb-1 text-slate-400">
              Obat & Sediaan *
            </label>
            {initialMedicine ? (
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/80 border-token-border'
              }`}>
                <div>
                  <span className="text-xs font-bold block text-token-emerald">
                    {activeMed?.name || activeMed?.medicine_name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Kode: {activeMed?.item_code || '-'} | Satuan: {baseUnit}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-token-emerald/15 text-token-emerald border border-token-emerald/30">
                  Katalog Terpilih
                </span>
              </div>
            ) : (
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                disabled={loadingMeds}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-white'
                }`}
              >
                {medicines.map((m) => (
                  <option key={m.medicine_id} value={m.medicine_id}>
                    {m.name} ({m.item_code}) — {m.base_unit_name || 'Item'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Batch Number & Expired Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-slate-400">
                Nomor Batch / Lot *
              </label>
              <input
                type="text"
                placeholder="Contoh: EFG146 / BTH-001"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                required
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-white'
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                * Nomor batch yang tercetak di kemasan fisik obat
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-slate-400">
                Tanggal Kadaluarsa (ED) *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                * Digunakan sebagai acuan FEFO kasir
              </span>
            </div>
          </div>

          {/* Allocation: Shelf vs Warehouse */}
          <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Alokasi Jumlah Fisik Masuk ({baseUnit})
              </span>
              <span className="text-xs font-extrabold text-cyan-400 font-mono">
                Total Masuk: {totalCombined} {baseUnit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Rak Penjualan */}
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-token-emerald mb-1">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Rak Penjualan Kasir</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={qtyShelf}
                  onChange={(e) => setQtyShelf(e.target.value)}
                  placeholder="0"
                  className={`w-full px-3 py-1.5 text-sm font-mono font-bold rounded-lg border text-right focus:outline-hidden focus:ring-1 focus:ring-token-emerald ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-card border-token-border text-token-emerald'
                  }`}
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Langsung siap ditransaksikan kasir
                </span>
              </div>

              {/* Gudang Belakang */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-1">
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Gudang Belakang</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={qtyWarehouse}
                  onChange={(e) => setQtyWarehouse(e.target.value)}
                  placeholder="0"
                  className={`w-full px-3 py-1.5 text-sm font-mono font-bold rounded-lg border text-right focus:outline-hidden focus:ring-1 focus:ring-amber-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-card border-token-border text-amber-400'
                  }`}
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Stok cadangan / buffer
                </span>
              </div>
            </div>
          </div>

          {/* Buy Price / HPP & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-slate-400">
                Harga Beli Satuan (HPP / Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="Contoh: 19500"
                  className={`w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-slate-400">
                Catatan / Keterangan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Saldo Awal Fisik Perdana"
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-token-inner border-token-border text-white'
                }`}
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
            isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}>
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div>
              <p className="font-semibold">Otomatisasi Buku Besar Mutasi Stok:</p>
              <p className="text-[10px] opacity-80 mt-0.5">
                Pencatatan ini seketika menambah fisik obat dan membuat jurnal mutasi audit <strong>SALDO AWAL</strong> di Kartu Stok Digital secara transparan dan akuntabel.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-token-inner hover:bg-slate-700 text-slate-300 border-token-border'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Saldo Awal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
