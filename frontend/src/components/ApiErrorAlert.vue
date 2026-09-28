<script setup>
/*
 * Pesan error yang jelas ketika Laravel tidak bisa dihubungi.
 * Ini salah satu syarat pada soal: pengguna harus tahu apa yang salah
 * dan apa yang harus dilakukan, bukan hanya melihat "Failed to fetch".
 */
defineProps({
  message: {
    type: String,
    required: true,
  },
})

defineEmits(['retry'])
</script>

<template>
  <div class="alert alert--error" role="alert">
    <p class="alert__title">Tidak bisa menghubungi server Laravel</p>
    <p class="alert__hint">{{ message }}</p>
    <p class="alert__hint">Coba cek satu dari hal berikut:</p>
    <ul class="alert__hint">
      <li>
        Server Laravel jalan? Jalankan
        <code>php artisan serve</code> di folder proyek.
      </li>
      <li>
        Alamat API benar? Buka file <code>frontend/.env.local</code> dan isi
        <code>VITE_API_URL=http://127.0.0.1:8000</code>, lalu jalankan ulang
        <code>npm run dev</code>.
      </li>
      <li>
        CORS mengizinkan origin Vue? Alamat
        <code>http://localhost:5173</code> sudah dicantumkan di
        <code>config/cors.php</code> milik Laravel.
      </li>
    </ul>
    <p>
      <button class="button" type="button" @click="$emit('retry')">Coba lagi</button>
    </p>
  </div>
</template>
