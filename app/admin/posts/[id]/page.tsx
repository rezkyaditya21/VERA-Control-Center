'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquareQuote,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_POSTS } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function PostDetailPage() {
  const params = useParams();
  const postId = params?.id as string;
  const post = MOCK_POSTS.find((p) => p.id === postId) || MOCK_POSTS[0];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/posts"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar Decision Rooms</span>
      </Link>

      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              {post.category}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getStatusColor(post.status)}`}>
              {post.status}
            </span>
            <span className="text-xs text-slate-500 font-mono">#{post.id}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{post.title}</h1>
          <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            "{post.description}"
          </p>
        </div>

        {/* Author box */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
          <img
            src={post.author?.avatar_url}
            alt={post.author?.full_name}
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-700"
          />
          <div>
            <p className="text-xs font-semibold text-white">{post.author?.full_name}</p>
            <p className="text-[11px] text-slate-400">@{post.author?.username}</p>
            <Link
              href={`/admin/users/${post.author_id}`}
              className="text-[10px] text-blue-400 hover:underline pt-1 inline-block"
            >
              Lihat Profil Pengguna →
            </Link>
          </div>
        </div>
      </div>

      {/* Constraints & Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Constraints */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
            Parameter Kebutuhan User
          </h3>
          <div>
            <span className="text-slate-500 block">Rentang Budget</span>
            <span className="font-mono text-white text-sm font-bold">
              Rp {post.min_budget.toLocaleString()} — {post.max_budget.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Prioritas Spesifik</span>
            <div className="flex flex-wrap gap-1">
              {post.priorities.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  ✓ {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Kondisi Barang</span>
            <span className="text-slate-200">{post.condition_preference}</span>
          </div>
        </div>

        {/* AI & Content Risk Score Panel */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>AI Moderation Scan</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE SCAN</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Spam Risk</span>
              <span className="font-mono font-bold text-slate-200">
                {post.ai_risk_score ? `${post.ai_risk_score}%` : '4%'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (post.ai_risk_score || 0) > 75 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${post.ai_risk_score || 4}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Harassment / Hate Risk</span>
              <span className="font-mono font-bold text-slate-200">
                {post.ai_risk_score && post.ai_risk_score > 75 ? '84%' : '2%'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (post.ai_risk_score || 0) > 75 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: post.ai_risk_score && post.ai_risk_score > 75 ? '84%' : '2%' }}
              ></div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 mt-2">
            Status: {post.status === 'published' ? 'Aman & Terverifikasi Komunitas' : `Tindakan: ${post.removal_reason}`}
          </div>
        </div>

        {/* Room Metrics */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
            Metrik Partisipasi
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Partisipan Menilai</span>
            <span className="font-mono text-white font-bold">{post.participants_count} User</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Pengalaman Riil</span>
            <span className="font-mono text-emerald-400 font-bold">{post.experiences_count} Bukti</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Resolusi Keputusan</span>
            <span className="font-mono text-blue-400 font-bold">{post.answered_percentage}% Terjawab</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Rekomendasi Teratas</span>
            <span className="text-white font-semibold">{post.top_candidate_name || 'ThinkPad X390'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
