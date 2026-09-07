'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Shield,
  Ban,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  MoreVertical,
  X,
} from 'lucide-react';
import { MOCK_PROFILES } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Profile, UserStatus } from '@/types/database';

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>(MOCK_PROFILES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [activeModal, setActiveModal] = useState<{
    type: 'suspend' | 'ban' | 'restore';
    user: Profile;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmAction = () => {
    if (!activeModal) return;
    const { type, user } = activeModal;

    if ((type === 'suspend' || type === 'ban') && !actionReason.trim()) {
      alert('Alasan penegakan moderasi wajib diisi!');
      return;
    }

    setUsers(
      users.map((u) => {
        if (u.id === user.id) {
          if (type === 'suspend') {
            return {
              ...u,
              status: 'suspended',
              ban_reason: actionReason,
            };
          }
          if (type === 'ban') {
            return {
              ...u,
              status: 'banned',
              ban_reason: actionReason,
            };
          }
          if (type === 'restore') {
            return {
              ...u,
              status: 'active',
              ban_reason: null,
              suspended_until: null,
            };
          }
        }
        return u;
      })
    );

    showToast(
      type === 'suspend'
        ? `Pengguna @${user.username} berhasil disuspend selama ${suspendDuration} jam.`
        : type === 'ban'
        ? `Pengguna @${user.username} berhasil dibanned permanen.`
        : `Akun @${user.username} berhasil dipulihkan (Restored).`
    );

    setActiveModal(null);
    setActionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola profil, status akun, dan penegakan reputasi penimbang VERA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Total Terdaftar: <strong className="text-white">{users.length}</strong>
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, username, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'active', 'suspended', 'banned'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Decision Score</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Bergabung</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                          {user.full_name}
                        </Link>
                        <p className="text-[11px] text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                    {user.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-400">
                        {user.decision_score}/100
                      </span>
                      <span className="text-[10px] text-slate-500">({user.reputation_tier})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold">
                      {user.roles?.[0] || 'USER'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Lihat Detail Profil"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {user.status === 'active' && (
                        <>
                          <button
                            onClick={() => setActiveModal({ type: 'suspend', user })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Suspend Pengguna"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveModal({ type: 'ban', user })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Ban Akun Permanen"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {(user.status === 'suspended' || user.status === 'banned') && (
                        <button
                          onClick={() => setActiveModal({ type: 'restore', user })}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Pulihkan Akun"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada pengguna yang cocok dengan pencarian "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activeModal.type === 'suspend' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {activeModal.type === 'ban' && <Ban className="w-4 h-4 text-rose-400" />}
                {activeModal.type === 'restore' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span>
                  {activeModal.type === 'suspend' && 'Suspend Akun Pengguna'}
                  {activeModal.type === 'ban' && 'Ban Permanen Pengguna'}
                  {activeModal.type === 'restore' && 'Pulihkan Akun Pengguna'}
                </span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Anda akan mengambil tindakan administratif pada akun{' '}
              <strong className="text-white">@{activeModal.user.username}</strong> ({activeModal.user.full_name}).
            </p>

            {activeModal.type === 'suspend' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Durasi Penangguhan
                </label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="24">24 Jam (1 Hari)</option>
                  <option value="72">72 Jam (3 Hari)</option>
                  <option value="168">168 Jam (7 Hari)</option>
                  <option value="720">720 Jam (30 Hari)</option>
                </select>
              </div>
            )}

            {(activeModal.type === 'suspend' || activeModal.type === 'ban') && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Alasan Penegakan (Wajib Diisi untuk Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Jelaskan alasan pelanggaran aturan komunitas..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl transition-colors ${
                  activeModal.type === 'ban'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : activeModal.type === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Konfirmasi Tindakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
