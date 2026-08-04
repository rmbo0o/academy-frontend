import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { getUserFromToken } from './permissions'

const app = createApp(App)

// ==============================================
// اعتراض عالمي للـ Fetch:
// 1) عند انتهاء صلاحية التوكن (401/403) نعيد المستخدم لصفحة الدخول تلقائياً
// 2) عند اختيار فرع معين نضيف branch_id لكل طلبات النظام ليتحول كامل النظام لهذا الفرع
// ==============================================
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const isAuthCall = String(url).includes('/api/login');

  // إضافة معرف الفرع المختار تلقائياً (إن لم يكن مضافاً يدوياً)
  const selectedBranch = localStorage.getItem('selectedBranchId');
  if (selectedBranch && !isAuthCall) {
    const urlStr = String(url);
    // طلبات GET: نضيفها كمعامل استعلام
    if (method === 'GET') {
      if (!urlStr.includes('branch_id=')) {
        const separator = urlStr.includes('?') ? '&' : '?';
        url = urlStr + separator + 'branch_id=' + selectedBranch;
      }
    } else {
      // طلبات POST/PUT/DELETE: نضيفها لجسم الطلب إن كان JSON ولا يحتويها أصلاً
      try {
        if (options.body && typeof options.body === 'string' && options.headers && options.headers['Content-Type'] && options.headers['Content-Type'].includes('application/json')) {
          const body = JSON.parse(options.body);
          if (body && typeof body === 'object' && body.branch_id === undefined) {
            body.branch_id = parseInt(selectedBranch);
            options = { ...options, body: JSON.stringify(body) };
          }
        }
      } catch (e) {}
    }
  }

  const response = await originalFetch(url, options);

  if (!isAuthCall && (response.status === 401 || (response.status === 403 && method === 'GET'))) {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
  return response;
};

// حماية المسارات (Route Guards): مصادقة + صلاحيات لكل صفحة
router.beforeEach((to, from) => {
  const user = getUserFromToken();

  if (to.meta.requiresAuth && !user) {
    return '/login';
  }
  if (user) {
    if (to.path === '/login') {
      return '/dashboard';
    }
    // صفحات خاصة بالمدير العام فقط
    if (to.meta.requiresAdmin && user.role !== 'admin') {
      return '/dashboard';
    }
    // صفحات مرتبطة بصلاحية محددة (لغير المدير العام)
    if (to.meta.permission && user.role !== 'admin') {
      if (!(user.permissions || []).includes(to.meta.permission)) {
        return '/dashboard';
      }
    }
  }
});

app.use(router)

app.mount('#app')
