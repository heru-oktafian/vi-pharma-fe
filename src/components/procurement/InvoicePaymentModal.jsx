import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, Clock, AlertCircle, Calendar, CreditCard, Building2, FileText, ArrowRight, RotateCcw } from 'lucide-react';
import { recordInvoicePayment, getInvoicePayments } from '../../services/inventoryApi';

export default function InvoicePaymentModal({
  isOpen,
  onClose,
  invoice,
  branch,
  token,
  theme = 'dark',
  onSuccess
}) {
  if (!isOpen || !invoice) return null;

  const isLight = theme === 'light';
  const todayStr = new Date().toISOString().slice(0, 10);

  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const paidAmount = parseFloat(invoice.paid_amount) || 0;
  const remainingDebt = Math.max(0, totalAmount - paidAmount);

  // Form State
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [amount, setAmount] = useState(remainingDebt > 0 ? remainingDebt : 0);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Payment History State
  const [payments, setPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  const loadPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await getInvoicePayments(invoice.id, token);
      setPayments(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Could not load payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
    setAmount(remainingDebt);
  }, [invoice.id, token, remainingDebt]);

  const handlePayFull = () => {
    setAmount(remainingDebt);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payVal = parseFloat(amount);
    if (!payVal || payVal <= 0) {
      setError('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }
    if (payVal > remainingDebt + 0.01) {
      setError(`Nominal pembayaran (Rp ${payVal.toLocaleString('id-ID')}) melebihi sisa hutang (Rp ${Math.round(remainingDebt).toLocaleString('id-ID')})`);
      return;
    }

    try {
      setLoadingSubmit(true);
      const payload = {
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount: payVal,
        reference_number: referenceNumber,
        notes: notes,
      };

      await recordInvoicePayment(invoice.id, payload, token, branch?.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Payment submit error:', err);
      setError(err.message || 'Gagal mencatat pembayaran hutang');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const getMethodBadge = (m) => {
    switch (m) {
      case 'BANK_TRANSFER':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">Transfer Bank</span>;
      case 'CASH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Kas Tunai</span>;
      case 'POTONG_RETUR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25">Potong Retur PBF</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400">{m}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className={`w-full max-w-2xl my-auto rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>Pelunasan Faktur Hutang PBF</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {invoice.invoice_number}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pencatatan kas keluar & rekonsiliasi pelunasan hutang dagang distributor
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

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Distributor PBF</span>
              <span className="font-bold text-sm text-purple-400 block mt-0.5">
                {invoice.supplier?.name || '-'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tgl Faktur: {invoice.invoice_date?.slice(0, 10)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Jatuh Tempo</span>
              <span className="font-mono font-bold text-sm block mt-0.5 text-amber-400">
                {invoice.due_date ? invoice.due_date.slice(0, 10) : 'Tidak diset'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total Tagihan: <span className="font-mono font-semibold text-slate-200">Rp {Math.round(totalAmount).toLocaleString('id-ID')}</span>
              </span>
            </div>

            <div className="sm:border-l sm:pl-3 border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sisa Hutang Berjalan</span>
              <span className={`font-mono font-black text-base block mt-0.5 ${
                remainingDebt > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                Rp {Math.round(remainingDebt).toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Terbayar: Rp {Math.round(paidAmount).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Form (Only if remainingDebt > 0) */}
          {remainingDebt > 0 ? (
            <form onSubmit={handleSubmit} className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-white border-purple-200 shadow-xs' : 'bg-token-inner/30 border-purple-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Input Pembayaran Baru</span>
                </h4>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition"
                >
                  Bayar Lunas Penuh (Rp {Math.round(remainingDebt).toLocaleString('id-ID')})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Tanggal Pembayaran */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span>Tanggal Pembayaran *</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                    required
                  />
                </div>

                {/* Metode Pembayaran */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Metode Bayar *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  >
                    <option value="BANK_TRANSFER">Transfer Bank (BCA, BRI, Mandiri, dll)</option>
                    <option value="CASH">Kas Tunai Apotek</option>
                    <option value="POTONG_RETUR">Potong Saldo Retur PBF (Credit Note)</option>
                    <option value="LAINNYA">Lain-lain / Bilyet Giro</option>
                  </select>
                </div>

                {/* Nominal Bayar */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Nominal yang Dibayar (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    max={remainingDebt}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className={`w-full p-2 text-xs rounded-xl border font-mono font-bold transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                    required
                  />
                </div>

                {/* Referensi / Bukti Transfer */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">No. Bukti / Ref Transfer / No. Retur</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Contoh: TRF-BCA-9812 / RET/PBF/202611/0001"
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  />
                </div>

                {/* Catatan */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Catatan Pembayaran</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Pelunasan tahap 1 via rekening BCA operasional apotek"
                    className={`w-full p-2 text-xs rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md shadow-purple-900/30 disabled:opacity-50"
                >
                  {loadingSubmit ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Pembayaran Hutang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Faktur pembelian ini sudah <strong>Lunas Sepenuhnya</strong>. Tidak ada sisa hutang yang perlu dibayarkan.</span>
            </div>
          )}

          {/* Payment History Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Riwayat Pembayaran Faktur Ini ({payments.length} transaksi)</span>
              {loadingHistory && <span className="text-[10px] text-slate-400">Memuat riwayat...</span>}
            </h4>

            {payments.length === 0 ? (
              <div className={`p-4 rounded-xl border text-center text-xs text-slate-400 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/30 border-token-border'
              }`}>
                Belum ada catatan pembayaran yang tercatat untuk faktur ini.
              </div>
            ) : (
              <div className={`rounded-xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-token-inner/30 border-token-border'
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-token-inner/80 text-slate-400 border-token-border'
                  }`}>
                    <tr>
                      <th className="py-2 px-3">Tanggal Bayar</th>
                      <th className="py-2 px-3">Metode</th>
                      <th className="py-2 px-3">Referensi / Bukti</th>
                      <th className="py-2 px-3 text-right">Nominal Bayar</th>
                      <th className="py-2 px-3">Petugas</th>
                      <th className="py-2 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-token-border/50">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition">
                        <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {p.payment_date?.slice(0, 10)}
                        </td>
                        <td className="py-2 px-3">
                          {getMethodBadge(p.payment_method)}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-300">
                          {p.reference_number || '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          Rp {Math.round(p.amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-300">
                          {p.created_by?.name || 'Petugas'}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-400 max-w-[150px] truncate">
                          {p.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
              isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-token-border text-slate-300 hover:bg-slate-800'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
