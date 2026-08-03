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
        <li v-if="userRole === 'admin'" @click="router.push('/coaches')">👨‍🏫 إدارة المدربين</li>
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

      <!-- أزرار إجراءات سريعة للمدير العام -->
      <div v-if="userRole === 'admin'" class="quick-actions">
        <button class="quick-action-btn add-coach-btn" @click="openAddCoachModal">➕ إضافة مدرب جديد</button>
      </div>

      <!-- نافذة منبثقة لإضافة مدرب جديد -->
      <div v-if="showCoachModal" class="modal-overlay" @click.self="closeAddCoachModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>➕ إضافة مدرب جديد</h3>
            <button class="modal-close" @click="closeAddCoachModal">✕</button>
          </div>
          <p class="modal-subtitle">أنشئ حساب مدرب ليتمكن من تسجيل الدخول وإدارة حصصه</p>

          <form @submit.prevent="addCoach">
            <div class="form-group">
              <label>اسم المدرب <span class="req">*</span></label>
              <input type="text" v-model="coachForm.name" required placeholder="مثال: كابتن أحمد محمد" />
            </div>
            <div class="form-group">
              <label>البريد الإلكتروني <span class="req">*</span></label>
              <input type="email" v-model="coachForm.email" required placeholder="coach@academy.com" />
            </div>
            <div class="form-group">
              <label>كلمة المرور <span class="req">*</span></label>
              <input type="password" v-model="coachForm.password" required placeholder="كلمة مرور الدخول" minlength="6" />
            </div>
            <div class="form-group">
              <label>نوع الحساب</label>
              <select v-model="coachForm.role" class="branch-selector-input">
                <option value="coach">مدرب</option>
                <option value="branch_manager">مدير فرع</option>
              </select>
            </div>

            <p v-if="coachError" class="coach-error">⚠️ {{ coachError }}</p>
            <p v-if="coachSuccess" class="coach-success">✅ {{ coachSuccess }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeAddCoachModal">إلغاء</button>
              <button type="submit" class="btn-save" :disabled="coachSaving">
                {{ coachSaving ? 'جاري الحفظ...' : '💾 حفظ المدرب' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- اختيار الفرع (متاح للمدير العام فقط) -->
      <div v-if="userRole === 'admin'" class="branch-selector-card">
        <label class="branch-selector-label">🏢 اختيار الفرع لعرض بياناته:</label>
        <select v-model="selectedBranchId" @change="onBranchChange" class="branch-selector-input">
          <option value="">-- كل الفروع --</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">
            {{ branch.name }} - {{ branch.city }}
          </option>
        </select>
      </div>

      <!-- بطاقة ملخص بيانات الفرع المحدد -->
      <div v-if="selectedBranchId && branchSummary" class="branch-summary-card">
        <h3>📊 ملخص {{ selectedBranchName }}</h3>
        <div class="branch-stats">
          <div class="stat-box"><span class="stat-value">{{ branchSummary.total_players }}</span><span class="stat-label">👥 إجمالي اللاعبين</span></div>
          <div class="stat-box"><span class="stat-value">{{ branchSummary.total_subscriptions }}</span><span class="stat-label">💳 اشتراكات نشطة</span></div>
          <div class="stat-box"><span class="stat-value">{{ branchSummary.total_revenue }}</span><span class="stat-label">💰 إجمالي الإيرادات</span></div>
        </div>
      </div>

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

// متغيرات اختيار الفرع (للمدير العام)
const branches = ref([]);
const selectedBranchId = ref('');
const branchSummary = ref(null);
const selectedBranchName = ref('');

// متغيرات إضافة مدرب جديد (نافذة منبثقة)
const showCoachModal = ref(false);
const coachSaving = ref(false);
const coachError = ref('');
const coachSuccess = ref('');
const coachForm = ref({ name: '', email: '', password: '', role: 'coach' });

const openAddCoachModal = () => {
  coachForm.value = { name: '', email: '', password: '', role: 'coach' };
  coachError.value = '';
  coachSuccess.value = '';
  showCoachModal.value = true;
};

const closeAddCoachModal = () => {
  if (coachSaving.value) return;
  showCoachModal.value = false;
};

const addCoach = async () => {
  coachError.value = '';
  coachSuccess.value = '';
  coachSaving.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(coachForm.value)
    });
    const data = await res.json();
    if (res.ok) {
      coachSuccess.value = data.message;
      setTimeout(() => closeAddCoachModal(), 1500);
    } else {
      coachError.value = data.message || 'حدث خطأ أثناء الحفظ';
    }
  } catch (error) {
    coachError.value = 'فشل الاتصال بالسيرفر';
  } finally {
    coachSaving.value = false;
  }
};

