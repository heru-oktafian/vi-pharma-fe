import React from 'react';

export const CLASSIFICATIONS = [
  { value: 'bebas', label: 'Obat Bebas', code: 'OB', color: 'bg-emerald-500 text-white border-emerald-600', ringColor: 'border-emerald-600 bg-emerald-500' },
  { value: 'bebas_terbatas', label: 'Bebas Terbatas', code: 'BT', color: 'bg-blue-600 text-white border-blue-700', ringColor: 'border-blue-700 bg-blue-600' },
  { value: 'keras', label: 'Obat Keras (K)', code: 'K', color: 'bg-red-600 text-white border-red-700', ringColor: 'border-red-700 bg-red-600' },
  { value: 'narkotika', label: 'Narkotika (Gol I/II/III)', code: 'N', color: 'bg-red-800 text-white border-red-900', ringColor: 'border-red-800 bg-white text-red-700' },
  { value: 'psikotropika', label: 'Psikotropika', code: 'PSI', color: 'bg-purple-600 text-white border-purple-700', ringColor: 'border-purple-700 bg-purple-600' },
  { value: 'prekursor', label: 'Prekursor Farmasi', code: 'PRK', color: 'bg-indigo-600 text-white border-indigo-700', ringColor: 'border-indigo-700 bg-indigo-600' },
  { value: 'oot', label: 'Obat Tertentu (OOT)', code: 'OOT', color: 'bg-amber-600 text-white border-amber-700', ringColor: 'border-amber-700 bg-amber-600' },
  { value: 'alkes', label: 'Alkes & BMHP', code: 'ALK', color: 'bg-teal-600 text-white border-teal-700', ringColor: 'border-teal-700 bg-teal-600' },
  { value: 'herbal', label: 'Herbal / Jamu', code: 'HRB', color: 'bg-lime-600 text-white border-lime-700', ringColor: 'border-lime-700 bg-lime-600' },
  { value: 'suplemen', label: 'Suplemen Kesehatan', code: 'SUP', color: 'bg-amber-500 text-white border-amber-600', ringColor: 'border-amber-600 bg-amber-500' },
  { value: 'lainnya', label: 'Lainnya', code: 'ETC', color: 'bg-slate-600 text-white border-slate-700', ringColor: 'border-slate-700 bg-slate-600' },
];

export default function ClassificationBadge({ classification, size = 'sm', showLabel = true }) {
  const norm = (classification || '').toLowerCase();
  const info = CLASSIFICATIONS.find((c) => c.value === norm) || {
    value: norm,
    label: norm || 'Lainnya',
    code: norm.substring(0, 3).toUpperCase(),
    color: 'bg-slate-500 text-white border-slate-600',
    ringColor: 'border-slate-600 bg-slate-500'
  };

  const isSmall = size === 'xs' || size === 'sm';

  // Rendering Indonesian BPOM Regulatory Emblem
  const renderEmblem = () => {
    switch (norm) {
      case 'bebas':
        // Lingkaran Hijau dengan border hitam pekat
        return (
          <span
            className="inline-block w-4 h-4 rounded-full bg-[#00A859] border-[1.5px] border-slate-900 shadow-xs shrink-0"
            title="Obat Bebas (Logo Lingkaran Hijau Garis Tepi Hitam)"
          />
        );
      case 'bebas_terbatas':
        // Lingkaran Biru dengan border hitam pekat
        return (
          <span
            className="inline-block w-4 h-4 rounded-full bg-[#0072CE] border-[1.5px] border-slate-900 shadow-xs shrink-0"
            title="Obat Bebas Terbatas (Logo Lingkaran Biru Garis Tepi Hitam)"
          />
        );
      case 'keras':
        // Lingkaran Merah dengan huruf K warna hitam di tengah
        return (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#E31B23] border-[1.5px] border-slate-900 shadow-xs shrink-0 font-black text-[9px] text-black leading-none"
            title="Obat Keras (Logo Lingkaran Merah Huruf K Garis Tepi Hitam)"
          >
            K
          </span>
        );
      case 'narkotika':
        // Lingkaran Putih dengan Palang Merah (Palang Medis)
        return (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white border-[1.5px] border-[#E31B23] shadow-xs shrink-0 text-[#E31B23] font-bold text-[11px] leading-none select-none"
            title="Narkotika (Logo Palang Merah)"
          >
            +
          </span>
        );
      default:
        return (
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${info.ringColor.split(' ')[1] || 'bg-slate-500'} shrink-0`} />
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
        info.color
      } ${isSmall ? 'text-[10px] py-0.5 px-1.5' : 'text-xs'}`}
    >
      {renderEmblem()}
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}
