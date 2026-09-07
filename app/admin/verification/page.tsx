'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Check,
  X,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { MOCK_VERIFICATIONS } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';
import { VerificationRequest, VerificationStatus } from '@/types/database';

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>(MOCK_VERIFICATIONS);
  const [selectedVer, setSelectedVer] = useState<VerificationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !rejectionNotes.trim()) {
      alert('Alasan penolakan verifikasi wajib diisi agar pengguna dapat memperbaiki dokumennya.');
      return;
    }

    setVerifications(
      verifications.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            status: decision,
            reviewer_notes: decision === 'rejected' ? rejectionNotes : 'Dokumen invoice dan foto unit valid.',
            reviewed_at: new Date().toISOString(),
          };
        }
        return v;
      })
    );

    showToast(
      decision === 'approved'
        ? 'Verifikasi Disetujui! Lencana Verified diberikan kepada pengguna.'
        : 'Verifikasi Ditolak dengan catatan perbaikan.'
    );

    setSelectedVer(null);
    setRejectionNotes('');
  };

  const filtered = verifications.filter((v) => {
    if (statusFilter === 'all') return true;
    return v.status === statusFilter;
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
            Verifikasi Pengalaman Nyata (*Verified Experience*)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tinjau bukti struk pembelian, invoice, dan foto unit fisik untuk memberikan lencana Verified.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
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

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4">
              <img
                src={item.user?.avatar_url}
                alt={item.user?.full_name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700 mt-1"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase font-bold ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pemohon: <strong className="text-slate-200">@{item.user?.username}</strong> ({item.user?.full_name}) • Decision Score: {item.user?.decision_score}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono pt-1">
                  <span>Merchant: {(item.submitted_info as any)?.merchant}</span>
                  <span>•</span>
                  <span>Invoice: {(item.submitted_info as any)?.invoice_number}</span>
                  <span>•</span>
                  <span>Diajukan: {formatDate(item.submitted_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedVer(item)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lihat Bukti Foto</span>
              </button>

              {item.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleDecision(item.id, 'approved')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setSelectedVer(item)}
                    className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Proof Modal */}
      {selectedVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Dokumen Bukti Verifikasi: {selectedVer.title}</span>
              </h3>
              <button
                onClick={() => setSelectedVer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Pemohon: <strong className="text-white">@{selectedVer.user?.username}</strong> — Silakan periksa keaslian bukti pembelian dan nomor invoice.
              </p>

              {/* Photo Evidence Grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedVer.document_urls.map((url, idx) => (
                  <div key={idx} className="space-y-1">
                    <img
                      src={url}
                      alt={`Bukti Dokumen ${idx + 1}`}
                      className="w-full h-44 object-cover rounded-xl border border-slate-800 ring-1 ring-slate-700"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Lampiran #{idx + 1}</span>
                  </div>
                ))}
              </div>

              {selectedVer.status === 'pending' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Catatan Moderator (Diperlukan jika Reject)
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Contoh: Foto nota buram / tidak terlihat tanggal pembelian..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedVer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
              {selectedVer.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedVer.id, 'rejected')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Tolak Verifikasi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedVer.id, 'approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Setujui (Beri Verified)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
