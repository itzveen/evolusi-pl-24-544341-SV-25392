# =============================================================================
#  Dockerfile — Pertemuan 05: Pengenalan Docker & Containerization
#  Repository : https://github.com/KEPL2026/evolusi-pl-24-544341-SV-25392
#  NIM        : 24-544341
#
#  Referensi: "Pertemuan-05-Pengenalan Docker & Containerization.pdf"
#             - Slide 11 : enam instruksi dasar Dockerfile
#             - Slide 12 : urutan layer menentukan cepat/lambatnya build
#             - Slide 14 : lima kesalahan yang harus dihindari
#             - Slide 17 : instruksi tugas
#
#  PRINSIP UTAMA YANG DIGUNAKAN DI SINI (Slide 12 & 17):
#    Tiap instruksi = 1 layer. Docker menyimpan layer yang tidak berubah dan
#    memakainya lagi pada build berikutnya. Karena itu URUTAN itu penting:
#    file dependensi (composer.json / composer.lock) disalin dan di-install
#    DULU, baru kode aplikasi disalin. Kalau dibalik, satu huruf yang diubah
#    di kode sudah cukup untuk membuat composer install diulang dari nol.
# =============================================================================


# -----------------------------------------------------------------------------
# 1. FROM — image dasar.
#    Selalu image resmi dengan tag JELAS, bukan `latest` (Slide 14).
#    - `8.4`  : composer.json mensyaratkan PHP ^8.3, jadi 8.2 dari slide tidak bisa.
#    - `cli`  : dipakai `php artisan serve` supaya container bisa langsung dibuka
#               dari browser tanpa nginx tambahan. (Slide 11 memakai fpm karena
#               di produksi ada nginx di depannya; untuk Containers 1 ("belajar")
#               cli jauh lebih sederhana.)
#    - `alpine`: image jauh lebih kecil daripada ubuntu (Slide 14: "image raksasa").
# -----------------------------------------------------------------------------
FROM php:8.4-cli-alpine

# -----------------------------------------------------------------------------
# 2. WORKDIR — folder kerja untuk semua instruksi berikutnya (pengganti `cd`).
# -----------------------------------------------------------------------------
WORKDIR /var/www


# -----------------------------------------------------------------------------
# 3. RUN — dipasang saat MEMBANGUN image, hasilnya ikut tersimpan di layer.
#
#    Catatan ekstensi (dicek langsung dengan `docker run --rm php:8.4-cli-alpine php -m`):
#    - pdo_sqlite dan sqlite3  : SUDAH aktif bawaan image resmi php alpine,
#                               makanya tidak perlu di-install lagi.
#    - pdo_mysql, bcmath      : belum ada, jadi harus dipasang.
#    - $PHPIZE_DEPS            : paket build (autoconf, gcc, make) yang dibutuhkan
#                               docker-php-ext-install. Dipasang di baris yang sama
#                               lalu dibuang lagi supaya tidak ikut jadi image gemuk.
# -----------------------------------------------------------------------------
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql bcmath \
    && apk del --no-network .build-deps

# Binary Composer resmi, disalin dari image composer:2 (tidak di-install
# lewat apk, jadi versinya pasti sama dengan yang dipakai di laptop).
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
