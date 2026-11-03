import React, { useState } from 'react';
import { X, Printer, Tag, Calendar, User, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

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
  const [printMode, setPrintMode] = useState('single'); // 'single' (Stiker Satuan) | 'group' (Jadwal Terpadu)
  const [patientName, setPatientName] = useState('Tn. Budi Santoso');
  const [patientAge, setPatientAge] = useState('38 Thn');
  const [doctorName, setDoctorName] = useState('dr. Bambang Sutrisno, Sp.PD');
  const [receiptNo, setReceiptNo] = useState(() => `R-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' | '58mm' | 'sticker'

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

  // Group list (if single, just target medicine; if group, take first 3 or all available)
  const groupItems = medicinesList.length > 0 ? medicinesList.slice(0, 5) : [targetMedicine];

  const handlePrint = () => {
    window.print();
  };

  const isObatLuar = (targetMedicine.label_type || '').toLowerCase() === 'luar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      {/* Container Dialog */}
      <div className={`w-full max-w-3xl max-h-[94vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
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
                Simulasi Cetak Etiket Farmasi (Thermal Label)
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

        {/* Mode Selector & Quick Controls */}
        <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151D2A] border-token-border'
        }`}>
          {/* Print Mode Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-token-inner border border-slate-300/60 dark:border-token-border">
            <button
              onClick={() => setPrintMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                printMode === 'single'
                  ? isLight
                    ? 'bg-white text-vip-navy shadow-xs border border-vip-navy-border'
                    : 'bg-token-card text-token-emerald shadow-xs border border-token-emerald/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>1. Print Etiket (Stiker Satuan)</span>
            </button>

            <button
              onClick={() => setPrintMode('group')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                printMode === 'group'
                  ? isLight
                    ? 'bg-white text-vip-navy shadow-xs border border-vip-navy-border'
                    : 'bg-token-card text-token-emerald shadow-xs border border-token-emerald/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Print Etiket Group (Jadwal Terpadu)</span>
            </button>
          </div>

          {/* Quick Param Inputs */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">Pasien:</span>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={`px-2 py-0.5 rounded text-xs border outline-hidden ${
                  isLight ? 'bg-white border-slate-300 w-32' : 'bg-token-inner border-token-border w-32 text-slate-100'
                }`}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">Umur:</span>
              <input
                type="text"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className={`px-2 py-0.5 rounded text-xs border outline-hidden ${
                  isLight ? 'bg-white border-slate-300 w-16' : 'bg-token-inner border-token-border w-16 text-slate-100'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-[#070A10] flex justify-center">
          {/* Printable Thermal Paper Container */}
          <div id="thermalPrintArea" className="w-full max-w-md shadow-2xl transition-all">
            {/* MODE 1: SINGLE STICKER LABEL */}
            {printMode === 'single' && (
              <div className={`p-4 rounded-xl border-2 font-mono text-slate-900 transition-all ${
                isObatLuar
                  ? 'bg-blue-50/95 border-blue-600 shadow-blue-500/20'
                  : 'bg-white border-slate-800 shadow-slate-900/20'
              }`}>
                {/* Pharmacy Header */}
                <div className="text-center border-b pb-2 mb-2 border-slate-700/60">
                  <h4 className="text-sm font-black tracking-wider uppercase leading-tight">
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
                  <span className="text-sm font-black uppercase text-slate-900 block mt-0.5">
                    {targetMedicine.default_signa || '3 X SEHARI 1 TABLET'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 block mt-0.5">
                    {targetMedicine.consumption_time || 'SESUDAH MAKAN'}
                  </span>
                </div>

                {/* Warning and Aux Tags */}
                {targetMedicine.warning_tags && (
                  <div className="py-1 px-2 rounded bg-red-500/15 border border-red-600/40 text-[10px] font-black text-red-900 text-center my-1.5 uppercase">
                    [ ! ] {targetMedicine.warning_tags}
                  </div>
                )}

                {targetMedicine.special_instructions && (
                  <div className="text-[9px] text-slate-600 italic text-center mt-1">
                    * Catatan: {targetMedicine.special_instructions}
                  </div>
                )}

                {/* Footer Notes */}
                <div className="border-t pt-1.5 mt-2 border-slate-400/50 flex justify-between items-center text-[9px] text-slate-500">
                  <span>{targetMedicine.bud_days ? `BUD: ${targetMedicine.bud_days} Hari Setelah Buka` : 'ED: Sesuai Kemasan Pabrik'}</span>
                  <span>Simpan di Tempat Sejuk</span>
                </div>
              </div>
            )}

            {/* MODE 2: GROUP DISPENSING RECEIPT (LEMBAR JADWAL MINUM TERPADU) */}
            {printMode === 'group' && (
              <div className="p-5 rounded-xl border font-mono bg-white text-slate-900 border-slate-700 shadow-xl text-xs space-y-3">
                {/* Header Apotek */}
                <div className="text-center border-b pb-2.5 border-slate-800">
                  <h4 className="text-sm font-black tracking-wider uppercase leading-tight">
                    {branch?.branch_name || 'APOTEK VI-PHARMA MEDIKA'}
                  </h4>
                  <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                    SIA: {branch?.sia_id || 'SIA-101/2026'} | SIPA: apt. Hendra, S.Farm
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {branch?.address || 'Jl. Kesehatan Raya No. 88, Jakarta Selatan'}
                  </p>
                  <div className="mt-2 py-1 px-3 border-y border-dashed border-slate-700 font-bold uppercase text-[11px] tracking-widest">
                    LEMBAR INFORMASI & JADWAL PENGGUNAAN OBAT
                  </div>
                </div>

                {/* Patient & Doctor Dossier */}
                <div className="grid grid-cols-2 gap-1 text-[10px] border-b pb-2 border-slate-300">
                  <div>
                    <span className="text-slate-500 block">No. Transaksi / Resep:</span>
                    <strong>{receiptNo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Penyerahan:</span>
                    <strong>{new Date().toLocaleDateString('id-ID')}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block">Nama Pasien:</span>
                    <strong>{patientName} ({patientAge})</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block">Dokter Preskriptor:</span>
                    <strong>{doctorName}</strong>
                  </div>
                </div>

                {/* List of Medicines */}
                <div>
                  <h5 className="font-bold uppercase text-[10px] tracking-wider mb-1.5 text-slate-700">
                    DAFTAR OBAT & PETUNJUK PENGGUNAAN:
                  </h5>
                  <div className="space-y-2.5 divide-y divide-slate-200">
                    {groupItems.map((med, idx) => (
                      <div key={idx} className={idx > 0 ? 'pt-2' : ''}>
                        <div className="flex items-start justify-between">
                          <span className="font-black text-xs text-slate-900">
                            {idx + 1}. {med.name}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                            med.label_type === 'luar'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {med.label_type === 'luar' ? 'Obat Luar' : 'Obat Dalam'}
                          </span>
                        </div>

                        <div className="text-[11px] pl-3 mt-0.5 space-y-0.5 text-slate-700">
                          <div>
                            • Aturan Pakai: <strong>{med.default_signa || '3 x Sehari 1 Tablet'}</strong>
                          </div>
                          <div>
                            • Waktu Minum: <span className="font-semibold text-amber-800">{med.consumption_time || 'Sesudah Makan'}</span>
                          </div>
                          {med.warning_tags && (
                            <div className="text-red-700 font-bold text-[10px]">
                              [ ! ] {med.warning_tags}
                            </div>
                          )}
                          {med.special_instructions && (
                            <div className="text-[9px] text-slate-500 italic">
                              * {med.special_instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TABLE JADWAL MINUM OBAT (PAGI, SIANG, MALAM) */}
                <div className="pt-2 border-t border-slate-700">
                  <h5 className="font-black uppercase text-[10px] tracking-wider mb-1 text-slate-800 text-center">
                    MATRIKS JADWAL MINUM OBAT HARIAN
                  </h5>
                  <table className="w-full text-center text-[10px] border border-slate-600 border-collapse">
                    <thead className="bg-slate-100 uppercase font-black border-b border-slate-600">
                      <tr>
                        <th className="py-1 px-1.5 text-left border-r border-slate-600">Nama Obat</th>
                        <th className="py-1 px-1 border-r border-slate-600">Pagi</th>
                        <th className="py-1 px-1 border-r border-slate-600">Siang</th>
                        <th className="py-1 px-1">Malam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {groupItems.map((med, idx) => (
                        <tr key={idx}>
                          <td className="py-1 px-1.5 text-left font-bold border-r border-slate-600 truncate max-w-[120px]">
                            {med.name}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-600 font-bold">
                            {med.dose_morning || '1'}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-600 font-bold">
                            {med.dose_noon || (med.default_signa?.includes('1 x') ? '-' : '1')}
                          </td>
                          <td className="py-1 px-1 font-bold">
                            {med.dose_night || '1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Greetings */}
                <div className="border-t border-dashed border-slate-500 pt-2 text-center text-[9px] text-slate-500">
                  <p className="font-bold text-slate-700">Semoga Lekas Sembuh & Sehat Selalu</p>
                  <p className="mt-0.5">Pusat Layanan Konsultasi Obat: (021) 7890-1234 / WA: 0812-9988-7766</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3.5 px-5 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-token-emerald" />
            <span>Format kompatibel printer thermal POS 58mm / 80mm & label sticker</span>
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
