import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import RegisterPlayerView from '../views/RegisterPlayerView.vue'
import CreateSubscriptionView from '../views/CreateSubscriptionView.vue'
import CreatePackageView from '../views/CreatePackageView.vue'
import AttendanceView from '@/views/AttendanceView.vue'

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
    },
    {
  path: '/create-subscription',
  name: 'CreateSubscription',
  component: CreateSubscriptionView
    },
    {
  path: '/create-package',
  name: 'CreatePackage',
  component: CreatePackageView
    },
    {
  path: '/attendance',
  name: 'attendance',
  component: AttendanceView
    }
  ]
})

export default router