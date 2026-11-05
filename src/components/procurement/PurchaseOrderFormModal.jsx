import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Check, AlertCircle, Building2, Calendar, ShieldAlert } from 'lucide-react';
import { getSuppliers, getMedicines, getUnits } from '../../services/masterDataApi';
import { createPurchaseOrder, updatePurchaseOrder } from '../../services/procurementApi';

export default function PurchaseOrderFormModal({ isOpen, onClose, theme = 'dark', branch, token, editPO = null, onSuccess }) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const todayStr = new Date().toISOString().slice(0, 10);

  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [supplierId, setSupplierId] = useState(editPO?.supplier_id || '');
  const [spType, setSpType] = useState(editPO?.sp_type || 'REGULER');
  const [orderDate, setOrderDate] = useState(editPO?.order_date?.slice(0, 10) || todayStr);
  const [estDeliveryDate, setEstDeliveryDate] = useState(editPO?.estimated_delivery_date?.slice(0, 10) || '');
  const [pharmacistName, setPharmacistName] = useState(editPO?.pharmacist_name || 'apt. Heru Oktafian, S.Farm.');
  const [pharmacistSIPA, setPharmacistSIPA] = useState(editPO?.pharmacist_sipa || '19950812/SIPA_31.74/2023/2001');
  const [notes, setNotes] = useState(editPO?.notes || '');

  // Line items
  const [items, setItems] = useState(
    editPO?.items?.map(it => ({
      id: it.id || `row-${Math.random()}`,
      medicine_id: it.medicine_id,
      unit_id: it.unit_id,
      qty_ordered: it.qty_ordered,
      estimated_price: it.estimated_price || 0,
      notes: it.notes || '',
    })) || [
      {
        id: 'row-1',
        medicine_id: '',
        unit_id: '',
        qty_ordered: 1,
        estimated_price: 0,
        notes: '',
      }
    ]
  );

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [supRes, medRes, unitRes] = await Promise.all([
          getSuppliers(token).catch(() => []),
          getMedicines({ limit: 300 }, token).catch(() => ({ data: [] })),
          getUnits(token).catch(() => []),
        ]);
        setSuppliers(supRes || []);
        const medList = medRes?.data || medRes?.items || (Array.isArray(medRes) ? medRes : []);
        setMedicines(medList);
        const unitList = Array.isArray(unitRes) ? unitRes : (unitRes?.data || []);
        setUnits(unitList);
      } catch (err) {
        console.error('Failed to load PO dependencies:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [token]);

  // When changing SP Type to Narkotika, enforce 1 item maximum
  const handleSpTypeChange = (newType) => {
    setSpType(newType);
    if (newType === 'NARKOTIKA' && items.length > 1) {
      setItems([items[0]]);
    }
  };

  const handleAddItem = () => {
    if (spType === 'NARKOTIKA' && items.length >= 1) {
      setError('Sesuai regulasi BPOM & UU Narkotika, Surat Pesanan Narkotika hanya boleh berisi 1 jenis obat per lembar!');
      return;
    }
    setItems([
      ...items,
      {
        id: `row-${Date.now()}`,
        medicine_id: '',
        unit_id: '',
        qty_ordered: 1,
        estimated_price: 0,
        notes: '',
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'medicine_id') {
      const selectedMed = medicines.find(m => m.id === value);
      if (selectedMed) {
        updated[index].unit_id = selectedMed.base_unit_id || (selectedMed.units?.[0]?.unit_id) || '';
        updated[index].estimated_price = selectedMed.buy_price || 0;
        updated[index].notes = `${selectedMed.dosage_form || ''} ${selectedMed.strength || ''}`.trim();
      }
    }

    setItems(updated);
  };

  const totalEstimated = items.reduce((acc, it) => {
    return acc + ((parseFloat(it.qty_ordered) || 0) * (parseFloat(it.estimated_price) || 0));
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !orderDate || !pharmacistName || !pharmacistSIPA) {
      setError('Supplier PBF, Tanggal Pesan, Nama Apoteker, dan No. SIPA wajib diisi');
      return;
    }

    if (spType === 'NARKOTIKA' && items.length > 1) {
      setError('Regulasi UU Narkotika: 1 Surat Pesanan Narkotika HANYA boleh berisi 1 item obat!');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.medicine_id) {
        setError(`Baris #${i + 1}: Obat belum dipilih`);
        return;
      }
      if ((parseFloat(it.qty_ordered) || 0) <= 0) {
        setError(`Baris #${i + 1}: Jumlah pesan harus lebih dari 0`);
        return;
      }
    }

    setLoadingSubmit(true);
    setError('');

    try {
      const payload = {
        supplier_id: supplierId,
        order_date: orderDate,
        estimated_delivery_date: estDeliveryDate || undefined,
        sp_type: spType,
        pharmacist_name: pharmacistName.trim(),
        pharmacist_sipa: pharmacistSIPA.trim(),
        notes: notes,
        items: items.map(it => ({
          medicine_id: it.medicine_id,
          unit_id: it.unit_id || (units.length > 0 ? units[0].id : 'UNT000000000001'),
          qty_ordered: parseFloat(it.qty_ordered) || 0,
          estimated_price: parseFloat(it.estimated_price) || 0,
          notes: it.notes,
        })),
      };

      if (editPO?.id) {
        await updatePurchaseOrder(editPO.id, payload, token, branch?.id);
      } else {
        await createPurchaseOrder(payload, token, branch?.id);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan Surat Pesanan');
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
              spType === 'NARKOTIKA'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : spType === 'PSIKOTROPIKA'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-purple-100 text-purple-700 border-purple-300'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold leading-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                {editPO ? 'Edit Surat Pesanan' : 'Buat Surat Pesanan Resmi (SP / PO)'}
              </h3>
              <p className={`text-xs leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Format resmi sesuai standar regulasi BPOM & SIPA Apoteker Penanggung Jawab
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Special Regulation Banner for Narkotika & Psikotropika */}
            {spType === 'NARKOTIKA' && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 shrink-0">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">PERATURAN RESMI BADAN POM RI - SURAT PESANAN NARKOTIKA:</strong>
                  <span>Hanya diperbolehkan mencantumkan <strong>1 (satu) jenis sediaan narkotika</strong> per lembar Surat Pesanan. Jika memerlukan beberapa jenis, silakan buat Surat Pesanan terpisah.</span>
                </div>
              </div>
            )}

            {/* Top Grid: SP Type, Supplier, Dates */}
            <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              {/* 1. Jenis SP */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Jenis Surat Pesanan *
                </label>
                <select
                  value={spType}
                  onChange={(e) => handleSpTypeChange(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-bold ${
                    spType === 'NARKOTIKA'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : spType === 'PSIKOTROPIKA'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                >
                  <option value="REGULER">SP Reguler / Alkes</option>
                  <option value="PREKURSOR">SP Prekursor Farmasi</option>
                  <option value="OOT">SP Obat Tertentu (OOT)</option>
                  <option value="PSIKOTROPIKA">SP Psikotropika</option>
                  <option value="NARKOTIKA">SP Narkotika (1 Item)</option>
                </select>
              </div>

              {/* 2. PBF Supplier */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Distributor PBF Tujuan *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-medium ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                >
                  <option value="">-- Pilih Supplier PBF --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code || 'PBF'})</option>
                  ))}
                </select>
              </div>

              {/* 3. Order Date */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Tanggal Pemesanan *
                </label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>

              {/* 4. Est Delivery Date */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Estimasi Tiba (Opsional)
                </label>
                <input
                  type="date"
                  value={estDeliveryDate}
                  onChange={(e) => setEstDeliveryDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>
            </div>

            {/* Middle Grid: APJ & SIPA */}
            <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Apoteker Penanggung Jawab (APJ) *
                </label>
                <input
                  type="text"
                  required
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                  placeholder="Contoh: apt. Heru Oktafian, S.Farm."
                  className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Nomor SIPA Resmi APJ *
                </label>
                <input
                  type="text"
                  required
                  value={pharmacistSIPA}
                  onChange={(e) => setPharmacistSIPA(e.target.value)}
                  placeholder="Contoh: 19950812/SIPA_31.74/2023/2001"
                  className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>
            </div>

            {/* Line Items Container */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daftar Obat yang Dipesan ({items.length} item)
                </span>

                {spType !== 'NARKOTIKA' && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-token-emerald/20 hover:bg-token-emerald/30 text-token-emerald border border-token-emerald/30 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Obat</span>
                  </button>
                )}
              </div>

              {/* Items Table / Cards */}
              <div className="flex flex-col gap-2.5">
                {items.map((it, idx) => {
                  const lineTotal = (parseFloat(it.qty_ordered) || 0) * (parseFloat(it.estimated_price) || 0);

                  return (
                    <div
                      key={it.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        {/* 1. Medicine Pick (5 cols) */}
                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold block mb-1 text-slate-400">
                            #{idx + 1} Pilih Obat *
                          </label>
                          <select
                            value={it.medicine_id}
                            onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                            required
                            className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-medium ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                            }`}
                          >
                            <option value="">-- Pilih Obat dari Katalog --</option>
                            {medicines.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.item_code}) — {m.drug_classification}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Packaging Unit (2 cols) */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold block mb-1 text-slate-400">
                            Satuan Pesan *
                          </label>
                          <select
                            value={it.unit_id || ''}
                            onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)}
                            className={`w-full px-2 py-1.5 text-xs rounded-lg border font-medium ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                            }`}
                          >
                            <option value="">-- Pilih Satuan --</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Qty Ordered (2 cols) */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold block mb-1 text-slate-400">
                            Qty Pesan *
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={it.qty_ordered}
                            onChange={(e) => handleItemChange(idx, 'qty_ordered', e.target.value)}
                            className={`w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border text-right ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                            }`}
                          />
                        </div>

                        {/* 4. Est Price (3 cols) */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold block mb-1 text-slate-400">
                            Estimasi Harga Beli (Rp)
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.estimated_price}
                              onChange={(e) => handleItemChange(idx, 'estimated_price', e.target.value)}
                              className={`w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border text-right ${
                                isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                              }`}
                            />
                            {items.length > 1 && spType !== 'NARKOTIKA' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition shrink-0"
                                title="Hapus Baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row Note / Sediaan & Subtotal */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-token-border text-xs">
                        <input
                          type="text"
                          value={it.notes}
                          onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                          placeholder="Keterangan sediaan / kekuatan (misal: Sirup 60ml, Tablet 500mg)..."
                          className={`w-2/3 px-2 py-1 text-[11px] rounded border ${
                            isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                          }`}
                        />
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 mr-2">Subtotal:</span>
                          <span className="font-mono font-bold text-token-emerald">
                            Rp {lineTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Summary & Notes */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <div className="w-full md:w-1/2">
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Catatan Tambahan untuk PBF
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan pengiriman atau instruksi khusus..."
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                  }`}
                />
              </div>

              <div className="w-full md:w-1/2 text-right">
                <span className="text-xs text-slate-400 block">Total Estimasi Nilai Pesanan:</span>
                <span className="text-lg font-mono font-extrabold text-token-emerald">
                  Rp {totalEstimated.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
          }`}>
            <span className="text-xs text-slate-400">
              * SP akan tersimpan dengan status <strong>DRAFT</strong> dan siap dicetak resmi.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loadingSubmit}
                className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-slate-500/10 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingSubmit || loadingInitial}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md disabled:opacity-40"
              >
                {loadingSubmit ? (
                  <span>Menyimpan SP...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editPO ? 'Perbarui SP' : 'Simpan Surat Pesanan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
