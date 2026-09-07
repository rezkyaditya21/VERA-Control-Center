'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  Terminal,
  FileCheck,
} from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { AdminAuditLog } from '@/types/database';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>(MOCK_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_email.toLowerCase().includes(search.toLowerCase()) ||
      (l.target_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Audit Log Staf (Immutable Activity Trail)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Catatan jejak aktivitas penegakan kepatuhan, moderasi, dan perubahan konfigurasi sistem.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Write-Only Database Protection</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter aksi, email admin, atau target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'USER_BANNED', 'USER_SUSPENDED', 'POST_REMOVED', 'VERIFICATION_APPROVED'].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors ${
                actionFilter === act
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {act === 'all' ? 'SEMUA AKSI' : act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Waktu (UTC+7)</th>
                <th className="py-3.5 px-4">Staf Pelaksana</th>
                <th className="py-3.5 px-4">Jenis Aksi</th>
                <th className="py-3.5 px-4">Target Entitas</th>
                <th className="py-3.5 px-4">Alasan & Metadata</th>
                <th className="py-3.5 px-4">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 font-semibold">
                    {log.admin_email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        log.action.includes('BANNED') || log.action.includes('REMOVED')
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.action.includes('SUSPENDED')
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="text-slate-500 text-[10px] uppercase block">{log.target_type}</span>
                    <span>{log.target_id}</span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 text-[11px]">
                    {JSON.stringify(log.metadata)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
