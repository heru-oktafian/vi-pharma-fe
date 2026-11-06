import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle, FileText, Landmark, ShieldCheck } from 'lucide-react';
import { createBranch, updateBranch } from '../../services/settingsApi';

export default function BranchModal({ isOpen, onClose, branchToEdit, token, onSaved, theme = 'dark' }) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isEditing = Boolean(branchToEdit);

  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    address: '',
    phone: '',
    email: '',
    sia_id: '',
    sia_name: '',
    sipa: '',
    sipa_name: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    tax_percentage: 0,
    journal_method: 'perpetual',
    branch_status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (branchToEdit) {
      setFormData({
        branch_code: branchToEdit.branch_code || '',
        branch_name: branchToEdit.branch_name || '',
        address: branchToEdit.address || '',
        phone: branchToEdit.phone || '',
        email: branchToEdit.email || '',
        sia_id: branchToEdit.sia_id || '',
        sia_name: branchToEdit.sia_name || '',
        sipa: branchToEdit.sipa || '',
        sipa_name: branchToEdit.sipa_name || '',
        bank_name: branchToEdit.bank_name || '',
        account_name: branchToEdit.account_name || '',
        account_number: branchToEdit.account_number || '',
        tax_percentage: branchToEdit.tax_percentage || 0,
        journal_method: branchToEdit.journal_method || 'perpetual',
        branch_status: branchToEdit.branch_status || 'active',
      });
    } else {
      setFormData({
        branch_code: '',
        branch_name: '',
        address: '',
        phone: '',
        email: '',
        sia_id: '',
        sia_name: '',
        sipa: '',
        sipa_name: '',
        bank_name: '',
        account_name: '',
        account_number: '',
        tax_percentage: 0,
        journal_method: 'perpetual',
        branch_status: 'active',
      });
    }
    setErrorMsg('');
  }, [branchToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.branch_name.trim()) {
      setErrorMsg('Nama cabang apotek wajib diisi');
      return;
    }

    if (!isEditing && !formData.branch_code.trim()) {
      setErrorMsg('Kode cabang wajib diisi (misal: CBG-JKT-01)');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateBranch(token, branchToEdit.id, {
          branch_name: formData.branch_name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          sia_id: formData.sia_id,
          sia_name: formData.sia_name,
          sipa: formData.sipa,
          sipa_name: formData.sipa_name,
          bank_name: formData.bank_name,
          account_name: formData.account_name,
          account_number: formData.account_number,
          tax_percentage: Number(formData.tax_percentage) || 0,
          journal_method: formData.journal_method,
          branch_status: formData.branch_status,
        });
      } else {
        await createBranch(token, {
          branch_code: formData.branch_code.toUpperCase().trim(),
          branch_name: formData.branch_name.trim(),
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          sia_id: formData.sia_id,
          sia_name: formData.sia_name,
          sipa: formData.sipa,
          sipa_name: formData.sipa_name,
          bank_name: formData.bank_name,
          account_name: formData.account_name,
          account_number: formData.account_number,
          tax_percentage: Number(formData.tax_percentage) || 0,
          journal_method: formData.journal_method,
          branch_status: formData.branch_status,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save branch:', err);
      setErrorMsg(err.message || 'Gagal menyimpan data cabang apotek');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isEditing ? 'Perbarui Profil Cabang Apotek' : 'Tambah Cabang Apotek Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEditing ? `ID: ${branchToEdit.id} (${branchToEdit.branch_code})` : 'Pendaftaran outlet/cabang baru ke jaringan apotek Vi-Pharma'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas Cabang */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>1. Identitas & Lokasi Cabang</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  Kode Cabang <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  placeholder="Misal: CBG000000000002"
                  value={formData.branch_code}
                  onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    isEditing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  Nama Cabang Apotek <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Apotek Vi-Pharma Cabang Tebet"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Alamat Lengkap Outlet</label>
              <textarea
                rows={2}
                placeholder="Jl. Tebet Raya No. 45, Jakarta Selatan"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="021-8881234 / 08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Cabang</label>
                <input
                  type="email"
                  placeholder="apotek.tebet@vi-pharma.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Legalitas Farmasi (SIA & SIPA APJ) */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>2. Legalitas Farmasi (Permenkes 73/2016 & SIA/SIPA)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nomor SIA (Surat Izin Apotek)</label>
                <input
                  type="text"
                  placeholder="SIA-198402/DKS/2024"
                  value={formData.sia_id}
                  onChange={(e) => setFormData({ ...formData, sia_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nama Izin Apotek (SIA Name)</label>
                <input
                  type="text"
                  placeholder="Apotek Vi-Pharma Farma"
                  value={formData.sia_name}
                  onChange={(e) => setFormData({ ...formData, sia_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">No. SIPA Apoteker (APJ)</label>
                <input
                  type="text"
                  placeholder="SIPA-199203/STRA/2024"
                  value={formData.sipa}
                  onChange={(e) => setFormData({ ...formData, sipa: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nama Apoteker Penanggung Jawab (APJ)</label>
                <input
                  type="text"
                  placeholder="apt. Heru Oktafian, S.Farm."
                  value={formData.sipa_name}
                  onChange={(e) => setFormData({ ...formData, sipa_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Rekening Kasir & Perpajakan */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Landmark className="w-4 h-4 text-cyan-400" />
              <span>3. Rekening Kasir & Konfigurasi Finansial</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nama Bank</label>
                <input
                  type="text"
                  placeholder="BCA / Mandiri / BRI"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nomor Rekening</label>
                <input
                  type="text"
                  placeholder="8820192812"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Atas Nama Rekening</label>
                <input
                  type="text"
                  placeholder="PT Vi-Pharma Medika"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Tarif PPN Penjualan (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Metode Jurnal</label>
                <select
                  value={formData.journal_method}
                  onChange={(e) => setFormData({ ...formData, journal_method: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="perpetual">Perpetual (Otomatis real-time saat transaksi)</option>
                  <option value="periodic">Periodik (Fisik akhir periode)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Status Operasional Cabang</label>
                <select
                  value={formData.branch_status}
                  onChange={(e) => setFormData({ ...formData, branch_status: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="active">Active (Buka & Aktif Melayani)</option>
                  <option value="inactive">Inactive (Tutup Sementara)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan Cabang' : 'Daftarkan Cabang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
