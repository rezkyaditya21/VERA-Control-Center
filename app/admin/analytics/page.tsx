'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Decision Resolution Rate', value: '73.4%', desc: 'Persentase room yang berhasil memilih pemenang', change: '+4.1%' },
    { label: 'Avg. Decision Time', value: '18 Jam', desc: 'Rata-rata waktu dari tanya hingga keputusan diambil', change: '-2 Jam' },
    { label: 'Verified Experience Ratio', value: '38.2%', desc: 'Proporsi ulasan dengan bukti nota asli', change: '+12.5%' },
    { label: 'Avg. Report Resolution', value: '14 Menit', desc: 'Kecepatan respon moderator menangani laporan', change: 'Super Fast' },
  ];

  const categoryDistribution = [
    { name: 'Elektronik & Gadget', count: 1240, percentage: 38 },
    { name: 'Gaming & PC Build', count: 856, percentage: 26 },
    { name: 'Fashion & Apparel', count: 910, percentage: 18 },
    { name: 'Otomotif & Motor', count: 642, percentage: 12 },
    { name: 'Lainnya', count: 420, percentage: 6 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Analitik & Kesehatan Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Metrik operasional sosial VERA: konversi keputusan, kepuasan komunitas, dan efisiensi moderasi.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              {m.label}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{m.value}</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{m.change}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown & Outcome Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Distribusi Kategori Decision Room</span>
          </h3>
          <div className="space-y-3">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">{cat.name}</span>
                  <span className="font-mono text-slate-400">
                    {cat.count} Room ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 90-Day Outcome Satisfaction */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Kepuasan Nyata Pasca Pembelian (90 Hari)</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">100% Sesuai Ekspektasi</span>
              <span className="font-mono text-emerald-400 font-bold">81.4%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[81.4%]"></div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300">Puas dengan Sedikit Kompromi</span>
              <span className="font-mono text-blue-400 font-bold">14.2%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full w-[14.2%]"></div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300">Menyesal / Salah Keputusan</span>
              <span className="font-mono text-rose-400 font-bold">4.4%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full w-[4.4%]"></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            *Data dikumpulkan dari check-in otomatis 90 hari setelah pengguna mengklik tombol "Pilih Produk Ini".
          </p>
        </div>
      </div>
    </div>
  );
}
