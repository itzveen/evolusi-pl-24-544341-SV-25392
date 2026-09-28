import { describe, it, expect, vi, afterEach } from 'vitest'

/*
 * Test untuk klien API.
 *
 * `fetch` sengaja di-mock, jadi test ini tidak pernah menyentuh jaringan
 * dan tidak butuh server Laravel. Yang diuji adalah perilakunya,
 * terutama saat server tidak bisa dihubungi: pesannya harus jelas.
 */

async function loadApi(baseUrl) {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', baseUrl)
  return import('./api')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('fetchGoals', () => {
  it('mengambil daftar goal dari endpoint /api/goals', async () => {
    const payload = { data: [{ id: 1, title: 'Baca buku' }], meta: { total: 1 } }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload })
    vi.stubGlobal('fetch', fetchMock)

    const { fetchGoals } = await loadApi('http://127.0.0.1:8000')
    const result = await fetchGoals()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:8000/api/goals')
    expect(result).toEqual([{ id: 1, title: 'Baca buku' }])
  })

  it('menyediakan pesan jelas saat Laravel tidak bisa dihubungi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    const { fetchGoals, ApiError } = await loadApi('http://127.0.0.1:8000')

    await expect(fetchGoals()).rejects.toBeInstanceOf(ApiError)
    await expect(fetchGoals()).rejects.toThrow(/Tidak bisa menghubungi server Laravel/)
    await expect(fetchGoals()).rejects.toThrow(/php artisan serve/)
  })

  it('menyertakan status code saat server menjawab error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' }),
    )

    const { fetchGoals } = await loadApi('http://127.0.0.1:8000')

    await expect(fetchGoals()).rejects.toThrow(/status 500/)
  })

  it('memberi tahu saat VITE_API_URL belum diisi', async () => {
    // Peringatan di modul api.js sengaja dibunyikan agar log test bersih.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { fetchGoals } = await loadApi('')

    await expect(fetchGoals()).rejects.toThrow(/VITE_API_URL/)
    warn.mockRestore()
  })

  it('mengembalikan daftar kosong bila field data bukan array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) }),
    )

    const { fetchGoals } = await loadApi('http://127.0.0.1:8000')

    await expect(fetchGoals()).resolves.toEqual([])
  })

  it('meneruskan AbortError tanpa membungkusnya jadi pesan lain', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))

    const { fetchGoals } = await loadApi('http://127.0.0.1:8000')

    await expect(fetchGoals()).rejects.toMatchObject({ name: 'AbortError' })
  })
})
