# Frontend - Goal Tracker (Vue 3)

Aplikasi Vue 3 yang membaca data goal dari endpoint JSON milik Laravel.

## Menjalankan di laptop

Laravel harus jalan lebih dulu, di folder proyek (satu folder di atas `frontend/`):

```bash
php artisan serve            # menyediakan http://127.0.0.1:8000
```

Lalu di folder ini:

```bash
npm install                  # pertama kali saja
cp .env.example .env.local   # sesuaikan VITE_API_URL bila perlu
npm run dev                  # buka http://localhost:5173
```

`VITE_API_URL` **wajib** diisi. Tidak ada alamat yang ditulis langsung di kode.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan Vite |
| `npm run build` | membangun `dist/` |
| `npm run preview` | mencoba hasil build secara lokal |
| `npm run lint` | ESLint |
| `npm test` | unit test Vitest |

## Halaman

| Rute | Isi |
|---|---|
| `/` | Beranda: kartu statistik + 3 goal pertama |
| `/goals` | Daftar goal dari `GET /api/goals` |
| `/goals/:id` | Detail satu goal |

Router memakai mode history, jadi setiap URL bisa di-refresh dan di-bookmark.
Setelah di-deploy, Vercel perlu rewrite semua path ke `index.html` supaya
halaman kedua tetap bisa dibuka langsung. Aturannya ada di `vercel.json`.

## Test yang tidak butuh Laravel

`src/lib/*.test.js` menguji logika murni: format persentase, label progres,
ringkasan, dan penanganan error API. Semua `fetch` di-mock, jadi `npm test`
lulus di GitHub Actions tanpa server Laravel dan tanpa PHP.

## Alamat API

Selalu dibaca dari `VITE_API_URL` di `src/lib/api.js`:

```js
export const API_BASE_URL = import.meta.env?.VITE_API_URL ?? ''
```

Saat Laravel tidak bisa dihubungi, `ApiError` membawa pesan yang menyebutkan
alamat yang dicoba, dan `components/ApiErrorAlert.vue` menampilkannya
beserta tiga langkah perbaikan yang harus dicoba pengguna.
