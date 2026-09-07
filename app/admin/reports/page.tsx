'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_REPORTS } from '@/lib/mockData';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { Report, ReportPriority, ReportStatus } from '@/types/database';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | ReportPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      (r.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.reporter?.username || '').toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Antrean Laporan Pengguna (Report System)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Investigasi laporan pelanggaran aturan komunitas, scam, dan pelecehan dari pengguna.
          </p>
        </div>

        <Link
          href="/admin/moderation"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Buka Kanban Moderasi</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari ID laporan, pelapor, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'pending', 'reviewing', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Semua' : st}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`px-2 py-1 rounded-lg text-xs font-medium uppercase font-mono transition-colors ${
                  priorityFilter === pr
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">ID & Prioritas</th>
                <th className="py-3.5 px-4">Kategori & Target</th>
                <th className="py-3.5 px-4">Pelapor</th>
                <th className="py-3.5 px-4">Moderator Bertugas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                      <span className="font-mono text-slate-300 font-semibold">#{report.id}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <span className="text-xs font-semibold text-white capitalize block">
                      {report.reason}
                    </span>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {report.target_preview || report.details}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300 font-medium">@{report.reporter?.username}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {report.assigned_to ? (
                      <span className="inline-flex items-center gap-1 text-slate-300 font-medium text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Staff Assigned</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">Belum di-claim</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors inline-block"
                    >
                      Investigasi
                    </Link>
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
