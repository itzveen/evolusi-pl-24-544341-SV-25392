# Evolusi PL — Goal Tracker

Aplikasi web sederhana berbasis **Laravel** untuk mencatat dan mengelola goals/tujuan pribadi.

Dibuat sebagai tugas praktikum **Evolusi Perangkat Lunak** — KEPL2026.

---

## 📋 Fitur

- Menampilkan daftar goal dari database
- Tambah goal baru melalui form
- Hapus goal yang sudah selesai
- Validasi input di sisi server

---

## 🛠️ Teknologi

- **PHP 8.4** + **Laravel 13**
- **SQLite** (development) / MySQL (production)
- **Blade** templating engine
- **Vue 3** + **Vue Router** + **Vite** (folder `frontend/`)
- **Vitest** untuk unit test frontend
- **GitHub Actions** CI/CD — dua pipeline:
  - `ci.yml` (backend): `build` → `test` → `staging` → `production`
  - `frontend.yml` (frontend): `lint` → `test` → `build` → `deploy`

---

## 🚀 Menjalankan di Lokal

### Prasyarat

Pastikan sudah terinstal:
- PHP >= 8.3
- Composer
- Node.js & npm (opsional, untuk asset)

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/KEPL2026/evolusi-pl-24-544341-SV-25392.git
cd evolusi-pl-24-544341-SV-25392

# 2. Install dependensi PHP
composer install

# 3. Salin file environment
cp .env.example .env

# 4. Generate app key
php artisan key:generate

# 5. Buat file database SQLite
touch database/database.sqlite

# 6. Jalankan migrasi
php artisan migrate

# 7. Jalankan server lokal
php artisan serve
```

Akses aplikasi di: **http://localhost:8000**

---

## 🧪 Menjalankan Tests

```bash
php artisan test                        # backend (PHPUnit)

cd frontend
npm test                                # frontend (Vitest) — tanpa Laravel
npm run lint                            # ESLint
```

---

## 🔌 Endpoint JSON untuk Frontend (Pertemuan 04)

Aplikasi Vue di `frontend/` membaca data lewat endpoint JSON, bukan HTML.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/goals` | Daftar semua goal beserta persentase dan status selesai |
| `GET` | `/api/goals/{goal}` | Detail satu goal |

Contoh respons:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Baca 10 buku",
      "target": 10,
      "progress": 3,
      "unit": "buku",
      "percentage": 30,
      "is_completed": false
    }
  ],
  "meta": { "total": 1, "completed": 0 }
}
```

**CORS** diatur di `config/cors.php`. Origin Vue di laptop sudah dicantumkan
eksplisit, jadi tidak memakai `*`:

| Origin |dipakai oleh |
|---|---|
| `http://localhost:5173` | `npm run dev` |
| `http://localhost:4173` | `npm run preview` |
| `env('FRONTEND_ORIGIN')` | domain Vercel produksi |

Uji cepat:

```bash
curl -H "Origin: http://localhost:5173" http://127.0.0.1:8000/api/goals
```

---

## 🏗️ Struktur Branch

```
main        ← production (protected)
└── dev     ← staging/development (protected)
    └── feature/goal-tracker  ← fitur yang dikerjakan
```

**Alur kerja:**
1. Buat branch `feature/<nama>` dari `dev`
2. Kerjakan fitur, lalu buka PR: `feature` → `dev`
3. Setelah review, buka PR: `dev` → `main`
4. Tidak ada push langsung ke `main` atau `dev`

---

## ⚙️ Pipeline CI/CD (Pertemuan 03)

Workflow `.github/workflows/ci.yml` berisi **4 job berantai** yang dirangkai dengan `needs:`.
Setiap job hanya berjalan bila job sebelumnya **sukses**.

```
build  ──▶  test  ──▶  staging  ──▶  production
```

| # | Job | `needs:` | Syarat | Isi |
|---|-----|----------|--------|-----|
| 1 | `build` | — | — | `composer install --no-dev` + upload artifact `vendor/` |
| 2 | `test` | `build` | — | `composer install` (dev), `key:generate`, SQLite in-memory, `php artisan test` |
| 3 | `staging` | `test` | — | Simulasi deploy ke staging (`echo`) |
| 4 | `production` | `staging` | `if: github.ref == 'refs/heads/main'` | 7 langkah `deploy.sh` (`echo`), memakai environment `production` |

**Penjaga job `production`:**

```yaml
production:
  needs: staging
  if: github.ref == 'refs/heads/main'   # hanya branch main
  environment:
    name: production                    # wajib approval reviewer
```

- Push ke branch `feature/**` atau `dev` → `build` dan `test` tetap jalan,
  `production` otomatis **skipped** karena `github.ref` bukan `refs/heads/main`.
- Push ke `main` → seluruh 4 job jalan, dan `production` **menunggu approval**
  reviewer environment sebelum eksekusi.
