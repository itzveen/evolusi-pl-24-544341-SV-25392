<script setup>
import { RouterLink } from 'vue-router'
import { useGoals } from '../composables/useGoals'
import { formatPercentage } from '../lib/goalFormat'

const { goals, stats, loading, error, load } = useGoals()
load()
</script>

<template>
  <section>
    <h1>Beranda</h1>
    <p class="lead">
      Aplikasi Vue 3 ini membaca data goal dari endpoint JSON milik Laravel
      (<code>GET /api/goals</code>). Alamat API diambil dari
      <code>VITE_API_URL</code>, bukan ditulis langsung di kode.
    </p>

    <div v-if="error" class="alert alert--error">
      <p class="alert__title">Data dari Laravel tidak bisa dimuat</p>
      <p>{{ error.message }}</p>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat__value">{{ stats.total }}</div>
        <div class="stat__label">Total goal</div>
      </div>
      <div class="stat">
        <div class="stat__value">{{ stats.completed }}</div>
        <div class="stat__label">Selesai</div>
      </div>
      <div class="stat">
        <div class="stat__value">{{ stats.inProgress }}</div>
        <div class="stat__label">Sedang berjalan</div>
      </div>
      <div class="stat">
        <div class="stat__value">{{ formatPercentage(stats.averagePercentage) }}</div>
        <div class="stat__label">Rata-rata progres</div>
      </div>
    </div>

    <p v-if="loading" class="muted">Memuat data dari Laravel...</p>
    <p v-else-if="!error && goals.length === 0" class="muted">
      Belum ada goal di database. Tambahkan lewat halaman Laravel.
    </p>

    <ul v-if="goals.length" class="goal-list">
      <li v-for="goal in goals" :key="goal.id" class="goal-card">
        <div class="goal-card__head">
          <p class="goal-card__title">
            <RouterLink :to="`/goals/${goal.id}`">{{ goal.title }}</RouterLink>
          </p>
          <span class="badge" :class="{ 'badge--pending': !goal.is_completed }">
            {{ goal.is_completed ? 'Selesai' : 'Berjalan' }}
          </span>
        </div>
        <p class="goal-card__meta">
          {{ goal.progress }} dari {{ goal.target }}
          {{ goal.unit }} - {{ formatPercentage(goal.percentage) }}
        </p>
        <div class="progress">
          <div
            class="progress__bar"
            :class="{ 'progress__bar--done': goal.is_completed }"
            :style="{ width: `${Math.min(100, goal.percentage)}%` }"
          />
        </div>
      </li>
    </ul>

    <p>
      <RouterLink class="button" to="/goals">Lihat semua goal</RouterLink>
    </p>
  </section>
</template>
