import React from 'react';
import { X, Printer, RotateCcw } from 'lucide-react';

export default function SalesReturnReceiptModal({ isOpen, onClose, ret, branch, theme = 'dark' }) {
  if (!isOpen || !ret) return null;

  const isLight = theme === 'light';

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const branchName = branch?.branch_name || ret.branch?.branch_name || 'APOTEK VI-PHARMA';
  const branchAddress = branch?.address || ret.branch?.address || 'Jl. Pemuda No. 10, Jakarta';
  const branchPhone = branch?.phone || ret.branch?.phone || '021-5551234';
  const cashierName = ret.cashier?.name || 'Kasir Apotek';
  const customerName = ret.customer_name || 'Pelanggan Umum';
  const items = ret.items || [];

  const getReasonLabel = (r) => {
    switch (r) {
      case 'SALAH_BELI': return 'Salah Beli / Keliru Obat';
      case 'PEMBATALAN_RESEP': return 'Pembatalan Terapi / Resep';
      case 'KEMASAN_RUSAK': return 'Kemasan Cacat / Rusak Fisik';
      case 'TIDAK_COCOK': return 'Alergi / Tidak Cocok';
      default: return r || 'Lain-lain';
    }
  };

  const getRefundLabel = (ref) => {
    switch (ref) {
      case 'REFUND_KAS': return 'Uang Tunai Kasir';
      case 'REFUND_TRANSFER': return 'Transfer Bank';
      case 'TUKAR_BARANG': return 'Tukar Obat Seharga';
      default: return ref || '-';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      {/* Thermal Print CSS for POS Return Receipt (58mm / 80mm) */}
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
          #printable-sales-return-receipt,
          #printable-sales-return-receipt * {
            visibility: visible !important;
          }
          #printable-sales-return-receipt {
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
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Container */}
      <div className={`w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Nota Retur Penjualan Kasir
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-950/40">
          <div
            id="printable-sales-return-receipt"
            className="w-[280px] sm:w-[300px] bg-white text-black p-4 rounded-xl shadow-lg font-mono text-[11px] leading-tight select-none border border-slate-300"
          >
            {/* Pharmacy Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <h2 className="font-bold text-xs uppercase tracking-wide text-black">
                {branchName}
              </h2>
              <p className="text-[10px] text-gray-700">{branchAddress}</p>
              <p className="text-[10px] text-gray-700">Telp: {branchPhone}</p>
              <div className="mt-1 pt-1 border-t border-dotted border-gray-400">
                <span className="font-bold text-[11px] tracking-wider uppercase text-rose-800">
                  ** BUKTI RETUR PENJUALAN **
                </span>
              </div>
            </div>

            {/* Return Meta */}
            <div className="py-2 space-y-0.5 text-[10px] border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>No. Retur:</span>
                <span className="font-bold">{ret.return_number}</span>
              </div>
              <div className="flex justify-between">
                <span>No. Struk Asal:</span>
                <span className="font-bold">{ret.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{new Date(ret.created_at || ret.return_date).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="capitalize">{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="capitalize">{customerName}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Alasan Retur:</span>
                <span className="font-semibold">{getReasonLabel(ret.reason)}</span>
              </div>
            </div>

            {/* Items Returned */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5">
              <div className="text-[9px] uppercase font-bold text-gray-600 mb-1">
                Daftar Obat yang Dikembalikan:
              </div>
              {items.map((it, idx) => (
                <div key={it.id || idx}>
                  <div className="font-semibold text-black flex justify-between">
                    <span>{it.medicine?.name || it.medicine_id}</span>
                    <span className="font-bold text-rose-700">
                      -{formatIDR(it.subtotal || (it.qty * it.unit_price))}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-600 flex justify-between">
                    <span>
                      {it.qty} {it.unit?.name || 'Pcs'} x {formatIDR(it.unit_price)}
                    </span>
                    <span className="italic">
                      [{it.condition === 'KONDISI_BAIK' ? 'Kondisi Baik' : 'Kemasan Cacat'}]
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Refund Summary */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
              <div className="flex justify-between font-bold text-xs pt-0.5">
                <span>TOTAL REFUND:</span>
                <span className="text-rose-800 font-extrabold">{formatIDR(ret.total_amount)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Bentuk Pengembalian:</span>
                <span className="font-semibold">{getRefundLabel(ret.refund_type)}</span>
              </div>
            </div>

            {ret.notes && (
              <div className="py-1 text-[9px] text-gray-600 italic border-b border-dashed border-gray-400">
                Catatan: {ret.notes}
              </div>
            )}

            {/* Signature Area */}
            <div className="pt-3 pb-1 text-[9px] text-center text-gray-700 space-y-4">
              <p>Stok obat telah direkonsiliasi ke sistem inventori.</p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[9px]">
                <div>
                  <p>Yang Menyerahkan,</p>
                  <div className="h-9"></div>
                  <p className="border-t border-gray-400 pt-0.5 font-bold">({customerName})</p>
                </div>
                <div>
                  <p>Kasir Penerima,</p>
                  <div className="h-9"></div>
                  <p className="border-t border-gray-400 pt-0.5 font-bold">({cashierName})</p>
                </div>
              </div>
              <p className="text-[8px] text-gray-500 pt-1">
                Terima kasih atas kerja samanya • Apotek Vi-Pharma
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3.5 border-t flex items-center justify-between gap-2 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-300 border-token-border'
            }`}
          >
            Tutup
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-md shadow-rose-900/30"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Retur (Thermal)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
