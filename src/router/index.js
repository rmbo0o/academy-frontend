import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import RegisterPlayerView from '../views/RegisterPlayerView.vue'
import CreateSubscriptionView from '../views/CreateSubscriptionView.vue'
import CreatePackageView from '../views/CreatePackageView.vue'
import ReportsView from '@/views/ReportsView.vue'
import BranchesView from '@/views/BranchesView.vue'
import PlayerProfile from '@/views/PlayerProfile.vue'
import EditPlayerView from '@/views/EditPlayerView.vue'
import EditPackageView from '@/views/EditPackageView.vue'
import WeeklySchedule from '../views/WeeklySchedule.vue';
import SessionAttendance from '../views/SessionAttendance.vue';


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
  component: RegisterPlayerView,
  meta: { requiresAuth: true, permission: 'players' }
    },
    {
  path: '/create-subscription',
  name: 'CreateSubscription',
  component: CreateSubscriptionView,
  meta: { requiresAuth: true, permission: 'subscriptions' }
    },
    {
  path: '/create-package',
  name: 'CreatePackage',
  component: CreatePackageView,
  meta: { requiresAuth: true, permission: 'packages' }
    },
    {
  path: '/coaches',
  name: 'Coaches',
  component: () => import('@/views/CoachesView.vue'),
  meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
  path: '/edit-package/:id',
  name: 'EditPackage',
  component: EditPackageView,
  meta: { requiresAuth: true, permission: 'packages' }
    },
    {
      path: '/holidays',
      name: 'Holidays',
      component: () => import('@/views/HolidaysView.vue'),
      meta: { requiresAuth: true, permission: 'holidays' }
    },
    {
      path: '/evaluations',
      name: 'Evaluations',
      component: () => import('@/views/EvaluationsView.vue'),
      meta: { requiresAuth: true, permission: 'evaluations' }
    },
    {
    path: '/reports',
    name: 'reports',
    component: ReportsView,
    meta: { requiresAuth: true, permission: 'reports' }
  },
  {
    path: '/branches',
    name: 'branches',
    component: BranchesView,
    meta: { requiresAuth: true, permission: 'branches' }
  },
  {
  path: '/players/:id',
  name: 'PlayerProfile',
  component: PlayerProfile,
  meta: { requiresAuth: true, permission: 'players' }
  },
  {
    path: '/players/:id/edit',
    name: 'EditPlayer',
    component: EditPlayerView,
    meta: { requiresAuth: true, permission: 'players' }
  },
  {
    path: '/schedule',
    name: 'WeeklySchedule',
    component: WeeklySchedule,
    meta: { requiresAuth: true, permission: 'schedule' }
  },
  {
    path: '/session-attendance/:id',
    name: 'SessionAttendance',
    component: SessionAttendance,
    meta: { requiresAuth: true, permission: 'schedule' }
  }
  ]
})

export default router