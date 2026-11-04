import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Check, AlertCircle, Building2, Calendar, DollarSign, PackageCheck, ShoppingBag } from 'lucide-react';
import { getSuppliers, getMedicines } from '../../services/masterDataApi';
import { createPurchaseInvoice } from '../../services/inventoryApi';

export default function PurchaseInvoiceModal({ isOpen, onClose, theme = 'dark', branchId, token, onSuccess }) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const todayStr = new Date().toISOString().slice(0, 10);

  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [paymentType, setPaymentType] = useState('CREDIT');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [autoPPN, setAutoPPN] = useState(true); // PPN 11%
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Invoice Items
  const [items, setItems] = useState([
    {
      id: 'row-1',
      medicine_id: '',
      unit_id: '',
      conversion_factor: 1,
      qty_purchased: 1,
      batch_number: '',
      expired_date: '',
      buy_price: 0,
      discount_percent: 0,
      put_to_shelf_directly: false,
    }
  ]);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [supRes, medRes] = await Promise.all([
          getSuppliers(token).catch(() => []),
          getMedicines({ limit: 200 }, token).catch(() => ({ data: [] })),
        ]);
        setSuppliers(supRes || []);
        const medList = medRes?.data || medRes?.items || (Array.isArray(medRes) ? medRes : []);
        setMedicines(medList);
      } catch (err) {
        console.error('Failed to load initial invoice dependencies:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [token]);

  // Recalculate Subtotal
  const subtotal = items.reduce((acc, it) => {
    const qty = parseFloat(it.qty_purchased) || 0;
    const price = parseFloat(it.buy_price) || 0;
    const disc = parseFloat(it.discount_percent) || 0;
    const lineTotal = qty * price * (1 - (disc / 100));
    return acc + lineTotal;
  }, 0);

  // Auto calculate tax when PPN toggle is true
  useEffect(() => {
    if (autoPPN) {
      const taxable = Math.max(0, subtotal - (parseFloat(discountAmount) || 0));
      setTaxAmount(Math.round(taxable * 0.11));
    }
  }, [subtotal, discountAmount, autoPPN]);

  const grandTotal = Math.max(0, subtotal - (parseFloat(discountAmount) || 0) + (parseFloat(taxAmount) || 0));

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `row-${Date.now()}`,
        medicine_id: '',
        unit_id: '',
        conversion_factor: 1,
        qty_purchased: 1,
        batch_number: '',
        expired_date: '',
        buy_price: 0,
        discount_percent: 0,
        put_to_shelf_directly: false,
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

    // If changing medicine, auto-set default unit and conversion
    if (field === 'medicine_id') {
      const selectedMed = medicines.find(m => m.id === value);
      if (selectedMed) {
        updated[index].unit_id = selectedMed.base_unit_id || (selectedMed.units?.[0]?.unit_id) || '';
        updated[index].conversion_factor = 1;
        updated[index].buy_price = selectedMed.buy_price || 0;
      }
    }

    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !invoiceNumber || !invoiceDate) {
      setError('PBF Supplier, Nomor Faktur, dan Tanggal Faktur wajib diisi');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.medicine_id) {
        setError(`Baris #${i + 1}: Obat belum dipilih`);
        return;
      }
      if (!it.batch_number) {
        setError(`Baris #${i + 1}: Nomor Batch wajib diisi untuk pelacakan FEFO`);
        return;
      }
      if (!it.expired_date) {
        setError(`Baris #${i + 1}: Tanggal Kadaluarsa (Expired Date) wajib diisi`);
        return;
      }
      if ((parseFloat(it.qty_purchased) || 0) <= 0) {
        setError(`Baris #${i + 1}: Jumlah beli harus lebih dari 0`);
        return;
      }
    }

    setLoadingSubmit(true);
    setError('');

    try {
      const payload = {
        supplier_id: supplierId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        payment_type: paymentType,
        discount_amount: parseFloat(discountAmount) || 0,
        tax_amount: parseFloat(taxAmount) || 0,
        notes: notes,
        items: items.map(it => ({
          medicine_id: it.medicine_id,
          unit_id: it.unit_id || 'UNT_PCS',
          conversion_factor: parseFloat(it.conversion_factor) || 1,
          qty_purchased: parseFloat(it.qty_purchased) || 0,
          batch_number: it.batch_number.trim(),
          expired_date: it.expired_date,
          buy_price: parseFloat(it.buy_price) || 0,
          discount_percent: parseFloat(it.discount_percent) || 0,
          put_to_shelf_directly: !!it.put_to_shelf_directly,
        })),
      };

      await createPurchaseInvoice(payload, token, branchId);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan faktur pembelian PBF');
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
              isLight ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold leading-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                Penerimaan Faktur Pembelian PBF
              </h3>
              <p className={`text-xs leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Input nomor batch, expired date, dan HPP otomatis masuk stok gudang/rak
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

            {/* Top Grid: Supplier & Invoice Metadata */}
            <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 shrink-0 ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              {/* Supplier Selection */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Distributor PBF *
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

              {/* Invoice Number */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  No. Faktur PBF *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Contoh: INV-PBF-9821"
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-mono font-bold ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Tanggal Faktur *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                  }`}
                />
              </div>

              {/* Payment Type & Due Date */}
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Syarat Pembayaran
                </label>
                <div className="flex gap-2">
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className={`w-1/2 px-2 py-1.5 text-xs rounded-lg border font-semibold ${
                      isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                    }`}
                  >
                    <option value="CREDIT">Kredit (TOP)</option>
                    <option value="CASH">Tunai (Lunas)</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    title="Jatuh Tempo"
                    className={`w-1/2 px-2 py-1.5 text-xs rounded-lg border ${
                      isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-white'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Item Rows Table Container */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-token-emerald" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Daftar Item Obat & Batch Masuk ({items.length} item)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-token-emerald/20 hover:bg-token-emerald/30 text-token-emerald border border-token-emerald/30 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris</span>
                </button>
              </div>

              {/* Items Card List / Table */}
              <div className="flex flex-col gap-2.5">
                {items.map((it, idx) => {
                  const lineTotal = (parseFloat(it.qty_purchased) || 0) * (parseFloat(it.buy_price) || 0) * (1 - ((parseFloat(it.discount_percent) || 0) / 100));

                  return (
                    <div
                      key={it.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        {/* 1. Medicine Pick (4 cols) */}
                        <div className="sm:col-span-4">
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
                                {m.name} ({m.item_code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Batch Number (2 cols) */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold block mb-1 text-slate-400">
                            No. Batch *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. B240901"
                            value={it.batch_number}
                            onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value)}
                            className={`w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border uppercase ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                            }`}
                          />
                        </div>

                        {/* 3. Expired Date (2 cols) */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold block mb-1 text-slate-400">
                            Expired Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={it.expired_date}
                            onChange={(e) => handleItemChange(idx, 'expired_date', e.target.value)}
                            className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                              isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                            }`}
                          />
                        </div>

                        {/* 4. Qty Beli & Isi Konversi (2 cols) */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400">
                              Qty Beli
                            </label>
                            <span className="text-[9px] text-slate-500">Konv: x{it.conversion_factor || 1}</span>
                          </div>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={it.qty_purchased}
                              onChange={(e) => handleItemChange(idx, 'qty_purchased', e.target.value)}
                              className={`w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border text-right ${
                                isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                              }`}
                            />
                          </div>
                        </div>

                        {/* 5. Buy Price & Disc (2 cols) */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400">
                              Harga Beli (Rp)
                            </label>
                            <span className="text-[9px] text-slate-500">Disc: {it.discount_percent || 0}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={it.buy_price}
                              onChange={(e) => handleItemChange(idx, 'buy_price', e.target.value)}
                              className={`w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border text-right ${
                                isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                              }`}
                            />
                            {items.length > 1 && (
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

                      {/* Row Footer: Direct Shelf Checkbox & Line Subtotal */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-token-border text-xs">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-200">
                          <input
                            type="checkbox"
                            checked={it.put_to_shelf_directly}
                            onChange={(e) => handleItemChange(idx, 'put_to_shelf_directly', e.target.checked)}
                            className="rounded text-token-emerald focus:ring-0"
                          />
                          <span className={it.put_to_shelf_directly ? 'text-token-emerald font-semibold' : ''}>
                            {it.put_to_shelf_directly
                              ? '🛒 Langsung dipajang di Rak Kasir'
                              : '📦 Masuk ke Stok Gudang Belakang (Default)'}
                          </span>
                        </label>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 mr-2">Subtotal Baris:</span>
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

            {/* Bottom Summary & Tax Calculation */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              {/* Notes */}
              <div className="w-full md:w-1/2">
                <label className="text-[11px] font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Catatan Faktur
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan faktur PBF..."
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                  }`}
                />
              </div>

              {/* Financial Calculation Column */}
              <div className="w-full md:w-1/2 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Barang:</span>
                  <span className="font-mono font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Diskon Faktur (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className={`w-28 px-2 py-0.5 text-xs font-mono text-right rounded border ${
                      isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPPN}
                      onChange={(e) => setAutoPPN(e.target.checked)}
                      className="rounded text-token-emerald focus:ring-0"
                    />
                    <span>PPN 11%:</span>
                  </label>
                  <span className="font-mono">Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-token-border text-sm font-bold">
                  <span className={isLight ? 'text-vip-navy' : 'text-white'}>Total Tagihan:</span>
                  <span className="text-base font-mono text-token-emerald font-extrabold">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Actions */}
          <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
          }`}>
            <span className="text-xs text-slate-400">
              * Stok batch akan seketika bertambah setelah faktur disimpan.
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
                className="px-5 py-2 text-xs font-bold rounded-xl bg-token-emerald hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md disabled:opacity-40"
              >
                {loadingSubmit ? (
                  <span>Menyimpan Faktur...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan & Masukkan ke Stok</span>
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
