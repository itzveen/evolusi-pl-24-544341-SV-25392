<script setup>
import { useGoals } from '../composables/useGoals'
import GoalCard from '../components/GoalCard.vue'
import ApiErrorAlert from '../components/ApiErrorAlert.vue'

const { goals, loading, error, load } = useGoals()
load()
</script>

<template>
  <section>
    <h1>Daftar Goal</h1>
    <p class="lead">
      Data di bawah diambil langsung dari endpoint JSON Laravel
      (<code>GET /api/goals</code>) melalui variabel lingkungan
      <code>VITE_API_URL</code>.
    </p>

    <ApiErrorAlert v-if="error" :message="error.message" @retry="load({ force: true })" />

    <p v-if="loading" class="muted">Memuat data dari Laravel...</p>

    <p v-else-if="!error && goals.length === 0" class="muted">
      Belum ada goal. Jalankan <code>php artisan serve</code> lalu tambahkan data
      melalui halaman CRUD Laravel.
    </p>

    <ul v-else class="goal-list">
      <GoalCard v-for="goal in goals" :key="goal.id" :goal="goal" />
    </ul>
  </section>
</template>
