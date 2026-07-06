import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import RegisterPlayerView from '../views/RegisterPlayerView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login' // تحويل أي شخص يدخل للموقع الأساسي إلى صفحة الدخول تلقائياً
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
  path: '/register-player',
  name: 'RegisterPlayer',
  component: RegisterPlayerView
    }
  ]
})

export default router