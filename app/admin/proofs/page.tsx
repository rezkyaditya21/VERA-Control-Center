'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Check,
  X,
  GitBranch,
  Globe,
  Award,
  FileText,
  Eye,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { MOCK_PROOFS } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { Proof, ProofStatus, ProofType } from '@/types/database';

export default function ProofsReviewPage() {
  const [proofs, setProofs] = useState<Proof[]>(MOCK_PROOFS);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ProofStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ProofType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getSafeDomain = (rawUrl?: string | null): string => {
    if (!rawUrl) return '';
    try {
      const url = new URL(rawUrl);
      return url.hostname;
    } catch {
      return rawUrl.substring(0, 30);
    }
  };

  const isSafeUrl = (rawUrl?: string | null): boolean => {
    if (!rawUrl) return false;
    const lower = rawUrl.trim().toLowerCase();
    return lower.startsWith('http://') || lower.startsWith('https://');
  };

  const handleDecision = async (id: string, decision: 'verify' | 'reject') => {
    if (decision === 'reject' && !rejectionNotes.trim()) {
      alert('Catatan penolakan wajib diisi agar pengguna mengetahui alasan bukti belum valid.');
      return;
    }

    setIsProcessing(true);
    try {
      // Call backend moderation API
      const res = await fetch('/api/moderation/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId: id,
          action: decision,
          reason: decision === 'reject' ? rejectionNotes : 'Bukti autentik dan memenuhi kriteria milestone',
        }),
      });

      const json = await res.json();
      if (!res.ok && json?.error) {
        console.warn('API warning:', json.error);
      }

      const newStatus: ProofStatus = decision === 'verify' ? 'verified' : 'rejected';

      setProofs((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                verification_status: newStatus,
                verified_at: new Date().toISOString(),
                rejection_reason: decision === 'reject' ? rejectionNotes : null,
              }
            : p
        )
      );

      showToast(
        decision === 'verify'
          ? 'Bukti diverifikasi! Badge Verified aktif pada milestone pengguna.'
          : 'Bukti ditolak dengan catatan peninjauan.'
      );
    } catch (err) {
      console.error('Failed to moderate proof:', err);
      showToast('Gagal memproses bukti.');
    } finally {
      setIsProcessing(false);
      setSelectedProof(null);
      setRejectionNotes('');
    }
  };

  const getProofTypeIcon = (type: ProofType) => {
    switch (type) {
      case 'github':
        return <GitBranch className="w-4 h-4 text-emerald-400" />;
      case 'website':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const filtered = proofs.filter((p) => {
    if (statusFilter !== 'all' && p.verification_status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchUser = p.user?.username?.toLowerCase().includes(q) || p.user?.full_name?.toLowerCase().includes(q);
      const matchProg = p.progress?.title?.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchProg) return false;
    }
    return true;
  });

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
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Peninjauan Bukti Nyata (*Proof Verification*)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validasi link GitHub, demo web, sertifikat, dan artefak karya pengguna untuk menjaga kredibilitas ekosistem VERA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'unverified', 'verified', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st === 'unverified' ? 'Pending Review' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bukti, username, atau judul perjalanan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 text-sm text-white rounded-xl focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'github', 'website', 'certificate', 'other'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-colors ${
                typeFilter === t
                  ? 'bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Proofs Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((proof) => (
          <div
            key={proof.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header: User info & Verification Badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 border border-slate-700 text-xs">
                    {proof.user?.username ? proof.user.username.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">@{proof.user?.username || 'user'}</h3>
                    <p className="text-xs text-slate-400">{proof.progress?.title || 'Perjalanan VERA'}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    proof.verification_status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : proof.verification_status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {proof.verification_status === 'verified' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {proof.verification_status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                  {proof.verification_status === 'unverified' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {proof.verification_status.toUpperCase()}
                </span>
              </div>

              {/* Proof Title & Description */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  {getProofTypeIcon(proof.type)}
                  <h4 className="text-sm font-semibold text-slate-100">{proof.title}</h4>
                </div>
                {proof.description && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{proof.description}</p>
                )}
              </div>

              {/* External URL Check */}
              {proof.external_url && (
                <div className="mb-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono text-emerald-400 truncate">
                      {getSafeDomain(proof.external_url)}
                    </span>
                  </div>
                  {isSafeUrl(proof.external_url) ? (
                    <a
                      href={proof.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 transition-colors"
                    >
                      Buka Tautan <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Protokol Dicurigai
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>{formatDate(proof.created_at)}</span>

              <div className="flex items-center gap-2">
                {proof.verification_status !== 'verified' && (
                  <button
                    onClick={() => handleDecision(proof.id, 'verify')}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Verifikasi
                  </button>
                )}
                {proof.verification_status !== 'rejected' && (
                  <button
                    onClick={() => setSelectedProof(proof)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-medium rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Tolak
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Tidak ada bukti dalam antrean</h3>
          <p className="text-xs text-slate-500 mt-1">Semua bukti perjalanan pengguna telah selesai ditinjau.</p>
        </div>
      )}

      {/* Modal Rejection Notes */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Tolak Verifikasi Bukti
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Berikan alasan penolakan agar pengguna mengerti mengapa bukti ini belum memenuhi kriteria validasi VERA.
            </p>

            <textarea
              rows={3}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Contoh: Tautan repositori GitHub tidak dapat diakses (404), atau file bukan sertifikat resmi..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedProof(null);
                  setRejectionNotes('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={() => handleDecision(selectedProof.id, 'reject')}
                disabled={isProcessing || !rejectionNotes.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
