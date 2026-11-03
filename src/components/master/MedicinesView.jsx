import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit2, Trash2, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Filter, Layers, DollarSign, Tag, Pill,
  AlertTriangle, Printer, FileText
} from 'lucide-react';
import ClassificationBadge, { CLASSIFICATIONS } from './ClassificationBadge';
import MedicineDetailModal from './MedicineDetailModal';
import MedicineFormModal from './MedicineFormModal';
import EtiketPrintPreviewModal from './EtiketPrintPreviewModal';
import { getMedicines, getMedicineById, deleteMedicine, getUnits, getCategories, getSuppliers } from '../../services/masterDataApi';

export default function MedicinesView({ token, userRole, theme = 'dark', branch }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  // Master lookups for form
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // Print Etiket Simulation Modal
  const [etiketModalOpen, setEtiketModalOpen] = useState(false);
  const [etiketPrintTarget, setEtiketPrintTarget] = useState(null);
  const [etiketPrintMode, setEtiketPrintMode] = useState('single');

  // Notifications
  const [alert, setAlert] = useState(null);

  const isLight = theme === 'light';
  const canEdit = ['superadmin', 'admin', 'pharmacist'].includes(userRole);
  const canDelete = ['superadmin', 'admin'].includes(userRole);

  // Load lookups
  useEffect(() => {
    if (!token) return;
    Promise.all([
      getUnits(token).catch(() => []),
      getCategories(token).catch(() => []),
      getSuppliers(token).catch(() => []),
    ]).then(([u, c, s]) => {
      setUnits(Array.isArray(u) ? u : []);
      setCategories(Array.isArray(c) ? c : []);
      setSuppliers(Array.isArray(s) ? s : []);
    });
  }, [token]);

  // Fetch medicines list
  const fetchMedicinesList = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        classification: classificationFilter || undefined,
        category_id: categoryFilter || undefined,
      };
      const res = await getMedicines(params, token);
      if (res && Array.isArray(res.items)) {
        setMedicines(res.items);
        setTotalCount(res.total || res.items.length);
      } else if (Array.isArray(res)) {
        setMedicines(res);
        setTotalCount(res.length);
      } else {
        setMedicines([]);
        setTotalCount(0);
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal memuat katalog obat' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicinesList();
  }, [token, page, classificationFilter, categoryFilter]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMedicinesList();
  };

  // Open Detail
  const handleOpenDetail = async (item) => {
    try {
      const full = await getMedicineById(item.id, token);
      setSelectedMedicine(full);
      setDetailModalOpen(true);
    } catch (err) {
      setSelectedMedicine(item);
      setDetailModalOpen(true);
    }
  };

  // Open Add
  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = async (item) => {
    try {
      const full = await getMedicineById(item.id, token);
      setEditingMedicine(full);
      setFormModalOpen(true);
    } catch (err) {
      setEditingMedicine(item);
      setFormModalOpen(true);
    }
  };

  // Open Print Simulation
  const handleOpenPrintSingle = (item) => {
    setEtiketPrintTarget(item);
    setEtiketPrintMode('single');
    setEtiketModalOpen(true);
  };

  const handleOpenPrintGroup = () => {
    setEtiketPrintTarget(medicines[0] || null);
    setEtiketPrintMode('group');
    setEtiketModalOpen(true);
  };

  // Delete
  const handleDelete = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus katalog "${item.name}"? Data transaksi yang terkait tidak akan bisa menggunakan obat ini.`)) {
      return;
    }
    try {
      await deleteMedicine(item.id, token);
      setAlert({ type: 'success', text: `Obat "${item.name}" berhasil dihapus.` });
      fetchMedicinesList();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Gagal menghapus obat.' });
    } finally {
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Format currency
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

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

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama obat, zat aktif, kode, barcode, atau No NIE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border outline-hidden transition ${
                isLight
                  ? 'bg-white border-vip-navy-border text-slate-800 placeholder-slate-400 focus:border-vip-navy'
                  : 'bg-token-inner border-token-border text-slate-100 placeholder-slate-500 focus:border-token-emerald'
              }`}
            />
          </div>

          <button
            type="submit"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
            }`}
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Classification Filter Dropdown */}
          <select
            value={classificationFilter}
            onChange={(e) => {
              setClassificationFilter(e.target.value);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium outline-hidden transition ${
              isLight
                ? 'bg-white border-vip-navy-border text-slate-700 focus:border-vip-navy'
                : 'bg-token-inner border-token-border text-slate-200 focus:border-token-emerald'
            }`}
          >
            <option value="">Semua Golongan BPOM</option>
            {CLASSIFICATIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium outline-hidden transition ${
              isLight
                ? 'bg-white border-vip-navy-border text-slate-700 focus:border-vip-navy'
                : 'bg-token-inner border-token-border text-slate-200 focus:border-token-emerald'
            }`}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Print Group Simulation Button */}
          <button
            onClick={handleOpenPrintGroup}
            disabled={medicines.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLight
                ? 'bg-white hover:bg-vip-navy-light text-vip-navy border-vip-navy-border'
                : 'bg-token-inner hover:bg-slate-700 text-slate-200 border-token-border hover:border-token-emerald'
            }`}
            title="Simulasi Print Etiket Group (Jadwal Terpadu)"
          >
            <Printer className="w-3.5 h-3.5 text-vip-orange" />
            <span className="hidden sm:inline">Print Etiket Group</span>
          </button>

          <button
            onClick={fetchMedicinesList}
            disabled={loading}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isLight
                ? 'bg-white border-vip-navy-border text-slate-600 hover:text-vip-navy'
                : 'bg-token-card border-token-border text-slate-300 hover:text-white'
            }`}
            title="Muat Ulang Katalog"
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
              <span>Tambah Obat Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className={`flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col shadow-xs ${
        isLight ? 'bg-white border-vip-navy-border' : 'bg-token-card border-token-border'
      }`}>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 text-[11px] uppercase tracking-wider font-bold border-b ${
              isLight ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border' : 'bg-token-inner text-slate-300 border-token-border'
            }`}>
              <tr>
                <th className="py-2.5 px-3.5">Obat & Aturan Pakai</th>
                <th className="py-2.5 px-3.5">Identifikasi (Kode/Barcode)</th>
                <th className="py-2.5 px-3.5">Sediaan & Kategori</th>
                <th className="py-2.5 px-3.5">Kemasan & Konversi</th>
                <th className="py-2.5 px-3.5 text-right">Tarif Harga Jual</th>
                <th className="py-2.5 px-3.5 text-center">Rak & Min</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-token-emerald" />
                    Memuat katalog master obat...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Tidak ada obat ditemukan dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                medicines.map((item) => {
                  const defaultPrice = item.prices?.find((p) => p.price_type === 'umum') || item.prices?.[0];
                  const isObatLuar = (item.label_type || '').toLowerCase() === 'luar';
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Name, Classification Badge & Etiket Indicator */}
                      <td className="py-2.5 px-3.5 max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className="pt-0.5">
                            <ClassificationBadge classification={item.drug_classification} size="xs" showLabel={false} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.requires_prescription && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Wajib Resep Dokter">
                                  Resep
                                </span>
                              )}
                            </div>
                            {item.generic_name && (
                              <span className="text-[10px] text-slate-400 italic block leading-tight">
                                {item.generic_name}
                              </span>
                            )}
                            {/* Etiket & Signa Badge */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                                isObatLuar
                                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                  : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                              }`}>
                                {isObatLuar ? 'Etiket Biru' : 'Etiket Putih'}
                              </span>
                              {item.default_signa && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  • {item.default_signa}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code & Barcode */}
                      <td className="py-2.5 px-3.5 font-mono">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{item.item_code}</div>
                        {item.barcode && (
                          <div className="text-[10px] text-slate-400">{item.barcode}</div>
                        )}
                        {item.nie && (
                          <div className="text-[9px] text-slate-500">BPOM: {item.nie}</div>
                        )}
                      </td>

                      {/* Dosage Form & Category */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.dosage_form || '-'}</div>
                        <span className="text-[10px] text-slate-400 block">{item.category?.name || '-'}</span>
                      </td>

                      {/* Units & Conversion Ladder */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            isLight ? 'bg-vip-navy-light text-vip-navy border-vip-navy-border' : 'bg-token-inner text-token-emerald border-token-border'
                          }`}>
                            1 {item.base_unit?.symbol || item.base_unit?.name || 'Unit'}
                          </span>
                          {item.units && item.units.filter((u) => !u.is_base_unit).map((u) => (
                            <span key={u.id} className="text-[10px] text-slate-400 font-mono">
                              / {u.unit?.name || u.unit_id} ({u.conversion_factor}x)
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                        {defaultPrice ? (
                          <div>
                            <span className={isLight ? 'text-vip-navy' : 'text-token-emerald'}>
                              {formatRupiah(defaultPrice.price)}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-normal">
                              /{defaultPrice.unit?.symbol || item.base_unit?.symbol || 'Satuan'} ({defaultPrice.price_type})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Rak & Min Stock */}
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          {item.storage_location || 'Rak A'}
                        </div>
                        <span className="text-[9px] text-amber-500 font-mono block">
                          Min: {item.min_stock}
                        </span>
                      </td>

                      {/* Status */}
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

                      {/* Action buttons */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print Etiket Action */}
                          <button
                            onClick={() => handleOpenPrintSingle(item)}
                            className={`p-1 rounded text-slate-400 hover:bg-slate-500/10 transition ${
                              isObatLuar ? 'hover:text-blue-400' : 'hover:text-emerald-400'
                            }`}
                            title="Simulasi Print Etiket Bawaan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-500/10 transition"
                            title="Lihat Detail & Aturan Pakai"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-vip-navy dark:hover:text-token-emerald hover:bg-slate-500/10 transition"
                              title="Edit Katalog"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                              title="Hapus Katalog"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className={`px-4 py-2 border-t flex items-center justify-between text-[11px] shrink-0 ${
          isLight ? 'bg-slate-50 border-vip-navy-border text-slate-500' : 'bg-token-inner border-token-border text-slate-400'
        }`}>
          <div>
            Menampilkan <strong>{medicines.length}</strong> item dari total <strong>{totalCount}</strong> katalog terdaftar
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Vi-Pharma Drug Formulary & Etiket Label</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <MedicineDetailModal
        medicine={selectedMedicine}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onOpenPrint={(med) => handleOpenPrintSingle(med)}
        theme={theme}
      />

      {/* Form Modal */}
      <MedicineFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={(name, action) => {
          setAlert({ type: 'success', text: `Obat "${name}" berhasil ${action}.` });
          fetchMedicinesList();
          setTimeout(() => setAlert(null), 4000);
        }}
        editingItem={editingMedicine}
        token={token}
        units={units}
        categories={categories}
        suppliers={suppliers}
        theme={theme}
      />

      {/* Print Etiket Simulation Modal */}
      <EtiketPrintPreviewModal
        isOpen={etiketModalOpen}
        onClose={() => setEtiketModalOpen(false)}
        medicine={etiketPrintTarget}
        medicinesList={medicines}
        branch={branch}
        theme={theme}
      />
    </div>
  );
}
