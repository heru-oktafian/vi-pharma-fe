import React, { useState, useEffect, useCallback } from 'react';
import { X, Building2, CheckCircle2, AlertCircle, Plus, ShieldCheck, RefreshCw } from 'lucide-react';
import { listBranches, assignUserBranch, getUserBranches } from '../../services/settingsApi';

export default function AssignBranchModal({ isOpen, onClose, targetUser, token, theme = 'dark' }) {
  if (!isOpen || !targetUser) return null;

  const isLight = theme === 'light';

  const [branches, setBranches] = useState([]);
  const [userBranches, setUserBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [allBranchesRes, userBranchesRes] = await Promise.all([
        listBranches(token, 1, 100),
        getUserBranches(token, targetUser.id),
      ]);
      const branchList = allBranchesRes?.items || [];
      setBranches(branchList);
      setUserBranches(userBranchesRes || []);

      if (branchList.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchList[0].id);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      setErrorMsg(err.message || 'Gagal memuat data cabang');
    } finally {
      setLoading(false);
    }
  }, [token, targetUser.id, selectedBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedBranchId) {
      setErrorMsg('Pilih cabang apotek terlebih dahulu');
      return;
    }

    setIsAssigning(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await assignUserBranch(token, {
        user_id: targetUser.id,
        branch_id: selectedBranchId,
        is_default: isDefault,
      });
      setSuccessMsg('Penugasan cabang berhasil disimpan!');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to assign branch:', err);
      setErrorMsg(err.message || 'Gagal menugaskan pengguna ke cabang');
    } finally {
      setIsAssigning(false);
    }
  };

  const isSuperAdmin = targetUser.user_role === 'superadmin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Penugasan Cabang Pengguna</h3>
              <p className="text-[11px] text-slate-400">
                Staf: <b>{targetUser.name}</b> (@{targetUser.username}) • Role: <span className="uppercase font-mono">{targetUser.user_role}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSuperAdmin && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-slate-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Hak Akses Superadmin</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pengguna dengan role <b>superadmin</b> memiliki otorisasi bawaan (*global privilege*) untuk membuka dan berpindah ke <b>seluruh cabang apotek aktif</b> tanpa perlu penugasan per-cabang secara manual.
              </p>
            </div>
          )}

          {/* Form Assign New Branch */}
          <form onSubmit={handleAssign} className={`p-4 rounded-xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
          }`}>
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tugaskan ke Cabang Baru</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Pilih Cabang Apotek</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-800"
                  />
                  <span>Jadikan Cabang Default Staf</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isAssigning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <span>{isAssigning ? 'Menugaskan...' : 'Tugaskan Pengguna'}</span>
              </button>
            </div>
          </form>

          {/* List of currently assigned branches */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-300 text-xs">
              Daftar Cabang yang Dapat Diakses Staf ({userBranches.length})
            </h4>

            {loading ? (
              <div className="p-6 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                <span>Memeriksa penugasan cabang staf...</span>
              </div>
            ) : userBranches.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <span>Belum ada cabang yang ditugaskan khusus untuk staf ini.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {userBranches.map((ub) => (
                  <div
                    key={ub.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{ub.branch_name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({ub.branch_code})</span>
                        {ub.is_default && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ub.address || 'Alamat cabang'}</p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 uppercase">
                        {ub.branch_status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
