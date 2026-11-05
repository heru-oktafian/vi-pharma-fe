import React, { useState, useRef } from 'react';
import { X, Printer, CheckSquare, Square, Tag, Pill } from 'lucide-react';

export default function PrescriptionEtiketModal({ prescription, branch, theme, onClose }) {
  const isLight = theme === 'light';
  const printRef = useRef(null);

  // Default select all items
  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    return (prescription?.items || []).map((it) => it.id);
  });

  if (!prescription) return null;

  const toggleSelect = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItemIds((prescription.items || []).map((it) => it.id));
  };

  const deselectAll = () => {
    setSelectedItemIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItems = (prescription.items || []).filter((it) =>
    selectedItemIds.includes(it.id)
  );

  const calculateBUD = (budDays) => {
    if (!budDays || budDays <= 0) return 'Sesuai ED Kemasan';
    const d = new Date();
    d.setDate(d.getDate() + budDays);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs overflow-y-auto">
      {/* Hidden print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-prescription-etiket, #printable-prescription-etiket * {
            visibility: visible !important;
          }
          #printable-prescription-etiket {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 10px !important;
            box-shadow: none !important;
          }
          .etiket-card-print {
            page-break-after: always;
            break-after: page;
            margin-bottom: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden ${
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
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cetak Etiket Obat & Racikan Resep</h3>
              <p className="text-[11px] text-slate-400">
                No. Resep: <span className="font-semibold text-emerald-400">{prescription.prescription_number}</span> &bull; Pasien: {prescription.patient_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak {selectedItems.length} Etiket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selection Checklist Bar */}
        <div
          className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs no-print ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-800/40 border-slate-700'
          }`}
        >
          <span className="text-slate-400">
            Pilih obat/racikan yang ingin dicetakkan etiketnya:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition"
            >
              Pilih Semua
            </button>
            <button
              onClick={deselectAll}
              className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition"
            >
              Batalkan Semua
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Checklist selection items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 no-print">
            {prescription.items?.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isRacik = item.item_type === 'RACIKAN';
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                    isSelected
                      ? isLight
                        ? 'bg-purple-50/70 border-purple-300 text-slate-900'
                        : 'bg-purple-950/20 border-purple-500/40 text-white'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="mt-0.5 text-purple-500">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isRacik
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {isRacik ? 'Racikan' : 'Obat Jadi'}
                      </span>
                      <span className="font-semibold text-xs truncate">
                        {isRacik ? item.racikan_name : item.medicine?.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      Signa: <strong>{item.signa}</strong> ({item.usage_time || 'Sesudah Makan'})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Printable Preview Area */}
          <div id="printable-prescription-etiket" ref={printRef} className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 no-print">
              Preview Etiket Fisik ({selectedItems.length} siap cetak):
            </h4>

            {selectedItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                Belum ada obat yang dipilih untuk dicetak.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedItems.map((item, idx) => {
                  const isLuar = item.label_type === 'luar';
                  const isRacik = item.item_type === 'RACIKAN';

                  return (
                    <div
                      key={item.id || idx}
                      className={`etiket-card-print relative rounded-xl border-2 p-3 font-sans text-slate-900 bg-white shadow-sm ${
                        isLuar ? 'border-blue-600' : 'border-slate-800'
                      }`}
                      style={{ maxWidth: '340px', minHeight: '220px' }}
                    >
                      {/* Etiket Banner / Badge */}
                      <div
                        className={`text-center py-1 px-2 rounded font-bold text-[10px] uppercase tracking-wider text-white mb-2 ${
                          isLuar ? 'bg-blue-600' : 'bg-slate-900'
                        }`}
                      >
                        {isLuar ? 'OBAT LUAR (TIDAK BOLEH DITELAN)' : 'OBAT DALAM'}
                      </div>

                      {/* Header Apotek */}
                      <div className="text-center border-b pb-1.5 mb-2 border-slate-200">
                        <h5 className="font-bold text-xs uppercase tracking-wide text-slate-950">
                          {branch?.branch_name || 'APOTEK VI-PHARMA PUSAT'}
                        </h5>
                        <p className="text-[9px] text-slate-600">
                          SIA: {branch?.sia_id || 'SIA-101/2026'} &bull; APA: {branch?.sipa_name || 'apt. Hendra Wijaya, S.Farm'}
                        </p>
                      </div>

                      {/* Meta Pasien & Resep */}
                      <div className="flex justify-between text-[10px] text-slate-600 border-b pb-1 mb-2">
                        <span>No: <strong>{prescription.prescription_number}</strong></span>
                        <span>Tgl: {new Date().toLocaleDateString('id-ID')}</span>
                      </div>

                      <div className="mb-2">
                        <span className="text-[10px] text-slate-500">Nama Pasien:</span>
                        <div className="font-bold text-xs text-slate-950 uppercase">
                          {prescription.patient_name}{' '}
                          {prescription.patient_age > 0 && `(${prescription.patient_age} Thn)`}
                        </div>
                      </div>

                      {/* Nama Obat / Racikan */}
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200 mb-2">
                        <div className="text-[10px] text-slate-500 font-medium">
                          {isRacik ? 'Komposisi Racikan:' : 'Nama Obat:'}
                        </div>
                        <div className="font-bold text-[11px] text-slate-900">
                          {isRacik
                            ? `${item.racikan_name} (${item.racikan_qty} ${item.racikan_unit})`
                            : item.medicine?.name}
                        </div>
                        {isRacik && item.compound_items?.length > 0 && (
                          <div className="text-[9px] text-slate-600 mt-0.5 line-clamp-2">
                            Bahan:{' '}
                            {item.compound_items
                              .map((c) => `${c.medicine?.name || 'Item'} (${c.dose_per_pack} tab)`)
                              .join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Signa Aturan Pakai */}
                      <div className="text-center my-2 p-1.5 bg-emerald-50 rounded border border-emerald-200">
                        <div className="font-extrabold text-xs text-emerald-950 tracking-wide">
                          {item.signa}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-800 italic mt-0.5">
                          {item.usage_time || 'Sesudah Makan'}
                        </div>
                      </div>

                      {/* BUD / Beyond Use Date & Peringatan */}
                      <div className="text-[9px] text-slate-500 flex justify-between items-center border-t pt-1.5 border-slate-200 mt-2">
                        <span>
                          BUD:{' '}
                          <strong className="text-slate-800">
                            {calculateBUD(item.bud_days || (isRacik ? 14 : 0))}
                          </strong>
                        </span>
                        <span className="italic text-slate-600">Semoga Lekas Sembuh</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
