'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquareQuote,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MOCK_PROFILES, MOCK_POSTS, MOCK_REPORTS, MOCK_VERIFICATIONS, MOCK_AUDIT_LOGS } from '@/lib/mockData';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';

export default function AdminDashboardPage() {
  const stats = [
    {
      title: 'TOTAL USERS',
      value: '128,421',
      change: '+12.4%',
      period: 'dari bulan lalu',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'ACTIVE TODAY',
      value: '18,294',
      change: '+5.2%',
      period: 'real-time online',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'DECISION ROOMS',
      value: '4,892',
      change: '+184 hari ini',
      period: '73% terjawab',
      icon: MessageSquareQuote,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'PENDING REPORTS',
      value: '3',
      change: '1 Kritis',
      period: 'butuh tindakan cepat',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  const pendingReports = MOCK_REPORTS.filter((r) => r.status === 'pending' || r.priority === 'critical');
  const pendingVerifications = MOCK_VERIFICATIONS.filter((v) => v.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Dashboard Operasional
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Status real-time ekosistem keputusan sosial VERA & antrean moderasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/moderation"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Buka Moderation Queue</span>
          </Link>
          <Link
            href="/admin/reports"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Semua Laporan</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 tracking-wider uppercase">
                  {item.title}
                </span>
                <div className={`p-2 rounded-xl border ${item.bgColor}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white tracking-tight">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span className="font-semibold text-emerald-400 font-mono">{item.change}</span>
                  <span>{item.period}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Urgent Reports Queue & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Attention Stream */}
        <div className="lg:col-span-2 space-y-6">
          {/* Laporan Prioritas Mendesak */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Laporan Membutuhkan Tindakan Cepat
                </h2>
              </div>
              <Link
                href="/admin/reports"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                Lihat Semua ({MOCK_REPORTS.length}) <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getPriorityColor(report.priority)}`}>
                        {report.priority.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-slate-400">#{report.id}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 font-medium capitalize">
                        Kategori: <strong className="text-slate-200">{report.reason}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium line-clamp-1">
                      {report.target_preview}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pelapor: <span className="text-slate-300">@{report.reporter?.username}</span> — {report.details}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Investigasi
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verifikasi Pengalaman Masuk */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Pengajuan Verifikasi Pengalaman Nyata
                </h2>
              </div>
              <Link
                href="/admin/verification"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                Kelola Verifikasi <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {MOCK_VERIFICATIONS.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={ver.user?.avatar_url}
                      alt={ver.user?.full_name}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{ver.title}</p>
                      <p className="text-[11px] text-slate-400">
                        Diajukan oleh <strong className="text-slate-300">@{ver.user?.username}</strong> ({ver.user?.decision_score} Decision Score)
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getStatusColor(ver.status)} uppercase font-bold`}>
                    {ver.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Audit Log & Security Stream */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Audit Log Terbaru
                </h2>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Semua
              </Link>
            </div>

            <div className="space-y-3.5">
              {MOCK_AUDIT_LOGS.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs space-y-1 border-l-2 border-slate-800 pl-3 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-blue-400 text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Oleh: <span className="font-mono text-slate-400">{log.admin_email}</span>
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    Target: {log.target_type} ({log.target_id})
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Platform Health Card */}
          <div className="rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/60 border border-blue-900/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Platform Health
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              98.4% Decision Room diselesaikan dalam waktu kurang dari 24 jam dengan tingkat kepuasan komunitas tinggi.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Auto-Moderation Accuracy</span>
                <span className="font-mono text-emerald-400 font-bold">96.8%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[96.8%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
