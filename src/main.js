import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

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
