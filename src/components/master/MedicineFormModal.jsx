import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, Pill, Layers, DollarSign, AlertCircle, Clock, Tag } from 'lucide-react';
import { CLASSIFICATIONS } from './ClassificationBadge';
import { createMedicine, updateMedicine } from '../../services/masterDataApi';

const DOSAGE_FORMS = [
  'Tablet', 'Kaplet', 'Kapsul', 'Sirup', 'Suspensi', 'Salep', 'Krim', 'Gel',
  'Cairan Obat Luar', 'Larutan', 'Minyak / Balsem Cair', 'Emulsi',
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
  const [activeTab, setActiveTab] = useState('BASIC'); // 'BASIC' | 'UNITS' | 'PRICES' | 'ETIKET'
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
    indication: '',
    is_active: true,
    // Etiket & Aturan Pakai
    label_type: 'dalam',
    default_signa: '3 x Sehari 1 Tablet',
    consumption_time: 'Sesudah Makan',
    dose_morning: '1',
    dose_noon: '1',
    dose_night: '1',
    warning_tags: '',
    special_instructions: '',
    bud_days: 0,
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
        indication: editingItem.indication || '',
        is_active: editingItem.is_active ?? true,
        label_type: editingItem.label_type || 'dalam',
        default_signa: editingItem.default_signa || '3 x Sehari 1 Tablet',
        consumption_time: editingItem.consumption_time || 'Sesudah Makan',
        dose_morning: editingItem.dose_morning || '1',
        dose_noon: editingItem.dose_noon || '1',
        dose_night: editingItem.dose_night || '1',
        warning_tags: editingItem.warning_tags || '',
        special_instructions: editingItem.special_instructions || '',
        bud_days: editingItem.bud_days ?? 0,
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
        indication: '',
        is_active: true,
        label_type: 'dalam',
        default_signa: '3 x Sehari 1 Tablet',
        consumption_time: 'Sesudah Makan',
        dose_morning: '1',
        dose_noon: '1',
        dose_night: '1',
        warning_tags: '',
        special_instructions: '',
        bud_days: 0,
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
        indication: form.indication?.trim() || '',
        default_supplier_id: form.default_supplier_id ? form.default_supplier_id : null,
        is_active: Boolean(form.is_active),
        label_type: form.label_type || 'dalam',
        default_signa: form.default_signa?.trim() || '3 x Sehari 1 Tablet',
        consumption_time: form.consumption_time?.trim() || 'Sesudah Makan',
        dose_morning: form.dose_morning || '1',
        dose_noon: form.dose_noon || '1',
        dose_night: form.dose_night || '1',
        warning_tags: form.warning_tags?.trim() || '',
        special_instructions: form.special_instructions?.trim() || '',
        bud_days: Number(form.bud_days) || 0,
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
        <div className={`px-5 pt-2 border-b flex gap-2 shrink-0 overflow-x-auto ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-card/80 border-token-border'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
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
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'UNITS'
                ? isLight
                  ? 'border-vip-navy text-vip-navy'
                  : 'border-token-emerald text-token-emerald'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Kemasan Bertingkat ({medicineUnits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRICES')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'PRICES'
                ? isLight
                  ? 'border-vip-navy text-vip-navy'
                  : 'border-token-emerald text-token-emerald'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Struktur Harga ({medicinePrices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ETIKET')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'ETIKET'
                ? isLight
                  ? 'border-vip-navy text-vip-navy'
                  : 'border-token-emerald text-token-emerald'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>4. Standar Etiket & Aturan Pakai</span>
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

              {/* Indikasi / Khasiat Obat */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Indikasi / Khasiat Obat
                  </label>
                  <span className="text-[10px] text-amber-500/90 font-medium">
                    (Membantu pencarian cepat di Kasir POS, pisahkan dengan koma)
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pusing, sakit kepala, demam, mual, sakit gigi, gusi bengkak, batuk berdahak, gatal jamur, gatal alergi..."
                  value={form.indication}
                  onChange={(e) => setForm({ ...form, indication: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-hidden transition resize-y ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
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

          {/* TAB 4: STANDAR ETIKET & ATURAN PAKAI */}
          {activeTab === 'ETIKET' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-2.5 text-blue-400">
                <Tag className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-blue-300">Konfigurasi Aturan Pakai & Etiket Resmi</strong>
                  Data ini otomatis terpanggil sebagai template saat apotek mencetak <strong>Print Etiket</strong> (stiker satuan) maupun <strong>Print Etiket Group</strong> (jadwal terpadu) pada saat penyerahan obat ke pasien.
                </div>
              </div>

              {/* Tipe Etiket Radio Cards */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                  Tipe Etiket & Sediaan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setForm({ ...form, label_type: 'dalam' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                      form.label_type === 'dalam'
                        ? isLight
                          ? 'bg-slate-100 border-slate-900 shadow-xs'
                          : 'bg-token-inner border-slate-300 text-white shadow-xs'
                        : isLight
                          ? 'bg-white border-slate-200 text-slate-600'
                          : 'bg-token-card border-token-border text-slate-400'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-white flex items-center justify-center shrink-0">
                      {form.label_type === 'dalam' && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Etiket Putih (Obat Dalam)</div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Obat oral: Tablet, Kapsul, Kaplet, Sirup, Puyer</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setForm({ ...form, label_type: 'luar' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                      form.label_type === 'luar'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-400 shadow-xs'
                        : isLight
                          ? 'bg-white border-slate-200 text-slate-600'
                          : 'bg-token-card border-token-border text-slate-400'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-600/30 flex items-center justify-center shrink-0">
                      {form.label_type === 'luar' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-blue-400">Etiket Biru (Obat Luar)</div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Salep, Krim, Tetes Mata, Injeksi, Suppositoria</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aturan Pakai Baku (Signa) with Suggestion Chips */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Aturan Pakai Standar (Signa Bawaan)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 x Sehari 1 Tablet"
                  value={form.default_signa}
                  onChange={(e) => setForm({ ...form, default_signa: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border outline-hidden transition ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Template Cepat:</span>
                  {[
                    '3 x Sehari 1 Tablet',
                    '2 x Sehari 1 Tablet',
                    '1 x Sehari 1 Tablet',
                    '1 x Sehari Malam Hari',
                    'Tiap 8 Jam 1 Kaplet',
                    '3 x Sehari 1 Sendok Takar (5ml)',
                    'Oleskan Tipis 2 x Sehari',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setForm({ ...form, default_signa: chip })}
                      className="text-[10px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-token-inner hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Waktu Konsumsi & Matriks Jadwal Minum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Waktu Konsumsi Obat
                  </label>
                  <select
                    value={form.consumption_time}
                    onChange={(e) => setForm({ ...form, consumption_time: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  >
                    <option value="Sesudah Makan">Sesudah Makan (p.c)</option>
                    <option value="Sebelum Makan">Sebelum Makan (a.c - 1 jam sebelum)</option>
                    <option value="Bersama Makan">Bersama Makan (d.c)</option>
                    <option value="Sebelum Tidur">Malam Hari Sebelum Tidur</option>
                    <option value="Bila Perlu / Demam">Bila Perlu / Bila Sakit (p.r.n)</option>
                    <option value="Pagi Hari Saja">Pagi Hari Saja</option>
                    <option value="Bebas Waktu">Kapan Saja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Masa Simpan Setelah Dibuka (BUD)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={form.bud_days}
                      onChange={(e) => setForm({ ...form, bud_days: e.target.value })}
                      className={`w-24 px-3 py-1.5 rounded-lg text-xs font-mono border outline-hidden transition ${
                        isLight
                          ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                          : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                      }`}
                    />
                    <span className="text-xs text-slate-400">
                      Hari ({form.bud_days > 0 ? `${form.bud_days} hari setelah segel dibuka` : '0 = Sesuai ED Pabrik'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Matriks Jadwal Minum (Pagi, Siang, Malam) */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'}`}>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Matriks Dosis Jadwal Harian (Untuk Etiket Group)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 block mb-1">☀️ Dosis Pagi</span>
                    <input
                      type="text"
                      placeholder="e.g. 1 / 5ml"
                      value={form.dose_morning}
                      onChange={(e) => setForm({ ...form, dose_morning: e.target.value })}
                      className={`w-full px-2.5 py-1 rounded text-xs text-center font-bold border outline-hidden ${
                        isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 block mb-1">🌤️ Dosis Siang</span>
                    <input
                      type="text"
                      placeholder="e.g. 1 / -"
                      value={form.dose_noon}
                      onChange={(e) => setForm({ ...form, dose_noon: e.target.value })}
                      className={`w-full px-2.5 py-1 rounded text-xs text-center font-bold border outline-hidden ${
                        isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 block mb-1">🌙 Dosis Malam</span>
                    <input
                      type="text"
                      placeholder="e.g. 1 / 5ml"
                      value={form.dose_night}
                      onChange={(e) => setForm({ ...form, dose_night: e.target.value })}
                      className={`w-full px-2.5 py-1 rounded text-xs text-center font-bold border outline-hidden ${
                        isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-slate-100'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Warning Tags Checkbox Buttons */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                  Label Peringatan Khusus (*Auxiliary Labels*)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Harus Dihabiskan (Antibiotik)',
                    'Kocok Dahulu',
                    'Menyebabkan Kantuk',
                    'Simpan di Lemari Pendingin (2-8°C)',
                    'Obat Luar - Tidak Boleh Ditelan',
                    'Hentikan Jika Demam Reda',
                    'Hati-hati Penggunaan Jangka Panjang',
                  ].map((tagText) => {
                    const currentTags = (form.warning_tags || '').split(',').map((t) => t.trim()).filter(Boolean);
                    const isChecked = currentTags.includes(tagText);
                    return (
                      <button
                        key={tagText}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? currentTags.filter((t) => t !== tagText)
                            : [...currentTags, tagText];
                          setForm({ ...form, warning_tags: updated.join(', ') });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          isChecked
                            ? 'bg-red-500/15 border-red-500 text-red-400 font-bold'
                            : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {tagText}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions Textarea */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Petunjuk Khusus & Informasi Tambahan untuk Pasien
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Larutkan dalam 1 gelas air, cuci tangan sebelum dan sesudah penggunaan..."
                  value={form.special_instructions}
                  onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
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
