import React, { useState, useEffect } from 'react';
import {
  X, RotateCcw, Search, AlertCircle, CheckCircle2,
  Calendar, User, DollarSign, Package, ArrowRight, RefreshCw, Check
} from 'lucide-react';
import { getSalesHistory, getSaleReturnableInfo, createSalesReturn } from '../../services/posApi';

export default function SalesReturnModal({
  isOpen,
  onClose,
  initialSale = null,
  branch,
  token,
  theme = 'dark',
  onSuccess
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const todayStr = new Date().toISOString().slice(0, 10);

  // Search Sale state (if initialSale not provided)
  const [searchInvoice, setSearchInvoice] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Active Selected Sale & Returnable Data
  const [selectedSale, setSelectedSale] = useState(initialSale);
  const [returnableInfo, setReturnableInfo] = useState(null);
  const [loadingReturnable, setLoadingReturnable] = useState(false);

  // Return Form State
  const [returnDate, setReturnDate] = useState(todayStr);
  const [reason, setReason] = useState('SALAH_BELI');
  const [refundType, setRefundType] = useState('REFUND_KAS');
  const [notes, setNotes] = useState('');

  // Selected items map: { [saleItemId]: { checked: boolean, qty: number, condition: string, notes: string } }
  const [itemSelections, setItemSelections] = useState({});

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Load Returnable Info whenever selectedSale changes
  useEffect(() => {
    if (selectedSale?.id) {
      loadReturnableData(selectedSale.id);
    }
  }, [selectedSale?.id]);

  const loadReturnableData = async (saleId) => {
    try {
      setLoadingReturnable(true);
      setError('');
      const data = await getSaleReturnableInfo(saleId, token, branch?.id);
      setReturnableInfo(data);

      // Pre-populate selections for items with remaining returnable qty > 0
      const initialMap = {};
      const saleItems = data?.sale?.items || [];
      const remainingQtys = data?.remaining_qtys || {};

      saleItems.forEach(it => {
        const rem = remainingQtys[it.id] ?? it.qty;
        initialMap[it.id] = {
          checked: false,
          qty: rem > 0 ? rem : 0,
          max: rem,
          unit_price: it.unit_price,
          condition: 'KONDISI_BAIK',
          notes: '',
        };
      });
      setItemSelections(initialMap);
    } catch (err) {
      console.error('Failed to load returnable info:', err);
      setError(err.message || 'Gagal memuat data transaksi');
    } finally {
      setLoadingReturnable(false);
    }
  };

  const handleSearchSales = async (e) => {
    e?.preventDefault();
    if (!searchInvoice.trim()) return;

    try {
      setSearching(true);
      setError('');
      const res = await getSalesHistory(token, {
        search: searchInvoice.trim(),
        limit: 10,
      }, branch?.id);

      const items = res?.data || (Array.isArray(res) ? res : []);
      setSearchResults(items);
      if (items.length === 1) {
        setSelectedSale(items[0]);
      } else if (items.length === 0) {
        setError('Tidak ditemukan transaksi penjualan dengan kata kunci tersebut.');
      }
    } catch (err) {
      setError('Gagal mencari transaksi: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleItem = (itemId) => {
    setItemSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        checked: !prev[itemId]?.checked,
      }
    }));
  };

  const handleUpdateQty = (itemId, val) => {
    const num = parseFloat(val) || 0;
    const max = itemSelections[itemId]?.max || 0;
    const cleanQty = Math.min(Math.max(0, num), max);

    setItemSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        qty: cleanQty,
        checked: cleanQty > 0 ? true : prev[itemId]?.checked,
      }
    }));
  };

  const handleUpdateCondition = (itemId, cond) => {
    setItemSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition: cond,
      }
    }));
  };

  const calculateTotalRefund = () => {
    let total = 0;
    Object.keys(itemSelections).forEach(id => {
      const sel = itemSelections[id];
      if (sel?.checked && sel?.qty > 0) {
        total += sel.qty * sel.unit_price;
      }
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedSale) {
      setError('Silakan pilih transaksi penjualan yang akan diretur');
      return;
    }

    const itemsToReturn = [];
    Object.keys(itemSelections).forEach(itemId => {
      const sel = itemSelections[itemId];
      if (sel?.checked && sel?.qty > 0) {
        itemsToReturn.push({
          sale_item_id: itemId,
          qty: sel.qty,
          condition: sel.condition,
          item_notes: sel.notes || '',
        });
      }
    });

    if (itemsToReturn.length === 0) {
      setError('Pilih minimal 1 obat yang diretur dengan jumlah > 0');
      return;
    }

    try {
      setLoadingSubmit(true);
      const payload = {
        sale_id: selectedSale.id,
        return_date: returnDate,
        reason: reason,
        refund_type: refundType,
        notes: notes,
        items: itemsToReturn,
      };

      const result = await createSalesReturn(payload, token, branch?.id);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Customer return error:', err);
      setError(err.message || 'Gagal memproses retur penjualan');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const sale = returnableInfo?.sale || selectedSale;
  const isFullyReturned = returnableInfo?.is_fully_returned;
  const totalRefund = calculateTotalRefund();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-3xl my-auto rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Form Retur Penjualan dari Pasien (Kasir)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pengembalian obat dari pasien, pengembalian dana (refund), & restorasi stok rak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Transaction Search or Display */}
          {!selectedSale ? (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <label className="text-xs font-bold text-slate-300 block">
                Cari Struk Transaksi Penjualan Asal:
              </label>
              <form onSubmit={handleSearchSales} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchInvoice}
                    onChange={(e) => setSearchInvoice(e.target.value)}
                    placeholder="Masukkan Nomor Invoice Struk (Contoh: POS/20261105/0004) atau Nama Pasien..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-token-emerald hover:bg-token-emerald-dark text-slate-950 transition flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{searching ? 'Mencari...' : 'Cari Struk'}</span>
                </button>
              </form>

              {searchResults.length > 1 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-slate-400 block font-semibold">Pilih transaksi dari hasil pencarian:</span>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map(s => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSale(s)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                          isLight ? 'bg-white hover:bg-purple-50 border-slate-200' : 'bg-token-card hover:bg-token-inner border-token-border'
                        }`}
                      >
                        <div>
                          <span className="font-mono font-bold text-token-emerald">{s.invoice_number}</span>
                          <span className="text-slate-400 ml-2">({s.customer_name})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200">{formatIDR(s.total_amount)}</span>
                          <span className="text-[10px] text-slate-400">{s.created_at?.slice(0, 10)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Struk Penjualan Terpilih</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-sm text-token-emerald">{sale.invoice_number}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    {sale.payment_method}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Pelanggan: <strong className="text-slate-200">{sale.customer_name}</strong> • Kasir: {sale.cashier?.name || 'Kasir'} • Total: {formatIDR(sale.total_amount)}
                </div>
              </div>

              {!initialSale && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSale(null);
                    setReturnableInfo(null);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-700 hover:bg-slate-700/50 text-slate-300 transition"
                >
                  Ganti Struk
                </button>
              )}
            </div>
          )}

          {/* Fully Returned Notice */}
          {isFullyReturned && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Seluruh item obat pada transaksi ini telah diretur sebelumnya. Tidak ada sisa obat yang dapat diretur lagi.</span>
            </div>
          )}

          {/* 2. Items Eligible for Return */}
          {selectedSale && !isFullyReturned && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-400" />
                  <span>Pilih Obat yang Dikembalikan Pasien</span>
                </h4>
                {loadingReturnable && <span className="text-[11px] text-slate-400">Memuat rincian struk...</span>}
              </div>

              <div className={`rounded-xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-token-inner/30 border-token-border'
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-token-inner/80 text-slate-400 border-token-border'
                  }`}>
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">Pilih</th>
                      <th className="py-2.5 px-3">Nama Obat</th>
                      <th className="py-2.5 px-3 text-center">Dibeli / Sisa Retur</th>
                      <th className="py-2.5 px-3 w-24 text-center">Qty Retur</th>
                      <th className="py-2.5 px-3 w-36">Kondisi Obat</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right">Subtotal Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-token-border/50">
                    {(sale.items || []).map((it) => {
                      const sel = itemSelections[it.id] || { checked: false, qty: 0, max: it.qty, condition: 'KONDISI_BAIK' };
                      const maxReturnable = returnableInfo?.remaining_qtys?.[it.id] ?? it.qty;
                      const isItemFullyReturned = maxReturnable <= 0;
                      const subtotal = sel.checked ? (sel.qty * it.unit_price) : 0;

                      return (
                        <tr
                          key={it.id}
                          className={`transition ${
                            sel.checked ? 'bg-rose-500/5' : isItemFullyReturned ? 'opacity-40 bg-slate-900/20' : 'hover:bg-slate-800/20'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={sel.checked}
                              disabled={isItemFullyReturned}
                              onChange={() => handleToggleItem(it.id)}
                              className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-200">
                              {it.medicine?.name || it.medicine_id}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Batch: {it.batch?.batch_number || it.batch_id}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono text-xs">
                            <span className="text-slate-400">{it.qty} {it.unit?.name || 'Pcs'}</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="font-bold text-token-emerald">{maxReturnable} {it.unit?.name || 'Pcs'}</span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={maxReturnable}
                              step="any"
                              value={sel.qty}
                              disabled={!sel.checked || isItemFullyReturned}
                              onChange={(e) => handleUpdateQty(it.id, e.target.value)}
                              className={`w-20 p-1 text-xs rounded-lg border text-center font-mono font-bold transition ${
                                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                              } disabled:opacity-30`}
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <select
                              value={sel.condition}
                              disabled={!sel.checked || isItemFullyReturned}
                              onChange={(e) => handleUpdateCondition(it.id, e.target.value)}
                              className={`w-full p-1 text-[11px] rounded-lg border transition ${
                                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                              } disabled:opacity-30`}
                            >
                              <option value="KONDISI_BAIK">Bagus (Restorasi ke Rak)</option>
                              <option value="KONDISI_RUSAK">Rusak (Karantina Gudang)</option>
                            </select>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {formatIDR(it.unit_price)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                            {formatIDR(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 3. Reason & Refund Details */}
              <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
              }`}>
                {/* Tanggal Retur */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-400" />
                    <span>Tanggal Retur *</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                    required
                  />
                </div>

                {/* Alasan Retur */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Alasan Retur *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  >
                    <option value="SALAH_BELI">Salah Beli / Keliru Obat</option>
                    <option value="PEMBATALAN_RESEP">Pembatalan Terapi / Resep</option>
                    <option value="KEMASAN_RUSAK">Kemasan Cacat / Rusak Fisik</option>
                    <option value="TIDAK_COCOK">Alergi / Tidak Cocok</option>
                    <option value="LAINNYA">Alasan Lainnya</option>
                  </select>
                </div>

                {/* Bentuk Refund */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Metode Pengembalian Dana *</label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  >
                    <option value="REFUND_KAS">Kas Tunai Kasir (Kembalikan Uang Tunai)</option>
                    <option value="REFUND_TRANSFER">Transfer Balik ke Rekening Pasien</option>
                    <option value="TUKAR_BARANG">Tukar Obat Seharga</option>
                  </select>
                </div>

                {/* Catatan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Catatan Khusus</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Pasien minta ganti merk lain / uang cash dikembalikan"
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div>
            <span className="text-xs text-slate-400 block">Total Pengembalian Dana (Refund):</span>
            <span className="text-lg font-black font-mono text-rose-400 block">
              {formatIDR(totalRefund)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-token-border text-slate-300 hover:bg-slate-800'
              }`}
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loadingSubmit || !selectedSale || isFullyReturned || totalRefund <= 0}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-md shadow-rose-900/30 disabled:opacity-40"
            >
              {loadingSubmit ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Proses Retur & Cetak Struk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