- Kalau `test` gagal, `staging` dan `production` **tidak dijalankan** sama sekali
  (effect chain dari `needs:`).

### 🚀 Skrip Deployment

`deploy.sh` di root repository berisi 7 langkah deployment dan memakai `set -e`
(berhenti segera jika ada perintah gagal):

```bash
#!/usr/bin/env bash
set -e
cd /var/www/aplikasi
php artisan down --retry=60      # 1. kunci pintu
git pull origin main             # 2. ambil kode terbaru
composer install --no-dev --optimize-autoloader   # 3. pasang dependensi
php artisan migrate --force      # 4. ubah skema basis data
php artisan config:cache         # 5. bangun ulang cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart        # 6. muat ulang worker antrean
php artisan up                   # 7. buka pintu
```

> Deploy ke server asli belum dilakukan — pada job `production` langkah-langkah ini
> masih ditulis sebagai `echo` sesuai instruksi tugas.

---

## 🎨 Pipeline Frontend (Pertemuan 04)

Workflow `.github/workflows/frontend.yml` berisi **4 job berantai** untuk
aplikasi Vue di `frontend/`:

```
lint  ──▶  test  ──▶  build  ──▶  deploy
```

| # | Job | `needs:` | Isi |
|---|-----|----------|-----|
| 1 | `lint` | — | `npm ci` + `npm run lint` (ESLint) |
| 2 | `test` | `lint` | `npm ci` + `npm test` (Vitest) |
| 3 | `build` | `test` | `npm ci` + `npm run build`, unggah `dist/` sebagai artifact |
| 4 | `deploy` | `build` | unduh `dist/`, tampilkan ke log, kirim ke Vercel |

Setiap job memakai `cache: 'npm'` dari `actions/setup-node`.

### `dist/` tanpa build ulang

Job `deploy` **tidak pernah** menjalankan `npm run build`. Ia hanya:

1. mengunduh artifact `frontend-dist` yang dibuat job `build`,
2. mencetak isi `dist/` ke log sebagai bukti,
3. mengirim folder itu apa adanya ke Vercel (`buildCommand` dikosongkan di
   `frontend/vercel.json`, jadi Vercel tidak membangun ulang).

Kalau `test` gagal, `build` dan `deploy` **tidak dijalankan** sama sekali
(effect chain dari `needs:`).

### Penjaga deploy

```yaml
deploy:
  needs: build
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

- **Pull Request** → `lint`, `test`, `build` jalan; `deploy` **skipped**.
- **Push ke `main`** → keempat job jalan, lalu menunggu approval reviewer
  pada environment `production-frontend`.

### Deploy ke Vercel

Bonus deploy ke Vercel butuh dua hal:

1. **Secret** `VERCEL_TOKEN` (opsional `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
   Buat di **Settings → Secrets and variables → Actions**.
2. **Matikan deploy otomatis Vercel** di *Project Settings → Git* — centang
   opsinya dimatikan. Kalau tidak, Vercel ikut rebuild sendiri saat commit
   masuk, dan syarat "tanpa build ulang" tidak berlaku lagi.

Variabel `VITE_API_URL` (Settings → Secrets and variables → Actions →
*Variables*) dipakai job `build` untuk meng-inline alamat API Laravel ke
hasil build.

Alamat API dibaca di `frontend/src/lib/api.js` dari `import.meta.env`,
tidak ada URL yang ditulis langsung di kode.

---

## 📁 Struktur Proyek

```
app/
├── Http/Controllers/GoalController.php        ← Controller CRUD (Blade)
├── Http/Controllers/Api/GoalApiController.php ← Controller JSON
├── Models/Goal.php                             ← Eloquent model
config/
├── cors.php                                    ← Izin origin untuk Vue
database/
├── migrations/                                 ← Skema database
frontend/
├── src/views/                                  ← Beranda, Goals, Detail
├── src/components/                             ← GoalCard, ApiErrorAlert
├── src/lib/api.js                              ← Klien API (VITE_API_URL)
├── src/lib/goalFormat.js                       ← Logika murni (diuji Vitest)
├── src/lib/*.test.js                           ← Unit test
├── vercel.json                                 ← Rewrite SPA
└── .env.example                                ← VITE_API_URL
resources/views/
├── goals/index.blade.php                       ← Tampilan utama
routes/
├── web.php                                     ← Route Blade
├── api.php                                     ← Route JSON /api/goals
tests/Feature/GoalApiTest.php                   ← Uji endpoint + CORS
.github/workflows/
├── ci.yml                                      ← Pipeline backend 4 tahap (P3)
├── frontend.yml                                ← Pipeline frontend 4 job (P4)
deploy.sh                                      ← Skrip deployment 7 langkah (P3)
```

---

## 👤 Identitas

- **Nama:** Gurveenderjeet Kaur
- **NIM:** 24/544341/SV/25392
- **Mata Kuliah:** Evolusi Perangkat Lunak 
