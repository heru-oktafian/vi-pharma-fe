import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

export default function PrintableSPModal({ isOpen, onClose, po, branch, theme = 'dark' }) {
  if (!isOpen || !po) return null;

  const isLight = theme === 'light';

  const handlePrint = () => {
    window.print();
  };

  // Title by SP Type according to Indonesian BPOM format
  let spTitle = "SURAT PESANAN OBAT JADI";
  let spSubtitle = "Nomor Izin Apotek (SIA) & SIPA Terlampir";
  let spNote = "";

  switch (po.sp_type) {
    case 'PREKURSOR':
      spTitle = "SURAT PESANAN OBAT MENGANDUNG PREKURSOR FARMASI";
      spSubtitle = "Berdasarkan Peraturan Badan POM RI tentang Pengelolaan Prekursor Farmasi";
      spNote = "Obat yang dipesan akan digunakan semata-mata untuk pelayanan kefarmasian di apotek kami.";
      break;
    case 'OOT':
      spTitle = "SURAT PESANAN OBAT-OBAT TERTENTU (OOT)";
      spSubtitle = "Berdasarkan Peraturan Badan POM RI tentang Kriteria dan Tata Laksana Penarikan dan Pemusnahan Sediaan Farmasi";
      spNote = "Obat yang dipesan akan digunakan untuk pelayanan kefarmasian resmi di apotek kami.";
      break;
    case 'PSIKOTROPIKA':
      spTitle = "SURAT PESANAN PSIKOTROPIKA";
      spSubtitle = "Berdasarkan Undang-Undang RI No. 5 Tahun 1997 tentang Psikotropika";
      spNote = "Dibuat dalam rangkap 3 (PBF, Arsip Apotek, Dinas Kesehatan).";
      break;
    case 'NARKOTIKA':
      spTitle = "SURAT PESANAN NARKOTIKA";
      spSubtitle = "Berdasarkan Undang-Undang RI No. 35 Tahun 2009 tentang Narkotika";
      spNote = "Hanya untuk 1 (satu) jenis obat narkotika per lembar Surat Pesanan. Dibuat dalam rangkap 4 atau 5.";
      break;
    default:
      spTitle = "SURAT PESANAN OBAT JADI (REGULER)";
      spSubtitle = "Permenkes No. 73 Tahun 2016 tentang Standar Pelayanan Kefarmasian di Apotek";
      break;
  }

  // Indonesian date formatter
  const formatDateID = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className={`w-full max-w-3xl my-auto rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="px-5 py-3 border-b flex items-center justify-between shrink-0 bg-slate-500/10 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pratinjau Cetak Surat Pesanan Resmi (Format Regulasi BPOM)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg border hover:bg-slate-500/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area (Always white background for standard A4 printing) */}
        <div id="printable-sp-area" className="p-8 sm:p-10 bg-white text-black font-sans leading-relaxed overflow-y-auto max-h-[82vh] print:max-h-none print:p-0">
          {/* 1. Header Apotek (Kop Resmi) */}
          <div className="border-b-2 border-black pb-3 text-center mb-4">
            <h1 className="text-lg font-bold tracking-wider uppercase text-black">
              APOTEK {branch?.branch_name || 'VI-PHARMA'}
            </h1>
            <p className="text-xs text-gray-700 mt-0.5">
              {branch?.address || 'Jl. Raya Farmasi Medika No. 88, Indonesia'} • Telp: {branch?.phone || '(021) 555-8899'}
            </p>
            <p className="text-xs text-gray-700 font-mono mt-0.5">
              SIA (Surat Izin Apotek): <strong>{branch?.sia_number || '503/SIA-0812/DPMPTSP/2024'}</strong>
            </p>
          </div>

          {/* 2. Judul Dokumen & Nomor SP */}
          <div className="text-center mb-5">
            <h2 className="text-sm font-extrabold uppercase underline tracking-wide">
              {spTitle}
            </h2>
            <p className="text-[10px] text-gray-600 mt-0.5 italic">
              {spSubtitle}
            </p>
            <div className="text-xs font-bold font-mono mt-1.5">
              Nomor: <span className="underline">{po.po_number}</span>
            </div>
          </div>

          {/* 3. Penerima & Pemesan Grid */}
          <div className="text-xs mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-1">Kepada Yth. PBF Distributor:</p>
              <div className="p-2 border border-gray-400 rounded text-xs bg-gray-50/50">
                <p className="font-bold">{po.supplier?.name || '-'}</p>
                <p className="text-gray-700 mt-0.5">{po.supplier?.address || 'Alamat Distributor PBF'}</p>
                <p className="text-gray-700 mt-0.5">No. Izin PBF: {po.supplier?.license_number || '-'}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Yang bertanda tangan di bawah ini:</p>
              <table className="text-xs w-full">
                <tbody>
                  <tr>
                    <td className="w-24 text-gray-600 py-0.5">Nama Apoteker</td>
                    <td className="w-2 py-0.5">:</td>
                    <td className="font-bold py-0.5">{po.pharmacist_name || 'Apoteker Penanggung Jawab'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-0.5">Nomor SIPA</td>
                    <td className="py-0.5">:</td>
                    <td className="font-mono font-bold py-0.5">{po.pharmacist_sipa || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-0.5">Jabatan</td>
                    <td className="py-0.5">:</td>
                    <td className="py-0.5">Apoteker Pengelola Apotek (APA / APJ)</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-0.5">Nama Apotek</td>
                    <td className="py-0.5">:</td>
                    <td className="font-semibold py-0.5">Apotek {branch?.branch_name}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs mb-2">
            Dengan ini mengajukan pesanan obat-obatan berikut untuk keperluan pelayanan farmasi di apotek kami:
          </p>

          {/* 4. Tabel Rincian Obat yang Dipesan */}
          <table className="w-full text-xs border border-collapse border-black mb-4">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-center font-bold">
                <th className="border-r border-black py-1.5 px-2 w-8">No.</th>
                <th className="border-r border-black py-1.5 px-3 text-left">Nama Obat / Zat Aktif</th>
                <th className="border-r border-black py-1.5 px-3 text-center w-28">Kemasan / Satuan</th>
                <th className="border-r border-black py-1.5 px-3 text-center w-20">Jumlah</th>
                <th className="border-r border-black py-1.5 px-3 text-right w-28">Estimasi Harga</th>
                <th className="py-1.5 px-3 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {(po.items || []).map((it, idx) => (
                <tr key={it.id || idx} className="border-b border-black">
                  <td className="border-r border-black py-1.5 px-2 text-center font-mono">
                    {idx + 1}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 font-bold">
                    {it.medicine?.name || '-'}
                    {it.medicine?.item_code && (
                      <span className="block text-[10px] font-normal text-gray-600 font-mono">
                        Kode: {it.medicine.item_code}
                      </span>
                    )}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-center">
                    {it.unit?.name || 'Pcs'}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-center font-bold font-mono">
                    {it.qty_ordered}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-right font-mono">
                    Rp {(it.estimated_price || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-1.5 px-3 text-gray-700 text-[11px]">
                    {it.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50 border-t border-black">
                <td colSpan="3" className="border-r border-black py-1.5 px-3 text-right">
                  Total Estimasi Tagihan:
                </td>
                <td className="border-r border-black py-1.5 px-3 text-center font-mono">
                  {po.total_items} Item
                </td>
                <td className="border-r border-black py-1.5 px-3 text-right font-mono">
                  Rp {(po.total_estimated_amount || 0).toLocaleString('id-ID')}
                </td>
                <td className="py-1.5 px-3"></td>
              </tr>
            </tfoot>
          </table>

          {spNote && (
            <p className="text-[11px] text-gray-700 italic mb-4">
              * Catatan Regulasi: {spNote}
            </p>
          )}

          {/* 5. Tanda Tangan & Tanggal */}
          <div className="flex justify-between items-end pt-4 mt-6 text-xs">
            <div className="w-1/2 text-gray-600 text-[11px]">
              <p>Dibuat melalui Sistem Informasi Apotek Vi-Pharma</p>
              <p className="font-mono mt-0.5">Waktu Cetak: {new Date().toLocaleString('id-ID')}</p>
            </div>

            <div className="w-64 text-center">
              <p className="mb-1">
                {branch?.city || 'Jakarta'}, {formatDateID(po.order_date)}
              </p>
              <p className="font-semibold">Apoteker Penanggung Jawab,</p>

              {/* Area Tanda Tangan & Cap Apotek */}
              <div className="h-20 flex items-center justify-center text-gray-300 border-b border-black mx-4 my-2">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan & Stempel Apotek )</span>
              </div>

              <p className="font-bold underline">{po.pharmacist_name || 'Apoteker Penanggung Jawab'}</p>
              <p className="font-mono text-[11px] mt-0.5">SIPA: {po.pharmacist_sipa || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
