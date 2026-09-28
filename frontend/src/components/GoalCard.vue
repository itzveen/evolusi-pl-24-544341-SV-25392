<script setup>
import { RouterLink } from 'vue-router'
import { formatPercentage, progressLabel } from '../lib/goalFormat'

defineProps({
  goal: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <li class="goal-card">
    <div class="goal-card__head">
      <p class="goal-card__title">
        <RouterLink :to="`/goals/${goal.id}`">{{ goal.title }}</RouterLink>
      </p>
      <span class="badge" :class="{ 'badge--pending': !goal.is_completed }">
        {{ goal.is_completed ? 'Selesai' : 'Berjalan' }}
      </span>
    </div>
    <p class="goal-card__meta">
      {{ progressLabel(goal) }} - {{ formatPercentage(goal.percentage) }}
    </p>
    <div class="progress">
      <div
        class="progress__bar"
        :class="{ 'progress__bar--done': goal.is_completed }"
        :style="{ width: `${Math.min(100, goal.percentage)}%` }"
      />
    </div>
  </li>
</template>
