<template>
  <div class="dashboard-container">
    <!-- القائمة الجانبية -->
    <div class="sidebar">
      <h3>الأكاديمية ⚽</h3>
      <div class="role-badge" :class="userRole">
        {{ userRole === 'admin' ? 'لوحة المدير العام' : userRole === 'branch_manager' ? 'لوحة مدير الفرع' : 'لوحة المدرب' }}
      </div>
      <ul>
        <li class="active">الرئيسية</li>
        <li v-if="userRole === 'admin'" @click="router.push('/branches')" style="color: white; font-weight: bold;">🏢 إدارة الفروع المتعددة</li>
        <li @click="router.push('/register-player')">📝 تسجيل مشترك جديد</li>
        <li v-if="userRole === 'admin'" @click="router.push('/create-package')">📦 إنشاء حزمة جديدة</li>
        <li @click="router.push('/create-subscription')" style="color: white; font-weight: bold;">💳 تسجيل اشتراك جديد</li>
        <li @click="router.push('/schedule')" style="color: white; font-weight: bold;">📋 متابعة الحضور والغياب</li>
        <li v-if="userRole === 'admin'" @click="router.push('/reports')" style="color: white; font-weight: bold;">📊 التقارير المالية والرياضية</li>
        <li v-if="userRole === 'admin'" @click="router.push('/holidays')" style="color: white; font-weight: bold;">🏖️ إدارة الإجازات والﻌطل</li>
        <li @click="router.push('/evaluations')" style="color: white; font-weight: bold;">📊 تقييم اللاعبين الشهري</li>
      </ul>
      <button @click="logout" class="logout-btn">تسجيل الخروج</button>
    </div>

    <!-- المحتوى الرئيسي -->
    <div class="main-content">
      <header>
        <h2>أهلاً بك: {{ userName }} 👋</h2>
      </header>
      
      <!-- كرت البحث السريع عن اللاعب الذكي -->
      <div class="card">
        <h3>🔍 البحث السريع والوصول لملف لاعب:</h3>
        <p class="secure-text">اكتب اسم المشترك أو رقم العضوية للبحث عن ملفه الشامل:</p>
        
        <div class="lookup-box">
          <div class="search-wrapper">
            <input 
              type="text" 
              v-model="searchQuery" 
              @input="searchPlayers" 
              placeholder="🔍 اكتب اسم اللاعب أو رقم المشترك..."
              class="search-input"
            />
            <div v-if="searchResults.length > 0" class="search-dropdown">
              <div 
                v-for="player in searchResults" 
                :key="player.id" 
                class="search-result-item"
                @click="goToProfile(player.id)"
              >
                <span class="player-name-text">{{ player.name }}</span>
                <span class="player-member-text">#{{ player.member_number || 'بدون رقم' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// البيانات الأساسية للوحة
const userName = ref('');
const userRole = ref('');
const secureContent = ref('');

// المتغيرات الجديدة الخاصة بالبحث عن اللاعبين
const searchQuery = ref('');
const searchResults = ref([]);
const searchTimeout = ref(null);

// دالة البحث الفوري بالاسم أو رقم العضوية
const searchPlayers = async () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  
  if (!searchQuery.value || searchQuery.value.length < 1) {
    searchResults.value = [];
    return;
  }

  searchTimeout.value = setTimeout(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/players/search?q=${encodeURIComponent(searchQuery.value)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        searchResults.value = await response.json();
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
    }
  }, 300);
};

onMounted(async () => {
  // 1. استرجاع بيانات المستخدم من التوكن (الكود الأساسي لديك)
  const token = localStorage.getItem('token');
  if (token) {
    try {
      // فك التوكن أو استرجاع بيانات الجلسة
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName.value = payload.username || 'المستخدم';
      userRole.value = payload.role || 'coach';
    } catch (e) {
      console.error('خطأ في قراءة بيانات التوكن', e);
    }
  }
});

// دالة الانتقال الذكية لصفحة تعديل بيانات اللاعب
const goToProfile = (id) => {
  if (!id) return;
  router.push(`/players/${id}/edit`);
};

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<style scoped>
/* التنسيقات الأساسية للوحة التحكم الخاصة بك */
.dashboard-container { display: flex; min-height: 100vh; background: #f8fafc; direction: rtl; font-family: sans-serif; }
.sidebar { width: 260px; background: #1e293b; color: white; padding: 20px; display: flex; flex-direction: column; }
.sidebar h3 { text-align: center; margin-bottom: 20px; }
.role-badge { text-align: center; padding: 5px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; font-weight: bold; }
.role-badge.admin { background: #ef4444; }
.role-badge.branch_manager { background: #f59e0b; }
.role-badge.coach { background: #10b981; }
.sidebar ul { list-style: none; padding: 0; margin: 0; flex-grow: 1; }
.sidebar li { padding: 12px 15px; cursor: pointer; border-radius: 6px; margin-bottom: 8px; transition: 0.2s; }
.sidebar li:hover, .sidebar li.active { background: #334155; }
.logout-btn { background: #ef4444; border: none; color: white; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }

.main-content { flex-grow: 1; padding: 30px; }
header { margin-bottom: 30px; }
.card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
.card h3 { color: #0f172a; margin-top: 0; margin-bottom: 10px; }
.secure-text { color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }

/* 🌟 تنسيق صندوق البحث الجديد */
.lookup-box { display: flex; gap: 15px; align-items: center; margin-top: 15px; }
.search-wrapper { flex-grow: 1; position: relative; }
.search-input { width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 15px; background: #f8fafc; outline: none; box-sizing: border-box; transition: border-color 0.2s; }
.search-input:focus { border-color: #2563eb; background: white; }

.search-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); z-index: 100; max-height: 300px; overflow-y: auto; margin-top: 4px; }
.search-result-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f1f5f9; }
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: #eff6ff; }
.player-name-text { font-weight: bold; color: #1e293b; font-size: 14px; }
.player-member-text { color: #64748b; font-size: 13px; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
</style>