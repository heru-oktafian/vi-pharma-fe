import React, { useState, useEffect } from 'react';
import {
  X, Banknote, QrCode, CreditCard, Building2, CheckCircle2,
  AlertCircle, ArrowRight, Wallet, Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
  loading = false,
  theme = 'dark',
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const [paymentMethod, setPaymentMethod] = useState('TUNAI'); // 'TUNAI', 'QRIS', 'DEBIT', 'TRANSFER'
  const [cashAmount, setCashAmount] = useState(totalAmount);
  const [referenceNotes, setReferenceNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setCashAmount(totalAmount);
    setErrorMsg('');
  }, [totalAmount, isOpen]);

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const changeAmount = paymentMethod === 'TUNAI' ? Math.max(0, cashAmount - totalAmount) : 0;
  const isCashInsufficient = paymentMethod === 'TUNAI' && cashAmount < totalAmount;

  const handleQuickCash = (nominal) => {
    setCashAmount(nominal);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCashInsufficient) {
      setErrorMsg('Nominal uang tunai yang diterima kurang dari total tagihan!');
      return;
    }

    onConfirmPayment({
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'TUNAI' ? Number(cashAmount) : Number(totalAmount),
      notes: referenceNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-token-emerald" />
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Pembayaran Kasir (Checkout)
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grand Total Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-token-inner border-token-border'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Tagihan Belanja
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-token-emerald">
                {formatIDR(totalAmount)}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-token-emerald/15 text-token-emerald border border-token-emerald/30">
              Lunas Kasir
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold block mb-1.5 text-slate-400 uppercase tracking-wider">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'TUNAI', label: 'Tunai (Cash)', icon: Banknote },
                { id: 'QRIS', label: 'QRIS Instan', icon: QrCode },
                { id: 'DEBIT', label: 'Kartu Debit', icon: CreditCard },
                { id: 'TRANSFER', label: 'Transfer Bank', icon: Building2 },
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id);
                      setErrorMsg('');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-center border transition flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-token-emerald text-white border-token-emerald shadow-xs'
                        : (isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' : 'bg-token-card hover:bg-slate-800 border-token-border text-slate-300')
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method-specific content */}
          {paymentMethod === 'TUNAI' && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Uang Tunai Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={totalAmount}
                  autoFocus
                  value={cashAmount}
                  onChange={(e) => {
                    setCashAmount(parseFloat(e.target.value) || 0);
                    setErrorMsg('');
                  }}
                  className={`w-full px-4 py-2.5 text-lg font-mono font-black rounded-xl border outline-hidden transition ${
                    isCashInsufficient
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : (isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white')
                  }`}
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(totalAmount)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-token-emerald/20 hover:bg-token-emerald/30 text-token-emerald border border-token-emerald/30 transition"
                >
                  Uang Pas
                </button>
                {[
                  Math.ceil(totalAmount / 10000) * 10000,
                  Math.ceil(totalAmount / 20000) * 20000,
                  Math.ceil(totalAmount / 50000) * 50000,
                  Math.ceil(totalAmount / 100000) * 100000,
                ]
                  .filter((v, idx, arr) => v > totalAmount && arr.indexOf(v) === idx)
                  .slice(0, 3)
                  .map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-token-card hover:bg-slate-700 text-slate-300 border-token-border'
                      }`}
                    >
                      {formatIDR(val)}
                    </button>
                  ))}
              </div>

              {/* Live Kembalian */}
              <div className="pt-2 border-t border-token-border/50 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                  Uang Kembalian:
                </span>
                <span className={`text-base font-extrabold font-mono ${
                  isCashInsufficient ? 'text-red-400' : 'text-token-emerald'
                }`}>
                  {isCashInsufficient ? 'Uang Kurang!' : formatIDR(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'QRIS' && (
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <div className="p-3 bg-white rounded-xl shadow-md border border-slate-300">
                <QRCodeSVG
                  value={`00020101021226600016ID.CO.VIPHARMA.WWW0118936009988776655440215000000000000001520458125303360540${totalAmount}5802ID5916VI-PHARMA APOTEK6007JAKARTA6304`}
                  size={140}
                  level="M"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Scan QRIS dari Mobile Banking / e-Wallet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana</p>
              </div>
            </div>
          )}

          {(paymentMethod === 'DEBIT' || paymentMethod === 'TRANSFER') && (
            <div>
              <label className="text-xs font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                No. Kartu / No. Referensi EDC / Approval Code (Opsional)
              </label>
              <input
                type="text"
                value={referenceNotes}
                onChange={(e) => setReferenceNotes(e.target.value)}
                placeholder="Contoh: BCA Debit - Ref #123456"
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || isCashInsufficient}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-token-emerald hover:bg-token-emerald-dark text-slate-950 transition shadow-md disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Memproses Transaksi...' : `Konfirmasi Pembayaran (${formatIDR(totalAmount)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
