'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessagesSquare,
  Search,
  EyeOff,
  Trash2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { MOCK_COMMENTS } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Comment } from '@/types/database';

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positif' | 'negatif' | 'netral'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAction = (id: string, action: 'hide' | 'delete' | 'restore') => {
    setComments(
      comments.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: action === 'hide' ? 'hidden' : action === 'delete' ? 'removed' : 'published',
          };
        }
        return c;
      })
    );
    showToast(
      action === 'hide'
        ? 'Komentar disembunyikan dari publik.'
        : action === 'delete'
        ? 'Komentar berhasil dihapus.'
        : 'Komentar berhasil dipulihkan.'
    );
  };

  const filteredComments = comments.filter((c) => {
    const matchesSearch =
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.author?.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.post_title || '').toLowerCase().includes(search.toLowerCase());
    const matchesSentiment = sentimentFilter === 'all' || c.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });

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
            Moderasi Komentar & Opini Komunitas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau ulasan pengguna, deteksi ujaran kebencian, dan lindungi diskusi yang beradab.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari isi komentar, author, atau room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'positif', 'negatif', 'netral'] as const).map((sent) => (
            <button
              key={sent}
              onClick={() => setSentimentFilter(sent)}
              className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-colors ${
                sentimentFilter === sent
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sent === 'all' ? 'Semua Sentimen' : sent}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={comment.author?.avatar_url}
                  alt={comment.author?.full_name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                />
                <div>
                  <span className="text-xs font-semibold text-white">
                    {comment.author?.full_name} (@{comment.author?.username})
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    {comment.verified_owner && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <BadgeCheck className="w-3 h-3" /> Pemilik Terverifikasi
                      </span>
                    )}
                    <span>• {comment.usage_duration}</span>
                    <span>• {formatDate(comment.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getStatusColor(
                    comment.status
                  )}`}
                >
                  {comment.status}
                </span>

                {comment.status === 'published' ? (
                  <>
                    <button
                      onClick={() => handleAction(comment.id, 'hide')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                      title="Sembunyikan"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAction(comment.id, 'delete')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleAction(comment.id, 'restore')}
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-200">
              "{comment.content}"
            </div>

            {comment.post_title && (
              <p className="text-[11px] text-slate-500">
                Pada Room:{' '}
                <Link
                  href={`/admin/posts/${comment.post_id}`}
                  className="text-slate-400 hover:text-blue-400 font-medium"
                >
                  {comment.post_title}
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
