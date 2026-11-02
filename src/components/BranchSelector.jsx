import React, { useState } from 'react';
import { Building2, MapPin, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { selectBranch } from '../services/api';

export default function BranchSelector({ user, branches, sessionId, onBranchSelected, onCancel, theme = 'dark' }) {
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);
  const isLight = theme === 'light';

  const handleSelect = async (branchId) => {
    try {
      setSubmittingId(branchId);
      setError(null);
      const res = await selectBranch(sessionId, branchId);
      if (onBranchSelected) onBranchSelected(res);
    } catch (err) {
      setError(err.message || 'Gagal memilih cabang');
      setSubmittingId(null);
    }
  };

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 max-w-xl w-full max-h-[82vh] flex flex-col transition-all duration-200 ${
      isLight
        ? 'bg-white border-vip-navy-border shadow-lg text-slate-800'
        : 'bg-slate-800/90 backdrop-blur-xl border-slate-700/60 shadow-2xl text-slate-100'
    }`}>
      {/* Header */}
      <div className={`flex items-start justify-between border-b pb-3 mb-3 shrink-0 ${
        isLight ? 'border-vip-navy-border' : 'border-slate-700/60'
      }`}>
        <div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-1 border ${
            isLight
              ? 'bg-vip-navy-light border-vip-navy-border text-vip-navy'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
          }`}>
            <Sparkles className="w-3 h-3 text-vip-orange" /> Otorisasi Berhasil
          </div>
          <h2 className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${isLight ? 'text-vip-navy' : 'text-white'}`}>
            Pilih Cabang Apotek
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Selamat datang, <strong className={isLight ? 'text-vip-navy' : 'text-white'}>{user?.name}</strong>! Pilih lokasi apotek tugas Anda.
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Role</span>
          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
            isLight
              ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border'
              : 'bg-slate-700 text-blue-300 border-slate-600'
          }`}>
            {user?.user_role}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium shrink-0">
          {error}
        </div>
      )}

      {/* Branch Cards Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {branches && branches.length > 0 ? (
          branches.map((b) => {
            const isSubmitting = submittingId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => !submittingId && handleSelect(b.id)}
                className={`group relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSubmitting
                    ? isLight
                      ? 'bg-vip-navy-light border-vip-navy ring-2 ring-vip-navy/20'
                      : 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                    : isLight
                      ? 'bg-white border-vip-navy-border hover:border-vip-orange hover:shadow-md'
                      : 'bg-slate-900/60 border-slate-700/80 hover:border-blue-500/70 hover:bg-slate-900/90 hover:shadow-md'
                }`}
              >
                {b.is_default && (
                  <span className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                    isLight
                      ? 'bg-vip-orange-light text-vip-orange border-vip-orange-border'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    Utama
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border group-hover:scale-105 transition shrink-0 ${
                      isLight
                        ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border group-hover:bg-vip-orange-light group-hover:text-vip-orange group-hover:border-vip-orange-border'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pr-10">
                      <h3 className={`font-bold text-sm leading-tight truncate transition ${
                        isLight ? 'text-slate-900 group-hover:text-vip-navy' : 'text-white group-hover:text-blue-300'
                      }`}>
                        {b.branch_name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">{b.branch_code}</span>
                    </div>
                  </div>

                  <div className={`space-y-1 text-[11px] pt-2 border-t ${
                    isLight ? 'text-slate-500 border-vip-navy-border/50' : 'text-slate-400 border-slate-800'
                  }`}>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">{b.address || 'Alamat belum diatur'}</span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{b.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold ${
                  isLight ? 'border-vip-navy-border/50 text-vip-navy group-hover:text-vip-orange' : 'border-slate-800/80 text-blue-300'
                }`}>
                  <span>{isSubmitting ? 'Mengaktifkan...' : 'Buka Workstation'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSubmitting ? 'animate-pulse' : 'group-hover:translate-x-1'}`} />
                </div>
              </div>
            );
          })
        ) : (
          <div className={`col-span-2 p-6 text-center rounded-xl border ${
            isLight ? 'bg-vip-navy-light border-vip-navy-border' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <p className="text-xs text-slate-400">User Anda belum ditautkan ke cabang mana pun.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Silakan hubungi Superadmin untuk penugasan cabang.</p>
          </div>
        )}
      </div>

      {/* Footer Cancel */}
      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between shrink-0 ${
        isLight ? 'border-vip-navy-border' : 'border-slate-700/60'
      }`}>
        <button
          onClick={onCancel}
          className={`text-xs transition ${isLight ? 'text-slate-500 hover:text-vip-navy' : 'text-slate-400 hover:text-white'}`}
        >
          ← Kembali ke Login QR
        </button>
        <span className="text-[10px] text-slate-400">
          Sesi aktif dibatasi untuk cabang terpilih
        </span>
      </div>
    </div>
  );
}
