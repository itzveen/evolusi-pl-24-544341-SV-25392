# Laporan Tugas 6 — Multi-Stage Build, Keamanan Container, dan GHCR

> **Mata Kuliah:** Konstruksi dan Evolusi Perangkat Lunak  
> **Nama:** Gurveenderjeet Kaur  
> **Repository:** [KEPL2026/evolusi-pl-24-544341-SV-25392](https://github.com/KEPL2026/evolusi-pl-24-544341-SV-25392)

---

## 1. Pendahuluan

Pada tugas sebelumnya (Tugas 4–5), Dockerfile aplikasi ini masih single-stage — semua perkakas build (Composer, header pustaka, Git) masuk ke image akhir. Image yang dihasilkan lebih besar, memiliki attack surface lebih luas, dan tidak efisien untuk produksi.

Tugas 6 ini menyempurnakannya dengan:
1. **Multi-stage Dockerfile** — pisahkan tahap build dan tahap run
2. **Versi terkunci** — tidak pakai tag `latest`
3. **Non-root user** — container tidak jalan sebagai root
4. **HEALTHCHECK** — container melaporkan status sehat/tidak sendiri
5. **CI/CD ke GHCR** — image di-push otomatis via GitHub Actions

---

## 2. Perubahan Dockerfile

### Struktur Multi-Stage

| Stage | Nama | Isi |
|-------|------|-----|
| 1 | `builder` | PHP dev headers, Composer 2.8, install dependensi, generate APP_KEY, migrate, cache artisan |
| 2 | `runner` | Image bersih PHP 8.4-cli-alpine, hanya runtime libs, salin hasil dari builder |

### Tag yang Dipakai

| Komponen | Sebelumnya | Sekarang | Alasan |
|----------|-----------|---------|--------|
| Image PHP | `php:8.4-cli-alpine` | `php:8.4-cli-alpine` (terkunci) | Alpine lebih kecil, versi PHP terkunci |
| Composer | `composer:2` | `composer:2.8` | Versi dikunci, konsisten |

### Keamanan

```dockerfile
# Ubah kepemilikan folder
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Jalankan sebagai non-root
USER www-data
```

### Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://127.0.0.1:8000 || exit 1
```

---

## 3. Bukti Perbandingan Ukuran

### Cara Pengujian

```bash
# Build image lama (single-stage) — tag v1
docker build -t evolusi-pl-544341:v1 -f Dockerfile.v1 .

# Build image baru (multi-stage) — tag multistage
docker build -t evolusi-pl-544341:multistage .

# Lihat perbandingan
docker images | grep evolusi-pl-544341
```

> 📸 **Screenshot `docker images` sebelum dan sesudah** → lampirkan di PDF laporan

### Tabel Perbandingan

| Parameter | v1 (single-stage) | multistage | Selisih | Penurunan |
|-----------|------------------|------------|---------|-----------|
| Disk usage | — MB | — MB | — MB | —% |
| Content size | — MB | — MB | — MB | —% |

> ✏️ Isi tabel ini setelah menjalankan `docker images` di laptop kamu

---

## 4. Bukti Non-Root User

```bash
# Jalankan container
docker run -d --name app-goals -p 8080:8000 evolusi-pl-544341:multistage

# Cek user yang sedang berjalan
docker exec app-goals whoami
```

**Output yang diharapkan:**
```
www-data
```

> 📸 **Screenshot `docker exec app-goals whoami`** → lampirkan di PDF laporan

---

## 5. Bukti HEALTHCHECK

```bash
# Tunggu ~30 detik setelah container jalan, lalu cek
docker ps
```

**Output yang diharapkan** (lihat kolom STATUS):
```
CONTAINER ID   IMAGE                          STATUS
xxxxxxxxxxxx   evolusi-pl-544341:multistage   Up 35 seconds (healthy)
```

> 📸 **Screenshot `docker ps` dengan kolom `(healthy)`** → lampirkan di PDF laporan

---

## 6. CI/CD — Push ke GHCR

### File Workflow

[`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml)

### Alur Kerja

```
push ke main/dev
      │
      ▼
┌─────────────┐
│  Checkout   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Login ke ghcr.io   │  ← pakai GITHUB_TOKEN (otomatis)
│  via GITHUB_TOKEN   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Paksa nama image   │  ← ${GITHUB_REPOSITORY,,} → huruf kecil
│  menjadi lowercase  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  docker build & push ke GHCR        │
│  Tag: :${{ github.sha }}            │  ← unik per commit
│  Tag: :latest                       │
└──────┬──────────────────────────────┘
       │
       ▼
  Image terpublikasi di GHCR 🎉
```

### Fitur Utama Workflow

| Fitur | Penjelasan |
|-------|-----------|
| `secrets.GITHUB_TOKEN` | Token otomatis dari GitHub, tidak perlu buat manual |
| `packages: write` | Izin eksplisit untuk push ke GHCR |
| `${GITHUB_REPOSITORY,,}` | Paksa huruf kecil — GHCR menolak huruf kapital |
| Tag `github.sha` | Setiap commit punya tag unik, mudah rollback |
| Tag `latest` | Penunjuk ke versi terbaru |
| `cache-from/cache-to: gha` | Cache build layer di GitHub Actions |

### Cara Ubah Visibilitas ke Public

Setelah image berhasil di-push:
1. Buka halaman package di GitHub
2. Klik **Package settings**
3. Scroll ke **Danger Zone** → **Change visibility**
4. Pilih **Public** → konfirmasi

> 📸 **Screenshot workflow hijau + halaman package** → lampirkan di PDF laporan

---

## 7. Cara Menjalankan Secara Lokal

```bash
# Clone repo
git clone https://github.com/KEPL2026/evolusi-pl-24-544341-SV-25392.git
cd evolusi-pl-24-544341-SV-25392

# Build image
docker build -t evolusi-pl-544341:multistage .

# Jalankan container
docker run -d \
  --name app-goals \
  -p 8080:8000 \
  evolusi-pl-544341:multistage

# Buka di browser
open http://localhost:8080

# Cek user (harus www-data, bukan root)
docker exec app-goals whoami

# Cek status healthcheck (tunggu ~30 detik)
docker ps
```

---

## 8. Tautan Penting

| Item | Tautan |
|------|--------|
| Repository (kode + Dockerfile) | [KEPL2026/evolusi-pl-24-544341-SV-25392](https://github.com/KEPL2026/evolusi-pl-24-544341-SV-25392) |
| Package GHCR | *(isi setelah workflow berhasil jalan)* |
