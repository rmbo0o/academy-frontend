<template>
  <div class="dashboard-container">
    <div class="sidebar">
      <h3>الأكاديمية ⚽</h3>
      <div class="role-badge" :class="userRole">{{ userRole === 'admin' ? 'لوحة المدير' : 'لوحة المدرب' }}</div>
      <ul>
        <li class="active">الرئيسية</li>
        <li v-if="userRole === 'admin'">إدارة شؤون الموظفين 🛠️</li>
      <!-- القائمة الجانبية في الـ Dashboard -->
        <li @click="router.push('/register-player')">📝 تسجيل مشترك جديد</li>
         <li @click="router.push('/create-package')">� إنشاء حزمة جديدة</li>
         <li @click="router.push('/create-subscription')" style=" color: white; font-weight: bold;">💳 تسجيل اشتراك جديد</li>
        <li @click="router.push('/attendance')" style=" color: white; font-weight: bold;">💳 الحضور</li>
        </ul>
      <button @click="logout" class="logout-btn">تسجيل الخروج</button>
    </div>

    <div class="main-content">
      <header>
        <h2>أهلاً بك: {{ userName }} 👋</h2>
      </header>
      
      <div class="card">
        <h3>🔐 البيانات المسترجعة بأمان من السيرفر:</h3>
        <p class="secure-text">{{ secureContent }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const userName = ref('');
const userRole = ref('');
const secureContent = ref('جاري تحميل البيانات الآمنة...');
const router = useRouter();

onMounted(async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    router.push('/login');
    return;
  }

  try {
    // الاتصال بالرابط المحمي وإرسال التوكن في الـ Headers
    const response = await fetch('http://localhost:5000/api/dashboard/data', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}` // إرسال تذكرة الأمان للسيرفر لفحصها
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // إذا كان التوكن مزوراً أو منتهياً قم بطرده لصفحة الدخول
      logout();
    } else {
      userName.value = data.name;
      userRole.value = data.role;
      secureContent.value = data.secretData; // استقبال البيانات المخصصة لدوره فقط
    }
  } catch (error) {
    secureContent.value = 'فشل الاتصال الآمن بالسيرفر.';
  }
});

const logout = () => {
  localStorage.clear();
  router.push('/login');
};
</script>

<style scoped>
.dashboard-container { display: flex; height: 100vh; font-family: sans-serif; direction: rtl; }
.sidebar { width: 260px; background: #1a252f; color: white; padding: 20px; display: flex; flex-direction: column; }
.sidebar h3 { text-align: center; margin-bottom: 10px; }
.role-badge { text-align: center; padding: 5px; border-radius: 4px; font-size: 12px; margin-bottom: 20px; font-weight: bold;}
.role-badge.admin { background: #e74c3c; color: white; }
.role-badge.coach { background: #f1c40f; color: #333; }
.sidebar ul { list-style: none; padding: 0; flex-grow: 1; }
.sidebar li { padding: 12px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; }
.sidebar li.active { background: #34495e; }
.logout-btn { background: #dc3545; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; }
.main-content { flex-grow: 1; background: #f8f9fa; padding: 20px; }
header { background: white; color :black ; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
.card { background: white; color :black ;padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.secure-text { background: #e8f4fd; border-left: 5px solid #2b8cd9; padding: 15px; border-radius: 4px; color: #2b8cd9; font-weight: bold; margin-top: 15px;}
</style>