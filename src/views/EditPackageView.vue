<template>
  <div class="edit-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>

    <div class="edit-card" v-if="form.name !== undefined">
      <h2>✏️ تعديل الباقة الرياضية</h2>
      <p class="subtitle">{{ form.name }} - {{ form.sport_name }}</p>

      <form @submit.prevent="savePackage">
        <div class="section-title">📋 البيانات الأساسية</div>

        <div class="form-group">
          <label>نوع الرياضة <span class="req">*</span></label>
          <select v-model="form.sport_name" required>
            <option value="" disabled>-- اختر الرياضة --</option>
            <option value="كرة القدم">كرة القدم</option>
            <option value="سباحة">سباحة</option>
            <option value="تايكوندو">تايكوندو</option>
            <option value="كاراتيه">كاراتيه</option>
          </select>
        </div>

        <div class="form-group">
          <label>اسم الباقة <span class="req">*</span></label>
          <input type="text" v-model="form.name" required />
        </div>

        <div class="form-group">
          <label>المدرب المسؤول عن الباقة <span class="req">*</span></label>
          <select v-model="form.coach_id" required>
            <option value="" disabled>-- اختر المدرب المسؤول --</option>
            <option v-for="coach in coaches" :key="coach.id" :value="coach.id">
              {{ coach.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>العدد الأقصى للمشتركين</label>
          <input type="number" v-model.number="form.max_subscribers" min="0" />
        </div>

        <div class="form-group">
          <label>أيام التدريب <span class="req">*</span></label>
          <div class="checkbox-group">
            <label v-for="day in daysOptions" :key="day" class="custom-checkbox">
              <input type="checkbox" :value="day" v-model="selectedDays" />
              <span class="checkmark">{{ day }}</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>من الساعة <span class="req">*</span></label>
            <input type="time" v-model="timeFrom" required />
          </div>
          <div class="form-group flex-1">
            <label>إلى الساعة <span class="req">*</span></label>
            <input type="time" v-model="timeTo" required />
          </div>
        </div>

        <div class="section-title">💰 تسعيرة الأشهر</div>
        <div class="durations-grid">
          <div v-for="(dur, idx) in durations" :key="dur.months" class="dur-row" :class="{ active: dur.is_active }">
            <span class="dur-label">{{ dur.months }} شهر</span>
            <input type="number" v-model.number="dur.price" placeholder="السعر" :disabled="!dur.is_active" class="dur-price" />
            <label class="switch-label">
              <input type="checkbox" v-model="dur.is_active" />
              <span class="switch-text">{{ dur.is_active ? '✔ شغالة' : '❌ معطلة' }}</span>
            </label>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

        <div class="buttons-row">
          <button type="button" @click="$router.push('/dashboard')" class="btn-secondary">إلغاء</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات' }}
          </button>
        </div>
      </form>
    </div>
    <div v-else class="loading">جاري تحميل بيانات الباقة...</div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const packageId = route.params.id;

const daysOptions = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const selectedDays = ref([]);
const timeFrom = ref('');
const timeTo = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const saving = ref(false);

const form = ref({});
const durations = ref([]);
const coaches = ref([]);

onMounted(async () => {
  const token = localStorage.getItem('token');
  try {
    const resCoaches = await fetch(API + '/api/coaches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resCoaches.ok) coaches.value = await resCoaches.json();
  } catch (err) {
    console.error('خطأ في جلب المدربين:', err);
  }

  try {
    const res = await fetch(`${API}/api/packages/${packageId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const pkg = await res.json();
      form.value = {
        sport_name: pkg.sport_name || '',
        name: pkg.name || '',
        coach_id: pkg.coach_id || '',
        max_subscribers: pkg.max_subscribers || 0
      };
      selectedDays.value = pkg.days ? pkg.days.split(' - ') : [];

      if (pkg.session_time) {
        const match = pkg.session_time.match(/من\s+(.+?)\s+إلى\s+(.+)/);
        if (match) {
          timeFrom.value = match[1].trim();
          timeTo.value = match[2].trim();
        }
      }

      durations.value = Array.from({ length: 12 }, (_, i) => {
        const existing = pkg.durations ? pkg.durations.find(d => d.months === i + 1) : null;
        return {
          months: i + 1,
          price: existing ? existing.price : null,
          is_active: existing ? existing.is_active === 1 : false
        };
      });
    }
  } catch (err) {
    errorMsg.value = 'خطأ في جلب البيانات';
  }
});

const savePackage = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  saving.value = true;

  const payload = {
    ...form.value,
    days: selectedDays.value.join(' - '),
    session_time: `من ${timeFrom.value} إلى ${timeTo.value}`,
    durations: durations.value
  };

  const hasActive = durations.value.some(d => d.is_active && d.price > 0);
  if (!hasActive) {
    errorMsg.value = 'يجب تفعيل شهر واحد على الأقل ووضع سعر له.';
    saving.value = false;
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/packages/${packageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      successMsg.value = data.message;
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      errorMsg.value = data.message || 'حدث خطأ';
    }
  } catch (err) {
    errorMsg.value = 'فشل الاتصال بالسيرفر';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.edit-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 800px; margin: 0 auto 20px auto; }
.btn-home { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #475569; }

.edit-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; }
h2 { color: #1e3a8a; margin: 0 0 5px 0; text-align: center; }
.subtitle { color: #64748b; font-size: 14px; text-align: center; margin-bottom: 25px; }

.section-title { font-size: 15px; font-weight: bold; color: #0284c7; margin: 20px 0 12px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }

.form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
.form-row { display: flex; gap: 15px; }
.flex-1 { flex: 1; }
label { font-weight: bold; margin-bottom: 5px; color: #334155; font-size: 13px; }
.req { color: #ef4444; }
input, select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: white; width: 100%; box-sizing: border-box; }
input:focus, select:focus { border-color: #2563eb; }

.checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
.custom-checkbox { display: flex; align-items: center; cursor: pointer; }
.custom-checkbox input { width: auto; margin-left: 5px; }
.checkmark { background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; color: #475569; }
.custom-checkbox input:checked + .checkmark { background: #e0f2fe; border-color: #3b82f6; color: #0284c7; }

.durations-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.dur-row { display: flex; align-items: center; gap: 15px; padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
.dur-row.active { background: #fff; border-color: #3b82f6; }
.dur-label { font-weight: bold; color: #334155; min-width: 70px; }
.dur-price { width: 120px; text-align: center; }
.switch-label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.switch-text { font-size: 12px; font-weight: bold; }

.buttons-row { display: flex; gap: 15px; margin-top: 25px; }
.btn-primary { background: #10b981; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 2; }
.btn-primary:hover { background: #059669; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-secondary { background: #64748b; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.success-msg { color: #10b981; background: #dcfce7; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.loading { text-align: center; font-size: 16px; padding: 50px; color: #64748b; }
</style>
