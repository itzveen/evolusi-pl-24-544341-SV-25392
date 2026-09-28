// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * Test konfigurasi.
 *
 * Dua hal di soal tidak bisa dibuktikan dengan test bytecode biasa,
 * tapi bisa dijaga dengan test: rewrite SPA (agar halaman kedua bisa
 * di-refresh setelah di-deploy) dan Larangan alamat API yang ditulis
 * langsung di kode.
 *
 * Test ini membaca berkas di disk, jadi hanya butuh Node - tidak
 * butuh server, tidak butuh Laravel, tidak butuh peramban.
 */
const root = fileURLToPath(new URL('../../', import.meta.url))

const read = (path) => readFileSync(join(root, path), 'utf8')

describe('konfigurasi Vercel', () => {
  const vercel = JSON.parse(read('vercel.json'))

  it('me-rewrite semua path ke index.html agar halaman kedua bisa di-refresh', () => {
    // Tanpa rewrite ini, membuka /goals/1 secara langsung akan
    // mendapat 404 dari Vercel karena tidak ada berkas dengan nama itu.
    expect(vercel.rewrites).toBeDefined()

    const rewrite = vercel.rewrites.find((r) => r.source === '/(.*)')
    expect(rewrite).toBeDefined()
    expect(rewrite.destination).toBe('/index.html')
  })

  it('menonaktifkan buildCommand supaya Vercel tidak membangun ulang', () => {
    // Kalau buildCommand terisi, Vercel akan membangun ulang sendiri
    // dan dist/ dari artifact tidak lagi dipakai.
    expect(vercel.buildCommand).toBeNull()
  })

  it('menunjuk outputDirectory ke dist', () => {
    expect(vercel.outputDirectory).toBe('dist')
  })
})

describe('alamat API tidak ditulis langsung di kode', () => {
  function collectFiles(dir, out = []) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) collectFiles(full, out)
      else if (/\.(js|vue)$/.test(entry)) out.push(full)
    }
    return out
  }

  const sources = collectFiles(join(root, 'src'))

  it('tidak ada domain non-localhost di seluruh src/', () => {
    // localhost/127.0.0.1 masih boleh muncul, tapi hanya sebagai contoh
    // di teks bantuan dan fixture test. Domain sungguhan tidak boleh
    // pernah ditulis langsung, karena harus lewat VITE_API_URL.
    const offenders = []

    for (const file of sources) {
      const text = readFileSync(file, 'utf8')
      const matches = text.match(/https?:\/\/[^\s'"`)]+/g) ?? []
      const real = matches.filter(
        (url) => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url),
      )
      if (real.length) offenders.push({ file: relative(root, file), real })
    }

    expect(offenders).toEqual([])
  })

  it('api.js mengambil alamat dari VITE_API_URL', () => {
    const api = read('src/lib/api.js')

    // Alamat API hanya boleh datang dari import.meta.env.
    expect(api).toContain('import.meta.env')
    expect(api).toMatch(/VITE_API_URL/)

    // Tidak boleh ada alamat yang dipakai sebagai nilai dasar.
    const literalUrls = api.match(/=\s*['"`]https?:\/\//g)
    expect(literalUrls).toBeNull()
  })
})
