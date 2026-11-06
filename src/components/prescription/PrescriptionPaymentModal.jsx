import React, { useState } from 'react';
import { X, CheckCircle2, CreditCard, DollarSign, Printer, Tag, Pill, Store, Calendar, User } from 'lucide-react';
import { updatePrescriptionStatus } from '../../services/prescriptionApi';

export default function PrescriptionPaymentModal({
  isOpen,
  onClose,
  prescription,
  branch,
  token,
  theme = 'dark',
  onSuccess,
  onOpenEtiket
}) {
  if (!isOpen || !prescription) return null;

  const isLight = theme === 'light';
  const branchId = branch?.id || prescription.branch_id || 'CBG000000000001';
  const grandTotal = Number(prescription.grand_total || 0);

  const [paymentMethod, setPaymentMethod] = useState('TUNAI');
  const [amountPaid, setAmountPaid] = useState(grandTotal);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const changeAmount = Math.max(0, (Number(amountPaid) || 0) - grandTotal);
  const isCash = paymentMethod === 'TUNAI';

  const handleQuickAmount = (val) => {
    setAmountPaid(val);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isCash && Number(amountPaid) < grandTotal) {
      setErrorMsg(`Uang pembayaran kurang Rp ${(grandTotal - Number(amountPaid)).toLocaleString('id-ID')}`);
      return;
    }

    setSubmitting(true);
    try {
      await updatePrescriptionStatus(
        prescription.id,
        {
          is_paid: true,
          status: prescription.status === 'SIAP' ? 'SELESAI' : prescription.status
        },
        token,
        branchId
      );

      setIsPaidSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses pembayaran resep');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const branchName = branch?.branch_name || 'APOTEK VI-PHARMA';
  const branchAddress = branch?.address || 'Jl. Pemuda No. 10, Jakarta';
  const branchPhone = branch?.phone || '021-5551234';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-fadeIn">
      {/* Thermal Print CSS for Prescription Receipt */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-rx-receipt,
          #printable-rx-receipt * {
            visibility: visible !important;
          }
          #printable-rx-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            margin: 0 auto !important;
            padding: 2mm 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            font-family: monospace !important;
            font-size: 9px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {isPaidSuccess ? 'Struk Pembayaran Resep Dokter' : 'Pembayaran Kasir Resep Dokter'}
              </h3>
              <p className="text-[10px] text-slate-400">
                No. Resep: <span className="font-mono font-bold text-emerald-400">{prescription.prescription_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!isPaidSuccess ? (
          <form onSubmit={handleConfirmPayment} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Prescription Info Box */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400">Pasien:</span>
                <span className="font-bold text-slate-200">
                  {prescription.patient_name} {prescription.patient_age > 0 ? `(${prescription.patient_age} Thn)` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dokter:</span>
                <span className="font-medium text-slate-300">{prescription.doctor_name}</span>
              </div>
              <div className="pt-2 border-t border-slate-700/50 flex justify-between text-xs">
                <span className="text-slate-400">Total Obat & Racikan:</span>
                <span className="font-mono">{formatIDR(prescription.total_med_price)}</span>
              </div>
              {(prescription.total_embalase > 0 || prescription.total_tuslah > 0) && (
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Embalase & Tuslah:</span>
                  <span className="font-mono">
                    {formatIDR((prescription.total_embalase || 0) + (prescription.total_tuslah || 0))}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-sm font-bold">
                <span className="text-emerald-400">TOTAL BAYAR:</span>
                <span className="font-mono text-base font-black text-emerald-400">
                  {formatIDR(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Metode Pembayaran</label>
              <div className="grid grid-cols-4 gap-2">
                {['TUNAI', 'QRIS', 'DEBIT', 'TRANSFER'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m);
                      if (m !== 'TUNAI') setAmountPaid(grandTotal);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition text-center ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input & Quick Amounts */}
            {isCash && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Jumlah Uang Diterima (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    min={0}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 text-sm font-bold font-mono rounded-xl border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                    autoFocus
                  />
                </div>

                {/* Quick denomination chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(grandTotal)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
                  >
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000, 200000].map((amt) => {
                    if (amt >= grandTotal) {
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickAmount(amt)}
                          className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          {amt.toLocaleString('id-ID')}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Change */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Kembalian:</span>
                  <span className={`font-mono font-black text-sm ${changeAmount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {formatIDR(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (isCash && Number(amountPaid) < grandTotal)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Memproses...' : 'Konfirmasi Pembayaran Kasir'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Receipt Print Preview Screen */
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
              <div className="font-bold text-sm text-emerald-400">Pembayaran Resep Berhasil!</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Status resep telah diperbarui menjadi <strong>LUNAS</strong>.
              </div>
            </div>

            {/* Receipt Card Preview */}
            <div className="p-4 rounded-xl bg-white text-black font-mono text-[11px] shadow-inner border border-slate-300 max-h-60 overflow-y-auto">
              <div className="text-center font-bold text-xs uppercase">{branchName}</div>
              <div className="text-center text-[10px] text-slate-600">{branchAddress}</div>
              <div className="text-center text-[10px] text-slate-600 pb-2 border-b border-dashed border-slate-400">
                Telp: {branchPhone}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div>No. Resep : {prescription.prescription_number}</div>
                <div>Tanggal   : {new Date(prescription.created_at || Date.now()).toLocaleString('id-ID')}</div>
                <div>Pasien    : {prescription.patient_name}</div>
                <div>Dokter    : {prescription.doctor_name}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                {(prescription.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[200px]">
                      {it.item_type === 'RACIKAN' ? `[Racikan] ${it.racikan_name}` : (it.medicine?.name || 'Obat Resep')}
                    </span>
                    <span className="font-bold">{formatIDR(it.total || it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span>TOTAL :</span>
                  <span>{formatIDR(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{paymentMethod} :</span>
                  <span>{formatIDR(isCash ? amountPaid : grandTotal)}</span>
                </div>
                {isCash && (
                  <div className="flex justify-between">
                    <span>Kembalian :</span>
                    <span>{formatIDR(changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-600">
                Semoga Lekas Sembuh & Sehat Selalu
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Tutup
              </button>
              <div className="flex items-center gap-2">
                {onOpenEtiket && (
                  <button
                    type="button"
                    onClick={() => onOpenEtiket(prescription)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition shadow-md"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Cetak Etiket</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk (Thermal 58mm/80mm)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden container for window.print() */}
      <div id="printable-rx-receipt" className="hidden">
        <div className="text-center pb-2 mb-2 border-b border-dashed border-black">
          <div className="font-bold text-xs uppercase">{branchName}</div>
          <div className="text-[8px]">{branchAddress}</div>
          <div className="text-[8px]">Telp: {branchPhone}</div>
        </div>

        <div className="pb-1 mb-1 border-b border-dashed border-black text-[8px]">
          <div>No. Resep: {prescription.prescription_number}</div>
          <div>Waktu: {new Date(prescription.created_at || Date.now()).toLocaleString('id-ID')}</div>
          <div>Pasien: {prescription.patient_name}</div>
          <div>Dokter: {prescription.doctor_name}</div>
        </div>

        <div className="pb-1 mb-1 border-b border-dashed border-black text-[8px]">
          {(prescription.items || []).map((it, idx) => (
            <div key={idx} className="mb-1">
              <div className="font-bold truncate">
                {it.item_type === 'RACIKAN' ? `[Racikan] ${it.racikan_name}` : (it.medicine?.name || 'Obat Resep')}
              </div>
              <div className="flex justify-between text-[7.5px]">
                <span>{it.qty || it.racikan_qty || 1} x {formatIDR(it.unit_price || it.total)}</span>
                <span>{formatIDR(it.total || it.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pb-1 mb-1 border-b border-dashed border-black text-[8px]">
          <div className="flex justify-between font-bold text-[9px]">
            <span>TOTAL:</span>
            <span>{formatIDR(grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{paymentMethod}:</span>
            <span>{formatIDR(isCash ? amountPaid : grandTotal)}</span>
          </div>
          {isCash && (
            <div className="flex justify-between font-bold">
              <span>Kembalian:</span>
              <span>{formatIDR(changeAmount)}</span>
            </div>
          )}
        </div>

        <div className="text-center pt-1 text-[7.5px]">
          <div>Terima Kasih - Semoga Lekas Sembuh</div>
          <div>Simpan struk ini sebagai bukti pembayaran sah</div>
        </div>
      </div>
    </div>
  );
}
