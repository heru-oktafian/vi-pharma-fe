import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Search, Barcode, Plus, Minus, Trash2, ArrowLeft,
  CreditCard, CheckCircle2, AlertCircle, RefreshCw, Layers, History,
  User, Tag, Percent, Sparkles, Package, AlertTriangle, Zap, Store
} from 'lucide-react';
import { getStockSummaries } from '../../services/inventoryApi';
import { createSaleTransaction, getTodaySummary } from '../../services/posApi';
import PaymentModal from './PaymentModal';
import ReceiptPrintModal from './ReceiptPrintModal';
import SalesHistoryModal from './SalesHistoryModal';

export default function POSDashboard({ user, branch, token, theme = 'dark', onBack }) {
  const isLight = theme === 'light';

  // Catalog State
  const [stockCatalog, setStockCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Scanner Barcode Input State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerFeedback, setScannerFeedback] = useState(null);
  const scannerInputRef = useRef(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priceTier, setPriceTier] = useState('umum'); // 'umum', 'resep', 'member'
  const [discountAmount, setDiscountAmount] = useState(0);

  // Today Summary State
  const [summaryToday, setSummaryToday] = useState(null);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Currency Formatter
  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Load Inventory & Today Summary
  const loadData = async () => {
    try {
      setLoadingCatalog(true);
      const [stockRes, sumRes] = await Promise.all([
        getStockSummaries(token, '', branch?.id).catch(() => []),
        getTodaySummary(token, branch?.id).catch(() => null),
      ]);
      setStockCatalog(stockRes || []);
      setSummaryToday(sumRes);
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, branch?.id]);

  // Autofocus scanner input on load and after actions
  useEffect(() => {
    if (!paymentModalOpen && !receiptModalOpen && !historyModalOpen) {
      scannerInputRef.current?.focus();
    }
  }, [paymentModalOpen, receiptModalOpen, historyModalOpen]);

  // Helper to get active price for medicine by tier
  const getMedicinePrice = (med, tier = priceTier) => {
    // If stock summary has prices from master
    const prices = med.prices || [];
    const found = prices.find(p => p.price_type === tier) ||
      prices.find(p => p.price_type === 'umum') ||
      prices[0];
    if (found) return Number(found.price);

    // Fallback if price is attached directly
    return Number(med.sell_price || med.price || 15000);
  };

  // Add Item to Cart
  const handleAddToCart = (medicine, batch = null) => {
    const existingIdx = cart.findIndex(it => it.medicine_id === medicine.medicine_id);
    const shelfQty = Number(medicine.total_shelf || 0);

    if (shelfQty <= 0) {
      setAlertMsg({ type: 'warning', text: `Stok "${medicine.name}" di Rak Penjualan kosong! Silakan refill dari gudang terlebih dahulu.` });
      setTimeout(() => setAlertMsg(null), 3500);
      return;
    }

    const price = getMedicinePrice(medicine, priceTier);

    if (existingIdx >= 0) {
      const currentQty = cart[existingIdx].qty;
      if (currentQty + 1 > shelfQty) {
        setAlertMsg({ type: 'warning', text: `Jumlah melebihi total stok di rak (${shelfQty} ${medicine.base_unit_name})` });
        setTimeout(() => setAlertMsg(null), 3500);
        return;
      }

      const updated = [...cart];
      updated[existingIdx].qty += 1;
      updated[existingIdx].subtotal = updated[existingIdx].qty * updated[existingIdx].unit_price;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicine_id: medicine.medicine_id,
          name: medicine.name,
          item_code: medicine.item_code,
          barcode: medicine.barcode,
          base_unit_name: medicine.base_unit_name || 'Pcs',
          unit_id: medicine.base_unit_id || 'UNT000000000001',
          conversion_factor: 1,
          batch_id: batch?.id || '',
          batch_number: batch?.batch_number || '',
          shelf_stock: shelfQty,
          qty: 1,
          unit_price: price,
          subtotal: price,
          discount: 0,
        }
      ]);
    }

    // Give visual scanner feedback
    setScannerFeedback({ name: medicine.name, price: price });
    setTimeout(() => setScannerFeedback(null), 1800);
  };

  // Barcode Gun Enter handler
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    // 1. Try exact barcode match or item_code match
    const found = stockCatalog.find(
      m => (m.barcode && m.barcode.toLowerCase() === query.toLowerCase()) ||
           (m.item_code && m.item_code.toLowerCase() === query.toLowerCase()) ||
           (m.name && m.name.toLowerCase() === query.toLowerCase())
    );

    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
    } else {
      // Partial match search
      const partial = stockCatalog.find(
        m => (m.name && m.name.toLowerCase().includes(query.toLowerCase())) ||
             (m.item_code && m.item_code.toLowerCase().includes(query.toLowerCase()))
      );

      if (partial) {
        handleAddToCart(partial);
        setBarcodeInput('');
      } else {
        setAlertMsg({ type: 'error', text: `Barcode / Kode "${query}" tidak ditemukan di katalog obat!` });
        setTimeout(() => setAlertMsg(null), 3500);
      }
    }
  };

  // Cart Item Modifications
  const handleUpdateQty = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    if (newQty > item.shelf_stock) {
      setAlertMsg({ type: 'warning', text: `Stok di rak hanya ${item.shelf_stock} ${item.base_unit_name}` });
      setTimeout(() => setAlertMsg(null), 3000);
      return;
    }

    item.qty = newQty;
    item.subtotal = item.qty * item.unit_price - item.discount;
    setCart(updated);
  };

  const handleRemoveItem = (index) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan seluruh keranjang belanja kasir?')) {
      setCart([]);
      setDiscountAmount(0);
    }
  };

  // Price calculations
  const cartSubtotal = cart.reduce((acc, it) => acc + (it.qty * it.unit_price - (it.discount || 0)), 0);
  const grandTotal = Math.max(0, cartSubtotal - Number(discountAmount || 0));

  // Process Checkout through API
  const handleConfirmCheckout = async (paymentData) => {
    setSubmittingCheckout(true);
    setAlertMsg(null);

    try {
      const payload = {
        customer_name: customerName.trim() || 'Pelanggan Umum',
        customer_phone: customerPhone.trim(),
        transaction_type: 'OTC',
        discount_amount: Number(discountAmount) || 0,
        payment_method: paymentData.payment_method,
        amount_paid: paymentData.amount_paid,
        notes: paymentData.notes,
        items: cart.map(it => ({
          medicine_id: it.medicine_id,
          batch_id: it.batch_id || undefined,
          unit_id: it.unit_id,
          conversion_factor: it.conversion_factor || 1,
          qty: it.qty,
          unit_price: it.unit_price,
          discount: it.discount || 0,
        })),
      };

      const result = await createSaleTransaction(payload, token, branch?.id);

      // Close payment modal & open receipt print preview
      setPaymentModalOpen(false);
      setLastCompletedSale(result);
      setReceiptModalOpen(true);

      // Reset Cart & reload inventory balances
      setCart([]);
      setDiscountAmount(0);
      setCustomerName('Pelanggan Umum');
      setCustomerPhone('');
      loadData();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memproses transaksi kasir' });
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Filter Catalog
  const filteredCatalog = stockCatalog.filter(m => {
    if (catalogSearch) {
      const q = catalogSearch.toLowerCase();
      const match = (m.name && m.name.toLowerCase().includes(q)) ||
                    (m.item_code && m.item_code.toLowerCase().includes(q)) ||
                    (m.barcode && m.barcode.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className={`h-full flex flex-col overflow-hidden animate-fadeIn ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-token-bg text-slate-100'
    }`}>
      {/* 1. Header Toolbar */}
      <div className={`px-4 py-2.5 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1 ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-token-inner hover:bg-slate-700 text-slate-200 border-token-border'
            }`}
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Menu Utama</span>
          </button>

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'
            }`}>
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Kasir & Penjualan (POS)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-token-emerald/15 text-token-emerald border border-token-emerald/30">
                  {branch?.branch_name || 'Apotek Vi-Pharma'}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Kasir: <strong className="text-slate-200">{user?.name || 'Apoteker Kasir'}</strong> | Transaksi OTC & Resep
              </p>
            </div>
          </div>
        </div>

        {/* Daily Summary Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-3 py-1 rounded-xl border text-xs flex items-center gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/60 border-token-border'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400">Hari Ini:</span>
            <span className="font-mono font-bold text-token-emerald">
              {summaryToday?.total_transactions || 0} Trx ({formatIDR(summaryToday?.total_revenue || 0)})
            </span>
          </div>

          <button
            onClick={() => setHistoryModalOpen(true)}
            className={`px-3 py-1 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-inner hover:bg-slate-700 text-slate-200 border-token-border'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Riwayat Transaksi</span>
          </button>

          <button
            onClick={loadData}
            disabled={loadingCatalog}
            className={`p-1.5 rounded-xl border transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-inner hover:bg-slate-700 text-slate-300 border-token-border'
            }`}
            title="Refresh Stok & Omzet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCatalog ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div className={`p-2.5 px-4 text-xs font-semibold flex items-center gap-2 shrink-0 ${
          alertMsg.type === 'error'
            ? 'bg-red-500/15 border-b border-red-500/30 text-red-400'
            : 'bg-amber-500/15 border-b border-amber-500/30 text-amber-400'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* 2. Main POS Workspace (Split Screen: Catalog 65% / Cart 35%) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Section: Scanner & Product Catalog (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col border-r border-token-border overflow-hidden">
          {/* Quick Barcode Scanner Input Bar */}
          <div className={`p-3 border-b flex items-center gap-2 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
          }`}>
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-token-emerald">
                <Barcode className="w-5 h-5 animate-pulse" />
              </div>
              <input
                ref={scannerInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Arahkan Barcode Gun / ketik kode obat, lalu tekan Enter..."
                className={`w-full pl-10 pr-20 py-2 text-xs font-mono font-bold rounded-xl border transition outline-hidden ${
                  isLight
                    ? 'bg-white border-slate-300 focus:border-token-emerald text-slate-900 placeholder-slate-400'
                    : 'bg-token-card border-token-border focus:border-token-emerald text-white placeholder-slate-500'
                }`}
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-token-emerald hover:bg-token-emerald-dark text-slate-950 transition"
              >
                Scan / Enter
              </button>
            </form>

            {/* Visual Scanner Audio/Beep Feedback Toast */}
            {scannerFeedback && (
              <div className="px-3 py-1.5 rounded-xl bg-token-emerald/20 border border-token-emerald/40 text-token-emerald text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                <Zap className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{scannerFeedback.name}</span>
                <span>(+1)</span>
              </div>
            )}
          </div>

          {/* Search & Filters */}
          <div className={`p-2.5 px-3 border-b flex items-center justify-between gap-2 shrink-0 text-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
          }`}>
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Filter nama obat di katalog..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border text-white'
                }`}
              />
            </div>

            <div className="text-[11px] text-slate-400">
              Menampilkan <strong>{filteredCatalog.length}</strong> item siap jual
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
            {loadingCatalog ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-token-emerald" />
                <p className="text-xs">Memuat katalog obat di rak kasir...</p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs">Tidak ada obat ditemukan.</p>
              </div>
            ) : (
              filteredCatalog.map(med => {
                const shelfQty = Number(med.total_shelf || 0);
                const isOutOfStock = shelfQty <= 0;
                const price = getMedicinePrice(med, priceTier);

                return (
                  <button
                    key={med.medicine_id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(med)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all select-none relative group ${
                      isOutOfStock
                        ? 'opacity-40 bg-slate-800/30 border-slate-700/50 cursor-not-allowed'
                        : isLight
                          ? 'bg-white hover:border-token-emerald hover:shadow-md border-slate-200'
                          : 'bg-token-card hover:border-token-emerald/80 hover:bg-slate-800/70 border-token-border'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                        <span className="truncate max-w-[65%]">{med.item_code}</span>
                        {med.storage_location && (
                          <span className="px-1 rounded-xs bg-slate-700 text-white truncate max-w-[35%]">
                            {med.storage_location}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {med.name}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-token-border/40 flex items-baseline justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-extrabold text-token-emerald">
                          {formatIDR(price)}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          /{med.base_unit_name || 'Pcs'}
                        </span>
                      </div>

                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isOutOfStock
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {isOutOfStock ? 'Habis di Rak' : `Rak: ${shelfQty}`}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section: Active Cart & Billing (col-span-5) */}
        <div className={`lg:col-span-5 flex flex-col h-full overflow-hidden ${
          isLight ? 'bg-white' : 'bg-token-card'
        }`}>
          {/* Cart Header & Customer Form */}
          <div className={`p-3 border-b flex flex-col gap-2 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-300">
                <ShoppingCart className="w-4 h-4 text-token-emerald" />
                <span>Keranjang Belanja ({cart.length} item)</span>
              </span>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[10px] text-red-400 hover:text-red-300 transition font-bold"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Customer Name & Price Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan (Umum)..."
                  className={`w-full px-2.5 py-1 text-xs rounded-lg border font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                  }`}
                />
              </div>

              {/* Price Tier Selector */}
              <div className="sm:col-span-5 flex rounded-lg border border-token-border p-0.5 bg-token-card">
                {['umum', 'resep', 'member'].map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      setPriceTier(tier);
                      // Update prices of items already in cart
                      const updated = cart.map(it => {
                        const originalMed = stockCatalog.find(m => m.medicine_id === it.medicine_id);
                        const newPrice = originalMed ? getMedicinePrice(originalMed, tier) : it.unit_price;
                        return {
                          ...it,
                          unit_price: newPrice,
                          subtotal: it.qty * newPrice - it.discount,
                        };
                      });
                      setCart(updated);
                    }}
                    className={`flex-1 py-0.5 rounded text-[10px] font-bold capitalize transition ${
                      priceTier === tier
                        ? 'bg-token-emerald text-slate-950 font-extrabold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
            {cart.length === 0 ? (
              <div className="my-auto text-center p-8 text-slate-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20 text-slate-400" />
                <p className="text-xs font-semibold">Keranjang Masih Kosong</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Scan barcode kemasan obat atau klik obat dari katalog sebelah kiri untuk mulai transaksi.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.medicine_id}-${idx}`}
                  className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/40 border-token-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-white">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.item_code} | Satuan: {item.base_unit_name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-500 hover:text-red-400 transition p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity & Line Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-token-border/40 text-xs">
                    {/* Qty +/- Controls */}
                    <div className="flex items-center gap-1 bg-token-card border border-token-border rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-slate-700/60 hover:bg-slate-700 text-white transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-xs text-white">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-slate-700/60 hover:bg-slate-700 text-white transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        {item.qty} x {formatIDR(item.unit_price)}
                      </span>
                      <span className="text-xs font-mono font-bold text-token-emerald">
                        {formatIDR(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing Breakdown & Checkout Footer */}
          <div className={`p-4 border-t flex flex-col gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
          }`}>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({cart.length} item):</span>
                <span className="font-mono font-semibold text-white">{formatIDR(cartSubtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Potongan / Diskon (Rp):</span>
                </span>
                <input
                  type="number"
                  min="0"
                  max={cartSubtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className={`w-28 text-right px-2 py-0.5 text-xs font-mono font-bold rounded border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                  }`}
                />
              </div>

              {/* Total Tagihan */}
              <div className="pt-2 border-t border-token-border/60 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    TOTAL AKHIR
                  </span>
                  <span className="text-xs text-slate-400">Sudah Termasuk PPN</span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-token-emerald tracking-tight">
                  {formatIDR(grandTotal)}
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              disabled={cart.length === 0 || submittingCheckout}
              onClick={() => setPaymentModalOpen(true)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-token-emerald hover:bg-token-emerald-dark text-slate-950 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-5 h-5" />
              <span>PROSES BAYAR & CETAK STRUK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalAmount={grandTotal}
        onConfirmPayment={handleConfirmCheckout}
        loading={submittingCheckout}
        theme={theme}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptPrintModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        sale={lastCompletedSale}
        branch={branch}
        theme={theme}
      />

      {/* Sales History Modal */}
      <SalesHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        token={token}
        branchId={branch?.id}
        theme={theme}
        onPrintReceipt={(sale) => {
          setLastCompletedSale(sale);
          setReceiptModalOpen(true);
        }}
      />
    </div>
  );
}
