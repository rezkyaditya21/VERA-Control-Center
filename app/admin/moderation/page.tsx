'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ListTodo,
  AlertOctagon,
  AlertTriangle,
  Info,
  UserCheck,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { MOCK_REPORTS, CURRENT_ADMIN } from '@/lib/mockData';
import { getPriorityColor, getStatusColor, formatDate } from '@/lib/utils';
import { Report } from '@/types/database';

export default function ModerationQueuePage() {
  const [tasks, setTasks] = useState<Report[]>(MOCK_REPORTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClaim = (taskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            assigned_to: CURRENT_ADMIN.id,
            status: 'reviewing',
          };
        }
        return t;
      })
    );
    showToast(`Task #${taskId} berhasil Anda claim.`);
  };

  const urgentTasks = tasks.filter((t) => t.priority === 'critical');
  const highTasks = tasks.filter((t) => t.priority === 'high');
  const normalTasks = tasks.filter((t) => t.priority === 'medium' || t.priority === 'low');

  const renderTaskCard = (task: Report) => {
    const isAssignedToMe = task.assigned_to === CURRENT_ADMIN.id;
    const isAssignedToOther = task.assigned_to && !isAssignedToMe;

    return (
      <div
        key={task.id}
        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-white">#{task.id}</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold text-white capitalize">{task.reason}</p>
          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
            "{task.target_preview || task.details}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[11px] text-slate-500">
          <span>{formatDate(task.created_at)}</span>

          {task.status === 'resolved' ? (
            <span className="text-emerald-400 font-bold font-mono">SELESAI</span>
          ) : isAssignedToMe ? (
            <span className="text-blue-400 font-semibold flex items-center gap-1 font-mono">
              <UserCheck className="w-3 h-3" /> Saya Tangani
            </span>
          ) : isAssignedToOther ? (
            <span className="text-amber-400 font-mono">Di-claim Staf Lain</span>
          ) : (
            <button
              onClick={() => handleClaim(task.id)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] transition-colors"
            >
              Claim Task
            </button>
          )}
        </div>

        <div className="pt-1">
          <Link
            href={`/admin/reports/${task.id}`}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <span>Buka Penyelidikan</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
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
            Moderation Task Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Alur kerja antrean penanganan laporan terstruktur untuk mencegah tumpang-tindih moderator.
          </p>
        </div>
      </div>

      {/* 3 Streams Grid: URGENT, HIGH, NORMAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stream 1: URGENT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">URGENT (CRITICAL)</span>
            </div>
            <span className="text-xs font-mono font-bold">{urgentTasks.length}</span>
          </div>

          <div className="space-y-3">
            {urgentTasks.map(renderTaskCard)}
            {urgentTasks.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                Tidak ada tugas kritis saat ini.
              </div>
            )}
          </div>
        </div>

        {/* Stream 2: HIGH */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">HIGH PRIORITY</span>
            </div>
            <span className="text-xs font-mono font-bold">{highTasks.length}</span>
          </div>

          <div className="space-y-3">
            {highTasks.map(renderTaskCard)}
            {highTasks.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                Tidak ada tugas high priority.
              </div>
            )}
          </div>
        </div>

        {/* Stream 3: NORMAL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">NORMAL QUEUE</span>
            </div>
            <span className="text-xs font-mono font-bold">{normalTasks.length}</span>
          </div>

          <div className="space-y-3">
            {normalTasks.map(renderTaskCard)}
            {normalTasks.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                Tidak ada tugas normal queue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
