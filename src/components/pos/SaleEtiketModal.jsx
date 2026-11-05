import React, { useState, useEffect } from 'react';
import {
  X, Printer, CheckSquare, Square, Tag, Calendar, User, FileText,
  AlertCircle, CheckCircle2, ShieldCheck, Clock, Edit3, Pill
} from 'lucide-react';

export default function SaleEtiketModal({
  isOpen,
  onClose,
  sale,
  branch,
  theme = 'dark',
}) {
  if (!isOpen || !sale) return null;

  const isLight = theme === 'light';
  const items = sale.items || [];

  // Patient & Header Info
  const [patientName, setPatientName] = useState(sale.customer_name || 'Pelanggan Umum');
  const [patientAge, setPatientAge] = useState('');
  const [receiptNo, setReceiptNo] = useState(sale.invoice_number || '');

  // Checked item IDs for printing
  const [selectedIds, setSelectedIds] = useState(() => items.map(it => it.id));

  // Custom signa / instructions overrides per item
  const [signaOverrides, setSignaOverrides] = useState({});
  const [timeOverrides, setTimeOverrides] = useState({});

  useEffect(() => {
    if (sale) {
      setPatientName(sale.customer_name || 'Pelanggan Umum');
      setReceiptNo(sale.invoice_number || '');
      setSelectedIds(items.map(it => it.id));
    }
  }, [sale]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(it => it.id));
    }
  };

  const toggleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) return;
    window.print();
  };

  const branchName = branch?.branch_name || sale.branch?.branch_name || 'APOTEK VI-PHARMA MEDIKA';
  const branchAddress = branch?.address || sale.branch?.address || 'Jl. Kesehatan Raya No. 88, Jakarta Selatan';
  const branchSia = branch?.sia_id || sale.branch?.sia_id || 'SIA-101/2026';
  const branchSipa = branch?.sipa_id || 'apt. Hendra, S.Farm';

  const selectedItems = items.filter(it => selectedIds.includes(it.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      {/* Print Stylesheet targeting thermal labels */}
      <style>{`
        @media print {
          @page {
            size: auto;
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
          #printable-sale-etiket,
          #printable-sale-etiket * {
            visibility: visible !important;
          }
          #printable-sale-etiket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .etiket-single-label {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            width: 70mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            border: 2px solid #1e293b !important;
            color: #0f172a !important;
            font-family: monospace !important;
          }
          .etiket-single-label.etiket-luar {
            border: 2px solid #2563eb !important;
            background: #eff6ff !important;
          }
          .etiket-single-label:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Dialog Container */}
      <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Cetak Etiket Transaksi Penjualan
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Invoice: <strong className="font-mono text-token-emerald">{sale.invoice_number}</strong> • Pelanggan: <strong>{sale.customer_name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Edit & Options Bar */}
        <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-token-inner/50 border-token-border'
        }`}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Nama Pasien:</span>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nama Pasien"
                className={`px-2.5 py-1 text-xs rounded-lg border font-bold ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Umur:</span>
              <input
                type="text"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Cth: 35 Th"
                className={`w-20 px-2 py-1 text-xs rounded-lg border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-token-card border-token-border text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition ${
                allSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-token-inner hover:bg-slate-700 text-slate-300 border-token-border'
              }`}
            >
              {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>{allSelected ? 'Batal Pilih Semua' : 'Pilih Semua Obat'}</span>
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400">
              ({selectedIds.length}/{items.length} Dipilih)
            </span>
          </div>
        </div>

        {/* Main Body: Checklist on Left, Preview on Right */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: Checkbox Selection List */}
          <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col shrink-0 overflow-hidden ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/30 border-token-border'
          }`}>
            <div className="p-3 border-b border-inherit text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Daftar Obat Transaksi</span>
              <span className="text-[10px] lowercase font-normal">checklist untuk cetak</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
              {items.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Tidak ada item dalam transaksi ini.
                </div>
              ) : (
                items.map((it, idx) => {
                  const isChecked = selectedIds.includes(it.id);
                  const med = it.medicine || {};
                  const isLuar = (med.label_type || '').toLowerCase() === 'luar';
                  const currentSigna = signaOverrides[it.id] ?? (med.default_signa || '3 x Sehari 1 Tablet');
                  const currentTime = timeOverrides[it.id] ?? (med.consumption_time || 'Sesudah Makan');

                  return (
                    <div
                      key={it.id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? isLight
                            ? 'bg-white border-blue-400 shadow-xs'
                            : 'bg-token-card border-blue-500/50 shadow-md'
                          : isLight
                            ? 'bg-slate-100/60 border-slate-200 opacity-60'
                            : 'bg-token-inner/30 border-token-border/50 opacity-50'
                      }`}
                    >
                      {/* Checkbox & Name Header */}
                      <div className="flex items-start gap-2.5 cursor-pointer" onClick={() => toggleSelectItem(it.id)}>
                        <button
                          type="button"
                          className="mt-0.5 text-blue-500 focus:outline-hidden"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold block truncate text-white">
                            {med.name || it.medicine_id}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              Qty: {it.qty} {it.unit?.name || 'Item'}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                              isLuar
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : 'bg-emerald-500/15 text-token-emerald border-token-emerald/30'
                            }`}>
                              {isLuar ? 'Obat Luar' : 'Obat Dalam'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Inline Signa Adjustment if checked */}
                      {isChecked && (
                        <div className="mt-2.5 pt-2 border-t border-slate-500/20 text-[11px] space-y-1.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Aturan Pakai (Signa):</span>
                            <input
                              type="text"
                              value={currentSigna}
                              onChange={(e) => setSignaOverrides({ ...signaOverrides, [it.id]: e.target.value })}
                              className={`w-full px-2 py-1 text-[11px] rounded border font-mono ${
                                isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-slate-100'
                              }`}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Waktu Minum / Cara Pakai:</span>
                            <input
                              type="text"
                              value={currentTime}
                              onChange={(e) => setTimeOverrides({ ...timeOverrides, [it.id]: e.target.value })}
                              className={`w-full px-2 py-1 text-[11px] rounded border font-mono ${
                                isLight ? 'bg-white border-slate-300' : 'bg-token-inner border-token-border text-slate-100'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Live Printable Thermal Stickers Preview */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-[#070A10] flex flex-col items-center">
            {selectedItems.length === 0 ? (
              <div className="m-auto text-center p-8 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-400" />
                <p className="text-sm font-semibold">Tidak ada obat yang dipilih.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Centang minimal satu obat pada daftar di sebelah kiri untuk melihat pratinjau dan mencetak etiket.
                </p>
              </div>
            ) : (
              <div id="printable-sale-etiket" className="w-full max-w-sm space-y-4">
                {selectedItems.map((it, idx) => {
                  const med = it.medicine || {};
                  const isLuar = (med.label_type || '').toLowerCase() === 'luar';
                  const signa = signaOverrides[it.id] ?? (med.default_signa || '3 x Sehari 1 Tablet');
                  const timeStr = timeOverrides[it.id] ?? (med.consumption_time || 'Sesudah Makan');

                  return (
                    <div
                      key={it.id || idx}
                      className={`etiket-single-label p-3.5 rounded-xl border-2 font-mono text-slate-900 shadow-md ${
                        isLuar
                          ? 'etiket-luar bg-blue-50/95 border-blue-600'
                          : 'bg-white border-slate-800'
                      }`}
                    >
                      {/* Apotek Header */}
                      <div className="text-center border-b pb-1.5 mb-1.5 border-slate-700/60">
                        <h4 className="text-xs font-black tracking-wider uppercase leading-tight">
                          {branchName}
                        </h4>
                        <p className="text-[9px] text-slate-600 leading-tight mt-0.5">
                          SIA: {branchSia} | SIPA: {branchSipa}
                        </p>
                        <p className="text-[8px] text-slate-500 line-clamp-1">
                          {branchAddress}
                        </p>
                        {isLuar && (
                          <div className="mt-1 py-0.5 px-2 rounded bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider inline-block">
                            *** OBAT LUAR — TIDAK BOLEH DITELAN ***
                          </div>
                        )}
                      </div>

                      {/* No & Date */}
                      <div className="flex justify-between items-center text-[9px] border-b pb-1 mb-1.5 border-slate-400/50">
                        <div>
                          <span className="text-slate-500">No:</span> <strong>{receiptNo}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Tgl:</span> <strong>{new Date(sale.created_at || Date.now()).toLocaleDateString('id-ID')}</strong>
                        </div>
                      </div>

                      {/* Patient Name */}
                      <div className="text-[11px] mb-1.5 flex justify-between font-sans">
                        <span>Pasien: <strong className="font-bold text-slate-900">{patientName}</strong></span>
                        {patientAge && <span className="text-[10px] text-slate-500">({patientAge})</span>}
                      </div>

                      {/* Medicine Name Box */}
                      <div className="py-2 px-2.5 rounded-lg border border-slate-800/80 bg-slate-50/90 my-1.5 text-center">
                        <div className="text-[11px] font-black uppercase tracking-wide text-slate-950">
                          {med.name || it.medicine_id}
                        </div>
                        <div className="text-[9px] text-slate-600 mt-0.5">
                          Jumlah: <strong>{it.qty} {it.unit?.name || 'Item'}</strong> • {med.dosage_form || 'Sediaan'}
                        </div>
                      </div>

                      {/* Signa / Directions */}
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-600/40 my-1.5 text-center">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 block">
                          {isLuar ? 'ATURAN PEMAKAIAN LUAR:' : 'ATURAN MINUM / KONSUMSI:'}
                        </span>
                        <div className="text-xs font-black text-amber-900 mt-0.5">
                          {signa}
                        </div>
                        <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                          ({timeStr})
                        </div>
                      </div>

                      {/* Warning Tags / Notes if any */}
                      {med.warning_tags && (
                        <div className="p-1 rounded bg-red-100 border border-red-300 text-[9px] text-red-800 font-bold text-center mt-1">
                          [ ! ] {med.warning_tags}
                        </div>
                      )}

                      {/* Footer: BUD / Expiry & Pharmacist initials */}
                      <div className="pt-1.5 mt-1 border-t border-slate-700/50 flex justify-between items-center text-[8px] text-slate-500">
                        <span>
                          {it.batch?.expired_date
                            ? `ED: ${it.batch.expired_date.slice(0, 10)}`
                            : med.bud_days
                              ? `BUD: ${med.bud_days} Hari`
                              : 'Simpan di tempat sejuk & kering'}
                        </span>
                        <span>Paraf: [ ________ ]</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3 px-5 border-t flex items-center justify-between text-xs shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="text-slate-400">
            Total etiket siap cetak: <strong className="text-white font-mono">{selectedItems.length}</strong> lembar
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl font-semibold border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
              }`}
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {selectedItems.length} Etiket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
