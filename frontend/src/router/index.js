import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GoalsView from '../views/GoalsView.vue'
import GoalDetailView from '../views/GoalDetailView.vue'

/*
 * Router memakai createWebHistory (mode history) supaya URL tiap halaman
 * bisa di-refresh dan di-bookmark. Setelah di-deploy, Vercel butuh
 * rewrite ke index.html supaya halaman kedua tetap bisa dibuka langsung.
 * Aturan rewrite-nya ada di frontend/vercel.json.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Beranda' },
    },
    {
      path: '/goals',
      name: 'goals',
      component: GoalsView,
      meta: { title: 'Daftar Goal' },
    },
    {
      path: '/goals/:id',
      name: 'goal-detail',
      component: GoalDetailView,
      meta: { title: 'Detail Goal' },
    },
  ],
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Goal Tracker'} - Goal Tracker`
})

export default router
