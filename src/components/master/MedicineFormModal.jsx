import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, Pill, Layers, DollarSign, AlertCircle } from 'lucide-react';
import { CLASSIFICATIONS } from './ClassificationBadge';
import { createMedicine, updateMedicine } from '../../services/masterDataApi';

const DOSAGE_FORMS = [
  'Tablet', 'Kaplet', 'Kapsul', 'Sirup', 'Suspensi', 'Salep', 'Krim', 'Gel',
  'Injeksi', 'Infus', 'Tetes Mata', 'Tetes Telinga', 'Tetes Hidung', 'Inhaler',
  'Suppositoria', 'Serbuk / Puyer', 'Sachet', 'Plester / Patch', 'Alat Kesehatan'
];

export default function MedicineFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  token,
  units = [],
  categories = [],
  suppliers = [],
  theme = 'dark'
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState('BASIC'); // 'BASIC' | 'UNITS' | 'PRICES'
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    item_code: '',
    barcode: '',
    name: '',
    generic_name: '',
    nie: '',
    manufacturer: '',
    dosage_form: 'Tablet',
    drug_classification: 'bebas',
    category_id: '',
    base_unit_id: '',
    default_supplier_id: '',
    requires_prescription: false,
    min_stock: 10,
    max_stock: 1000,
    storage_location: 'Rak A-1',
    is_active: true,
  });

  // Dynamic Units & Prices
  const [medicineUnits, setMedicineUnits] = useState([]);
  const [medicinePrices, setMedicinePrices] = useState([]);

  // Populate form on edit
  useEffect(() => {
    if (editingItem) {
      setForm({
        item_code: editingItem.item_code || '',
        barcode: editingItem.barcode || '',
        name: editingItem.name || '',
        generic_name: editingItem.generic_name || '',
        nie: editingItem.nie || '',
        manufacturer: editingItem.manufacturer || '',
        dosage_form: editingItem.dosage_form || 'Tablet',
        drug_classification: editingItem.drug_classification || 'bebas',
        category_id: editingItem.category_id || (categories[0]?.id || ''),
        base_unit_id: editingItem.base_unit_id || (units[0]?.id || ''),
        default_supplier_id: editingItem.default_supplier_id || '',
        requires_prescription: editingItem.requires_prescription || false,
        min_stock: editingItem.min_stock ?? 10,
        max_stock: editingItem.max_stock ?? 1000,
        storage_location: editingItem.storage_location || '',
        is_active: editingItem.is_active ?? true,
      });

      if (editingItem.units && editingItem.units.length > 0) {
        setMedicineUnits(editingItem.units.map((u) => ({
          unit_id: u.unit_id,
          conversion_factor: u.conversion_factor,
          is_base_unit: u.is_base_unit,
          barcode: u.barcode || '',
        })));
      } else if (editingItem.base_unit_id) {
        setMedicineUnits([{
          unit_id: editingItem.base_unit_id,
          conversion_factor: 1,
          is_base_unit: true,
          barcode: editingItem.barcode || '',
        }]);
      }

      if (editingItem.prices && editingItem.prices.length > 0) {
        setMedicinePrices(editingItem.prices.map((p) => ({
          unit_id: p.unit_id,
          price_type: p.price_type,
          price: p.price,
        })));
      }
    } else {
      // Default new item
      const defaultUnit = units[0]?.id || '';
      const defaultCat = categories[0]?.id || '';
      setForm({
        item_code: `MED-${Date.now().toString().slice(-6)}`,
        barcode: '',
        name: '',
        generic_name: '',
        nie: '',
        manufacturer: '',
        dosage_form: 'Tablet',
        drug_classification: 'bebas',
        category_id: defaultCat,
        base_unit_id: defaultUnit,
        default_supplier_id: suppliers[0]?.id || '',
        requires_prescription: false,
        min_stock: 10,
        max_stock: 1000,
        storage_location: 'Rak A-1',
        is_active: true,
      });

      if (defaultUnit) {
        setMedicineUnits([{
          unit_id: defaultUnit,
          conversion_factor: 1,
          is_base_unit: true,
          barcode: '',
        }]);
        setMedicinePrices([
          { unit_id: defaultUnit, price_type: 'umum', price: 1000 },
          { unit_id: defaultUnit, price_type: 'resep', price: 950 }
        ]);
      } else {
        setMedicineUnits([]);
        setMedicinePrices([]);
      }
    }
  }, [editingItem, isOpen, units, categories, suppliers]);

  // Sync base unit change to first unit item
  const handleBaseUnitChange = (newBaseUnitId) => {
    setForm((prev) => ({ ...prev, base_unit_id: newBaseUnitId }));
    setMedicineUnits((prev) => {
      const exists = prev.some((u) => u.unit_id === newBaseUnitId);
      if (exists) {
        return prev.map((u) => ({
          ...u,
          is_base_unit: u.unit_id === newBaseUnitId,
          conversion_factor: u.unit_id === newBaseUnitId ? 1 : u.conversion_factor,
        }));
      } else {
        return [
          { unit_id: newBaseUnitId, conversion_factor: 1, is_base_unit: true, barcode: '' },
          ...prev.filter((u) => !u.is_base_unit)
        ];
      }
    });
  };

  // Unit rows operations
  const handleAddUnitRow = () => {
    const unselected = units.find((u) => !medicineUnits.some((mu) => mu.unit_id === u.id));
    const targetUnit = unselected?.id || units[0]?.id || '';
    setMedicineUnits([
      ...medicineUnits,
      { unit_id: targetUnit, conversion_factor: 10, is_base_unit: false, barcode: '' }
    ]);
  };

  const handleRemoveUnitRow = (index) => {
    if (medicineUnits[index]?.is_base_unit) {
      alert('Satuan dasar utama tidak dapat dihapus dari kemasan bertingkat.');
      return;
    }
    setMedicineUnits(medicineUnits.filter((_, i) => i !== index));
  };

  const handleUnitRowChange = (index, field, value) => {
    const updated = [...medicineUnits];
    updated[index] = { ...updated[index], [field]: value };
    setMedicineUnits(updated);
  };

  // Price rows operations
  const handleAddPriceRow = () => {
    const defaultU = medicineUnits[0]?.unit_id || form.base_unit_id;
    setMedicinePrices([
      ...medicinePrices,
      { unit_id: defaultU, price_type: 'umum', price: 0 }
    ]);
  };

  const handleRemovePriceRow = (index) => {
    setMedicinePrices(medicinePrices.filter((_, i) => i !== index));
  };

  const handlePriceRowChange = (index, field, value) => {
    const updated = [...medicinePrices];
    updated[index] = { ...updated[index], [field]: value };
    setMedicinePrices(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.item_code.trim()) {
      setErrorMsg('Kode item obat wajib diisi.');
      return;
    }
    if (!form.name.trim()) {
      setErrorMsg('Nama obat wajib diisi.');
      return;
    }
    if (!form.category_id) {
      setErrorMsg('Kategori terapi wajib dipilih.');
      return;
    }
    if (!form.base_unit_id) {
      setErrorMsg('Satuan dasar terkecil wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        item_code: form.item_code.trim(),
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        generic_name: form.generic_name.trim(),
        nie: form.nie.trim(),
        manufacturer: form.manufacturer.trim(),
        dosage_form: form.dosage_form,
        drug_classification: form.drug_classification,
        category_id: form.category_id,
        base_unit_id: form.base_unit_id,
        requires_prescription: Boolean(form.requires_prescription),
        min_stock: Number(form.min_stock) || 0,
        max_stock: Number(form.max_stock) || 0,
        storage_location: form.storage_location.trim(),
        default_supplier_id: form.default_supplier_id ? form.default_supplier_id : null,
        is_active: Boolean(form.is_active),
        units: medicineUnits.map((u) => ({
          unit_id: u.unit_id,
          conversion_factor: Number(u.conversion_factor) || 1,
          is_base_unit: Boolean(u.is_base_unit),
          barcode: u.barcode || '',
        })),
        prices: medicinePrices.map((p) => ({
          unit_id: p.unit_id,
          price_type: p.price_type,
          price: Number(p.price) || 0,
        })),
      };

      if (editingItem) {
        await updateMedicine(editingItem.id, payload, token);
      } else {
        await createMedicine(payload, token);
      }

      onSuccess(form.name, editingItem ? 'diperbarui' : 'ditambahkan');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data obat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-vip-navy-border text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Modal Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-vip-navy-light border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <Pill className={`w-5 h-5 ${isLight ? 'text-vip-navy' : 'text-token-emerald'}`} />
            <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
              {editingItem ? `Edit Master Obat: ${editingItem.name}` : 'Tambah Katalog Obat & Alkes Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className={`px-5 pt-2 border-b flex gap-2 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-card/80 border-token-border'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'BASIC'
                ? isLight
                  ? 'border-vip-navy text-vip-navy'
                  : 'border-token-emerald text-token-emerald'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Informasi Utama & Regulasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UNITS')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'UNITS'
                ? isLight
                  ? 'border-vip-navy text-vip-navy'
                  : 'border-token-emerald text-token-emerald'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Kemasan Satuan Bertingkat ({medicineUnits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRICES')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'PRICES'
                ? isLight
                  ? 'border-vip-navy text-vip-navy'
                  : 'border-token-emerald text-token-emerald'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Struktur Harga Jual ({medicinePrices.length})</span>
          </button>
        </div>

        {/* Modal Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="underline text-[10px] font-bold">Tutup</button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form id="medicineForm" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'BASIC' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Kode Item <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-001"
                    value={form.item_code}
                    onChange={(e) => setForm({ ...form, item_code: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono uppercase border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Barcode Utama (Kemasan Primer)
                  </label>
                  <input
                    type="text"
                    placeholder="Scan barcode..."
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Golongan BPOM <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.drug_classification}
                    onChange={(e) => setForm({ ...form, drug_classification: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  >
                    {CLASSIFICATIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Nama Obat & Kekuatan Sediaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Nama Generik / Zat Aktif
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol / Acetaminophen"
                    value={form.generic_name}
                    onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs italic border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Kategori Terapi <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Bentuk Sediaan
                  </label>
                  <select
                    value={form.dosage_form}
                    onChange={(e) => setForm({ ...form, dosage_form: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  >
                    {DOSAGE_FORMS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Satuan Terkecil / Dasar <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.base_unit_id}
                    onChange={(e) => handleBaseUnitChange(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-token-emerald focus:border-token-emerald'
                    }`}
                  >
                    <option value="">-- Pilih Satuan Dasar --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    No. NIE BPOM Resmi
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DKL1234567890A1"
                    value={form.nie}
                    onChange={(e) => setForm({ ...form, nie: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono uppercase border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Pabrik / Produsen
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kimia Farma / Sanbe"
                    value={form.manufacturer}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Distributor PBF Utama
                  </label>
                  <select
                    value={form.default_supplier_id}
                    onChange={(e) => setForm({ ...form, default_supplier_id: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  >
                    <option value="">-- Tanpa PBF Khusus --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Lokasi Rak / Lemari
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rak A-1 / Lemari Narkotik"
                    value={form.storage_location}
                    onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Batas Minimum Stok (Alert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_stock}
                    onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Batas Maksimum Stok
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_stock}
                    onChange={(e) => setForm({ ...form, max_stock: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requires_prescription}
                    onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })}
                    className="rounded border-slate-400 text-vip-orange focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-semibold">Wajib Resep Dokter (Prescription Only)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-slate-400 text-token-emerald focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-semibold">Status Aktif & Siap Ditransaksikan</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PACKAGING UNITS CONVERSION */}
          {activeTab === 'UNITS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Definisikan satuan bertingkat (misal: 1 Box = 10 Strip, 1 Strip = 10 Tablet). Semua faktor pengali dihitung relatif terhadap <strong>Satuan Dasar ({units.find((u) => u.id === form.base_unit_id)?.name || 'Terkecil'})</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleAddUnitRow}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition shrink-0 ${
                    isLight
                      ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border hover:bg-vip-navy hover:text-white'
                      : 'bg-token-inner text-token-emerald border-token-border hover:bg-token-emerald hover:text-slate-950'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Satuan Kemasan</span>
                </button>
              </div>

              <div className={`rounded-xl border overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-token-border'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead className={`text-[10px] uppercase font-bold border-b ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-token-inner text-slate-300 border-token-border'
                  }`}>
                    <tr>
                      <th className="py-2 px-3">Kemasan Satuan</th>
                      <th className="py-2 px-3">Faktor Konversi (x Satuan Dasar)</th>
                      <th className="py-2 px-3">Barcode Kemasan</th>
                      <th className="py-2 px-3 text-center">Satuan Dasar?</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/50">
                    {medicineUnits.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <select
                            disabled={row.is_base_unit}
                            value={row.unit_id}
                            onChange={(e) => handleUnitRowChange(idx, 'unit_id', e.target.value)}
                            className={`w-full px-2.5 py-1 rounded-lg text-xs border outline-hidden ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                            }`}
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            disabled={row.is_base_unit}
                            value={row.conversion_factor}
                            onChange={(e) => handleUnitRowChange(idx, 'conversion_factor', e.target.value)}
                            className={`w-28 px-2.5 py-1 rounded-lg text-xs font-mono border outline-hidden ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Barcode kemasan ini..."
                            value={row.barcode}
                            onChange={(e) => handleUnitRowChange(idx, 'barcode', e.target.value)}
                            className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono border outline-hidden ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.is_base_unit ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-token-emerald/15 text-token-emerald border border-token-emerald/30">
                              Ya (1x)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Turunan</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {!row.is_base_unit && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUnitRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 transition"
                              title="Hapus Kemasan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING TIERS */}
          {activeTab === 'PRICES' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Konfigurasikan tarif jual untuk masing-masing kemasan dan kelompok pelanggan (Umum OTC, Resep Dokter, atau Member / Faskes).
                </p>
                <button
                  type="button"
                  onClick={handleAddPriceRow}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition shrink-0 ${
                    isLight
                      ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border hover:bg-vip-navy hover:text-white'
                      : 'bg-token-inner text-token-emerald border-token-border hover:bg-token-emerald hover:text-slate-950'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Harga</span>
                </button>
              </div>

              <div className={`rounded-xl border overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-token-border'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead className={`text-[10px] uppercase font-bold border-b ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-token-inner text-slate-300 border-token-border'
                  }`}>
                    <tr>
                      <th className="py-2 px-3">Kemasan Satuan</th>
                      <th className="py-2 px-3">Kelompok / Tier Harga</th>
                      <th className="py-2 px-3">Nominal Harga Jual (Rp)</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/50">
                    {medicinePrices.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <select
                            value={row.unit_id}
                            onChange={(e) => handlePriceRowChange(idx, 'unit_id', e.target.value)}
                            className={`w-full px-2.5 py-1 rounded-lg text-xs border outline-hidden ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                            }`}
                          >
                            {/* Offer from configured medicineUnits if available, or all units */}
                            {(medicineUnits.length > 0
                              ? units.filter((u) => medicineUnits.some((mu) => mu.unit_id === u.id))
                              : units
                            ).map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.price_type}
                            onChange={(e) => handlePriceRowChange(idx, 'price_type', e.target.value)}
                            className={`w-full px-2.5 py-1 rounded-lg text-xs font-semibold border outline-hidden ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                            }`}
                          >
                            <option value="umum">Umum (Bebas / OTC)</option>
                            <option value="resep">Pelayanan Resep</option>
                            <option value="member">Member / Faskes Mitra</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400">Rp</span>
                            <input
                              type="number"
                              min="0"
                              value={row.price}
                              onChange={(e) => handlePriceRowChange(idx, 'price', e.target.value)}
                              className={`w-full pl-8 pr-3 py-1 rounded-lg text-xs font-mono font-bold border outline-hidden ${
                                isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePriceRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 transition"
                            title="Hapus Harga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {medicinePrices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                          Belum ada baris harga. Klik tombol "+ Tambah Baris Harga" di atas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className={`p-3.5 px-5 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="text-[11px] text-slate-400">
            Form Master Katalog Vi-Pharma &copy; 2026
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-token-inner text-slate-300 hover:bg-slate-700'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              form="medicineForm"
              disabled={submitting}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                isLight
                  ? 'bg-vip-navy hover:bg-vip-navy-dark text-white'
                  : 'bg-token-emerald hover:bg-token-emerald-dark text-slate-950 font-bold'
              }`}
            >
              {submitting ? 'Menyimpan ke Server...' : editingItem ? 'Perbarui Katalog' : 'Simpan Obat Baru'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
