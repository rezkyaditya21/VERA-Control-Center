'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  PauseCircle,
  Archive,
  EyeOff,
  Eye,
  Calendar,
  Lock,
  Users,
  Globe,
  Milestone,
  FileCheck,
  ShieldAlert,
  BadgeCheck,
} from 'lucide-react';
import { MOCK_PROGRESSES } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { Progress, ProgressStatus } from '@/types/database';

export default function ProgressOverviewPage() {
  const [progresses, setProgresses] = useState<Progress[]>(MOCK_PROGRESSES);
  const [statusFilter, setStatusFilter] = useState<'all' | ProgressStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const calculateDays = (startDateStr: string, endDateStr?: string | null): number => {
    try {
      const start = new Date(startDateStr).getTime();
      const end = endDateStr ? new Date(endDateStr).getTime() : new Date().getTime();
      const diff = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
      return diff === 0 ? 1 : diff;
    } catch {
      return 1;
    }
  };

  const handleModeration = async (progressId: string, action: 'hide' | 'restore' | 'archive') => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/moderation/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressId,
          action,
          reason: `Admin moderation action: ${action}`,
        }),
      });

      const json = await res.json();
      if (!res.ok && json?.error) {
        console.warn('API warning:', json.error);
      }

      setProgresses((prev) =>
        prev.map((p) => {
          if (p.id === progressId) {
            if (action === 'hide') {
              return { ...p, deleted_at: new Date().toISOString() };
            } else if (action === 'restore') {
              return { ...p, deleted_at: null };
            } else if (action === 'archive') {
              return { ...p, status: 'archived' };
            }
          }
          return p;
        })
      );

      showToast(
        action === 'hide'
          ? 'Perjalanan disembunyikan dari publik.'
          : action === 'restore'
          ? 'Perjalanan berhasil dipulihkan.'
          : 'Perjalanan diarsipkan.'
      );
    } catch (err) {
      console.error('Failed to moderate progress:', err);
      showToast('Gagal memproses moderasi perjalanan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = progresses.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchUser = p.user?.username?.toLowerCase().includes(q) || p.user?.full_name?.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchCategory) return false;
    }
    return true;
  });

  const activeCount = progresses.filter((p) => p.status === 'active' && !p.deleted_at).length;
  const completedCount = progresses.filter((p) => p.status === 'completed' && !p.deleted_at).length;
  const totalMilestones = progresses.reduce((acc, p) => acc + (p.milestones_count || 0), 0);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Manajemen Perjalanan (*Progress Overview*)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau aktivitas belajar, project, dan pencapaian pengguna di platform VERA (*Show your progress, not just your result*).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'completed', 'paused', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {st === 'all' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Perjalanan Aktif</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeCount}</div>
          <p className="text-xs text-slate-500 mt-1">Pengguna sedang konsisten berkarya</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Perjalanan Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completedCount}</div>
          <p className="text-xs text-slate-500 mt-1">Mencapai target akhir perjalanan</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Milestones</span>
            <Milestone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalMilestones}</div>
          <p className="text-xs text-slate-500 mt-1">Titik pencapaian didokumentasikan</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul perjalanan, kategori, atau nama pengguna..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 text-sm text-white rounded-xl focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Progress Items List */}
      <div className="space-y-3">
        {filtered.map((prog) => {
          const isHidden = !!prog.deleted_at;
          const days = calculateDays(prog.start_date, prog.end_date);

          return (
            <div
              key={prog.id}
              className={`p-5 rounded-2xl border transition-all ${
                isHidden
                  ? 'bg-rose-950/20 border-rose-800/40 opacity-70'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                      {prog.category}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                        prog.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : prog.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : prog.status === 'archived'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {prog.status}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      {prog.visibility === 'public' ? (
                        <>
                          <Globe className="w-3 h-3 text-slate-400" /> Publik
                        </>
                      ) : prog.visibility === 'followers' ? (
                        <>
                          <Users className="w-3 h-3 text-slate-400" /> Pengikut
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-400" /> Pribadi
                        </>
                      )}
                    </span>

                    {isHidden && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> DISEMBUNYIKAN
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{prog.title}</h3>
                  {prog.description && (
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{prog.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Oleh: <strong className="text-slate-300">@{prog.user?.username || 'user'}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Mulai {formatDate(prog.start_date)} ({days} hari aktif)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Milestone className="w-3 h-3 text-amber-400" />
                      {prog.milestones_count || 0} Milestones
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      {prog.proofs_count || 0} Proofs
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  {isHidden ? (
                    <button
                      onClick={() => handleModeration(prog.id, 'restore')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Pulihkan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModeration(prog.id, 'hide')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                    </button>
                  )}

                  {prog.status !== 'archived' && (
                    <button
                      onClick={() => handleModeration(prog.id, 'archive')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" /> Arsipkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Tidak ada perjalanan yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
        </div>
      )}
    </div>
  );
}
