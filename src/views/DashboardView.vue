<template>
  <div class="dashboard-container">
    <!-- القائمة الجانبية -->
    <div class="sidebar">
      <h3>الأكاديمية ⚽</h3>
      <div class="role-badge" :class="userRole">
        {{ roleText }}
      </div>
      <ul>
        <li class="active">الرئيسية</li>
        <li
          v-for="item in menuItems"
          :key="item.route"
          @click="router.push(item.route)"
          :class="{ 'bold-item': item.bold }"
        >{{ item.label }}</li>
      </ul>
      <button @click="logout" class="logout-btn">تسجيل الخروج</button>
    </div>

    <!-- المحتوى الرئيسي -->
    <div class="main-content">
      <header>
        <h2>أهلاً بك: {{ userName }} 👋</h2>
        <p v-if="selectedBranchName" class="branch-indicator">📍 تعمل الآن على فرع: <strong>{{ selectedBranchName }}</strong></p>
      </header>

      <!-- أزرار إجراءات سريعة للمدير العام -->
      <div v-if="userRole === 'admin'" class="quick-actions">
        <button class="quick-action-btn add-coach-btn" @click="router.push('/coaches')">👨‍💼 إدارة الموظفين والصلاحيات</button>
      </div>

      <!-- اختيار الفرع (متاح للمدير العام ومدير الفرع) -->
      <div v-if="userRole === 'admin' || userRole === 'branch_manager'" class="branch-selector-card">
        <label class="branch-selector-label">🏢 اختيار الفرع للعمل عليه:</label>
        <select
          v-model="selectedBranchId"
          @change="onBranchChange"
          class="branch-selector-input"
          :disabled="isBranchManager"
        >
          <option v-if="userRole === 'admin'" value="">-- كل الفروع --</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">
            {{ branch.name }} - {{ branch.city }}
          </option>
        </select>
        <span v-if="isBranchManager" class="branch-manager-note">🔒 مدير الفرع مقيد بفرعه المخصص</span>
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

      <!-- آخر المشتركين المسجلين (حسب الفرع المحدد) -->
      <div class="card recent-players-card">
        <h3>🆕 آخر المشتركين المسجلين</h3>
        <p class="secure-text">
          {{ selectedBranchName ? 'أحدث 10 مشتركين تم تسجيلهم في فرع: ' + selectedBranchName : 'أحدث 10 مشتركين تم تسجيلهم في النظام' }}
        </p>
        <table class="recent-table" v-if="recentPlayers.length > 0">
          <thead>
            <tr>
              <th>رقم العضوية</th>
              <th>اسم اللاعب</th>
              <th>تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in recentPlayers" :key="p.id" class="clickable-row" @click="goToProfile(p.id)">
              <td><span class="member-badge">{{ p.member_number }}</span></td>
              <td class="player-name-cell">{{ p.name }}</td>
              <td class="date-cell">{{ formatDate(p.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-recent">لا يوجد مشتركين مسجلين بعد.</div>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUserFromToken, hasPermission } from '../permissions';

const router = useRouter();

// البيانات الأساسية للوحة
const userName = ref('');
const userRole = ref('');
const branchIdFromToken = ref(null);

const roleText = computed(() =>
  userRole.value === 'admin' ? 'لوحة المدير العام'
  : userRole.value === 'branch_manager' ? 'لوحة مدير الفرع'
  : userRole.value === 'employee' ? 'لوحة الموظف'
  : 'لوحة المدرب'
);

// قائمة القائمة الجانبية حسب الصلاحيات
const menuItems = computed(() => {
  const items = [];
  if (userRole.value === 'admin') {
    items.push({ label: '🏢 إدارة الفروع المتعددة', route: '/branches', bold: true });
  }
  if (hasPermission('players')) items.push({ label: '📝 تسجيل مشترك جديد', route: '/register-player' });
  if (hasPermission('subscriptions')) items.push({ label: '💳 تسجيل اشتراك جديد', route: '/create-subscription', bold: true });
  if (hasPermission('packages')) items.push({ label: '📦 إدارة الباقات', route: '/create-package' });
  if (hasPermission('schedule')) items.push({ label: '📋 متابعة الحضور والغياب', route: '/schedule', bold: true });
  if (hasPermission('evaluations')) items.push({ label: '📊 تقييم اللاعبين الشهري', route: '/evaluations' });
  if (hasPermission('reports')) items.push({ label: '📊 التقارير المالية والرياضية', route: '/reports', bold: true });
  if (hasPermission('holidays')) items.push({ label: '🏖️ إدارة الإجازات', route: '/holidays', bold: true });
  if (userRole.value === 'admin') items.push({ label: '👨‍💼 إدارة الموظفين والصلاحيات', route: '/coaches', bold: true });
  return items;
});

// المتغيرات الجديدة الخاصة بالبحث عن اللاعبين
const searchQuery = ref('');
const searchResults = ref([]);
const searchTimeout = ref(null);

// متغيرات اختيار الفرع
const branches = ref([]);
const selectedBranchId = ref('');
const branchSummary = ref(null);
const selectedBranchName = ref('');

// آخر المشتركين المسجلين
const recentPlayers = ref([]);

const isBranchManager = computed(() => userRole.value === 'branch_manager');

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('ar-EG');
};

// جلب آخر 10 مشتركين مسجلين (حسب الفرع المختار تلقائياً)
const fetchRecentPlayers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/players/recent?limit=10', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) recentPlayers.value = await response.json();
  } catch (error) {
    console.error('خطأ في جلب آخر المشتركين:', error);
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
  selectedBranchName.value = '';
  if (!selectedBranchId.value) {
    await fetchRecentPlayers();
    return;
  }
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
  await fetchRecentPlayers();
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
  const user = getUserFromToken();
  if (!user) {
    router.push('/login');
    return;
  }
  userName.value = user.name || 'المستخدم';
  userRole.value = user.role || 'employee';
  branchIdFromToken.value = user.branch_id || null;

  if (userRole.value === 'admin' || userRole.value === 'branch_manager') {
    await fetchBranches();

    // مدير الفرع: يُحدد فرعه تلقائياً ولا يمكن تغييره
    if (userRole.value === 'branch_manager' && branchIdFromToken.value) {
      selectedBranchId.value = String(branchIdFromToken.value);
      await onBranchChange();
    } else {
      selectedBranchId.value = localStorage.getItem('selectedBranchId') || '';
      if (selectedBranchId.value) {
        await onBranchChange();
      }
    }
  }

  await fetchRecentPlayers();
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
.role-badge.employee { background: #6366f1; }
.sidebar ul { list-style: none; padding: 0; margin: 0; flex-grow: 1; }
.sidebar li { padding: 12px 15px; cursor: pointer; border-radius: 6px; margin-bottom: 8px; transition: 0.2s; }
.sidebar li:hover, .sidebar li.active { background: #334155; }
.sidebar li.bold-item { font-weight: bold; }
.logout-btn { background: #ef4444; border: none; color: white; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }

.main-content { flex-grow: 1; padding: 30px; }
header { margin-bottom: 30px; }
.branch-indicator { color: #1e3a8a; background: #dbeafe; display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; margin-top: 6px; }
.card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
.card h3 { color: #0f172a; margin-top: 0; margin-bottom: 10px; }
.secure-text { color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }

/* اختيار الفرع */
.branch-selector-card { background: white; padding: 18px 25px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.branch-selector-label { font-weight: bold; color: #1e293b; font-size: 14px; }
.branch-selector-input { padding: 10px 14px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: bold; background: #f8fafc; outline: none; min-width: 260px; }
.branch-selector-input:focus { border-color: #2563eb; background: white; }
.branch-selector-input:disabled { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
.branch-manager-note { color: #b45309; font-size: 13px; font-weight: bold; }

.branch-summary-card { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.branch-summary-card h3 { margin: 0 0 18px 0; font-size: 17px; }
.branch-stats { display: flex; gap: 20px; flex-wrap: wrap; }
.stat-box { background: rgba(255,255,255,0.12); border-radius: 10px; padding: 16px 24px; display: flex; flex-direction: column; align-items: center; min-width: 130px; }
.stat-value { font-size: 26px; font-weight: bold; }
.stat-label { font-size: 12px; opacity: 0.85; margin-top: 4px; }

/* أزرار الإجراءات السريعة */
.quick-actions { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.quick-action-btn { padding: 12px 22px; border: none; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; color: white; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.add-coach-btn { background: #10b981; }
.add-coach-btn:hover { background: #059669; transform: translateY(-1px); }

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

/* آخر المشتركين المسجلين */
.recent-players-card { margin-top: 20px; }
.recent-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.recent-table th, .recent-table td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; }
.recent-table th { background: #f8fafc; color: #475569; font-size: 12px; }
.clickable-row { cursor: pointer; transition: background 0.15s; }
.clickable-row:hover { background: #eff6ff; }
.player-name-cell { font-weight: bold; color: #0f172a; }
.date-cell { color: #64748b; font-size: 13px; }
.empty-recent { color: #94a3b8; text-align: center; padding: 20px; }
</style>
