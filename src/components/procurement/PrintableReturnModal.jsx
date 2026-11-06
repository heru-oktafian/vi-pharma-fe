import React from 'react';
import { X, Printer, RotateCcw } from 'lucide-react';

export default function PrintableReturnModal({ isOpen, onClose, ret, branch, theme = 'dark' }) {
  if (!isOpen || !ret) return null;

  const isLight = theme === 'light';

  const handlePrint = () => {
    window.print();
  };

  const formatDateID = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case 'KADALUARSA_ED': return 'Kadaluarsa / Mendekati Expired Date (ED)';
      case 'RUSAK_KEMASAN': return 'Kemasan Rusak / Cacat Fisik / Segel Rusak';
      case 'SALAH_KIRIM': return 'Salah Kirim Barang / Tidak Sesuai Pemesanan';
      case 'RECALL_BPOM': return 'Penarikan Batch Resmi Badan POM RI (Recall)';
      default: return reason || 'Lain-lain';
    }
  };

  const getCompensationText = (comp) => {
    switch (comp) {
      case 'POTONG_FAKTUR': return 'Pemotongan Saldo Hutang Faktur (Credit Note)';
      case 'TUKAR_BARANG': return 'Tukar Guling Barang Baru yang Sejenis';
      case 'REFUND_DANA': return 'Pengembalian Dana Kas / Transfer Bank';
      default: return comp || '-';
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
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pratinjau Cetak Nota Retur Pembelian Resmi PBF
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-md"
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

        {/* Printable Document Area */}
        <div id="printable-return-area" className="p-8 sm:p-10 bg-white text-black font-sans leading-relaxed overflow-y-auto max-h-[82vh] print:max-h-none print:p-0">
          {/* 1. Header Apotek (Kop Surat Resmi) */}
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

          {/* 2. Judul Dokumen & Nomor Nota Retur */}
          <div className="text-center mb-5">
            <h2 className="text-sm font-extrabold uppercase underline tracking-wide">
              NOTA RETUR PEMBELIAN KEPADA DISTRIBUTOR (PBF)
            </h2>
            <p className="text-[10px] text-gray-600 mt-0.5 italic">
              Berita Acara Pengembalian Obat & Rekonsiliasi Tagihan Farmasi
            </p>
            <div className="text-xs font-bold font-mono mt-1.5">
              Nomor Retur: <span className="underline">{ret.return_number}</span>
            </div>
          </div>

          {/* 3. Info PBF & Info Retur Grid */}
          <div className="text-xs mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-1">Kepada Yth. Distributor PBF:</p>
              <div className="p-2.5 border border-gray-400 rounded text-xs bg-gray-50/50">
                <p className="font-bold text-sm">{ret.supplier?.name || '-'}</p>
                <p className="text-gray-700 mt-0.5">{ret.supplier?.address || 'Alamat Distributor PBF'}</p>
                <p className="text-gray-700 mt-0.5">Telp: {ret.supplier?.phone || '-'}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Rincian Dokumen Retur:</p>
              <table className="text-xs w-full">
                <tbody>
                  <tr>
                    <td className="w-28 text-gray-600 py-0.5">Tanggal Retur</td>
                    <td className="w-2 py-0.5">:</td>
                    <td className="font-bold py-0.5">{formatDateID(ret.return_date)}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-0.5">No. Faktur Asal</td>
                    <td className="py-0.5">:</td>
                    <td className="font-mono font-bold py-0.5">{ret.invoice_number || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-0.5">Alasan Retur</td>
                    <td className="py-0.5">:</td>
                    <td className="font-semibold text-rose-700 py-0.5">{getReasonText(ret.reason)}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-0.5">Kompensasi</td>
                    <td className="py-0.5">:</td>
                    <td className="font-semibold text-blue-700 py-0.5">{getCompensationText(ret.compensation_type)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs mb-2">
            Dengan ini menyerahkan kembali sejumlah sediaan farmasi di bawah ini kepada pihak Distributor (PBF) sesuai dengan kesepakatan:
          </p>

          {/* 4. Tabel Rincian Obat yang Diretur */}
          <table className="w-full text-xs border border-collapse border-black mb-4">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-center font-bold">
                <th className="border-r border-black py-1.5 px-2 w-8">No.</th>
                <th className="border-r border-black py-1.5 px-3 text-left">Nama Obat / Sediaan</th>
                <th className="border-r border-black py-1.5 px-3 text-center">No. Batch</th>
                <th className="border-r border-black py-1.5 px-3 text-center">Expired Date</th>
                <th className="border-r border-black py-1.5 px-3 text-center w-20">Jumlah</th>
                <th className="border-r border-black py-1.5 px-3 text-center w-20">Satuan</th>
                <th className="border-r border-black py-1.5 px-3 text-right w-24">Harga Beli</th>
                <th className="py-1.5 px-3 text-right w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(ret.items || []).map((it, idx) => (
                <tr key={it.id || idx} className="border-b border-black">
                  <td className="border-r border-black py-1.5 px-2 text-center font-mono">
                    {idx + 1}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 font-bold">
                    {it.medicine?.name || '-'}
                    {it.item_reason && (
                      <span className="block text-[10px] font-normal text-gray-600 italic">
                        Ket: {it.item_reason}
                      </span>
                    )}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-center font-mono font-semibold">
                    {it.batch?.batch_number || it.batch_id}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-center font-mono">
                    {it.batch?.expired_date ? formatDateID(it.batch.expired_date) : '-'}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-center font-bold font-mono">
                    {it.qty}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-center">
                    {it.unit?.name || 'Pcs'}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-right font-mono">
                    Rp {Math.round(it.unit_price || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold">
                    Rp {Math.round(it.subtotal || (it.qty * it.unit_price) || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50 border-t border-black">
                <td colSpan="4" className="border-r border-black py-1.5 px-3 text-right uppercase">
                  Total Nilai Pengembalian:
                </td>
                <td colSpan="2" className="border-r border-black py-1.5 px-3 text-center font-mono">
                  {ret.total_items} Jenis Obat
                </td>
                <td colSpan="2" className="py-1.5 px-3 text-right font-mono text-sm font-bold">
                  Rp {Math.round(ret.total_amount || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>

          {ret.notes && (
            <div className="p-2 border border-gray-300 rounded text-xs bg-gray-50 mb-4">
              <strong>Catatan Khusus: </strong>{ret.notes}
            </div>
          )}

          {/* 5. Tanda Tangan Dual Columns (Apotek & Ekspedisi PBF) */}
          <div className="grid grid-cols-2 gap-8 pt-4 mt-6 text-xs text-center">
            {/* Kolom Apotek */}
            <div>
              <p className="font-semibold">Pihak Apotek Penyerah,</p>
              <p className="text-gray-600 text-[11px] mb-2">{branch?.branch_name || 'Vi-Pharma'}</p>
              <div className="h-20 flex items-center justify-center text-gray-300 border-b border-black mx-6 my-2">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan & Cap Apotek )</span>
              </div>
              <p className="font-bold underline">{ret.created_by?.name || 'Petugas Farmasi'}</p>
              <p className="text-[11px] text-gray-600">Petugas Farmasi / Apoteker</p>
            </div>

            {/* Kolom PBF */}
            <div>
              <p className="font-semibold">Pihak Distributor PBF Penerima,</p>
              <p className="text-gray-600 text-[11px] mb-2">{ret.supplier?.name || 'Distributor'}</p>
              <div className="h-20 flex items-center justify-center text-gray-300 border-b border-black mx-6 my-2">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan & Cap PBF )</span>
              </div>
              <p className="font-bold underline">( .................................................. )</p>
              <p className="text-[11px] text-gray-600">Sales / Ekspedisi / PBF</p>
            </div>
          </div>

          <div className="mt-8 pt-2 border-t text-[10px] text-gray-500 flex justify-between">
            <span>Dicetak secara otomatis oleh Sistem Manajemen Apotek Vi-Pharma</span>
            <span className="font-mono">Waktu Cetak: {new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
