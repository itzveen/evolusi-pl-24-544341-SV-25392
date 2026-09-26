#!/usr/bin/env bash
#
# deploy.sh - Skrip deployment Laravel (7 langkah)
# Dijalankan di server setelah kode versi baru ditarik.
# set -e (wu) -> script berhenti segera jika ada perintah yang gagal.
# -u -> dipakai variabel yang belum di-set dianggap error
# -o pipefail -> pipeline dihitung gagal kalau salah satu perintah gagal
#
set -euo pipefail

cd /var/www/aplikasi

# 1. Kunci pintu: tampilkan halaman pemeliharaan
php artisan down --retry=60

# 2. Ambil kode terbaru
git pull origin main

# 3. Pasang dependensi tanpa paket dev
composer install --no-dev --optimize-autoloader

# 4. Ubah skema basis data
php artisan migrate --force

# 5. Bangun ulang cache dengan kode & config baru
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Muat ulang pekerja antrean
php artisan queue:restart

# 7. Buka pintu kembali
php artisan up
