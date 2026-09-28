<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useGoals } from '../composables/useGoals'
import { findGoal, formatPercentage, progressLabel } from '../lib/goalFormat'
import ApiErrorAlert from '../components/ApiErrorAlert.vue'

const route = useRoute()
const { goals, loading, error, load } = useGoals()
load()

/*
 * Halaman kedua memakai route dinamis (/goals/:id).
 * Karena router memakai mode history, halaman ini tetap bisa di-refresh
 * langsung lewat URL begitu di-deploy, asal Vercel sudah dikonfigurasi
 * untuk rewrite semua path ke index.html.
 */
const goal = computed(() => findGoal(goals.value, route.params.id))
</script>

<template>
  <section>
    <p><RouterLink to="/goals">&larr; Kembali ke daftar</RouterLink></p>

    <ApiErrorAlert v-if="error" :message="error.message" @retry="load({ force: true })" />

    <p v-if="loading" class="muted">Memuat data dari Laravel...</p>

    <template v-else-if="goal">
      <h1>{{ goal.title }}</h1>
      <p class="lead">{{ progressLabel(goal) }}</p>

      <div class="stats">
        <div class="stat">
          <div class="stat__value">{{ formatPercentage(goal.percentage) }}</div>
          <div class="stat__label">Progres</div>
        </div>
        <div class="stat">
          <div class="stat__value">{{ goal.progress }}</div>
          <div class="stat__label">Tercapai</div>
        </div>
        <div class="stat">
          <div class="stat__value">{{ goal.target }}</div>
          <div class="stat__label">Target</div>
        </div>
        <div class="stat">
          <div class="stat__value">{{ goal.is_completed ? 'Ya' : 'Belum' }}</div>
          <div class="stat__label">Selesai</div>
        </div>
      </div>

      <div class="progress">
        <div
          class="progress__bar"
          :class="{ 'progress__bar--done': goal.is_completed }"
          :style="{ width: `${Math.min(100, goal.percentage)}%` }"
        />
      </div>
    </template>

    <p v-else-if="!error" class="muted">
      Goal dengan id <code>{{ route.params.id }}</code> tidak ditemukan.
    </p>
  </section>
</template>
