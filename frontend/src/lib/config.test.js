// @vitest-environment node

import { describe, it, expect } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDistConfig, prepareDist } from '../../scripts/prepare-dist.mjs'

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

describe('konfigurasi yang ikut terunggah ke Vercel', () => {
  // Job deploy mengunggah folder dist/ sebagai root project, jadi Vercel
  // membaca konfigurasi dari dist/vercel.json - bukan frontend/vercel.json.
  // Kalau berkas ini tidak ikut terunggah, rewrite tidak berlaku dan
  // halaman kedua tidak bisa di-refresh.
  const rootConfig = JSON.parse(read('vercel.json'))

  it('dibuat oleh npm run build, bukan manual', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.scripts.build).toContain('prepare-dist.mjs')
  })

  it('memakai rewrite yang sama dengan vercel.json', () => {
    const forDist = buildDistConfig(rootConfig)
    expect(forDist.rewrites).toEqual(rootConfig.rewrites)
    expect(forDist.rewrites.find((r) => r.source === '/(.*)').destination).toBe('/index.html')
  })

  it('tidak menyuruh Vercel membangun ulang', () => {
    const forDist = buildDistConfig(rootConfig)
    // Kalau buildCommand terisi, Vercel akan membangun sendiri dan
    // dist/ dari artifact tidak lagi dipakai.
    expect(forDist.buildCommand ?? null).toBeNull()
    expect(forDist.outputDirectory ?? null).toBeNull()
  })

  it('menolak konfigurasi tanpa rewrite', () => {
    expect(() => buildDistConfig({})).toThrow(/tidak punya rewrite/)
    expect(() => buildDistConfig({ rewrites: [] })).toThrow(/tidak punya rewrite/)
  })

  it('benar-benar menulis dist/vercel.json', () => {
    // Folder sementara, supaya test tidak bergantung pada dist/ yang
    // belum ada saat job test berjalan sebelum job build.
    const temp = mkdtempSync(join(tmpdir(), 'dist-test-'))
    try {
      mkdirSync(join(temp, 'dist'))
      writeFileSync(join(temp, 'vercel.json'), JSON.stringify(rootConfig))

      const result = prepareDist(temp)
      const written = JSON.parse(readFileSync(join(temp, 'dist', 'vercel.json'), 'utf8'))

      expect(written).toEqual(result)
      expect(written.rewrites[0].destination).toBe('/index.html')
      expect(written.buildCommand).toBeUndefined()
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  })

  it('menolak folder dist/ yang belum ada', () => {
    const temp = mkdtempSync(join(tmpdir(), 'dist-test-'))
    try {
      expect(() => prepareDist(temp)).toThrow(/belum ada/)
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
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
