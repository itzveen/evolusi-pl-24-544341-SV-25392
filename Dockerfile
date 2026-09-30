# 1. Base Image - menggunakan versi resmi Alpine yang ringan dan ber-tag spesifik (sesuai Slide 11 & 14)
FROM php:8.4-cli-alpine

# 2. Folder kerja di dalam container
WORKDIR /var/www

# 3. Pasang ekstensi PHP yang dibutuhkan Laravel (sesuai Slide 11)
RUN apk add --no-cache sqlite-libs \
    && docker-php-ext-install pdo_mysql bcmath

# Salin binary Composer resmi
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 4. Urutan Cache: Salin daftar dependensi DULU sebelum kode aplikasi (sesuai Slide 11, 12, dan 17)
COPY composer.json composer.lock ./

# Pasang dependensi tanpa dev & scripts agar layer ini tersimpan di cache jika kode berubah
RUN composer install --no-dev --no-scripts --prefer-dist

# 5. Baru salin seluruh kode aplikasi
COPY . .

# Buat autoloader lengkap, siapkan environment default, dan inisialisasi database SQLite
RUN composer dump-autoload --optimize --no-dev \
    && cp -n .env.example .env || true \
    && php artisan key:generate --force \
    && touch database/database.sqlite \
    && php artisan migrate --force

# Port aplikasi (sesuai dokumentasi)
EXPOSE 8000

# Perintah saat container dinyalakan (menjalankan HTTP server bawaan Laravel)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
