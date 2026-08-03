<template>
  <div class="coaches-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>

    <div class="coaches-grid">
      <!-- نموذج إضافة مدرب جديد -->
      <div class="add-coach-card">
        <h2>➕ إضافة مدرب جديد</h2>
        <p class="subtitle">أنشئ حساب مدرب ليتمكن من تسجيل الدخول وإدارة حصصه</p>

        <form @submit.prevent="addCoach">
          <div class="form-group">
            <label>اسم المدرب <span class="req">*</span></label>
            <input type="text" v-model="form.name" required placeholder="مثال: كابتن أحمد محمد" />
          </div>
          <div class="form-group">
            <label>البريد الإلكتروني <span class="req">*</span></label>
            <input type="email" v-model="form.email" required placeholder="coach@academy.com" />
          </div>
          <div class="form-group">
            <label>كلمة المرور <span class="req">*</span></label>
            <input type="password" v-model="form.password" required placeholder="كلمة مرور الدخول" minlength="6" />
          </div>
          <div class="form-group">
            <label>نوع الحساب</label>
            <select v-model="form.role" class="form-input">
              <option value="coach">مدرب</option>
              <option value="branch_manager">مدير فرع</option>
            </select>
          </div>

          <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
          <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

          <button type="submit" class="btn-add" :disabled="saving">
            {{ saving ? 'جاري الحفظ...' : '💾 حفظ المدرب' }}
          </button>
        </form>
      </div>

      <!-- قائمة المدربين الحاليين -->
      <div class="coaches-list-card">
        <h2>📋 قائمة المدربين ({{ coaches.length }})</h2>
        <p class="subtitle">جميع حسابات المدربين المتاحة في النظام</p>

        <div v-if="loading" class="loading-state">🔄 جاري تحميل المدربين...</div>

        <div v-else-if="coaches.length === 0" class="empty-state">
          ⚠️ لا يوجد مدربون مسجلون حالياً.
        </div>

        <ul v-else class="coaches-list">
          <li v-for="coach in coaches" :key="coach.id" class="coach-item">
            <div class="coach-avatar">👨‍🏫</div>
            <div class="coach-info">
              <span class="coach-name">{{ coach.name }}</span>
              <span class="coach-email">{{ coach.email }}</span>
            </div>
            <span class="coach-role-badge">مدرب</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';

const coaches = ref([]);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'coach'
});

const fetchCoaches = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/coaches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) coaches.value = await res.json();
  } catch (err) {
    console.error('خطأ في جلب المدربين:', err);
  } finally {
    loading.value = false;
  }
};

const addCoach = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  saving.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();
    if (res.ok) {
      successMsg.value = data.message;
      form.value.name = '';
      form.value.email = '';
      form.value.password = '';
      form.value.role = 'coach';
      await fetchCoaches();
    } else {
      errorMsg.value = data.message;
    }
  } catch (err) {
    errorMsg.value = 'فشل الاتصال بالسيرفر.';
  } finally {
    saving.value = false;
  }
};

onMounted(fetchCoaches);
</script>

<style scoped>
.coaches-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 1000px; margin: 0 auto 20px auto; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }

.coaches-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; max-width: 1000px; margin: 0 auto; align-items: start; }

.add-coach-card, .coaches-list-card { background: white; padding: 30px; border-radius: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
h2 { color: #1e3a8a; margin: 0 0 5px 0; font-size: 19px; }
.subtitle { color: #64748b; font-size: 13px; margin: 0 0 20px 0; }

.form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
label { font-weight: bold; margin-bottom: 5px; color: #334155; font-size: 13px; }
.req { color: #ef4444; }
input, select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
input:focus, select:focus { border-color: #2563eb; }

.btn-add { background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer; width: 100%; }
.btn-add:hover { background: #059669; }
.btn-add:disabled { background: #94a3b8; cursor: not-allowed; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 9px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.success-msg { color: #10b981; background: #dcfce7; padding: 9px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }

.coaches-list { list-style: none; padding: 0; margin: 0; }
.coach-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #f1f5f9; border-radius: 8px; margin-bottom: 10px; background: #fafbfc; }
.coach-avatar { font-size: 26px; }
.coach-info { flex: 1; display: flex; flex-direction: column; }
.coach-name { font-weight: bold; color: #1e293b; font-size: 14px; }
.coach-email { color: #64748b; font-size: 12px; }
.coach-role-badge { background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; }
.loading-state, .empty-state { text-align: center; padding: 30px; color: #64748b; }

@media (max-width: 800px) {
  .coaches-grid { grid-template-columns: 1fr; }
}
</style>
