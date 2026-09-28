import { ref, computed } from 'vue'
import { fetchGoals } from '../lib/api'
import { summarise } from '../lib/goalFormat'

/*
 * Sumber data tunggal untuk seluruh halaman.
 *
 * - `load()` mengambil data dari Laravel lewat endpoint JSON.
 * - Kegagalan (server mati, CORS, alamat salah) ditangkap dan disimpan
 *   di `error` supaya halaman bisa menampilkan pesan yang jelas.
 * - Dipanggil ulang hanya jika `force` true, supaya berpindah halaman
 *   tidak menembak API berkali-kali.
 */
const goals = ref([])
const meta = ref({ total: 0, completed: 0 })
const loading = ref(false)
const error = ref(null)
let lastLoadOk = false

export function useGoals() {
  const stats = computed(() => summarise(goals.value))

  async function load({ force = false } = {}) {
    if (loading.value) return
    if (lastLoadOk && !force) return

    loading.value = true
    error.value = null

    try {
      goals.value = await fetchGoals()
      lastLoadOk = true
    } catch (caught) {
      error.value = caught
      lastLoadOk = false
    } finally {
      loading.value = false
    }
  }

  return { goals, meta, stats, loading, error, load }
}
