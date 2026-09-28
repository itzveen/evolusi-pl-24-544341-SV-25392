/**
 * Klien API untuk endpoint JSON Laravel.
 *
 * Alamat API SELALU dibaca dari environment variable VITE_API_URL.
 * Tidak ada URL yang ditulis langsung di sini.
 */

export const API_BASE_URL = import.meta.env?.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

if (!API_BASE_URL) {
  console.warn(
    '[api] VITE_API_URL belum diisi. Buat file .env.local di folder frontend/ ' +
      'misalnya: VITE_API_URL=http://127.0.0.1:8000',
  )
}

/**
 * Ambil daftar goal dari Laravel.
 * Melempar ApiError dengan pesan yang jelas bila server tidak bisa dihubungi.
 */
export async function fetchGoals({ signal } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError(
      'Alamat API belum dikonfigurasi. Set VITE_API_URL di file .env.local ' +
        'contoh: VITE_API_URL=http://127.0.0.1:8000',
    )
  }

  const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/goals`

  let response
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(
      `Tidak bisa menghubungi server Laravel di ${API_BASE_URL}. ` +
        'Pastikan php artisan serve sedang berjalan dan alamat VITE_API_URL benar.',
    )
  }

  if (!response.ok) {
    throw new ApiError(
      `Server Laravel menjawab dengan status ${response.status} (${response.statusText}).`,
      response.status,
    )
  }

  try {
    const payload = await response.json()
    return Array.isArray(payload?.data) ? payload.data : []
  } catch {
    throw new ApiError('Respons dari server Laravel bukan JSON yang valid.')
  }
}
