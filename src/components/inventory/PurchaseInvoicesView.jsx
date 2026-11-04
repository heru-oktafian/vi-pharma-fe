import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, FileText, Calendar, Building2, DollarSign, CheckCircle2, Clock, Eye, X } from 'lucide-react';
import { getPurchaseInvoices, getPurchaseInvoiceDetail } from '../../services/inventoryApi';
import PurchaseInvoiceModal from './PurchaseInvoiceModal';

export default function PurchaseInvoicesView({ token, userRole, theme = 'dark', branch }) {
  const isLight = theme === 'light';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await getPurchaseInvoices(token, 1, 50, branch?.id);
      setInvoices(res?.items || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load purchase invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [token, branch?.id]);

  const handleOpenDetail = async (invId) => {
    try {
      setLoadingDetail(true);
      setDetailModalOpen(true);
      const res = await getPurchaseInvoiceDetail(invId, token);
      setSelectedInvoice(res);
    } catch (err) {
      console.error('Failed to load invoice detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Action Bar */}
      <div className={`p-3 rounded-xl border shrink-0 flex items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Daftar Faktur Pembelian PBF Masuk ({invoices.length} faktur)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInvoices}
            className="p-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:text-white transition"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Input Faktur PBF Baru</span>
          </button>
        </div>
      </div>

      {/* Invoices Table Container */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-token-card border-token-border'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 border-b text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-slate-100/95 border-slate-200 text-slate-600' : 'bg-token-inner/95 border-token-border text-slate-400 backdrop-blur-xs'
            }`}>
              <tr>
                <th className="py-2.5 px-3">No. Faktur PBF</th>
                <th className="py-2.5 px-3">Distributor PBF</th>
                <th className="py-2.5 px-3">Tanggal Faktur</th>
                <th className="py-2.5 px-3">Jatuh Tempo</th>
                <th className="py-2.5 px-3 text-center">Metode Bayar</th>
                <th className="py-2.5 px-3 text-center">Status Bayar</th>
                <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                <th className="py-2.5 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-token-border">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Memuat daftar faktur pembelian...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                    <span>Belum ada faktur pembelian yang tercatat di cabang ini.</span>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.payment_status === 'PAID';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-500/5 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {inv.invoice_number}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {inv.supplier?.name || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {inv.invoice_date?.slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {inv.due_date ? inv.due_date.slice(0, 10) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 border border-slate-500/20">
                          {inv.payment_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isPaid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-token-emerald border border-token-emerald/30">
                            Lunas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Belum Lunas
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-100">
                        Rp {(inv.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenDetail(inv.id)}
                          className="p-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:text-white hover:bg-purple-500/20 transition"
                          title="Lihat Detail Item Faktur"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <PurchaseInvoiceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        theme={theme}
        branchId={branch?.id}
        token={token}
        onSuccess={loadInvoices}
      />

      {/* Invoice Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
          }`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                  Detail Faktur: {selectedInvoice?.invoice_number}
                </h3>
                <p className="text-xs text-slate-400">
                  Distributor: {selectedInvoice?.supplier?.name} • Tanggal: {selectedInvoice?.invoice_date?.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1 rounded-lg border hover:bg-slate-500/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                  <span>Memuat detail faktur...</span>
                </div>
              ) : selectedInvoice ? (
                <>
                  <div className="rounded-xl border border-slate-200 dark:border-token-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-500/10 text-[10px] text-slate-400 uppercase border-b border-token-border">
                        <tr>
                          <th className="py-2 px-3">Nama Obat</th>
                          <th className="py-2 px-3">Batch & ED</th>
                          <th className="py-2 px-3 text-right">Qty Beli</th>
                          <th className="py-2 px-3 text-right">Harga Satuan</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-3 text-center">Lokasi Masuk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-token-border/40">
                        {(selectedInvoice.items || []).map((it) => (
                          <tr key={it.id}>
                            <td className="py-2 px-3 font-semibold">
                              {it.medicine?.name || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              <span>Batch: {it.batch_number}</span>
                              <span className="block text-[10px] text-slate-500">ED: {it.expired_date?.slice(0, 10)}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {it.qty_purchased}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              Rp {(it.buy_price || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-token-emerald">
                              Rp {(it.subtotal || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                it.put_to_shelf_directly
                                  ? 'bg-emerald-500/15 text-token-emerald'
                                  : 'bg-amber-500/15 text-amber-400'
                              }`}>
                                {it.put_to_shelf_directly ? '🛒 Rak' : '📦 Gudang'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial breakdown */}
                  <div className="flex justify-end pt-2 text-xs">
                    <div className="w-64 flex flex-col gap-1 border-t border-token-border pt-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal:</span>
                        <span className="font-mono">Rp {(selectedInvoice.subtotal || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Diskon:</span>
                        <span className="font-mono">- Rp {(selectedInvoice.discount_amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>PPN:</span>
                        <span className="font-mono">+ Rp {(selectedInvoice.tax_amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-token-emerald pt-1 border-t border-token-border">
                        <span>Total Tagihan:</span>
                        <span className="font-mono font-extrabold">Rp {(selectedInvoice.total_amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
