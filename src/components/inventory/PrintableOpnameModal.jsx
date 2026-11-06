import React from 'react';
import { X, Printer, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PrintableOpnameModal({ isOpen, onClose, opname, branch, theme = 'dark' }) {
  if (!isOpen || !opname) return null;

  const isLight = theme === 'light';
  const branchName = branch?.branch_name || opname.branch?.branch_name || 'APOTEK VI-PHARMA';
  const branchAddress = branch?.address || opname.branch?.address || 'Jl. Pemuda No. 10, Jakarta';
  const branchPhone = branch?.phone || opname.branch?.phone || '021-5551234';
  const branchSIA = branch?.sia_number || opname.branch?.sia_number || 'SIA-198402/DKS/2024';
  const branchSIPA = branch?.sipa_number || opname.branch?.sipa_number || 'SIPA-199203/STRA/2024';
  const apjName = branch?.pharmacist_in_charge || opname.branch?.pharmacist_in_charge || 'apt. Heru Oktafian, S.Farm.';

  const handlePrint = () => {
    window.print();
  };

  const items = opname.items || [];
  const matchCount = items.filter(it => it.difference_qty === 0).length;
  const surplusCount = items.filter(it => it.difference_qty > 0).length;
  const deficitCount = items.filter(it => it.difference_qty < 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      {/* Print CSS for Formal Opname Report */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-opname-doc,
          #printable-opname-doc * {
            visibility: visible !important;
          }
          #printable-opname-doc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 10.5pt !important;
            line-height: 1.3 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`w-full max-w-4xl max-h-[92vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 no-print ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Berita Acara Hasil Stok Opname Fisik</h3>
              <p className="text-[10px] text-slate-400">
                Kode Sesi: <span className="font-mono font-bold text-emerald-400">{opname.opname_code}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen (A4)</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-slate-950/40">
          <div
            id="printable-opname-doc"
            className="w-full max-w-3xl mx-auto p-8 sm:p-10 rounded-xl bg-white text-slate-900 shadow-md border border-slate-200"
          >
            {/* Header Apotek */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-lg font-black tracking-tight uppercase text-slate-950">
                  {branchName}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">{branchAddress}</p>
                <p className="text-xs text-slate-600">Telp: {branchPhone}</p>
              </div>
              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                <div>No. SIA: <span className="font-mono font-bold text-slate-900">{branchSIA}</span></div>
                <div>No. SIPA: <span className="font-mono font-bold text-slate-900">{branchSIPA}</span></div>
                <div>APJ: <span className="font-bold text-slate-900">{apjName}</span></div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4">
              <h2 className="text-sm font-black uppercase tracking-wider underline">
                BERITA ACARA HASIL STOK OPNAME FISIK OBAT
              </h2>
              <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                Nomor: {opname.opname_code}
              </div>
            </div>

            {/* Session Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-32 py-0.5 text-slate-500">Tanggal Opname</td>
                      <td className="py-0.5 font-semibold">: {new Date(opname.opname_date || opname.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-500">Lokasi Fisik</td>
                      <td className="py-0.5 font-semibold">: {opname.location === 'RAK' ? 'Rak Kasir (Apotek Depan)' : 'Gudang Utama Farmasi'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-500">Nama Rak / Zona</td>
                      <td className="py-0.5 font-bold text-emerald-800">: {opname.rack_name || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-32 py-0.5 text-slate-500">Status Sesi</td>
                      <td className="py-0.5 font-bold uppercase">: {opname.status}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-500">Petugas Hitung</td>
                      <td className="py-0.5 font-semibold">: {opname.created_by?.name || 'Petugas Farmasi'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-500">Catatan Sesi</td>
                      <td className="py-0.5">: {opname.notes || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table of Counted Items */}
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300 mb-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                  <th className="py-2 px-2 border-r border-slate-300 text-center w-8">No</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Nama Obat & Sediaan</th>
                  <th className="py-2 px-2 border-r border-slate-300 text-center w-24">No. Batch</th>
                  <th className="py-2 px-2 border-r border-slate-300 text-center w-20">Exp. Date</th>
                  <th className="py-2 px-2 border-r border-slate-300 text-right w-16">Stok Sistem</th>
                  <th className="py-2 px-2 border-r border-slate-300 text-right w-16">Stok Fisik</th>
                  <th className="py-2 px-2 border-r border-slate-300 text-right w-16">Selisih</th>
                  <th className="py-2 px-2.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                      Tidak ada item obat yang tercatat pada sesi ini.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const diff = Number(it.difference_qty) || 0;
                    const isDiff = diff !== 0;

                    return (
                      <tr key={idx} className={isDiff ? 'bg-amber-50/40' : ''}>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-center">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                          {it.medicine?.name || 'Obat Farmasi'}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-[10px]">
                          {it.batch?.batch_number || it.batch_number || '-'}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-center text-[10px]">
                          {it.batch?.expired_date ? new Date(it.batch.expired_date).toLocaleDateString('id-ID', { month: '2-digit', year: 'numeric' }) : '-'}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono">
                          {Number(it.system_qty || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono font-bold">
                          {Number(it.physical_qty || 0).toLocaleString('id-ID')}
                        </td>
                        <td className={`py-1.5 px-2 border-r border-slate-200 text-right font-mono font-black ${
                          diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-1.5 px-2.5 text-[10px] text-slate-600">
                          {it.notes || (diff === 0 ? 'Sesuai' : diff > 0 ? 'Surplus' : 'Selisih Kurang')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Variance Summary Chips */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-8">
              <div>
                Total Item Diperiksa: <strong className="font-mono text-slate-900">{items.length}</strong> batch
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-semibold">
                  ✓ Sesuai: <strong>{matchCount}</strong>
                </span>
                <span className="text-amber-700 font-semibold">
                  + Surplus: <strong>{surplusCount}</strong>
                </span>
                <span className="text-red-700 font-semibold">
                  - Defisit: <strong>{deficitCount}</strong>
                </span>
              </div>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-8 text-xs text-center pt-2">
              <div>
                <p className="text-slate-600 mb-14">Petugas Pemeriksa Fisik,</p>
                <p className="font-bold underline text-slate-900">
                  ( {opname.created_by?.name || 'Petugas Farmasi'} )
                </p>
                <p className="text-[10px] text-slate-500">Staf Logistik / Gudang</p>
              </div>

              <div>
                <p className="text-slate-600 mb-14">Apoteker Penanggung Jawab (APJ),</p>
                <p className="font-bold underline text-slate-900">
                  ( {apjName} )
                </p>
                <p className="text-[10px] text-slate-500">SIPA: {branchSIPA}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs text-slate-400 shrink-0 no-print ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
          }`}
        >
          <div>
            Format cetak: <strong>A4 Portrait</strong> • Standar Audit Mutu Farmasi
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
