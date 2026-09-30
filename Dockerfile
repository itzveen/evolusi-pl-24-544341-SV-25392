
FROM php:8.4-cli-alpine
# -----------------------------------------------------------------------------
# 2. WORKDIR — folder kerja untuk semua instruksi berikutnya (pengganti `cd`).
# -----------------------------------------------------------------------------
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql bcmath \
    && apk del --no-network .build-deps
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# #############################################################################
#  #  BAGIAN PALING PENTING — URUTAN LAYER UNTUK CACHE                          #
#  #############################################################################
#  suspeito perubahan kode (app/, routes/, resources/) tidak boleh
#  membatalkan cache di sini.
# -----------------------------------------------------------------------------

# 4a. Salin DAFTAR dependensi saja — belum ada kode aplikasi.
#     Karena yang dicopy hanya dua file ini, layer ini hanya batal
#     kalau composer.json / composer.lock ikut berubah.
COPY composer.json composer.lock ./

# 4b. Jalankan composer install.
#     Layer inilah yang paling mahal (ratusan paket Laravel), dan sekarang
#     dia aman dari cache. --no-dev melewati paket test, --no-scripts
#     mencegah script Artisan berjalan sebelum kodenya ada.
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-progress \
        --prefer-dist \
        --no-interaction

# 4c. Baru SETELAH itu, seluruh kode aplikasi disalin.
#    Layer inilah yang sering "CACHED" pada build kedua dan ketiga.
COPY . .

# -----------------------------------------------------------------------------
# 5. Penyelesaian build (semua di layer terakhir, setelah `COPY . .`).
#    - composer dump-autoload : autoloader kelas produksi, lebih cepat
#    - cp .env.example .env   : .env asli DIKECUALIKAN .dockerignore (Slide 14:
#                               "menaruh rahasia di Dockerfile"), jadi image
#                               memakai konfigurasi default yang aman.
#    - key:generate           : APP_KEY dibuat di dalam image, tidak ditulis
#                               manual di dalam Dockerfile.
#    - migrate + db:seed      : skema & data contoh supaya /api/goals langsung
#                               mengembalikan JSON berisi data (Slide 17 butir 6).
# -----------------------------------------------------------------------------
RUN composer dump-autoload --optimize --no-dev --no-scripts \
    && cp .env.example .env \
    && php artisan key:generate --force \
    && touch database/database.sqlite \
    && php artisan migrate --force --seed \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && chown -R www-data:www-data storage bootstrap/cache

# -----------------------------------------------------------------------------
# 6. EXPOSE — hanya CATATAN port. Tidak membuka apa pun (Slide 11).
#    Yang benar-benar membuka port tetap flag -p saat `docker run`.
# -----------------------------------------------------------------------------
EXPOSE 8000

# -----------------------------------------------------------------------------
# 7. CMD — perintah saat container NYALA. Berbeda dengan RUN (Slide 11).
#    --host=0.0.0.0 WAJIB: tanpa itu server hanya mendengarkan di localhost
#    DI DALAM container dan `-p 8080:8000` tidak akan bisa dihubungi dari luar.
# -----------------------------------------------------------------------------
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
