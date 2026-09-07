# VERA Social Decision Platform — End-to-End System Integration

> **Architectural Overview**: Integrasi menyeluruh antara **VERA Mobile Application** (React Native / Expo) dan **VERA Control Center** (Next.js App Router Web Admin) menggunakan satu Single Source of Truth backend: **Supabase PostgreSQL**.

---

## 1. Arsitektur Terpadu (Single Source of Truth)

```
                       ┌──────────────────────────────────────┐
                       │           VERA Mobile App            │
                       │    (React Native + Expo SDK 57)      │
                       └──────────────────┬───────────────────┘
                                          │
                               (Anon Key, RLS Enforced)
                                          │
                                          ▼
                       ┌──────────────────────────────────────┐
                       │        Supabase / PostgreSQL         │
                       │──────────────────────────────────────│
                       │  • profiles        • candidates      │
                       │  • posts           • reports         │
                       │  • comments        • verifications   │
                       │  • user_exp        • audit_logs      │
                       │  • roles & perms   • settings        │
                       └──────────────────┬───────────────────┘
                                          │
                              (Authorized Server API,
                              Service Role Key Server-Only)
                                          │
                                          ▼
                       ┌──────────────────────────────────────┐
                       │         VERA Control Center          │
                       │      (Next.js 16 App Router)         │
                       └──────────────────────────────────────┘
```

---

## 2. Alur Data Terintegrasi (End-to-End Data Flows)

### A. Alur Pembuatan Post (Decision Room)
1. **User Mobile**: Mengisi formulir kebutuhan di `CreateDecisionScreen` (kategori, budget min-max, preferensi, kandidat).
2. **Validasi Akun**: Mobile memeriksa `userStatus`. Jika pengguna berstatus `suspended` atau `banned`, aksi diblokir dengan pesan edukasi.
3. **Penyimpanan Database**: `apiService.createRoom` mengirimkan data ke tabel `posts` dan `candidates` di PostgreSQL.
4. **Admin Sinkron**: Decision Room baru langsung tercatat dengan status `published` dan dapat dipantau di halaman `/admin/posts` Web Control Center.

### B. Alur Pelaporan Konten (Report Flow)
1. **User Mobile**: Menemukan konten mencurigakan atau melanggar TOS pada `DecisionRoomScreen`.
2. **Tombol Flag & Modal**: Pengguna menekan tombol bendera (`flag-outline`) di header kanan dan memilih kategori pelanggaran (`scam`, `harassment`, `hate`, `spam`, `other`) serta mengisi detail insiden.
3. **Database Write**: Terkirim ke tabel `reports` dengan status `pending` dan prioritas otomatis.
4. **Admin Resolusi**: Moderator/Admin membuka `/admin/reports`, meninjau bukti, dan mengambil tindakan (`resolve` atau `dismiss`).
5. **Audit Trail**: Keputusan dicatat otomatis ke `admin_audit_logs`.

### C. Alur Moderasi Konten & Reaktivitas Mobile
1. **Admin Hide/Remove**: Admin menekan aksi **Hide** atau **Remove** pada `/admin/posts/[id]` atau `/admin/moderation`.
2. **Authorized API**: Panggilan dialirkan ke `/api/moderation/post` dengan verifikasi izin RBAC (`posts.hide` / `posts.delete`).
3. **Database Update**: Status post diubah menjadi `hidden` atau `removed` beserta alasan (`removed_reason`) dan timestamp.
4. **Mobile Enforcement**: Feed beranda mobile (`HomeScreen.js`) memfilter query secara reaktif:
   ```javascript
   const publishedRooms = (rooms || []).filter(
     (r) => r.status !== 'hidden' && r.status !== 'removed'
   );
   ```
   Post yang disembunyikan atau dihapus tidak lagi tampil pada pengguna biasa.

### D. Alur Penangguhan Akun (User Suspension / Ban)
1. **Admin User Management**: Admin membuka `/admin/users/[id]` dan memilih **Suspend** (dengan durasi 24-72 jam) atau **Permanent Ban**.
2. **Proteksi RBAC**: Hanya role `ADMIN` dan `SUPER_ADMIN` yang dapat melakukan ban permanen (`users.ban`). Percobaan oleh role `MODERATOR` ditolak dengan status HTTP 403 Forbidden.
3. **Pencatatan Audit**: Aksi tercatat di `admin_audit_logs` dengan aksi `USER_SUSPENDED` atau `USER_BANNED`.
4. **Mobile Enforcement**: Pengguna yang berstatus `suspended` atau `banned` tidak dapat membuat Decision Room baru atau berpartisipasi dalam voting.

---

## 3. Matriks Peran & Izin (Role-Based Access Control)

| Izin (Permission) | USER | MODERATOR | ADMIN | SUPER_ADMIN |
|-------------------|:----:|:---------:|:-----:|:-----------:|
| `users.view` | ❌ | ✅ | ✅ | ✅ |
| `users.suspend` | ❌ | ❌ | ✅ | ✅ |
| `users.ban` | ❌ | ❌ | ✅ | ✅ |
| `posts.view` | ❌ | ✅ | ✅ | ✅ |
| `posts.hide` | ❌ | ✅ | ✅ | ✅ |
| `posts.delete` | ❌ | ❌ | ✅ | ✅ |
| `reports.resolve` | ❌ | ✅ | ✅ | ✅ |
| `verification.approve` | ❌ | ✅ | ✅ | ✅ |
| `admins.manage` | ❌ | ❌ | ❌ | ✅ |
| `audit_logs.view` | ❌ | ❌ | ✅ | ✅ |

---

## 4. Keamanan & Isolasi Kredensial

1. **Anon Key vs Service Role Key**:
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` digunakan pada aplikasi mobile dan browser publik.
   - `SUPABASE_SERVICE_ROLE_KEY` **hanya** berada di server Next.js (`lib/supabase/admin.ts`). Tidak pernah disertakan dalam bundle React Native atau browser client.
2. **Row Level Security (RLS)**:
   - Tabel `admin_audit_logs` dan `system_settings` sepenuhnya terisolasi dan tidak dapat diakses oleh role `USER`.
   - Modifikasi status penting (moderasi/suspensi) dijamin melalui server-side route handler terotorisasi.
3. **Resilience & Dual-Mode**:
   - Sistem dirancang dengan arsitektur toleran kegagalan (dual-mode): jika koneksi Supabase langsung aktif, data disinkronkan langsung ke PostgreSQL; jika dalam mode demo/pengembangan offline, fallback data lokal yang aman diaktifkan tanpa membuat aplikasi crash.
