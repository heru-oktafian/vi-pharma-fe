import React, { useState } from 'react';
import { Building2, MapPin, Phone, CheckCircle, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { selectBranch } from '../services/api';

export default function BranchSelector({ user, branches, sessionId, onBranchSelected, onCancel }) {
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);

  const handleSelect = async (branchId) => {
    try {
      setSubmittingId(branchId);
      setError(null);
      const res = await selectBranch(sessionId, branchId);
      if (onBranchSelected) {
        onBranchSelected(res);
      }
    } catch (err) {
      setError(err.message || 'Gagal memilih cabang');
      setSubmittingId(null);
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-700/60 pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Otorisasi Berhasil
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pilih Cabang Apotek</h2>
          <p className="text-sm text-slate-400 mt-1">
            Selamat datang, <strong className="text-white">{user?.name}</strong>! Pilih lokasi cabang apotek tempat Anda bertugas saat ini.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Role Anda</span>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-slate-700 text-emerald-300 font-mono text-xs font-bold border border-slate-600">
            {user?.user_role}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches && branches.length > 0 ? (
          branches.map((b) => {
            const isSubmitting = submittingId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => !submittingId && handleSelect(b.id)}
                className={`group relative p-5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-emerald-500/70 hover:bg-slate-900/90 hover:shadow-lg'
                }`}
              >
                {b.is_default && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Cabang Utama
                  </span>
                )}

                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight group-hover:text-emerald-300 transition">
                      {b.branch_name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">{b.branch_code}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{b.address || 'Alamat belum diatur'}</span>
                  </div>
                  {b.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>{isSubmitting ? 'Mengaktifkan sesi...' : 'Buka Workstation'}</span>
                  <ArrowRight className={`w-4 h-4 transition-transform ${isSubmitting ? 'animate-pulse' : 'group-hover:translate-x-1'}`} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
            <p className="text-sm text-slate-400">User Anda belum ditautkan ke cabang mana pun.</p>
            <p className="text-xs text-slate-500 mt-1">Silakan hubungi Superadmin untuk penugasan cabang.</p>
          </div>
        )}
      </div>

      {/* Footer Cancel */}
      <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white transition"
        >
          ← Batalkan dan Kembali ke QR Login
        </button>
        <span className="text-xs text-slate-500">
          Sesi aktif dibatasi untuk cabang terpilih
        </span>
      </div>
    </div>
  );
}
