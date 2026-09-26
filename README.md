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
- **GitHub Actions** CI/CD — 4 tahap: `build` → `test` → `staging` → `production`

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
php artisan test
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

## 📁 Struktur Proyek

```
app/
├── Http/Controllers/GoalController.php   ← Controller utama
├── Models/Goal.php                        ← Eloquent model
database/
├── migrations/                            ← Skema database
resources/views/
├── goals/index.blade.php                  ← Tampilan utama
routes/
├── web.php                                ← Definisi routes
.github/workflows/
├── ci.yml                                 ← Pipeline 4 tahap (P3)
deploy.sh                                 ← Skrip deployment 7 langkah (P3)
```

---

## 👤 Identitas

- **Nama:** Gurveenderjeet Kaur
- **NIM:** 24/544341/SV/25392
- **Mata Kuliah:** Evolusi Perangkat Lunak 
