import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Tag } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/masterDataApi';

export default function CategoriesView({ token, userRole, theme = 'dark' }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const isLight = theme === 'light';
  const canEdit = ['superadmin', 'admin', 'pharmacist'].includes(userRole);
  const canDelete = ['superadmin', 'admin'].includes(userRole);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getCategories(token);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal memuat kategori terapi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', is_active: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      is_active: item.is_active
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setAlert({ type: 'error', text: 'Nama kategori terapi wajib diisi.' });
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await updateCategory(editingItem.id, formData, token);
        setAlert({ type: 'success', text: `Kategori "${formData.name}" berhasil diperbarui.` });
      } else {
        await createCategory(formData, token);
        setAlert({ type: 'success', text: `Kategori "${formData.name}" berhasil ditambahkan.` });
      }
      setModalOpen(false);
      fetchList();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal menyimpan kategori.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus kategori "${item.name}"? Produk yang terkait akan terpengaruh.`)) {
      return;
    }
    try {
      await deleteCategory(item.id, token);
      setAlert({ type: 'success', text: `Kategori "${item.name}" berhasil dihapus.` });
      fetchList();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal menghapus kategori.' });
    } finally {
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* Alert Notice */}
      {alert && (
        <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between shrink-0 transition ${
          alert.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-500'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="underline text-[10px] font-bold">Tutup</button>
        </div>
      )}

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kategori terapi atau indikasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
              isLight
                ? 'bg-white border-vip-navy-border text-slate-800 placeholder-slate-400 focus:border-vip-navy'
                : 'bg-token-inner border-token-border text-slate-100 placeholder-slate-500 focus:border-token-emerald'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchList}
            disabled={loading}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isLight
                ? 'bg-white border-vip-navy-border text-slate-600 hover:text-vip-navy'
                : 'bg-token-card border-token-border text-slate-300 hover:text-white'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                isLight
                  ? 'bg-vip-navy hover:bg-vip-navy-dark text-white'
                  : 'bg-token-emerald hover:bg-token-emerald-dark text-slate-950 font-bold'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className={`flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col shadow-xs ${
        isLight ? 'bg-white border-vip-navy-border' : 'bg-token-card border-token-border'
      }`}>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 text-[11px] uppercase tracking-wider font-bold border-b ${
              isLight ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border' : 'bg-token-inner text-slate-300 border-token-border'
            }`}>
              <tr>
                <th className="py-2.5 px-3.5">ID & Kategori</th>
                <th className="py-2.5 px-3.5">Deskripsi / Indikasi Klinis</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-token-emerald" />
                    Memuat kategori farmasi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada kategori ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                  }`}>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <Tag className={`w-3.5 h-3.5 ${isLight ? 'text-vip-navy' : 'text-token-emerald'}`} />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400">
                      {item.description || '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-token-emerald bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-slate-400 hover:text-vip-navy dark:hover:text-token-emerald hover:bg-slate-500/10 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-all ${
            isLight ? 'bg-white border-vip-navy-border text-slate-900' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <h3 className={`text-sm sm:text-base font-bold mb-3 ${isLight ? 'text-vip-navy' : 'text-white'}`}>
              {editingItem ? 'Edit Kategori Terapi' : 'Tambah Kategori Terapi Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Nama Kategori / Golongan Terapi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Antibiotik, Analgesik, Antihipertensi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Deskripsi / Indikasi Farmakologi
                </label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan khasiat dan indikasi kelompok obat ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-400 text-token-emerald focus:ring-0 w-4 h-4"
                />
                <label htmlFor="cat_active" className="text-xs font-medium cursor-pointer">
                  Kategori Aktif & Tersedia untuk Produk
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-token-inner text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                    isLight
                      ? 'bg-vip-navy hover:bg-vip-navy-dark text-white'
                      : 'bg-token-emerald hover:bg-token-emerald-dark text-slate-950'
                  }`}
                >
                  {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
