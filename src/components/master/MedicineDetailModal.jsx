import React from 'react';
import { X, Pill, ShieldCheck, MapPin, Package, Building2, Tag, Layers, DollarSign, AlertTriangle, CheckCircle2, Printer, Clock, QrCode } from 'lucide-react';
import ClassificationBadge from './ClassificationBadge';

export default function MedicineDetailModal({ medicine, isOpen, onClose, onOpenPrint, onOpenBarcode, theme = 'dark' }) {
  if (!isOpen || !medicine) return null;

  const isLight = theme === 'light';

  // Format currency helper
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const isObatLuar = (medicine.label_type || '').toLowerCase() === 'luar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-vip-navy-border text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-start justify-between shrink-0 ${
          isLight ? 'bg-vip-navy-light border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isLight ? 'bg-white text-vip-navy border-vip-navy-border' : 'bg-token-card text-token-emerald border-token-border'
            }`}>
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <ClassificationBadge classification={medicine.drug_classification} size="sm" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isObatLuar
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                }`}>
                  {isObatLuar ? 'Etiket Biru (Obat Luar)' : 'Etiket Putih (Obat Dalam)'}
                </span>
                {medicine.requires_prescription && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    Wajib Resep Dokter
                  </span>
                )}
                {medicine.is_active ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                    Nonaktif
                  </span>
                )}
              </div>
              <h3 className={`text-base sm:text-lg font-bold mt-1 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {medicine.name}
              </h3>
              {medicine.generic_name && (
                <p className="text-xs text-slate-400 italic">
                  Zat Aktif: {medicine.generic_name}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Key Specifications Grid */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-vip-navy-border/60' : 'bg-token-inner border-token-border'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Item</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{medicine.item_code}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Barcode Utama</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{medicine.barcode || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bentuk Sediaan</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{medicine.dosage_form || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kategori Terapi</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{medicine.category?.name || '-'}</span>
            </div>
          </div>

          {/* Standar Etiket & Aturan Pakai Pasien */}
          <div className={`p-3.5 rounded-xl border space-y-2.5 ${
            isObatLuar
              ? 'bg-blue-500/5 border-blue-500/30'
              : isLight ? 'bg-white border-slate-200' : 'bg-token-card/60 border-token-border'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-token-emerald" /> Standar Etiket & Aturan Pakai Pasien
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isObatLuar ? 'bg-blue-500 text-white' : 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
              }`}>
                {isObatLuar ? 'Obat Luar (Biru)' : 'Obat Dalam (Putih)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Aturan Pakai Standar (Signa):</span>
                <span className="font-bold text-slate-900 dark:text-token-emerald text-sm">
                  {medicine.default_signa || '3 x Sehari 1 Tablet'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Waktu Minum / Konsumsi:</span>
                <span className="font-semibold text-amber-500">
                  {medicine.consumption_time || 'Sesudah Makan'}
                </span>
              </div>
            </div>

            {/* Matriks Jadwal */}
            <div className={`p-2 rounded-lg border text-[11px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Jadwal Minum Harian (Etiket Group):
              </span>
              <div className="flex items-center gap-4">
                <span>☀️ Pagi: <strong>{medicine.dose_morning || '1'}</strong></span>
                <span>🌤️ Siang: <strong>{medicine.dose_noon || '1'}</strong></span>
                <span>🌙 Malam: <strong>{medicine.dose_night || '1'}</strong></span>
              </div>
            </div>

            {medicine.warning_tags && (
              <div className="text-[10px] font-bold text-red-500 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                Peringatan: {medicine.warning_tags}
              </div>
            )}

            {medicine.special_instructions && (
              <p className="text-[11px] text-slate-400 italic">
                * Petunjuk khusus: {medicine.special_instructions}
              </p>
            )}
          </div>

          {/* Regulatory & Distributor Information */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card/60 border-token-border'
          }`}>
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-token-emerald" /> Regulasi & Produsen Farmasi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">No. NIE BPOM Resmi:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{medicine.nie || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Industri Farmasi / Pabrik:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.manufacturer || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Distributor PBF Utama:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.default_supplier?.name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Storage & Inventory Limits */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card/60 border-token-border'
          }`}>
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-vip-orange" /> Tata Letak Rak & Batas Stok
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Lokasi Rak:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{medicine.storage_location || 'Gudang Utama'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Batas Minimum (Min Stock):</span>
                <span className="font-mono font-bold text-amber-500">{medicine.min_stock} {medicine.base_unit?.symbol || 'Satuan'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Batas Maksimum (Max Stock):</span>
                <span className="font-mono font-bold text-slate-400">{medicine.max_stock} {medicine.base_unit?.symbol || 'Satuan'}</span>
              </div>
            </div>
          </div>

          {/* Multi-Tier Units & Packaging Conversions */}
          <div className={`p-3.5 rounded-xl border space-y-2.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card/60 border-token-border'
          }`}>
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Konversi Kemasan Satuan Bertingkat
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold text-slate-400 ${
                    isLight ? 'border-slate-200' : 'border-slate-700'
                  }`}>
                    <th className="pb-1.5">Kemasan</th>
                    <th className="pb-1.5">Faktor Pengali Satuan Dasar</th>
                    <th className="pb-1.5">Barcode Kemasan</th>
                    <th className="pb-1.5 text-center">Tingkatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/50">
                  {medicine.units && medicine.units.length > 0 ? (
                    medicine.units.map((u) => (
                      <tr key={u.id} className="py-1">
                        <td className="py-1.5 font-bold text-slate-800 dark:text-slate-200">
                          {u.unit?.name || u.unit_id} ({u.unit?.symbol || '-'})
                        </td>
                        <td className="py-1.5 font-mono text-slate-600 dark:text-slate-300">
                          = {u.conversion_factor} {medicine.base_unit?.name || 'Terkecil'}
                        </td>
                        <td className="py-1.5 font-mono text-slate-400">
                          {u.barcode || '-'}
                        </td>
                        <td className="py-1.5 text-center">
                          {u.is_base_unit ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-token-emerald/15 text-token-emerald border border-token-emerald/30">
                              Satuan Dasar
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Tingkat {u.conversion_factor}x
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-2 text-slate-400 text-center italic">
                        Belum ada konfigurasi kemasan bertingkat. Satuan dasar: {medicine.base_unit?.name}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Tier Selling Prices */}
          <div className={`p-3.5 rounded-xl border space-y-2.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-token-card/60 border-token-border'
          }`}>
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Struktur Harga Jual Berjenjang
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold text-slate-400 ${
                    isLight ? 'border-slate-200' : 'border-slate-700'
                  }`}>
                    <th className="pb-1.5">Kemasan Satuan</th>
                    <th className="pb-1.5">Kelompok Penjualan (Tier)</th>
                    <th className="pb-1.5 text-right">Tarif Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/50">
                  {medicine.prices && medicine.prices.length > 0 ? (
                    medicine.prices.map((p) => (
                      <tr key={p.id}>
                        <td className="py-1.5 font-bold text-slate-800 dark:text-slate-200">
                          {p.unit?.name || p.unit_id}
                        </td>
                        <td className="py-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            p.price_type === 'resep'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : p.price_type === 'member'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {p.price_type === 'umum' ? 'Penjualan Umum (OTC)' : p.price_type === 'resep' ? 'Resep Dokter' : 'Member / Grosir'}
                          </span>
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-900 dark:text-token-emerald">
                          {formatRupiah(p.price)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-2 text-slate-400 text-center italic">
                        Belum ada konfigurasi tarif harga jual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3.5 px-5 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-vip-navy-border' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenBarcode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBarcode(medicine);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-token-card hover:bg-slate-700 text-token-emerald border-token-border'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Cetak Label Barcode / QR</span>
              </button>
            )}

            {onOpenPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrint(medicine);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-vip-navy border-vip-navy-border'
                    : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Simulasi Print Etiket</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
            }`}
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
}
