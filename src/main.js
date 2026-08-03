import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// اعتراض عالمي للردود: عند انتهاء صلاحية التوكن أو عدم صحته نعيد المستخدم لصفحة الدخول تلقائياً
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const response = await originalFetch(url, options);
  const method = (options.method || 'GET').toUpperCase();
  const isAuthCall = String(url).includes('/api/login');
  if (!isAuthCall && (response.status === 401 || (response.status === 403 && method === 'GET'))) {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
  return response;
};

// حماية المسارات (Route Guards)
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token');
  let userRole = '';
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.role || '';
    } catch (e) {}
  }

  if (to.meta.requiresAuth && !token) {
    return '/login';
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    return '/dashboard';
  } else if (to.path === '/login' && token) {
    return '/dashboard';
  }
});

app.use(router)

app.mount('#app')
