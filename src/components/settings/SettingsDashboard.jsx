import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings, Users, Building2, ShieldCheck, ArrowLeft, Plus,
  Search, RefreshCw, Eye, Edit2, Lock, CheckCircle2, AlertCircle,
  Shield, UserCheck, Landmark, Smartphone, Server, Radio, KeyRound
} from 'lucide-react';
import { listUsers, listBranches, getBranch } from '../../services/settingsApi';
import { WS_BASE_URL, API_BASE_URL } from '../../services/api';
import UserModal from './UserModal';
import AssignBranchModal from './AssignBranchModal';
import BranchModal from './BranchModal';

export default function SettingsDashboard({ user, branch, token, theme = 'dark', onBack, onBranchUpdated }) {
  const isLight = theme === 'light';

  // Active Tab: 'users' | 'branches' | 'system'
  const [activeTab, setActiveTab] = useState('users');

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userToEdit, setUserToEdit] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForAssignBranch, setUserForAssignBranch] = useState(null);

  // Branches State
  const [branchesList, setBranchesList] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [branchToEdit, setBranchToEdit] = useState(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // 1. Fetch Users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setErrorMsg('');
    try {
      const res = await listUsers(token, 1, 100);
      setUsersList(res?.items || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar pengguna sistem');
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  // 2. Fetch Branches
  const fetchBranches = useCallback(async () => {
    setBranchesLoading(true);
    setErrorMsg('');
    try {
      const res = await listBranches(token, 1, 100);
      setBranchesList(res?.items || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setErrorMsg(err.message || 'Gagal memuat katalog cabang apotek');
    } finally {
      setBranchesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'branches') {
      fetchBranches();
    }
  }, [activeTab, fetchUsers, fetchBranches]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesRole = userRoleFilter === 'ALL' || u.user_role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'ALL' || u.user_status === userStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, userSearchQuery, userRoleFilter, userStatusFilter]);

  // Filtered Branches
  const filteredBranches = useMemo(() => {
    return branchesList.filter((b) => {
      const q = branchSearchQuery.toLowerCase();
      return (
        b.branch_name.toLowerCase().includes(q) ||
        b.branch_code.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.sia_id && b.sia_id.toLowerCase().includes(q))
      );
    });
  }, [branchesList, branchSearchQuery]);

  // Badge helpers
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wide">
            Superadmin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
            Admin
          </span>
        );
      case 'pharmacist':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase tracking-wide">
            Apoteker (APJ)
          </span>
        );
      case 'cashier':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
            Kasir POS
          </span>
        );
      case 'inventory':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
            Logistik Gudang
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 uppercase">
            {role}
          </span>
        );
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Aktif</span>
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Non-aktif</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Suspended</span>
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-400 font-mono">{status}</span>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Top Header */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Kembali ke Dashboard Modul"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-slate-700/40 border border-slate-600/40 text-slate-200 flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">Pengaturan Sistem & User</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{branch?.branch_name || 'Apotek Vi-Pharma'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Otorisasi pengguna vi-token, penugasan hak akses role (RBAC), profil legalitas apotek SIA/SIPA, dan sesi workstation
            </p>
          </div>
        </div>

        {/* Global Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'branches') fetchBranches();
            }}
            disabled={usersLoading || branchesLoading}
            className={`p-2 rounded-xl border transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${(usersLoading || branchesLoading) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Pengguna & Staf ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'branches'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil & Legalitas Cabang Apotek ({branchesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'system'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Status Sesi & Keamanan Workstation</span>
        </button>
      </div>

      {/* Error / Feedback Alert */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
        {/* ============================================================== */}
        {/* TAB 1: MANAJEMEN PENGGUNA & HAK AKSES (RBAC)                  */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama staf atau username..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs w-60 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="ALL">Semua Peran (Role)</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="pharmacist">Apoteker (APJ)</option>
                  <option value="cashier">Kasir</option>
                  <option value="inventory">Logistik Gudang</option>
                </select>

                {/* Status Filter */}
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-aktif</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Add User Button */}
              <button
                onClick={() => {
                  setUserToEdit(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengguna Baru</span>
              </button>
            </div>

            {/* Users Table */}
            <div
              className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/40">
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3">Nama Lengkap & Username</th>
                      <th className="py-3 px-3 text-center">Hak Akses (Role)</th>
                      <th className="py-3 px-3 text-center">Status Akun</th>
                      <th className="py-3 px-3 font-mono">User ID</th>
                      <th className="py-3 px-3 text-center w-48">Aksi Pengaturan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                          <span>Memuat daftar pengguna dari server...</span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          <span>Tidak ada pengguna yang cocok dengan filter.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={u.id}
                          className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}`}
                        >
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.id === user?.id && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                                  ANDA
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">@{u.username}</span>
                          </td>
                          <td className="py-3 px-3 text-center">{renderRoleBadge(u.user_role)}</td>
                          <td className="py-3 px-3 text-center">{renderStatusBadge(u.user_status)}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{u.id}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setUserToEdit(u);
                                  setIsUserModalOpen(true);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center gap-1 ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                }`}
                                title="Edit Profil, Role, atau Reset Password"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => setUserForAssignBranch(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center gap-1 ${
                                  isLight
                                    ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200'
                                    : 'bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-400 border-cyan-800/60'
                                }`}
                                title="Atur Penugasan Akses Cabang Staf"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Cabang</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div
                className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <span>
                  Total terdaftar: <b>{filteredUsers.length}</b> pengguna sistem
                </span>
                <span className="text-[11px]">
                  *Hanya Superadmin & Admin yang berhak memodifikasi akun dan hak akses staf
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PROFIL & LEGALITAS CABANG APOTEK                        */}
        {/* ============================================================== */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama cabang, kode, SIA, atau alamat..."
                  value={branchSearchQuery}
                  onChange={(e) => setBranchSearchQuery(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs w-72 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                onClick={() => {
                  setBranchToEdit(null);
                  setIsBranchModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Cabang Baru</span>
              </button>
            </div>

            {/* Branches Grid Cards */}
            {branchesLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                <span>Memuat katalog cabang apotek...</span>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <span>Tidak ada cabang yang cocok dengan pencarian.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBranches.map((br) => {
                  const isCurrentActive = br.id === branch?.id;
                  return (
                    <div
                      key={br.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition shadow-xs ${
                        isCurrentActive
                          ? isLight
                            ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                          : isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {/* Branch Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isCurrentActive
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                {br.branch_name}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Kode: <b>{br.branch_code}</b> | ID: {br.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white shadow-xs">
                                CABANG AKTIF
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                              {br.branch_status || 'Active'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                          {br.address || 'Alamat cabang belum dikonfigurasi'}
                        </p>

                        {/* Legalitas Farmasi Details */}
                        <div className="mt-3.5 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1 text-xs">
                          <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Legalitas Farmasi Resmi (SIA & SIPA)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Nomor SIA Apotek:</span>
                              <strong className="text-slate-200 font-mono">{br.sia_id || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Nomor SIPA APJ:</span>
                              <strong className="text-slate-200 font-mono">{br.sipa || '-'}</strong>
                            </div>
                          </div>
                          <div className="text-[11px] pt-0.5">
                            <span className="text-slate-400 text-[10px]">Apoteker Penanggung Jawab: </span>
                            <strong className="text-slate-200">{br.sipa_name || 'apt. Heru Oktafian, S.Farm.'}</strong>
                          </div>
                        </div>

                        {/* Rekening & Pajak Details */}
                        <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div>
                            <span className="block text-[10px]">Rekening Kasir:</span>
                            <span className="text-slate-300 font-medium font-mono">
                              {br.bank_name ? `${br.bank_name} ${br.account_number}` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px]">Tarif PPN:</span>
                            <span className="text-slate-300 font-medium">
                              {br.tax_percentage || 0}% ({br.journal_method || 'perpetual'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Telp: {br.phone || '-'}
                        </span>

                        <button
                          onClick={() => {
                            setBranchToEdit(br);
                            setIsBranchModalOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Edit Profil Cabang</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: STATUS SISTEM & KEAMANAN WORKSTATION                    */}
        {/* ============================================================== */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Active User Sesi */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sesi Pengguna Saat Ini</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Nama Lengkap:</span>
                    <strong className="text-slate-200">{user?.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Username Login:</span>
                    <strong className="font-mono text-emerald-400">@{user?.username}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Hak Akses (Role):</span>
                    <strong className="uppercase text-rose-400 font-bold">{user?.user_role}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">User ID:</span>
                    <strong className="font-mono text-[11px] text-slate-400">{user?.id}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Active Branch Context */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Cabang Apotek Terpilih</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Nama Cabang:</span>
                    <strong className="text-slate-200">{branch?.branch_name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Kode Cabang:</span>
                    <strong className="font-mono text-blue-400">{branch?.branch_code}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Nomor SIA:</span>
                    <strong className="font-mono text-slate-300">{branch?.sia_id || '-'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">APJ (SIPA):</span>
                    <strong className="text-slate-300 truncate max-w-[150px]">{branch?.sipa_name || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: WebSocket Pairing Status */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Status WebSocket Workstation</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Status Saluran:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      CONNECTED (AKTIF)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Fungsi:</span>
                    <strong className="text-slate-300">Remote Logout & Pairing</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Protokol:</span>
                    <strong className="font-mono text-slate-400 text-[10px]">WSS / WebSocket v1</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* System Infrastructure Details */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Informasi Arsitektur & Lingkungan Server Vi-Pharma</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block">Backend API Host:</span>
                  <span className="font-mono text-slate-200 font-bold truncate block">{API_BASE_URL}</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block">Workstation WS URL:</span>
                  <span className="font-mono text-slate-200 font-bold truncate block">{WS_BASE_URL}</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block">Engine & Basis Data:</span>
                  <span className="text-slate-200 font-bold block">Go Fiber + PostgreSQL 16</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block">Keamanan Otorisasi:</span>
                  <span className="text-slate-200 font-bold block">JWT + Biometric vi-token</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal (Create & Edit) */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
        token={token}
        theme={theme}
        onSaved={() => {
          setFeedbackMsg(userToEdit ? 'Data pengguna berhasil diperbarui!' : 'Pengguna baru berhasil didaftarkan!');
          setTimeout(() => setFeedbackMsg(''), 4000);
          fetchUsers();
        }}
      />

      {/* Assign Branch Modal */}
      <AssignBranchModal
        isOpen={Boolean(userForAssignBranch)}
        onClose={() => setUserForAssignBranch(null)}
        targetUser={userForAssignBranch}
        token={token}
        theme={theme}
      />

      {/* Branch Form Modal (Create & Edit) */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branchToEdit={branchToEdit}
        token={token}
        theme={theme}
        onSaved={() => {
          setFeedbackMsg(branchToEdit ? 'Profil cabang apotek berhasil diperbarui!' : 'Cabang apotek baru berhasil didaftarkan!');
          setTimeout(() => setFeedbackMsg(''), 4000);
          fetchBranches();
          if (onBranchUpdated) {
            onBranchUpdated();
          }
        }}
      />
    </div>
  );
}
