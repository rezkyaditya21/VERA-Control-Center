# PANDUAN SETUP VERA CONTROL CENTER & SUPABASE 🛡️

Dokumen ini berisi panduan resmi langkah demi langkah untuk mengonfigurasi database Supabase, menjalankan migrasi skema, dan membuat akun Super Admin pertama.

---

## 1. Setup Database di Supabase

1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Buat proyek baru atau gunakan proyek Supabase VERA yang sudah ada.
3. Buka menu **SQL Editor** di sidebar kiri.
4. Buka file migrasi berikut dari proyek:
   `supabase/migrations/20260907_vera_control_center.sql`
5. Salin seluruh isi skrip SQL tersebut, tempelkan ke SQL Editor Supabase, lalu klik **Run**.
6. Skrip ini akan otomatis membuat:
   - Tabel `profiles`, `roles`, `permissions`, `posts`, `comments`, `user_experiences`, `reports`, `moderation_actions`, `verifications`, `admin_audit_logs`, dan `system_settings`.
   - Fungsi keamanan RLS (`is_admin_or_super`, `is_staff`).
   - Kebijakan Row Level Security (RLS) ketat.
   - Seed data default untuk roles dan sistem pengaturan.

---

## 2. Membuat Akun Super Admin Pertama

Ada 2 cara membuat Super Admin:

### Cara A — Melalui Supabase Dashboard (Paling Mudah):
1. Buka menu **Authentication > Users** di Supabase.
2. Klik **Add User > Create User**.
3. Masukkan:
   - **Email**: `admin@vera.id`
   - **Password**: *(Masukkan kata sandi yang kuat)*
   - Centang **Auto Confirm User?** -> Ya.
4. Buka **SQL Editor** lagi dan jalankan perintah berikut untuk memberikan hak `SUPER_ADMIN`:
   ```sql
   -- Masukkan user_id dari akun yang baru dibuat ke tabel user_roles
   INSERT INTO public.user_roles (user_id, role_id)
   SELECT id, 'SUPER_ADMIN'
   FROM auth.users
   WHERE email = 'admin@vera.id'
   ON CONFLICT (user_id, role_id) DO NOTHING;
   ```

---

## 3. Konfigurasi Environment Variables

Di folder `C:\Users\rezky\Documents\vera-control-center`, buat file `.env.local`:

```env
# URL Proyek Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Anon Public Key (Aman untuk browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (RAHASIA - Hanya digunakan di sisi server!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **PERINGATAN KEAMANAN**:
> Jangan pernah menambahkan prefix `NEXT_PUBLIC_` pada `SUPABASE_SERVICE_ROLE_KEY`. Kunci service role memiliki bypass RLS penuh dan hanya boleh dijalankan di server Next.js.

---

## 4. Menjalankan Dashboard Secara Lokal

Buka Terminal / Command Prompt:

```bash
cd c:\Users\rezky\Documents\vera-control-center
npm run dev
```

Buka browser di:
👉 **[http://localhost:3000](http://localhost:3000)**

*Catatan: Jika kredensial Supabase belum diisi, dashboard otomatis berjalan dalam **Fallback Mode** dengan akun demonstrasi `admin@vera.id` sehingga Anda dapat langsung meninjau seluruh 11 halaman operasional tanpa kendala.*
