'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Clock,
  MessageSquareQuote,
  MessagesSquare,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
  History,
} from 'lucide-react';
import { MOCK_PROFILES, MOCK_POSTS, MOCK_COMMENTS, MOCK_REPORTS, MOCK_AUDIT_LOGS } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;
  const user = MOCK_PROFILES.find((p) => p.id === userId) || MOCK_PROFILES[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments' | 'reports' | 'history'>('overview');

  const userPosts = MOCK_POSTS.filter((p) => p.author_id === user.id);
  const userComments = MOCK_COMMENTS.filter((c) => c.author_id === user.id);
  const userReports = MOCK_REPORTS.filter((r) => r.reporter_id === user.id);
  const userHistory = MOCK_AUDIT_LOGS.filter((l) => l.target_id === user.id);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar Pengguna</span>
      </Link>

      {/* User Header Profile Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-700"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{user.full_name}</h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getStatusColor(user.status)}`}>
                {user.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              @{user.username} • <span className="font-mono">{user.email}</span>
            </p>
            {user.bio && <p className="text-xs text-slate-300 italic pt-1">{user.bio}</p>}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Decision Score</span>
            <p className="text-lg font-bold font-mono text-blue-400">{user.decision_score}/100</p>
            <span className="text-[10px] text-slate-500">{user.reputation_tier}</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Decisions</span>
            <p className="text-lg font-bold font-mono text-white">{user.decisions_count}</p>
            <span className="text-[10px] text-slate-500">Rooms</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Experiences</span>
            <p className="text-lg font-bold font-mono text-emerald-400">{user.experiences_count}</p>
            <span className="text-[10px] text-slate-500">Reviews</span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Ringkasan & Info', icon: Activity },
          { id: 'posts', label: `Decision Rooms (${userPosts.length})`, icon: MessageSquareQuote },
          { id: 'comments', label: `Komentar (${userComments.length})`, icon: MessagesSquare },
          { id: 'reports', label: `Laporan Diajukan (${userReports.length})`, icon: AlertTriangle },
          { id: 'history', label: `Riwayat Moderasi (${userHistory.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
                Informasi Akun
              </h3>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 text-[11px] block">User ID</span>
                  <span className="font-mono text-slate-300">{user.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Role Akses</span>
                  <span className="font-mono text-blue-400 font-semibold">{user.roles?.[0] || 'USER'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Bergabung Pada</span>
                  <span>{formatDate(user.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Aktivitas Terakhir</span>
                  <span>{formatDate(user.last_active_at)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
                Status Disiplin & Pelanggaran
              </h3>
              {user.status === 'active' ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Akun memiliki reputasi baik dan tidak sedang dalam hukuman penangguhan.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Akun Dalam Status: {user.status.toUpperCase()}</span>
                  </div>
                  {user.ban_reason && (
                    <p className="text-[11px] text-rose-300 pt-1">
                      Alasan: {user.ban_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-3">
            {userPosts.map((post) => (
              <div key={post.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <Link href={`/admin/posts/${post.id}`} className="text-sm font-bold text-white hover:text-blue-400">
                    {post.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{post.category} • Budget: Rp {post.min_budget.toLocaleString()} - {post.max_budget.toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>
            ))}
            {userPosts.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">Pengguna belum membuat Decision Room.</p>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-3">
            {userComments.map((comment) => (
              <div key={comment.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs text-slate-200">"{comment.content}"</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                  <span>Sentimen: {comment.sentiment}</span>
                  <span>•</span>
                  <span>{comment.usage_duration}</span>
                  <span>•</span>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
              </div>
            ))}
            {userComments.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">Pengguna belum menulis komentar atau opini.</p>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-3">
            {userReports.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                    {rep.priority} • {rep.reason}
                  </span>
                  <p className="text-xs text-slate-300 mt-1">{rep.details}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">{rep.status}</span>
              </div>
            ))}
            {userReports.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">Pengguna belum pernah mengajukan laporan.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {userHistory.map((hist) => (
              <div key={hist.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-blue-400">{hist.action}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{formatDate(hist.created_at)}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">Oleh: {hist.admin_email}</p>
              </div>
            ))}
            {userHistory.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada catatan hukuman atau tindakan moderasi pada pengguna ini.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
