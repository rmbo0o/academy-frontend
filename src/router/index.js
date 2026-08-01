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
  path: '/edit-package/:id',
  name: 'EditPackage',
  component: EditPackageView,
  meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/holidays',
      name: 'Holidays',
      component: () => import('@/views/HolidaysView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/evaluations',
      name: 'Evaluations',
      component: () => import('@/views/EvaluationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
    path: '/reports',
    name: 'reports',
    component: ReportsView,
    meta: { requiresAuth: true, requiresAdmin: true } // حماية مخصصة للأدمن فقط
  },
  {
    path: '/branches',
    name: 'branches',
    component: BranchesView,
    meta: { requiresAuth: true, requiresAdmin: true } // حماية مخصصة للأدمن فقط
  },
  {
  path: '/players/:id',
  name: 'PlayerProfile',
  component: PlayerProfile,
  meta: { requiresAuth: true } 
  },
  {
    path: '/players/:id/edit',
    name: 'EditPlayer',
    component: EditPlayerView,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'WeeklySchedule',
    component: WeeklySchedule,
    meta: { requiresAuth: true }
  },
  {
    path: '/session-attendance/:id',
    name: 'SessionAttendance',
    component: SessionAttendance,
    meta: { requiresAuth: true }
  }
  ]
})

export default router