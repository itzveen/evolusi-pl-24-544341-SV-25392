import { describe, it, expect } from 'vitest'
import {
  averagePercentage,
  findGoal,
  formatPercentage,
  progressLabel,
  summarise,
} from './goalFormat'

/*
 * Unit test untuk logika tampilan.
 *
 * Semua test ini murni: tidak memakai fetch, tidak menyentuh jaringan,
 * tidak butuh server Laravel. Karena itu test ini lulus di GitHub Actions
 * hanya dengan `npm ci && npm test`.
 */
describe('formatPercentage', () => {
  it('memformat persentase menjadi persen', () => {
    expect(formatPercentage(0)).toBe('0%')
    expect(formatPercentage(30)).toBe('30%')
    expect(formatPercentage(100)).toBe('100%')
  })

  it('membulatkan angka desimal', () => {
    expect(formatPercentage(62.4)).toBe('62%')
    expect(formatPercentage(62.5)).toBe('63%')
  })

  it('mengubah nilai di luar rentang 0-100', () => {
    expect(formatPercentage(-5)).toBe('0%')
    expect(formatPercentage(140)).toBe('100%')
  })

  it('mengembalikan 0% untuk nilai yang bukan angka', () => {
    expect(formatPercentage(null)).toBe('0%')
    expect(formatPercentage('abc')).toBe('0%')
  })
})

describe('progressLabel', () => {
  it('menyertakan satuan bila ada', () => {
    expect(progressLabel({ progress: 3, target: 10, unit: 'buku' })).toBe('3 dari 10 buku')
  })

  it('tidak menambah spasi ganda bila satuan kosong', () => {
    expect(progressLabel({ progress: 3, target: 10, unit: '' })).toBe('3 dari 10')
    expect(progressLabel({ progress: 3, target: 10 })).toBe('3 dari 10')
  })

  it('menganggap nilai yang hilang sebagai nol', () => {
    expect(progressLabel({})).toBe('0 dari 0')
  })
})

describe('summarise', () => {
  const goals = [
    { id: 1, is_completed: false, percentage: 30 },
    { id: 2, is_completed: true, percentage: 100 },
    { id: 3, is_completed: false, percentage: 10 },
  ]

  it('menghitung total, selesai, dan sedang berjalan', () => {
    const stats = summarise(goals)
    expect(stats.total).toBe(3)
    expect(stats.completed).toBe(1)
    expect(stats.inProgress).toBe(2)
  })

  it('menghitung rata-rata persentase', () => {
    // (30 + 100 + 10) / 3 = 46.67 -> 47
    expect(summarise(goals).averagePercentage).toBe(47)
  })

  it('aman untuk daftar kosong', () => {
    expect(summarise([])).toEqual({
      total: 0,
      completed: 0,
      inProgress: 0,
      averagePercentage: 0,
    })
  })

  it('aman untuk input null', () => {
    expect(summarise(null).total).toBe(0)
  })
})

describe('averagePercentage', () => {
  it('mengabaikan goal tanpa persentase yang valid', () => {
    expect(averagePercentage([{ percentage: 50 }, { percentage: null }, { percentage: 90 }])).toBe(70)
  })

  it('mengembalikan nol bila tidak ada angka sama sekali', () => {
    expect(averagePercentage([{ percentage: 'x' }])).toBe(0)
  })
})

describe('findGoal', () => {
  const goals = [{ id: 1, title: 'Baca buku' }, { id: 2, title: 'Lari' }]

  it('mencari berdasarkan id dengan tipe data berbeda', () => {
    expect(findGoal(goals, 2).title).toBe('Lari')
    expect(findGoal(goals, '2').title).toBe('Lari')
  })

  it('mengembalikan null bila tidak ada', () => {
    expect(findGoal(goals, 99)).toBeNull()
  })
})
