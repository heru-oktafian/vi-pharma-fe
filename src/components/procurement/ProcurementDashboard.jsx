import React, { useState } from 'react';
import { ArrowLeft, FileText, ShieldAlert, AlertTriangle, Building2, Plus, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import PurchaseOrdersListView from './PurchaseOrdersListView';
import AutoReorderView from './AutoReorderView';
import PurchaseOrderFormModal from './PurchaseOrderFormModal';
import PurchaseOrderDetailModal from './PurchaseOrderDetailModal';
import PrintableSPModal from './PrintableSPModal';
import PurchaseReturnsListView from './PurchaseReturnsListView';
import PurchaseReturnFormModal from './PurchaseReturnFormModal';
import PurchaseReturnDetailModal from './PurchaseReturnDetailModal';
import PrintableReturnModal from './PrintableReturnModal';

export default function ProcurementDashboard({ user, branch, token, theme = 'dark', onBack }) {
  const [activeTab, setActiveTab] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const isLight = theme === 'light';

  // Modals for Purchase Orders
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPO, setPrintPO] = useState(null);

  // Modals for Purchase Returns
  const [returnFormModalOpen, setReturnFormModalOpen] = useState(false);
  const [editReturn, setEditReturn] = useState(null);
  const [returnDetailModalOpen, setReturnDetailModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [printReturnModalOpen, setPrintReturnModalOpen] = useState(false);
  const [printReturn, setPrintReturn] = useState(null);

  // Fast SP creation from ROP recommendations
  const [fastItems, setFastItems] = useState(null);

  const tabs = [
    { id: 'all', label: 'Semua Surat Pesanan (SP)', icon: FileText, desc: 'Daftar PO reguler & seluruh distributor PBF' },
    { id: 'special', label: 'SP Khusus (Narkotika & Prekursor)', icon: ShieldAlert, desc: 'Surat Pesanan dengan regulasi khusus BPOM & SIPA' },
    { id: 'reorder', label: 'Rekomendasi ROP (Stok Menipis)', icon: AlertTriangle, desc: 'Kalkulasi otomatis obat di bawah batas minimum' },
    { id: 'returns', label: 'Retur Pembelian (PBF)', icon: RotateCcw, desc: 'Pengembalian obat rusak/ED ke distributor & nota retur resmi' },
  ];

  const handleOpenCreate = () => {
    setEditPO(null);
    setFastItems(null);
    setFormModalOpen(true);
  };

  const handleFastCreateSP = (selectedMeds) => {
    // Construct pre-filled draft
    setEditPO({
      items: selectedMeds.map(m => {
        const deficit = Math.max(1, (m.min_stock || 0) - (m.total_stock || 0));
        return {
          medicine_id: m.medicine_id,
          unit_id: m.base_unit_name || 'Pcs',
          qty_ordered: deficit,
          estimated_price: 0,
          notes: 'Rekomendasi ROP Batas Min-Stock',
        };
      })
    });
    setFormModalOpen(true);
  };

  const handleOpenDetail = (po) => {
    setSelectedPO(po);
    setDetailModalOpen(true);
  };

  const handleOpenPrint = (po) => {
    setPrintPO(po);
    setPrintModalOpen(true);
  };

  const handleOpenEdit = (po) => {
    setEditPO(po);
    setFormModalOpen(true);
  };

  const handleRefreshList = () => {
    setActiveTab('all');
    setRefreshKey((k) => k + 1);
  };

  // Return Handlers
  const handleOpenCreateReturn = () => {
    setEditReturn(null);
    setReturnFormModalOpen(true);
  };

  const handleOpenDetailReturn = (ret) => {
    setSelectedReturn(ret);
    setReturnDetailModalOpen(true);
  };

  const handleOpenPrintReturn = (ret) => {
    setPrintReturn(ret);
    setPrintReturnModalOpen(true);
  };

  const handleOpenEditReturn = (ret) => {
    setEditReturn(ret);
    setReturnFormModalOpen(true);
  };

  const handleRefreshReturns = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* Top Header & Breadcrumb Nav */}
      <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors ${
        isLight
          ? 'bg-white border-vip-navy-border shadow-xs'
          : 'bg-token-card border-token-border shadow-md'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg border transition flex items-center gap-1.5 text-xs font-bold ${
              isLight
                ? 'bg-vip-navy-light hover:bg-vip-navy text-vip-navy hover:text-white border-vip-navy-border'
                : 'bg-token-inner hover:bg-slate-700 text-slate-300 hover:text-white border-token-border hover:border-token-emerald'
            }`}
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-sm sm:text-base font-bold leading-tight flex items-center gap-2 ${
                isLight ? 'text-vip-navy' : 'text-white'
              }`}>
                <FileText className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                <span>Pengadaan & Surat Pesanan (PO / SP)</span>
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-500/15 text-purple-400 border-purple-500/25'
              }`}>
                {branch?.branch_code || 'PUSAT'}
              </span>
            </div>
            <p className={`text-[11px] leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Surat Pesanan Resmi PBF (Reguler, Prekursor, Narkotika, Psikotropika, OOT) & Rekomendasi ROP
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? isLight
                      ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                      : 'bg-token-card text-purple-400 shadow-xs border border-purple-500/40'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'all' && (
          <PurchaseOrdersListView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
            spTypeFilter="ALL"
            refreshKey={refreshKey}
            onOpenCreate={handleOpenCreate}
            onOpenDetail={handleOpenDetail}
            onOpenPrint={handleOpenPrint}
          />
        )}

        {activeTab === 'special' && (
          <PurchaseOrdersListView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
            spTypeFilter="NARKOTIKA" // Defaults to showing regulated types
            refreshKey={refreshKey}
            onOpenCreate={handleOpenCreate}
            onOpenDetail={handleOpenDetail}
            onOpenPrint={handleOpenPrint}
          />
        )}

        {activeTab === 'reorder' && (
          <AutoReorderView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
            onFastCreateSP={handleFastCreateSP}
          />
        )}

        {activeTab === 'returns' && (
          <PurchaseReturnsListView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
            refreshKey={refreshKey}
            onOpenCreate={handleOpenCreateReturn}
            onOpenDetail={handleOpenDetailReturn}
            onOpenPrint={handleOpenPrintReturn}
          />
        )}
      </div>

      {/* Create / Edit Form Modal */}
      <PurchaseOrderFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        theme={theme}
        branch={branch}
        token={token}
        editPO={editPO}
        onSuccess={handleRefreshList}
      />

      {/* Detail Modal */}
      <PurchaseOrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        po={selectedPO}
        branch={branch}
        token={token}
        theme={theme}
        onPrint={handleOpenPrint}
        onEdit={handleOpenEdit}
        onRefresh={handleRefreshList}
      />

      {/* Official Printable SP Modal */}
      <PrintableSPModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        po={printPO}
        branch={branch}
        theme={theme}
      />

      {/* Purchase Return Form Modal */}
      <PurchaseReturnFormModal
        isOpen={returnFormModalOpen}
        onClose={() => setReturnFormModalOpen(false)}
        theme={theme}
        branch={branch}
        token={token}
        editReturn={editReturn}
        onSuccess={handleRefreshReturns}
      />

      {/* Purchase Return Detail Modal */}
      <PurchaseReturnDetailModal
        isOpen={returnDetailModalOpen}
        onClose={() => setReturnDetailModalOpen(false)}
        ret={selectedReturn}
        branch={branch}
        token={token}
        theme={theme}
        onPrint={handleOpenPrintReturn}
        onEdit={handleOpenEditReturn}
        onRefresh={handleRefreshReturns}
      />

      {/* Printable Return Slip Modal */}
      <PrintableReturnModal
        isOpen={printReturnModalOpen}
        onClose={() => setPrintReturnModalOpen(false)}
        ret={printReturn}
        branch={branch}
        theme={theme}
      />
    </div>
  );
}
