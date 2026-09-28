/**
 * Logika tampilan murni — tidak menyentuh jaringan maupun DOM.
 * Dipisahkan supaya mudah diuji Vitest tanpa Laravel berjalan.
 */

/** Format persentase untuk tampilan. */
export function formatPercentage(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0%'
  const clamped = Math.min(100, Math.max(0, Math.round(number)))
  return `${clamped}%`
}

/**
 * Label progres: "3 dari 10 buku (30%)".
 * unit yang kosong tidak menghasilkan teks ganda.
 */
export function progressLabel(goal) {
  const target = Number(goal?.target ?? 0)
  const progress = Number(goal?.progress ?? 0)
  const unit = (goal?.unit ?? '').trim()

  const base = `${progress} dari ${target}`
  return unit ? `${base} ${unit}` : base
}

/** Ringkasan untuk kartu statistik. */
export function summarise(goals) {
  const list = Array.isArray(goals) ? goals : []
  return {
    total: list.length,
    completed: list.filter((goal) => goal?.is_completed).length,
    inProgress: list.filter((goal) => !goal?.is_completed).length,
    averagePercentage: averagePercentage(list),
  }
}

/**
 * Rata-rata persentase, dibulatkan; 0 bila daftar kosong.
 *
 * Goal tanpa persentase yang benar-benar angka (null, undefined, teks)
 * diabaikan, bukan diperlakukan sebagai 0. Number(null) memang 0,
 * jadi nilai kosong harus diperiksa lebih dulu.
 */
export function averagePercentage(goals) {
  const list = (Array.isArray(goals) ? goals : []).filter((goal) => {
    const raw = goal?.percentage
    if (raw === null || raw === undefined || raw === '') return false
    return Number.isFinite(Number(raw))
  })
  if (list.length === 0) return 0
  const total = list.reduce((sum, goal) => sum + Number(goal.percentage), 0)
  return Math.round(total / list.length)
}

/** Cari satu goal berdasarkan id. */
export function findGoal(goals, id) {
  const list = Array.isArray(goals) ? goals : []
  return list.find((goal) => String(goal?.id) === String(id)) ?? null
}
