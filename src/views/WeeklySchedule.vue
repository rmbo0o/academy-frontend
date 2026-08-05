<template>
  <div class="schedule-container">
    <div class="back-bar">
      <button type="button" @click="router.push('/dashboard')" class="btn-home">🏠 الرئيسية</button>
    </div>
    <div class="header-section">
      <h2>📅 جدول الحصص والتمارين الأسبوعي التفاعلي</h2>
      <p class="subtitle">
        <span v-if="isCoach">🏃‍♂️ هذه حصصك التدريبية الخاصة بك فقط — قم بتحضير الحضور والغياب مباشرة.</span>
        <span v-else>يتم سحب الأوقات والأيام تلقائياً بناءً على الباقات المحددة، مع توفير تحضير حصري للمدرب المسؤول.</span>
      </p>
    </div>

    <!-- 🛠️ نموذج إضافة حصة تدريبية جديدة (يظهر للأدمن والمدير فقط) -->
    <div v-if="isAdmin" class="add-session-card">
      <h3>➕ إضافة حصة تدريبية جديدة بجدول الأسبوع</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>اختر الباقة الرياضية (النوع والفئة):</label>
          <select v-model="form.package_id" class="form-input">
            <option value="">-- اختر الباقة المخصصة --</option>
            <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">
              {{ pkg.sport_name }} - {{ pkg.package_name }}
            </option>
          </select>
        </div>
      </div>

      <!-- معاينة سريعة لبيانات الباقة بمجرد الاختيار -->
      <div v-if="selectedPackage" class="package-preview">
        <span>⏱️ <strong>توقيت الحصة:</strong> {{ selectedPackage.session_time }}</span>
        <span>📅 <strong>أيام التمرين بالأسبوع:</strong> {{ selectedPackage.days }}</span>
        <span>👥 <strong>الحد الأقصى للمشتركين:</strong> {{ selectedPackage.max_subscribers || 'مفتوح' }} لاعب</span>
        <span>🏃‍♂️ <strong>المدرب المسؤول:</strong> {{ selectedPackage.coach_name || 'غير محدد' }}</span>
      </div>

      <button @click="createSession" class="btn-submit">💾 تفعيل الحصة وحفظها بالجدول الأسبوعي</button>
    </div>

    <!-- 📅 شبكة أيام الأسبوع الأوتوماتيكية -->
    <div class="weekly-grid">
      <div v-for="day in daysOfWeek" :key="day" class="day-column">
        <div class="day-header">{{ day }}</div>
        <div class="sessions-list">
          <div 
            v-for="session in getSessionsByDay(day)" 
            :key="session.id" 
            class="session-card"
          >
            <div class="session-sport">⚽ {{ session.title }}</div>
            <div class="session-time">⏰ {{ session.start_time }} {{ session.end_time ? ' - ' + session.end_time : '' }}</div>
            <div class="session-coach">🏃‍♂️ كابتن: {{ session.coach_name }}</div>
            <div class="session-subscribers">👥 اللاعبين: {{ session.active_subscribers_count }} / {{ session.max_subscribers || '∞' }}</div>
            
            <!-- أزرار الصلاحيات التفاعلية -->
            <button 
              v-if="isAllowedToAttend(session)" 
              @click="openAttendance(session)" 
              class="btn-attendance"
            >
              📝 تحضير الحضور والغياب
            </button>
            <div v-else class="lock-badge">🔒 كشف الحضور مغلق (للمدرب فقط)</div>
          </div>
          <div v-if="getSessionsByDay(day).length === 0" class="no-sessions">لا توجد حصص</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const sessions = ref([]);
const packages = ref([]);
const currentUser = ref(null);

const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const form = ref({
  package_id: ''
});

// استخراج الباقة المحددة لمعاينتها
const selectedPackage = computed(() => {
  return packages.value.find(p => p.id === form.value.package_id) || null;
});

// فحص صلاحية الأدمن
const isAdmin = computed(() => {
  return currentUser.value?.role === 'admin' || currentUser.value?.role === 'المدير العام';
});

// فحص إذا كان المستخدم الحالي مدرباً
const isCoach = computed(() => {
  return currentUser.value?.role === 'coach' || currentUser.value?.role === 'مدرب';
});

// التحقق من تصريح التحضير للمدرب المسؤول أو الأدمن
const isAllowedToAttend = (session) => {
  if (isAdmin.value) return true;
  return currentUser.value && currentUser.value.id === session.coach_id;
};

