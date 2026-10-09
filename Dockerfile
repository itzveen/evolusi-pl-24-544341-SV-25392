# =============================================================================
# STAGE 1 — builder
# Berisi semua perkakas build: Composer, header pustaka, kompilasi ekstensi.
# Stage ini TIDAK masuk ke image akhir — hanya hasilnya yang disalin.
# =============================================================================
FROM php:8.4-cli-alpine AS builder

# Pasang header pustaka (-dev) dan perkakas build yang hanya dibutuhkan
# saat kompilasi ekstensi PHP. Setelah di-COPY --from=builder ke stage runner,
# semua ini akan ditinggal di sini dan tidak masuk image akhir.
RUN apk add --no-cache \
        $PHPIZE_DEPS \
        libpng-dev \
        libxml2-dev \
        sqlite-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_sqlite bcmath \
    && apk del $PHPIZE_DEPS

# Ambil Composer dari image resmi — versi dikunci ke 2.8, bukan latest.
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# --- Langkah paling penting untuk cache layer ---
# 4a. Salin daftar dependensi dulu (composer.json & composer.lock).
#     Layer ini hanya batal jika dua file ini berubah.
COPY composer.json composer.lock ./

# 4b. Install dependensi produksi.
#     --no-dev   : lewati paket test/dev
#     --no-scripts: jangan jalankan script Artisan (kodenya belum ada)
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-progress \
        --prefer-dist \
        --no-interaction

# 4c. Baru setelah itu salin seluruh kode aplikasi.
#     Jika hanya kode yang berubah (bukan composer.json), layer vendor di atas
#     tetap terpasang dari cache.
COPY . .

# Finalisasi build:
# - dump-autoload  : autoloader kelas produksi yang lebih cepat
# - cp .env.example: .env asli dikecualikan .dockerignore → pakai default aman
# - key:generate   : APP_KEY dibuat di dalam image
# - migrate + seed : skema & data awal langsung tersedia
# - cache          : config, route, view di-cache agar lebih cepat saat serve
# - chown          : ubah kepemilikan folder agar www-data bisa menulis
RUN cp .env.example .env \
    && php artisan key:generate --force \
    && touch database/database.sqlite \
    && php artisan migrate --force --seed \
    && composer dump-autoload --optimize --no-dev --no-scripts \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache


# =============================================================================
# STAGE 2 — runner
# Image bersih — hanya runtime yang dibutuhkan aplikasi saat melayani.
# Composer, header -dev, Git, dan perkakas build TIDAK ada di sini.
# =============================================================================
FROM php:8.4-cli-alpine AS runner

# Pasang HANYA pustaka runtime (tanpa -dev).
# Ini yang dibutuhkan ekstensi PHP saat aplikasi berjalan.
RUN apk add --no-cache \
        libpng \
        libxml2 \
        sqlite-libs \
        curl

# Salin HANYA yang dibutuhkan dari stage builder:
# 1. Ekstensi PHP yang sudah dikompilasi
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
# 2. Konfigurasi PHP yang mengaktifkan ekstensi tersebut
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
# 3. Folder aplikasi beserta vendor/ dan file .env yang sudah siap
COPY --from=builder /app /var/www

WORKDIR /var/www

# Pastikan www-data punya izin tulis di folder yang dibutuhkan Laravel.
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# -----------------------------------------------------------------------------
# Keamanan: jalankan aplikasi sebagai non-root user.
# Jika container ditembus, penyerang hanya mendapat hak akses www-data,
# bukan root. Instruksi USER harus SETELAH semua RUN yang butuh hak root.
# -----------------------------------------------------------------------------
USER www-data

# Port yang digunakan server bawaan Laravel (hanya catatan, bukan membuka port).
EXPOSE 8000

# -----------------------------------------------------------------------------
# HEALTHCHECK — Docker menjalankan curl ke halaman utama secara berkala.
# Status container akan tampil sebagai (healthy) atau (unhealthy) di docker ps.
#   --interval  : periksa setiap 30 detik
#   --timeout   : dianggap gagal jika tidak respons dalam 5 detik
#   --start-period: beri waktu 30 detik untuk aplikasi pertama kali nyala
#   --retries   : tandai unhealthy setelah 3 kali gagal berturut-turut
# -----------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://127.0.0.1:8000 || exit 1

# Perintah saat container nyala.
# --host=0.0.0.0 WAJIB: tanpa ini server hanya mendengarkan di dalam container
# dan tidak bisa dihubungi dari luar lewat flag -p.
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
