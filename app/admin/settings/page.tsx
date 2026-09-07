'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldAlert,
  Save,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { MOCK_SETTINGS } from '@/lib/mockData';

export default function SettingsPage() {
  const [platformName, setPlatformName] = useState('VERA Social Platform');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [autoModThreshold, setAutoModThreshold] = useState(85);
  const [maxUploadMb, setMaxUploadMb] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Konfigurasi operasional sistem berhasil disimpan.');
    setTimeout(() => setToastMessage(null), 3000);
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
            Pengaturan Operasional Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Konfigurasi aturan moderasi otomatis, batasan unggahan bukti, dan parameter sistem.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Section 1: General */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
            Pengaturan Umum Platform
          </h3>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nama Resmi Platform
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-semibold text-white block">Izinkan Pendaftaran Pengguna Baru</span>
              <span className="text-[11px] text-slate-500">Membuka pendaftaran akun penimbang baru secara publik.</span>
            </div>
            <input
              type="checkbox"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
            />
          </div>
        </div>

        {/* Section 2: Moderation & Anti-Spam */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
            Ambang Batas Moderasi & Anti-Buzzer
          </h3>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Ambang Batas AI Auto-Flag
              </label>
              <span className="font-mono text-blue-400 font-bold">{autoModThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={autoModThreshold}
              onChange={(e) => setAutoModThreshold(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Konten dengan skor risiko kecurangan di atas {autoModThreshold}% akan otomatis masuk antrean Under Review.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Batas Maksimal Ukuran Foto Bukti Invoice (MB)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxUploadMb}
              onChange={(e) => setMaxUploadMb(Number(e.target.value))}
              className="w-32 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Section 3: Critical Security & Maintenance */}
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Mode Darurat & Pemeliharaan</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Kunci Platform (Maintenance Mode)</span>
              <span className="text-[11px] text-slate-400">
                Aplikasi mobile hanya dapat dibuka oleh staf dengan role ADMIN atau SUPER_ADMIN.
              </span>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => {
                if (!maintenanceMode && !confirm('PERINGATAN: Mengaktifkan Maintenance Mode akan membatasi akses ribuan pengguna. Lanjutkan?')) {
                  return;
                }
                setMaintenanceMode(e.target.checked);
              }}
              className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-950 border-slate-700"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