onMounted(async () => {
  // فك وحفظ بيانات المستخدم المسجل
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
  } else {
    // محاولة فك توكن JWT بشكل تلقائي في حال عدم وجود كائن المستخدم في المتصفح
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        currentUser.value = JSON.parse(jsonPayload);
      } catch (e) {
        console.error("خطأ في فك التوكن:", e);
      }
    }
  }

  await fetchSessions();
  if (isAdmin.value) {
    await fetchPackages();
  }
});

const fetchSessions = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/sessions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) sessions.value = await response.json();
  } catch (err) {
    console.error(err);
  }
};

const fetchPackages = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/packages-list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) packages.value = await response.json();
  } catch (err) {
    console.error(err);
  }
};

const createSession = async () => {
  if (!form.value.package_id) {
    alert('الرجاء اختيار الباقة الرياضية لحفظ الحصة!');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/sessions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ package_id: form.value.package_id })
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      alert(data.message || 'تم إدراج الحصة بجدول التمارين بنجاح! ⚽');
      form.value.package_id = '';
      await fetchSessions();
    } else {
      alert(data.message || 'حدث خطأ أثناء حفظ الحصة!');
    }
  } catch (err) {
    console.error(err);
    alert('فشل الاتصال بالخادم.');
  }
};

// توحيد كتابة الحروف العربية (همزة فوق وتحت وتحت) لمنع عدم تطابق أسماء الأيام
const normalizeArabic = (str) => String(str || '').replace(/[أإآ]/g, 'ا');

// تصفية ذكية لفصل الأيام من سلسلة نصية وتوزيعها بالشبكة
const getSessionsByDay = (day) => {
  const normalizedDay = normalizeArabic(day);
  return sessions.value.filter(session => {
    if (!session.day_of_week) return false;
    const cleanDays = session.day_of_week.split(/[-–,،\s]+/).map(d => normalizeArabic(d).trim());
    return cleanDays.includes(normalizedDay);
  });
};

const openAttendance = (session) => {
  router.push(`/session-attendance/${session.id}`);
};
</script>

<style scoped>
.schedule-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtrim; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 1200px; margin: 0 auto 15px auto; }
.btn-home { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
.btn-home:hover { background: #1d4ed8; }
.header-section { text-align: center; margin-bottom: 30px; }
.header-section h2 { color: #1e3a8a; margin: 0 0 8px 0; }
.subtitle { color: #64748b; font-size: 14px; margin: 0; }

/* بطاقة الإضافة */
.add-session-card { background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.add-session-card h3 { margin-top: 0; color: #1e293b; margin-bottom: 18px; font-size: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 13px; font-weight: bold; color: #475569; }
.form-input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }

.package-preview { margin-top: 20px; background: #f0fdf4; border: 1px dashed #10b981; padding: 12px; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 25px; font-size: 13px; color: #15803d; }

.btn-submit { margin-top: 20px; background: #2563eb; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
.btn-submit:hover { background: #1d4ed8; }

/* جدول الأيام والشبكة */
.weekly-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
.day-column { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; min-height: 450px; overflow: hidden; }
.day-header { background: #1e3a8a; color: white; text-align: center; padding: 12px; font-weight: bold; font-size: 13px; }
.sessions-list { padding: 10px; display: flex; flex-direction: column; gap: 10px; flex-grow: 1; background: #fcfdfe; }

.session-card { background: white; border-right: 4px solid #2563eb; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 6px; }
.session-sport { font-weight: bold; color: #0f172a; font-size: 12px; }
.session-time { font-size: 11px; color: #475569; font-weight: bold; }
.session-coach { font-size: 11px; color: #64748b; }
.session-subscribers { font-size: 11px; color: #059669; font-weight: bold; }

.btn-attendance { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; text-align: center; margin-top: 8px; transition: background 0.2s; }
.btn-attendance:hover { background: #059669; }

.lock-badge { font-size: 10px; color: #94a3b8; text-align: center; padding-top: 8px; font-weight: bold; }
.no-sessions { text-align: center; color: #cbd5e1; font-size: 11px; padding: 25px 0; font-style: italic; }

@media (max-width: 1200px) {
  .weekly-grid { grid-template-columns: 1fr; }
  .day-column { min-height: auto; margin-bottom: 15px; }
}
</style>