'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  X,
  Lock,
} from 'lucide-react';
import { MOCK_ADMINS, CURRENT_ADMIN } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { AdminRole } from '@/types/database';
import { AdminStaffItem } from '@/types/admin';

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<AdminStaffItem[]>(MOCK_ADMINS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'MODERATOR' as AdminRole });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) return;

    const created = {
      id: `adm-${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      status: 'active',
      last_active: 'Baru saja',
      created_at: new Date().toISOString(),
    };

    setAdmins([...admins, created]);
    showToast(`Admin staf ${newAdmin.name} (${newAdmin.role}) berhasil ditambahkan.`);
    setShowAddModal(false);
    setNewAdmin({ name: '', email: '', role: 'MODERATOR' });
  };

  const handleToggleStatus = (id: string, name: string, role: string) => {
    if (role === 'SUPER_ADMIN') {
      alert('Tindakan Ditolak: SUPER_ADMIN tidak dapat dinonaktifkan.');
      return;
    }

    setAdmins(
      admins.map((a) => {
        if (a.id === id) {
          const next = a.status === 'active' ? 'inactive' : 'active';
          showToast(`Status staf ${name} diubah menjadi ${next}.`);
          return { ...a, status: next };
        }
        return a;
      })
    );
  };

  return (
    <div className="space-y-6">
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
            Manajemen Tim Staf & Administrator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pengaturan Role-Based Access Control (RBAC) untuk Super Admin, Admin, dan Moderator.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah Staf Baru</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <th className="py-3.5 px-4">Nama Staf</th>
              <th className="py-3.5 px-4">Email Akses</th>
              <th className="py-3.5 px-4">Role RBAC</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Terdaftar</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {admins.map((adm) => (
              <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-white">{adm.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">{adm.email}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      adm.role === 'SUPER_ADMIN'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : adm.role === 'ADMIN'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {adm.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                      adm.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}
                  >
                    {adm.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400 text-[11px]">{formatDate(adm.created_at)}</td>
                <td className="py-3.5 px-4 text-right">
                  {adm.role === 'SUPER_ADMIN' ? (
                    <span className="text-slate-500 text-[10px] font-mono italic flex items-center justify-end gap-1">
                      <Lock className="w-3 h-3" /> Master Account
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(adm.id, adm.name, adm.role)}
                      className="text-xs text-slate-400 hover:text-rose-400 font-medium transition-colors"
                    >
                      {adm.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Tambah Anggota Staf Baru</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Lengkap Staf
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Korporat (@vera.id)
                </label>
                <input
                  type="email"
                  required
                  placeholder="budi.mod@vera.id"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tingkatan Role RBAC
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminRole })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="MODERATOR">MODERATOR — Menangani laporan, konten, & ulasan</option>
                  <option value="ADMIN">ADMIN — Mengelola pengguna, audit log, & konfigurasi</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN — Kontrol penuh seluruh ekosistem</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
