'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquareQuote,
  Search,
  EyeOff,
  Trash2,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  X,
  AlertTriangle,
} from 'lucide-react';
import { MOCK_POSTS } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Post, ContentStatus } from '@/types/database';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [activeModal, setActiveModal] = useState<{
    type: 'hide' | 'remove' | 'restore';
    post: Post;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.author?.username || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmAction = () => {
    if (!activeModal) return;
    const { type, post } = activeModal;

    if ((type === 'hide' || type === 'remove') && !reason.trim()) {
      alert('Alasan tindakan moderasi konten wajib diisi!');
      return;
    }

    setPosts(
      posts.map((p) => {
        if (p.id === post.id) {
          if (type === 'hide') {
            return {
              ...p,
              status: 'hidden',
              removal_reason: reason,
              removed_at: new Date().toISOString(),
            };
          }
          if (type === 'remove') {
            return {
              ...p,
              status: 'removed',
              removal_reason: reason,
              removed_at: new Date().toISOString(),
            };
          }
          if (type === 'restore') {
            return {
              ...p,
              status: 'published',
              removal_reason: null,
              removed_at: null,
            };
          }
        }
        return p;
      })
    );

    showToast(
      type === 'hide'
        ? 'Decision Room berhasil disembunyikan dari publik.'
        : type === 'remove'
        ? 'Decision Room berhasil dihapus (soft-delete).'
        : 'Decision Room berhasil dipulihkan (Published).'
    );

    setActiveModal(null);
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            Moderasi Decision Rooms
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau ruang keputusan, verifikasi kelayakan produk, dan tangani konten spam/buzzer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Total Room: <strong className="text-white">{posts.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari judul room, kategori, atau pembuat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'published', 'under_review', 'hidden', 'removed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Topik Decision Room</th>
                <th className="py-3.5 px-4">Pembuat</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Budget</th>
                <th className="py-3.5 px-4">AI Risk</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Dibuat</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 max-w-xs">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors block line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{post.description}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.author?.avatar_url}
                        alt={post.author?.full_name}
                        className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-700"
                      />
                      <span className="text-slate-300 font-medium">@{post.author?.username}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {post.category}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                    Rp {(post.min_budget / 1000000).toFixed(0)}M - {(post.max_budget / 1000000).toFixed(0)}M
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        (post.ai_risk_score || 0) > 75
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : (post.ai_risk_score || 0) > 40
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {post.ai_risk_score || 0}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getStatusColor(
                        post.status
                      )}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Lihat Detail & Kandidat"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {post.status === 'published' && (
                        <>
                          <button
                            onClick={() => setActiveModal({ type: 'hide', post })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Sembunyikan Room"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveModal({ type: 'remove', post })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {(post.status === 'hidden' || post.status === 'removed') && (
                        <button
                          onClick={() => setActiveModal({ type: 'restore', post })}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Pulihkan Post"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>
                  {activeModal.type === 'hide' && 'Sembunyikan Decision Room'}
                  {activeModal.type === 'remove' && 'Hapus Decision Room'}
                  {activeModal.type === 'restore' && 'Pulihkan Decision Room'}
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
              Anda akan memoderasi room "{activeModal.post.title}" milik{' '}
              <strong className="text-white">@{activeModal.post.author?.username}</strong>.
            </p>

            {(activeModal.type === 'hide' || activeModal.type === 'remove') && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Alasan Moderasi Konten (Wajib untuk Audit Staf)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Terbukti mengandung link spam / judi online / promosi terlarang..."
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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Terapkan Moderasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
