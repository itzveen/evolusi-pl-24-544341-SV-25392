<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="app__header">
      <RouterLink to="/" class="app__brand">Goal Tracker</RouterLink>
      <nav class="app__nav">
        <RouterLink to="/">Beranda</RouterLink>
        <RouterLink to="/goals">Daftar Goal</RouterLink>
      </nav>
    </header>

    <main class="app__main">
      <RouterView />
    </main>

    <footer class="app__footer">
      <p>Frontend Vue 3 - data diambil dari endpoint JSON Laravel.</p>
    </footer>
  </div>
</template>
