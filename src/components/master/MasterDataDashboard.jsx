import React, { useState } from 'react';
import { ArrowLeft, Pill, Database, Layers, Tag, Building2, Stethoscope } from 'lucide-react';
import MedicinesView from './MedicinesView';
import UnitsView from './UnitsView';
import CategoriesView from './CategoriesView';
import SuppliersView from './SuppliersView';
import DoctorsView from './DoctorsView';

export default function MasterDataDashboard({ user, branch, token, theme = 'dark', onBack }) {
  const [activeTab, setActiveTab] = useState('medicines');
  const isLight = theme === 'light';

  const tabs = [
    { id: 'medicines', label: 'Katalog Obat & Alkes', icon: Pill, desc: 'Master sediaan, NIE BPOM & multi-harga' },
    { id: 'units', label: 'Master Satuan', icon: Layers, desc: 'Satuan kemasan & konversi bertingkat' },
    { id: 'categories', label: 'Kategori Terapi', icon: Tag, desc: 'Klasifikasi farmakologis' },
    { id: 'suppliers', label: 'Distributor PBF', icon: Building2, desc: 'Pedagang Besar Farmasi resmi' },
    { id: 'doctors', label: 'Dokter Preskriptor', icon: Stethoscope, desc: 'Dokter & Surat Izin Praktik (SIP)' },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* Top Navigation & Breadcrumb Header */}
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
            title="Kembali ke Dashboard Modul"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-sm sm:text-base font-bold leading-tight flex items-center gap-2 ${
                isLight ? 'text-vip-navy' : 'text-white'
              }`}>
                <Database className={`w-4 h-4 ${isLight ? 'text-vip-orange' : 'text-token-emerald'}`} />
                <span>Master Data Farmasi & Alkes</span>
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
              }`}>
                {branch?.branch_code || 'PUSAT'}
              </span>
            </div>
            <p className={`text-[11px] leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Konfigurasi formularium obat, NIE BPOM, konversi satuan multi-tier, PBF, dan dokter
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
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

      {/* Sub-View Container (Zero Outer Scroll, full height) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'medicines' && (
          <MedicinesView token={token} userRole={user?.user_role} theme={theme} branch={branch} />
        )}
        {activeTab === 'units' && (
          <UnitsView token={token} userRole={user?.user_role} theme={theme} />
        )}
        {activeTab === 'categories' && (
          <CategoriesView token={token} userRole={user?.user_role} theme={theme} />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersView token={token} userRole={user?.user_role} theme={theme} />
        )}
        {activeTab === 'doctors' && (
          <DoctorsView token={token} userRole={user?.user_role} theme={theme} />
        )}
      </div>
    </div>
  );
}