// جلب قائمة الفروع
const fetchBranches = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/branches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) branches.value = await response.json();
  } catch (error) {
    console.error('خطأ في جلب الفروع:', error);
  }
};

// عند اختيار فرع يتم جلب ملخص بياناته وتخزين الاختيار
const onBranchChange = async () => {
  localStorage.setItem('selectedBranchId', selectedBranchId.value);
  branchSummary.value = null;
  if (!selectedBranchId.value) return;
  const branch = branches.value.find(b => b.id === parseInt(selectedBranchId.value));
  selectedBranchName.value = branch ? branch.name : '';
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/branches/${selectedBranchId.value}/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) branchSummary.value = await response.json();
  } catch (error) {
    console.error('خطأ في جلب ملخص الفرع:', error);
  }
};

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
      if (userRole.value === 'admin') {
        await fetchBranches();
        selectedBranchId.value = localStorage.getItem('selectedBranchId') || '';
        if (selectedBranchId.value) {
          await onBranchChange();
        }
      }
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

/* اختيار الفرع للمدير العام */
.branch-selector-card { background: white; padding: 18px 25px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.branch-selector-label { font-weight: bold; color: #1e293b; font-size: 14px; }
.branch-selector-input { padding: 10px 14px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: bold; background: #f8fafc; outline: none; min-width: 260px; }
.branch-selector-input:focus { border-color: #2563eb; background: white; }

/* أزرار الإجراءات السريعة */
.quick-actions { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.quick-action-btn { padding: 12px 22px; border: none; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; color: white; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.add-coach-btn { background: #10b981; }
.add-coach-btn:hover { background: #059669; transform: translateY(-1px); }

/* النافذة المنبثقة */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(3px); }
.modal-box { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 420px; box-shadow: 0 25px 60px rgba(0,0,0,0.3); direction: rtl; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.modal-header h3 { color: #1e3a8a; margin: 0; }
.modal-close { background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; color: #64748b; }
.modal-close:hover { background: #e2e8f0; }
.modal-subtitle { color: #64748b; font-size: 13px; margin: 4px 0 18px 0; }
.modal-box .form-group { display: flex; flex-direction: column; margin-bottom: 14px; }
.modal-box label { font-weight: bold; margin-bottom: 5px; color: #334155; font-size: 13px; }
.modal-box .req { color: #ef4444; }
.modal-box input, .modal-box select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
.modal-box input:focus, .modal-box select:focus { border-color: #2563eb; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 11px; border: 1px solid #cbd5e1; background: white; color: #475569; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-cancel:hover { background: #f1f5f9; }
.btn-save { flex: 2; padding: 11px; border: none; background: #10b981; color: white; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-save:hover { background: #059669; }
.btn-save:disabled { background: #94a3b8; cursor: not-allowed; }
.coach-error { color: #ef4444; background: #fee2e2; padding: 9px; border-radius: 6px; font-weight: bold; text-align: center; margin: 10px 0 0 0; }
.coach-success { color: #10b981; background: #dcfce7; padding: 9px; border-radius: 6px; font-weight: bold; text-align: center; margin: 10px 0 0 0; }

.branch-summary-card { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.branch-summary-card h3 { margin: 0 0 18px 0; font-size: 17px; }
.branch-stats { display: flex; gap: 20px; flex-wrap: wrap; }
.stat-box { background: rgba(255,255,255,0.12); border-radius: 10px; padding: 16px 24px; display: flex; flex-direction: column; align-items: center; min-width: 130px; }
.stat-value { font-size: 26px; font-weight: bold; }
.stat-label { font-size: 12px; opacity: 0.85; margin-top: 4px; }

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