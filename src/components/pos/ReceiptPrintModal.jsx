import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Store, Phone, Calendar, User, Hash, Tag } from 'lucide-react';
import SaleEtiketModal from './SaleEtiketModal';

export default function ReceiptPrintModal({ isOpen, onClose, sale, branch, theme = 'dark', onOpenEtiket }) {
  if (!isOpen || !sale) return null;

  const isLight = theme === 'light';
  const [showEtiketModal, setShowEtiketModal] = useState(false);

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

  const branchName = branch?.branch_name || sale.branch?.branch_name || 'APOTEK VI-PHARMA';
  const branchAddress = branch?.address || sale.branch?.address || 'Jl. Pemuda No. 10, Jakarta';
  const branchPhone = branch?.phone || sale.branch?.phone || '021-5551234';
  const cashierName = sale.cashier?.name || 'Kasir';
  const customerName = sale.customer_name || 'Pelanggan Umum';
  const items = sale.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      {/* Thermal Print CSS for POS Receipt (58mm / 80mm) */}
      {!showEtiketModal && (
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
          #printable-pos-receipt,
          #printable-pos-receipt * {
            visibility: visible !important;
          }
          #printable-pos-receipt {
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
      )}

      {/* Modal Dialog Container */}
      <div className={`w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-token-emerald" />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Struk Transaksi Penjualan Kasir
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Visual Preview */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col items-center justify-center bg-slate-900/50">
          <div className="w-[300px] bg-white text-black p-4 rounded-xl shadow-xl border border-slate-300 font-mono text-[10px] leading-tight select-none flex flex-col">
            {/* Apotek Header */}
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
              <h2 className="font-extrabold text-xs tracking-wider uppercase">{branchName}</h2>
              <p className="text-[8.5px] text-gray-700 mt-0.5">{branchAddress}</p>
              <p className="text-[8.5px] text-gray-700">Telp: {branchPhone}</p>
            </div>

            {/* Receipt Meta */}
            <div className="flex flex-col gap-0.5 border-b border-dashed border-black pb-2 mb-2 text-[8.5px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{sale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{new Date(sale.created_at || Date.now()).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="capitalize">{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="capitalize">{customerName}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex flex-col gap-1.5 border-b border-dashed border-black pb-2 mb-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-bold truncate text-[9px]">
                    {it.medicine?.name || 'Obat Farmasi'}
                  </span>
                  <div className="flex justify-between text-[8px] text-gray-800 pl-1">
                    <span>
                      {it.qty} {it.unit?.name || 'Pcs'} x {formatIDR(it.unit_price)}
                    </span>
                    <span className="font-bold">{formatIDR(it.total)}</span>
                  </div>
                  {it.discount > 0 && (
                    <div className="text-right text-[7.5px] text-gray-600">
                      (Disc: -{formatIDR(it.discount)})
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col gap-1 border-b border-dashed border-black pb-2 mb-2 text-[9px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatIDR(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-red-700">
                  <span>Diskon Nota:</span>
                  <span>-{formatIDR(sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-[11px] pt-1 border-t border-dotted border-gray-400">
                <span>TOTAL:</span>
                <span>{formatIDR(sale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-[9px] pt-1">
                <span>Metode Bayar ({sale.payment_method}):</span>
                <span>{formatIDR(sale.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold">
                <span>Kembalian:</span>
                <span>{formatIDR(sale.change_amount)}</span>
              </div>
            </div>

            {/* Footer Greetings */}
            <div className="text-center pt-1 text-[8px] text-gray-600 leading-normal">
              <p className="font-bold text-black">Terima Kasih Atas Kunjungan Anda</p>
              <p>Semoga Lekas Sembuh & Sehat Selalu</p>
              <p className="text-[7.5px] mt-1 text-gray-500">
                Barang yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian sebelumnya.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3.5 px-5 border-t flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
            }`}
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenEtiket) {
                  onOpenEtiket(sale);
                } else {
                  setShowEtiketModal(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md"
              title="Cetak Etiket Aturan Pakai Obat Farmasi"
            >
              <Tag className="w-4 h-4" />
              <span>Cetak Etiket</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold bg-token-emerald hover:bg-token-emerald-dark text-slate-950 transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk (Thermal 58mm/80mm)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden printable container for window.print() */}
      <div id="printable-pos-receipt" className="hidden">
        <div className="text-center pb-2 mb-2 border-b border-dashed border-black">
          <div className="font-bold text-xs uppercase">{branchName}</div>
          <div className="text-[8px]">{branchAddress}</div>
          <div className="text-[8px]">Telp: {branchPhone}</div>
        </div>

        <div className="pb-1 mb-1 border-b border-dashed border-black text-[8px]">
          <div>Nota: {sale.invoice_number}</div>
          <div>Waktu: {new Date(sale.created_at || Date.now()).toLocaleString('id-ID')}</div>
          <div>Kasir: {cashierName} | Pelanggan: {customerName}</div>
        </div>

        <div className="pb-1 mb-1 border-b border-dashed border-black">
          {items.map((it, idx) => (
            <div key={idx} className="mb-1">
              <div className="font-bold truncate">{it.medicine?.name || 'Obat Farmasi'}</div>
              <div className="flex justify-between text-[8px]">
                <span>{it.qty} {it.unit?.name || 'Pcs'} x {formatIDR(it.unit_price)}</span>
                <span>{formatIDR(it.total)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pb-1 mb-1 border-b border-dashed border-black text-[8px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatIDR(sale.subtotal)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between">
              <span>Diskon:</span>
              <span>-{formatIDR(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[9px] pt-0.5">
            <span>TOTAL:</span>
            <span>{formatIDR(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>{sale.payment_method}:</span>
            <span>{formatIDR(sale.amount_paid)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Kembalian:</span>
            <span>{formatIDR(sale.change_amount)}</span>
          </div>
        </div>

        <div className="text-center pt-1 text-[7.5px]">
          <div>Terima Kasih - Semoga Lekas Sembuh</div>
          <div>Simpan struk ini sebagai bukti pembayaran sah</div>
        </div>
      </div>

      {/* Sale Etiket Modal */}
      {showEtiketModal && (
        <SaleEtiketModal
          isOpen={showEtiketModal}
          onClose={() => setShowEtiketModal(false)}
          sale={sale}
          branch={branch}
          theme={theme}
        />
      )}
    </div>
  );
}
