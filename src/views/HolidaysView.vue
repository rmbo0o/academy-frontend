<template>
  <div class="holidays-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>

    <div class="holidays-card">
      <h2>🏖️ إدارة الإجازات والعيطل الرسمية</h2>
      <p class="subtitle">تسجيل أيام الإجازة يؤدي إلى تمديد جميع الاشتراكات النشطة تلقائياً بعدد أيام الإجازة</p>

      <form @submit.prevent="addHoliday" class="holiday-form">
        <div class="form-row">
          <div class="form-group flex-2">
            <label>اسم الإجازة <span class="required">*</span></label>
            <input type="text" v-model="form.title" placeholder="مثال: عيد الأضحى المبارك" required />
          </div>
          <div class="form-group flex-1">
            <label>تاريخ بدء الإجازة <span class="required">*</span></label>
            <input type="date" v-model="form.start_date" required />
          </div>
          <div class="form-group flex-1">
            <label>عدد أيام الإجازة <span class="required">*</span></label>
            <input type="number" v-model.number="form.days_count" min="1" placeholder="مثال: 10" required />
          </div>
        </div>

        <div v-if="form.days_count && form.start_date" class="preview-box">
          📅 سيتم تمديد الاشتراكات من تاريخ الانتهاء الحالي لمدة <strong>{{ form.days_count }} يوم إضافي</strong>
          (من {{ form.start_date }} إلى تاريخ الانتهاء المُرجّح)
        </div>

        <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

        <button type="submit" class="btn-submit" :disabled="saving">
          {{ saving ? 'جاري الحفظ...' : '💾 حفظ الإجازة وتمديد الاشتراكات تلقائياً' }}
        </button>
      </form>
    </div>

    <div class="holidays-card" v-if="holidays.length > 0">
      <h3>📋 سجل الإجازات المسجلة سابقاً</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>اسم الإجازة</th>
            <th>تاريخ البدء</th>
            <th>عدد الأيام</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in holidays" :key="h.id">
            <td>{{ h.title }}</td>
            <td>{{ h.start_date }}</td>
            <td>{{ h.days_count }} يوم</td>
            <td><span class="status-badge active">تم التمديد</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';

const form = ref({
  title: '',
  start_date: '',
  days_count: null
});

const holidays = ref([]);
const errorMsg = ref('');
const successMsg = ref('');
const saving = ref(false);

onMounted(async () => {
  await fetchHolidays();
});

const fetchHolidays = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/holidays', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      holidays.value = await response.json();
    }
  } catch (err) {
    console.error(err);
  }
};

const addHoliday = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  saving.value = true;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/holidays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    });

    const data = await response.json();
    if (response.ok) {
      successMsg.value = data.message;
      form.value = { title: '', start_date: '', days_count: null };
      await fetchHolidays();
    } else {
      errorMsg.value = data.message || data.error || 'حدث خطأ';
    }
  } catch (err) {
    errorMsg.value = 'فشل الاتصال بالسيرفر';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.holidays-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 800px; margin: 0 auto 20px auto; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }

.holidays-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto 20px auto; border: 1px solid #e2e8f0; }
h2 { color: #1e3a8a; margin: 0 0 10px 0; text-align: center; }
h3 { color: #1e293b; margin: 0 0 15px 0; font-size: 16px; }
.subtitle { color: #64748b; font-size: 14px; text-align: center; margin-bottom: 25px; }

.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-group { display: flex; flex-direction: column; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

label { font-weight: bold; margin-bottom: 6px; color: #334155; font-size: 14px; }
.required { color: #ef4444; }
input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
input:focus { border-color: #2563eb; }

.preview-box { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; text-align: center; }

.btn-submit { background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
.btn-submit:hover { background: #059669; }
.btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.success-msg { color: #10b981; background: #dcfce7; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }

.data-table { width: 100%; border-collapse: collapse; text-align: right; margin-top: 10px; }
.data-table th { background: #f8fafc; color: #475569; padding: 10px; font-size: 13px; border-bottom: 2px solid #e2e8f0; }
.data-table td { padding: 12px 10px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
.status-badge { font-size: 12px; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
.status-badge.active { background: #dcfce7; color: #15803d; }
</style>
