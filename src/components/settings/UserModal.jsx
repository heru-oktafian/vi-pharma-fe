import React, { useState, useEffect } from 'react';
import { X, User, Lock, Shield, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { createUser, updateUser } from '../../services/settingsApi';

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Superadmin (Akses Penuh Seluruh Sistem & Cabang)', color: 'text-rose-400' },
  { value: 'admin', label: 'Admin (Manajemen Operasional Cabang & Master Data)', color: 'text-amber-400' },
  { value: 'pharmacist', label: 'Apoteker (APJ / Pelayanan Resep, Skrining Klinis & SIPNAP)', color: 'text-purple-400' },
  { value: 'cashier', label: 'Kasir (Transaksi POS, Etiket, Struk & Retur Pasien)', color: 'text-orange-400' },
  { value: 'inventory', label: 'Logistik Gudang (Stok Opname, FEFO, & Faktur PBF)', color: 'text-blue-400' },
];

export default function UserModal({ isOpen, onClose, userToEdit, token, onSaved, theme = 'dark' }) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isEditing = Boolean(userToEdit);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    user_role: 'cashier',
    user_status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        name: userToEdit.name || '',
        password: '', // Leave blank unless resetting
        user_role: userToEdit.user_role || 'cashier',
        user_status: userToEdit.user_status || 'active',
      });
    } else {
      setFormData({
        username: '',
        name: '',
        password: '',
        user_role: 'cashier',
        user_status: 'active',
      });
    }
    setErrorMsg('');
  }, [userToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap staf wajib diisi');
      return;
    }

    if (!isEditing) {
      if (!formData.username.trim() || formData.username.length < 3) {
        setErrorMsg('Username minimal 3 karakter');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMsg('Password akun minimal 6 karakter');
        return;
      }
    } else {
      if (formData.password && formData.password.length < 6) {
        setErrorMsg('Password baru minimal 6 karakter jika ingin mengganti');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing) {
        const payload = {
          name: formData.name,
          user_role: formData.user_role,
          user_status: formData.user_status,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await updateUser(token, userToEdit.id, payload);
      } else {
        await createUser(token, {
          username: formData.username.trim(),
          password: formData.password.trim(),
          name: formData.name.trim(),
          user_role: formData.user_role,
          user_status: formData.user_status,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save user:', err);
      setErrorMsg(err.message || 'Gagal menyimpan data pengguna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isEditing ? 'Perbarui Data Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEditing ? `ID: ${userToEdit.id} (${userToEdit.username})` : 'Registrasi akun staf apotek untuk workstation & vi-token'}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">
              Nama Lengkap Staf <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: apt. Siti Rahmawati, S.Farm."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border text-xs ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Username Login <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                placeholder="misal: sitirahma"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  isEditing ? 'opacity-60 cursor-not-allowed' : ''
                } ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'}`}
              />
              {isEditing && (
                <span className="text-[10px] text-slate-500 block">Username tidak dapat diubah setelah dibuat</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>{isEditing ? 'Password Baru (Opsional)' : 'Password Akun *'}</span>
              </label>
              <input
                type="password"
                required={!isEditing}
                placeholder={isEditing ? 'Kosongkan jika tidak diganti' : 'Minimal 6 karakter'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Peran / Hak Akses (Role) <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.user_role}
                onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Status Akun</label>
              <select
                value={formData.user_status}
                onChange={(e) => setFormData({ ...formData, user_status: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="active">Aktif (Dapat Login & Transaksi)</option>
                <option value="inactive">Non-aktif (Akses Dibekukan)</option>
                <option value="suspended">Ditangguhkan (Suspended)</option>
              </select>
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
              <span>{loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
