# VERA CONTROL CENTER 🛡️
### Platform Operations & Moderation Console for VERA Social Decision Platform

> **"Pusat Komando Operasional, Moderasi & Administrasi Komunitas VERA"**

VERA Control Center adalah aplikasi web administrasi tingkat SaaS yang dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase PostgreSQL**. Berfungsi sebagai platform operations center yang aman, terisolasi dari aplikasi mobile pengguna, namun berbagi database yang sama melalui kebijakan Row Level Security (RLS) dan Role-Based Access Control (RBAC).

---

## 🏛️ Arsitektur Sistem & Fitur Utama

Dashboard ini mencakup 11 modul operasional terpadu:

1. **Autentikasi & RBAC Server-Side (`/login`)**:
   - Validasi sesi melalui Supabase Auth & Next.js Middleware.
   - Hak akses hierarkis: `SUPER_ADMIN` > `ADMIN` > `MODERATOR` > `USER`.
   - *Deny by Default*: User biasa dicegat di level middleware dengan respon 403 Forbidden.
2. **Dashboard Operasional (`/admin`)**:
   - KPI Real-time: Total Pengguna, Pengguna Aktif Hari Ini, Decision Room Baru, Laporan Tertunda.
   - Antrean Laporan Prioritas Kritis (Critical & High Priority).
   - Feed Verifikasi Pengalaman Masuk & Jejak Audit Terbaru.
3. **Manajemen Pengguna (`/admin/users`)**:
   - Pencarian live, filter status (`active`, `suspended`, `banned`), dan filter role.
   - Dialog konfirmasi penegakan aturan (Suspend dengan batas waktu, Ban permanen) dengan input alasan wajib.
   - Pemulihan akun (*Restore*).
4. **Detail Pengguna (`/admin/users/[id]`)**:
   - Kartu Decision Score (0-100) dan lencana reputasi penimbang.
   - Tab navigasi: *Ringkasan*, *Decision Rooms yang Dibuat*, *Komentar/Opini*, *Laporan Diajukan*, dan *Riwayat Moderasi*.
5. **Moderasi Konten / Decision Rooms (`/admin/posts`)**:
   - Filter status (`published`, `under_review`, `hidden`, `removed`).
   - Pemindaian skor risiko AI (*AI Risk Score*).
   - Tindakan Sembunyikan (*Hide*) dan Hapus Lembut (*Soft Delete / Remove*) dengan alasan audit.
6. **Detail Decision Room (`/admin/posts/[id]`)**:
   - Ringkasan kebutuhan pengguna, rentang budget, dan prioritas spesifik.
   - Panel AI Moderation Scan (Spam Risk, Harassment Risk).
   - Metrik partisipasi room (Partisipan menilai, Bukti pengalaman riil, % Terjawab).
7. **Moderasi Komentar & Opini (`/admin/comments`)**:
   - Filter sentimen (*Positif*, *Negatif*, *Netral*) dan ulasan berdurasi pakai (*Usage Duration*).
   - Identifikasi lencana *Pemilik Terverifikasi*.
   - Aksi Sembunyikan, Hapus, atau Pulihkan.
8. **Sistem Pelaporan Komunitas (`/admin/reports`)**:
   - Kategori: *Spam*, *Pelecehan*, *Ujaran Kebencian*, *Penipuan/Scam*, *Impersonasi*.
   - Tingkat prioritas: *Critical*, *High*, *Medium*, *Low*.
   - Status penanganan: *Pending*, *Reviewing*, *Resolved*, *Dismissed*.
9. **Investigasi & Penegakan Laporan (`/admin/reports/[id]`)**:
   - Pratinjau konten target dan pernyataan pelapor.
   - Formulir eksekusi keputusan moderasi (Dismiss, Warn, Hide, Remove, Suspend, Ban) dengan justifikasi wajib.
10. **Moderation Task Queue (`/admin/moderation`)**:
    - Alur kerja 3 jalur: *URGENT (Critical)*, *HIGH PRIORITY*, dan *NORMAL QUEUE*.
    - Sistem klaim tugas (*Claim Task*) untuk mencegah tumpang-tindih antar-moderator.
11. **Verifikasi Pengalaman Nyata (`/admin/verification`)**:
    - Antrean pemeriksaan bukti nota belanja, invoice e-commerce, dan foto unit fisik.
    - Modal pratinjau bukti dokumen resolusi tinggi.
    - Tombol *Approve* (memberikan badge hijau Verified) dan *Reject* (dengan catatan revisi).
12. **Manajemen Tim Staf (`/admin/admins`)**:
    - Penambahan staf baru dengan pembagian role RBAC.
    - Proteksi akun Super Admin (*Master Account*) agar tidak dapat dinonaktifkan sembarangan.
13. **Audit Log Tak Terubah (`/admin/audit-logs`)**:
    - Jejak audit *Write-Only* yang mencatat seluruh tindakan administratif: **WHO, WHAT, WHEN, TARGET, WHY, & IP ADDRESS**.
    - Filter berdasarkan nama staf dan jenis tindakan.
14. **Analitik & Kesehatan Platform (`/admin/analytics`)**:
    - Decision Resolution Rate, Rata-rata waktu pencapaian keputusan, Rasio ulasan terverifikasi.
    - Kepuasan nyata pasca pembelian (Outcome 90 hari: *Sesuai Ekspektasi*, *Puas*, *Menyesal*).
15. **Pengaturan Sistem (`/admin/settings`)**:
    - Pengaturan pendaftaran akun baru, ambang batas auto-moderation, batas ukuran bukti foto, dan mode darurat *Maintenance Mode*.

---

## 🛠️ Stack Teknologi

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Backend & Auth**: Supabase JS (`@supabase/supabase-js`, `@supabase/ssr`)
- **Database**: PostgreSQL with Row Level Security (RLS)

---

## 🚀 Cara Menjalankan Secara Lokal

```bash
# 1. Masuk ke direktori
cd c:\Users\rezky\Documents\vera-control-center

# 2. Jalankan development server
npm run dev
```

Buka browser di:
👉 **[http://localhost:3000/admin](http://localhost:3000/admin)**
Atau halaman login di:
👉 **[http://localhost:3000/login](http://localhost:3000/login)** (Gunakan email `admin@vera.id`)
