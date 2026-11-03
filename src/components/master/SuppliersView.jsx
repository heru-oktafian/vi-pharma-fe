import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Building2, Phone, Mail, UserCheck } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/masterDataApi';

export default function SuppliersView({ token, userRole, theme = 'dark' }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    pic_name: '',
    pic_phone: '',
    npwp: '',
    payment_term_days: 30,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const isLight = theme === 'light';
  const canEdit = ['superadmin', 'admin', 'pharmacist'].includes(userRole);
  const canDelete = ['superadmin', 'admin'].includes(userRole);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers(token);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal memuat distributor PBF' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      pic_name: '',
      pic_phone: '',
      npwp: '',
      payment_term_days: 30,
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      pic_name: item.pic_name || '',
      pic_phone: item.pic_phone || '',
      npwp: item.npwp || '',
      payment_term_days: item.payment_term_days ?? 30,
      is_active: item.is_active
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setAlert({ type: 'error', text: 'Kode PBF dan Nama PBF wajib diisi.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        payment_term_days: Number(formData.payment_term_days) || 0
      };
      if (editingItem) {
        await updateSupplier(editingItem.id, payload, token);
        setAlert({ type: 'success', text: `Distributor "${formData.name}" berhasil diperbarui.` });
      } else {
        await createSupplier(payload, token);
        setAlert({ type: 'success', text: `Distributor "${formData.name}" berhasil ditambahkan.` });
      }
      setModalOpen(false);
      fetchList();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal menyimpan data PBF.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus distributor PBF "${item.name}"?`)) {
      return;
    }
    try {
      await deleteSupplier(item.id, token);
      setAlert({ type: 'success', text: `Distributor "${item.name}" berhasil dihapus.` });
      fetchList();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal menghapus distributor PBF.' });
    } finally {
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return s.code.toLowerCase().includes(q) ||
           s.name.toLowerCase().includes(q) ||
           (s.pic_name && s.pic_name.toLowerCase().includes(q)) ||
           (s.address && s.address.toLowerCase().includes(q));
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
            placeholder="Cari kode, nama PBF, atau nama PIC..."
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
              <span>Tambah Distributor PBF</span>
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
                <th className="py-2.5 px-3.5">Kode & PBF</th>
                <th className="py-2.5 px-3.5">Kontak & Alamat</th>
                <th className="py-2.5 px-3.5">Sales / PIC</th>
                <th className="py-2.5 px-3.5 text-center">Tempo (TOP)</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-token-emerald" />
                    Memuat data distributor PBF...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada distributor PBF ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                  }`}>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-start gap-2">
                        <Building2 className={`w-4 h-4 mt-0.5 shrink-0 ${isLight ? 'text-vip-navy' : 'text-token-emerald'}`} />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">{item.code}</span>
                            {item.npwp && (
                              <span className="text-[10px] text-slate-500 font-mono">NPWP: {item.npwp}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 max-w-xs">
                      <div className="truncate line-clamp-1">{item.address || '-'}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {item.phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{item.phone}</span>}
                        {item.email && <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{item.email}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      {item.pic_name ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            {item.pic_name}
                          </div>
                          {item.pic_phone && (
                            <span className="text-[10px] text-slate-400 block font-mono">{item.pic_phone}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                        isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {item.payment_term_days} Hari
                      </span>
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
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-vip-navy-border text-slate-900' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <h3 className={`text-sm sm:text-base font-bold mb-3 ${isLight ? 'text-vip-navy' : 'text-white'}`}>
              {editingItem ? 'Edit Distributor PBF' : 'Tambah Distributor PBF Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Kode PBF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PBF-KF"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono uppercase border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Tempo Pembayaran (Hari)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="30"
                    value={formData.payment_term_days}
                    onChange={(e) => setFormData({ ...formData, payment_term_days: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Nama Resmi PBF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PT Kimia Farma Trading & Distribution"
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
                  Alamat Gudang / Kantor PBF
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap distributor..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Telepon Kantor
                  </label>
                  <input
                    type="text"
                    placeholder="021-xxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="order@pbf.co.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    Nama PIC / Sales
                  </label>
                  <input
                    type="text"
                    placeholder="Nama kontak sales..."
                    value={formData.pic_name}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                    No. WhatsApp / HP PIC
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={formData.pic_phone}
                    onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                        : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                  Nomor NPWP Badan Usaha
                </label>
                <input
                  type="text"
                  placeholder="01.234.567.8-901.000"
                  value={formData.npwp}
                  onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border outline-hidden transition ${
                    isLight
                      ? 'bg-slate-50 border-vip-navy-border text-slate-900 focus:border-vip-navy'
                      : 'bg-token-inner border-token-border text-slate-100 focus:border-token-emerald'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="supplier_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-400 text-token-emerald focus:ring-0 w-4 h-4"
                />
                <label htmlFor="supplier_active" className="text-xs font-medium cursor-pointer">
                  Distributor Aktif untuk Surat Pesanan (SP)
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
                  {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui PBF' : 'Simpan PBF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
