import React, { useState } from 'react';
import { ArrowLeft, Package, FileText, BookOpen, Clock, ClipboardCheck, Warehouse, ArrowRightLeft } from 'lucide-react';
import StockOverviewView from './StockOverviewView';
import PurchaseInvoicesView from './PurchaseInvoicesView';
import StockCardView from './StockCardView';
import FefoWatcherView from './FefoWatcherView';
import StockOpnameView from './StockOpnameView';

export default function InventoryDashboard({ user, branch, token, theme = 'dark', onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [initialCardMedicineId, setInitialCardMedicineId] = useState('');
  const isLight = theme === 'light';

  const tabs = [
    { id: 'overview', label: 'Stok 3-Level (Gudang & Rak)', icon: Package, desc: 'Rekapitulasi stok Gudang, Rak Kasir & Total' },
    { id: 'invoices', label: 'Faktur Masuk PBF', icon: FileText, desc: 'Penerimaan faktur distributor & batch baru' },
    { id: 'stock-card', label: 'Kartu Stok Digital', icon: BookOpen, desc: 'Buku mutasi barang double-entry per lokasi' },
    { id: 'fefo', label: 'Monitoring ED & FEFO', icon: Clock, desc: 'Prioritas jual kadaluarsa terdekat' },
    { id: 'opname', label: 'Stok Opname Bergulir', icon: ClipboardCheck, desc: 'Hitung parsial per rak tanpa tutup apotek' },
  ];

  const handleOpenStockCard = (medicineId) => {
    setInitialCardMedicineId(medicineId);
    setActiveTab('stock-card');
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
                <Warehouse className={`w-4 h-4 ${isLight ? 'text-vip-orange' : 'text-amber-400'}`} />
                <span>Gudang & Inventori Stok Batch</span>
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
              }`}>
                {branch?.branch_code || 'PUSAT'}
              </span>
            </div>
            <p className={`text-[11px] leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Manajemen 3-Level Stok (Gudang, Rak Kasir, Total), Faktur PBF, FEFO & Opname Bergulir
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
                      ? 'bg-white text-vip-navy shadow-xs border border-vip-navy-border'
                      : 'bg-token-card text-token-emerald shadow-xs border border-token-emerald/40'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isLight ? 'text-vip-orange' : 'text-token-emerald') : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Views Container (Single Screen Fit - No Outer Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'overview' && (
          <StockOverviewView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
            onOpenStockCard={handleOpenStockCard}
          />
        )}
        {activeTab === 'invoices' && (
          <PurchaseInvoicesView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
          />
        )}
        {activeTab === 'stock-card' && (
          <StockCardView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
            initialMedicineId={initialCardMedicineId}
          />
        )}
        {activeTab === 'fefo' && (
          <FefoWatcherView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
          />
        )}
        {activeTab === 'opname' && (
          <StockOpnameView
            token={token}
            userRole={user?.user_role}
            theme={theme}
            branch={branch}
          />
        )}
      </div>
    </div>
  );
}
