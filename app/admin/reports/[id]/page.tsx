'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  User,
  CheckCircle2,
  XCircle,
  EyeOff,
  Ban,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { MOCK_REPORTS, MOCK_PROFILES, CURRENT_ADMIN } from '@/lib/mockData';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.id as string;
  const report = MOCK_REPORTS.find((r) => r.id === reportId) || MOCK_REPORTS[0];

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24');
  const [resolved, setResolved] = useState(report.status === 'resolved');

  const handleExecuteResolution = () => {
    if (!selectedAction) {
      alert('Pilih salah satu tindakan penegakan moderasi!');
      return;
    }
    if (selectedAction !== 'dismiss' && !resolutionReason.trim()) {
      alert('Alasan penegakan wajib diisi untuk catatan audit.');
      return;
    }

    setResolved(true);
    alert(`Keputusan moderasi [${selectedAction.toUpperCase()}] berhasil dieksekusi dan dicatat ke Audit Log.`);
    router.push('/admin/reports');
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Antrean Laporan</span>
      </Link>

      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getPriorityColor(report.priority)}`}>
              {report.priority} PRIORITY
            </span>
            <span className="text-xs font-mono text-slate-400">#{report.id}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase font-bold ${getStatusColor(resolved ? 'resolved' : report.status)}`}>
              {resolved ? 'RESOLVED' : report.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight capitalize">
            Laporan Pelanggaran: {report.reason}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Diterima pada {formatDate(report.created_at)} • Target: {report.target_type}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Moderator: <strong className="text-white">{CURRENT_ADMIN.full_name}</strong>
          </span>
        </div>
      </div>

      {/* Investigation Details 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Report Context & Content Target */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Content Box */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Konten yang Dilaporkan</span>
              <span className="font-mono text-slate-500">ID: {report.target_id}</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed font-mono">
              "{report.target_preview || 'Konten melanggar ketentuan VERA...'}"
            </div>
          </div>

          {/* Reporter Claims & Evidence */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
              Keterangan Pelapor
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <img
                src={report.reporter?.avatar_url}
                alt={report.reporter?.full_name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
              />
              <div>
                <p className="text-xs font-semibold text-white">@{report.reporter?.username}</p>
                <p className="text-[11px] text-slate-400">Pelapor Terdaftar</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed pt-1">{report.details}</p>
          </div>
        </div>

        {/* Right 1 Col: Enforcement Action Form */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-4">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Tindakan Moderasi Resmi</span>
            </h3>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pilih Keputusan
              </label>

              {[
                { id: 'dismiss', label: 'Tolak Laporan (Tidak Melanggar)' },
                { id: 'warn', label: 'Beri Peringatan Resmi (Warn User)' },
                { id: 'hide_content', label: 'Sembunyikan Konten (Hide)' },
                { id: 'remove_content', label: 'Hapus Konten Permanen (Remove)' },
                { id: 'suspend_user', label: 'Suspend Akun Pelaku' },
                { id: 'ban_user', label: 'Ban Permanen Akun Pelaku' },
              ].map((act) => (
                <label
                  key={act.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedAction === act.id
                      ? 'bg-blue-600/10 border-blue-500 text-white font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="action"
                    value={act.id}
                    checked={selectedAction === act.id}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="text-blue-600 focus:ring-0"
                  />
                  <span>{act.label}</span>
                </label>
              ))}
            </div>

            {selectedAction === 'suspend_user' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Durasi Suspend
                </label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                >
                  <option value="24">24 Jam (1 Hari)</option>
                  <option value="72">72 Jam (3 Hari)</option>
                  <option value="168">168 Jam (7 Hari)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Alasan Penegakan (Wajib Diisi)
              </label>
              <textarea
                rows={3}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="Tuliskan justifikasi keputusan moderasi untuk jejak audit..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleExecuteResolution}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
            >
              Eksekusi Tindakan & Tutup Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
