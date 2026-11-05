import React, { useState } from 'react';
import { X, Printer, Tag, Calendar, User, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function EtiketPrintPreviewModal({
  isOpen,
  onClose,
  medicine,
  medicinesList = [],
  branch,
  theme = 'dark'
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const [patientName, setPatientName] = useState('Tn. Budi Santoso');
  const [patientAge, setPatientAge] = useState('38 Thn');
  const [receiptNo, setReceiptNo] = useState(() => `R-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);

  const targetMedicine = medicine || medicinesList[0] || {
    name: 'Paracetamol 500 mg',
    dosage_form: 'Tablet',
    label_type: 'dalam',
    default_signa: '3 x Sehari 1 Tablet',
    consumption_time: 'Sesudah Makan (Bila Demam / Sakit)',
    dose_morning: '1',
    dose_noon: '1',
    dose_night: '1',
    warning_tags: 'Hentikan bila demam sudah reda',
    special_instructions: 'Hati-hati penggunaan jangka panjang tanpa petunjuk dokter',
    bud_days: 0,
  };

  const handlePrint = () => {
    window.print();
  };

  const isObatLuar = (targetMedicine.label_type || '').toLowerCase() === 'luar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      {/* Container Dialog */}
      <div className={`w-full max-w-xl max-h-[94vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-vip-navy-border text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-vip-navy-light border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2">
            <Printer className={`w-5 h-5 ${isLight ? 'text-vip-navy' : 'text-token-emerald'}`} />
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                Cetak Etiket Farmasi (Thermal Label)
              </h3>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Standar Pelayanan Kefarmasian Apotek — Permenkes 73/2016
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

        {/* Quick Param Inputs */}
        <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151D2A] border-token-border'
        }`}>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Pasien:</span>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-hidden ${
                  isLight ? 'bg-white border-slate-300 w-36 text-slate-900' : 'bg-token-inner border-token-border w-36 text-slate-100'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Umur:</span>
              <input
                type="text"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="38 Th"
                className={`px-2 py-1 rounded-lg text-xs border outline-hidden ${
                  isLight ? 'bg-white border-slate-300 w-20 text-slate-900' : 'bg-token-inner border-token-border w-20 text-slate-100'
                }`}
              />
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
            isObatLuar
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-emerald-500/15 text-token-emerald border-token-emerald/30'
          }`}>
            {isObatLuar ? 'Label Luar (Biru)' : 'Label Dalam (Putih)'}
          </span>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-[#070A10] flex justify-center">
          {/* Printable Thermal Paper Container */}
          <div id="thermalPrintArea" className="w-full max-w-sm shadow-2xl transition-all">
            {/* SINGLE STICKER LABEL */}
            <div className={`p-4 rounded-xl border-2 font-mono text-slate-900 transition-all ${
              isObatLuar
                ? 'bg-blue-50/95 border-blue-600 shadow-blue-500/20'
                : 'bg-white border-slate-800 shadow-slate-900/20'
            }`}>
              {/* Pharmacy Header */}
              <div className="text-center border-b pb-2 mb-2 border-slate-700/60">
                <h4 className="text-xs sm:text-sm font-black tracking-wider uppercase leading-tight">
                  {branch?.branch_name || 'APOTEK VI-PHARMA MEDIKA'}
                </h4>
                <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                  SIA: {branch?.sia_id || 'SIA-101/2026'} | SIPA: apt. Hendra, S.Farm
                </p>
                <p className="text-[9px] text-slate-500 line-clamp-1">
                  {branch?.address || 'Jl. Kesehatan Raya No. 88, Jakarta Selatan'}
                </p>
                {isObatLuar && (
                  <div className="mt-1.5 py-0.5 px-3 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest inline-block">
                    *** OBAT LUAR — TIDAK BOLEH DITELAN ***
                  </div>
                )}
              </div>

              {/* Patient & Prescription Info */}
              <div className="flex justify-between items-center text-[10px] border-b pb-1.5 mb-2 border-slate-400/50">
                <div>
                  <span className="text-slate-500">No:</span> <strong>{receiptNo}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Tgl:</span> <strong>{new Date().toLocaleDateString('id-ID')}</strong>
                </div>
              </div>

              <div className="text-xs mb-2">
                <div className="flex justify-between">
                  <span>Pasien: <strong>{patientName}</strong></span>
                  <span className="text-[11px] text-slate-600">({patientAge})</span>
                </div>
              </div>

              {/* Medicine Main Name Box */}
              <div className="py-2.5 px-3 rounded-lg border border-slate-800/80 bg-slate-50/80 my-2 text-center">
                <div className="text-xs font-black uppercase tracking-wide">
                  {targetMedicine.name}
                </div>
                {targetMedicine.generic_name && (
                  <div className="text-[10px] text-slate-600 italic mt-0.5">
                    ({targetMedicine.generic_name})
                  </div>
                )}
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Sediaan: {targetMedicine.dosage_form || 'Tablet'}
                </div>
              </div>

              {/* Directions (Signa) */}
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-600/40 my-2 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
                  {isObatLuar ? 'ATURAN PAKAI / PEMAKAIAN LUAR:' : 'ATURAN MINUM / KONSUMSI:'}
                </span>
                <div className="text-sm font-black text-amber-900 mt-1">
                  {targetMedicine.default_signa || '3 x Sehari 1 Tablet'}
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                  ({targetMedicine.consumption_time || 'Sesudah Makan'})
                </div>
              </div>

              {/* Warning Tags */}
              {targetMedicine.warning_tags && (
                <div className="p-1.5 rounded bg-red-100 border border-red-300 text-[10px] text-red-800 font-bold text-center my-1.5">
                  [ ! ] {targetMedicine.warning_tags}
                </div>
              )}

              {/* Special Instructions */}
              {targetMedicine.special_instructions && (
                <div className="text-[10px] text-slate-600 text-center italic my-1">
                  * {targetMedicine.special_instructions}
                </div>
              )}

              {/* Beyond Use Date (BUD) */}
              <div className="text-[9px] text-slate-500 text-center border-t border-slate-400/50 pt-1.5 mt-2 flex justify-between items-center">
                <span>
                  {targetMedicine.bud_days > 0
                    ? `BUD: ${targetMedicine.bud_days} Hari setelah dibuka`
                    : 'Gunakan sesuai petunjuk dokter'}
                </span>
                <span>Paraf: [ ________ ]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3.5 px-5 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-token-emerald" />
            <span>Format kompatibel printer thermal POS & stiker roll</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
              }`}
            >
              Tutup Preview
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                isLight
                  ? 'bg-vip-navy hover:bg-vip-navy-dark text-white'
                  : 'bg-token-emerald hover:bg-token-emerald-dark text-slate-950 font-bold'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
