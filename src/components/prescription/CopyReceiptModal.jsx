import React, { useRef } from 'react';
import { X, Printer, FileText, ShieldCheck, Check } from 'lucide-react';

export default function CopyReceiptModal({ prescription, branch, theme, onClose }) {
  const isLight = theme === 'light';
  const printRef = useRef(null);

  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs overflow-y-auto">
      {/* Hidden print styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-copy-receipt, #printable-copy-receipt * {
            visibility: visible !important;
          }
          #printable-copy-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b no-print ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Salinan Resep Resmi (Apograph)</h3>
              <p className="text-[11px] text-slate-400">
                P.C.C (Pro Copie Conforme) &bull; Standar Pelayanan Farmasi Apotek
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Salinan (A5 / Kuarto)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-100/60 dark:bg-slate-950/40 flex justify-center">
          <div
            id="printable-copy-receipt"
            ref={printRef}
            className="w-full max-w-[540px] bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-md font-serif leading-normal"
            style={{ minHeight: '620px' }}
          >
            {/* Header / Kop Apotek */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-lg font-bold uppercase tracking-wider text-slate-950 font-sans">
                {branch?.branch_name || 'APOTEK VI-PHARMA PUSAT'}
              </h1>
              <p className="text-xs text-slate-700 font-sans mt-0.5">
                {branch?.address || 'Jl. Pemuda No. 10, Jakarta'} &bull; Telp: {branch?.phone || '021-5551234'}
              </p>
              <div className="flex justify-center items-center gap-3 text-[11px] text-slate-600 font-sans mt-1">
                <span>SIA: <strong>{branch?.sia_id || 'SIA-101/2026'}</strong></span>
                <span>&bull;</span>
                <span>APA: <strong>{branch?.sipa_name || 'apt. Hendra Wijaya, S.Farm'}</strong></span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                SIPA: {branch?.sipa || 'SIPA-2026/001'}
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest underline decoration-1 underline-offset-4 font-sans text-slate-900">
                SALINAN RESEP
              </h2>
              <p className="text-[11px] text-slate-600 italic font-sans mt-0.5">
                (APOGRAPH / EXEMPLUM)
              </p>
            </div>

            {/* Meta Resep Asli */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4 pb-3 border-b border-dashed border-slate-300 font-sans">
              <div>
                <span className="text-slate-500">Dari Dokter:</span>{' '}
                <strong className="text-slate-900">{prescription.doctor_name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Tgl Resep Asli:</span>{' '}
                <span className="text-slate-800">{formatDate(prescription.prescription_date)}</span>
              </div>
              <div>
                <span className="text-slate-500">SIP Dokter:</span>{' '}
                <span className="text-slate-800">{prescription.doctor_sip || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">No. Resep Apotek:</span>{' '}
                <strong className="text-emerald-700">{prescription.prescription_number}</strong>
              </div>
              <div>
                <span className="text-slate-500">Untuk Pasien:</span>{' '}
                <strong className="text-slate-900">{prescription.patient_name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Umur / BB:</span>{' '}
                <span className="text-slate-800">
                  {prescription.patient_age > 0 ? `${prescription.patient_age} Thn` : '-'}
                  {prescription.patient_weight > 0 ? ` (${prescription.patient_weight} kg)` : ''}
                </span>
              </div>
            </div>

            {/* Content R/ Resep */}
            <div className="space-y-4 my-4 min-h-[220px]">
              {prescription.items?.map((item, idx) => (
                <div key={item.id || idx} className="text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-950 font-serif italic mb-0.5">
                        R/
                      </div>
                      {item.item_type === 'NON_RACIK' ? (
                        <div className="pl-4">
                          <div className="font-sans font-semibold text-slate-900 text-[13px]">
                            {item.medicine?.name || 'Obat Non-Racik'} &nbsp;
                            <span className="font-normal text-slate-600">No. {item.qty} {item.unit?.name || 'Tab'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pl-4 space-y-0.5">
                          <div className="font-sans font-bold text-emerald-800 text-[13px]">
                            {item.racikan_name || 'Racikan Puyer/Kapsul'} &nbsp;
                            <span className="font-normal text-slate-700">({item.racikan_dose_form}) No. {item.racikan_qty} {item.racikan_unit}</span>
                          </div>
                          {item.compound_items?.map((comp, cIdx) => (
                            <div key={cIdx} className="font-sans text-[11px] text-slate-700 pl-2">
                              &bull; {comp.medicine?.name || 'Bahan Aktif'}{' '}
                              <span className="text-slate-500 italic">
                                ({item.racikan_method === 'DTD' ? `${comp.dose_per_pack} tab/bgks` : `total ${comp.total_qty} tab`})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Signa */}
                      <div className="pl-4 mt-1 font-sans text-xs italic text-slate-800">
                        S. {item.signa} &mdash; {item.usage_time || 'Sesudah Makan'}
                      </div>
                    </div>

                    {/* Detur Status Marker */}
                    <div className="text-right pl-3 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${
                          item.detur_status === 'det' || item.detur_status === 'DET'
                            ? 'bg-slate-100 text-slate-900 border-slate-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.detur_status === 'ne_det' ? 'ne det' : 'det'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Copy Resep */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-xs font-sans">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="font-bold text-[11px] text-slate-700">
                    P. C. C.
                  </div>
                  <div className="text-[10px] text-slate-500 italic">
                    (Pro Copie Conforme / Sesuai Resep Aslinya)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    Dicetak pada: {new Date().toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="text-center w-48">
                  <p className="text-[11px] text-slate-600 mb-10">
                    {branch?.branch_name?.replace('Apotek ', '') || 'Jakarta'}, {formatDate(new Date())}
                    <br />
                    Apoteker Pengelola Apotek,
                  </p>
                  <p className="font-bold text-xs underline text-slate-950">
                    ({branch?.sipa_name || 'apt. Hendra Wijaya, S.Farm'})
                  </p>
                  <p className="text-[10px] text-slate-500">
                    SIPA: {branch?.sipa || 'SIPA-2026/001'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
