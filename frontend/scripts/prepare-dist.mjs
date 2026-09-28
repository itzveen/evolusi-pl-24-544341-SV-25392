/*
 * Siapkan folder dist/ agar bisa langsung di-deploy ke Vercel.
 *
 * Latar belakang:
 * Job `deploy` menjalankan `vercel deploy ... dist`, jadi Vercel
 * memperlakukan isi folder dist/ sebagai ROOT project. Akibatnya
 * konfigurasi dibaca dari `dist/vercel.json`, bukan dari
 * `frontend/vercel.json`.
 *
 * Tanpa berkas konfigurasi di dalam dist/, dua syarat bonus tidak
 * terpenuhi:
 *   - rewrite /(.*) ke /index.html, jadi /goals/1 tidak bisa di-refresh
 *   - tidak ada buildCommand, jadi Vercel tidak dibangun ulang
 *
 * Skrip ini hanya menyalin berkas konfigurasi. Tidak ada proses build
 * apa pun yang dijalankan di sini.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)

/**
 * Susun konfigurasi yang ikut diunggah bersama dist/.
 *
 * Dipakai sebagai root project di Vercel, jadi outputDirectory dan
 * buildCommand sudah tidak relevan di level ini. Yang wajib ada hanya
 * rewrite, supaya setiap URL mengembalikan index.html.
 */
export function buildDistConfig(config) {
  if (!Array.isArray(config.rewrites) || config.rewrites.length === 0) {
    throw new Error('vercel.json tidak punya rewrite. Halaman kedua tidak akan bisa di-refresh.')
  }

  return {
    $schema: config.$schema,
    rewrites: config.rewrites,
  }
}

/** Tulis dist/vercel.json. Mengembalikan isi berkas yang ditulis. */
export function prepareDist(rootDir = root) {
  const dist = join(rootDir, 'dist')

  if (!existsSync(dist)) {
    throw new Error('Folder dist/ belum ada. Jalankan `npm run build` lebih dulu.')
  }

  const config = JSON.parse(readFileSync(join(rootDir, 'vercel.json'), 'utf8'))
  const forDist = buildDistConfig(config)

  writeFileSync(join(dist, 'vercel.json'), `${JSON.stringify(forDist, null, 2)}\n`)

  return forDist
}

// Jalan hanya bila dipanggil langsung, bukan saat diimpor oleh test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const forDist = prepareDist()
    console.log('dist/vercel.json dibuat:')
    for (const rule of forDist.rewrites) {
      console.log(`  rewrite ${rule.source} -> ${rule.destination}`)
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
