<template>
  <div class="package-container">
    <div class="package-card">
      
      <!-- مؤشر الخطوات العلوي -->
      <div class="wizard-header">
        <div class="step-indicator" :class="{ active: currentStep === 1 }">1. البيانات الأساسية</div>
        <div class="step-line"></div>
        <div class="step-indicator" :class="{ active: currentStep === 2 }">2. أسعار الأشهر والتفعيل</div>
      </div>

      <h2 v-if="currentStep === 1">🏆 إنشاء باقة رياضية جديدة</h2>
      <h2 v-else>💰 ضبط تسعيرة الأشهر وتفعيلها</h2>
      <p class="subtitle">لوحة الإدارة - تخصيص الأيام والوقت المفتوح 24 ساعة</p>

      <form @submit.prevent="savePackage">
        
        <!-- ================= الخطوة الأولى ================= -->
        <div v-if="currentStep === 1" class="step-content">
          
          <!-- 1. تعديل: جعل نوع الرياضة خانة إدخال نصية (Input) بدلاً من قائمة -->
          <div class="form-group">
            <label>اكتب نوع الرياضة المنفصلة *</label>
            <input 
              type="text" 
              v-model="form.sport_name" 
              placeholder="مثال: كرة القدم، سباحة، تايكوندو، كاراتيه..." 
              class="input-highlight"
            />
          </div>

          <div class="form-group">
            <label>اسم الباقة التدريبية *</label>
            <input type="text" v-model="form.name" placeholder="مثال: الفئة السنية 6-8 سنوات" />
          </div>

          <!-- اختيار الأيام عبر Checkbox -->
          <div class="form-group">
            <label>حدد أيام التدريب في الأسبوع *</label>
            <div class="checkbox-group-box">
              <label v-for="day in daysOptions" :key="day" class="custom-checkbox">
                <input type="checkbox" :value="day" v-model="selectedDays" />
                <span class="checkmark-box">{{ day }}</span>
              </label>
            </div>
          </div>

          <!-- 2. تعديل: جعل خانة الوقت مفتوحة ونظام 24 ساعة مع فترات صباحي/مسائي -->
          <div class="form-group">
            <label>حدد مواعيد الحصص التدريبية (نظام الوقت المفتوح) *</label>
            <div class="time-open-container">
              
              <div class="time-pickers-row">
                <div class="time-field">
                  <span>من الساعة:</span>
                  <input type="time" v-model="timeFrom" />
                </div>
                <div class="time-field">
                  <span>إلى الساعة:</span>
                  <input type="time" v-model="timeTo" />
                </div>
              </div>

              <div class="period-selectors">
                <span>تحديد الفترة المتاحة:</span>
                <div class="checkbox-group-box border-none">
                  <label class="custom-checkbox">
                    <input type="checkbox" value="صباحي" v-model="selectedPeriods" />
                    <span class="checkmark-box☀️">☀️ فتره صباحية</span>
                  </label>
                  <label class="custom-checkbox">
                    <input type="checkbox" value="مسائي" v-model="selectedPeriods" />
                    <span class="checkmark-box🌙">🌙 فتره مسائية</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
          
          <div class="buttons-row justify-end">
            <button type="button" @click="goToStep2" class="btn-next">التالي: ضبط الأسعار ➡️</button>
          </div>
        </div>

        <!-- ================= الخطوة الثانية ================= -->
        <div v-if="currentStep === 2" class="step-content">
          <p class="info-alert">قم بكتابة السعر أمام الأشهر التي تريد إتاحتها للموظفين، وضع علامة (✔ تشغيل) لتفعيلها.</p>
          
          <div class="durations-grid">
            <div class="grid-header">
              <div>الفترة الزمنية</div>
              <div>السعر المراد وضعه ($)</div>
              <div>حالة تشغيل الباقة للموظف</div>
            </div>

            <div v-for="(dur, index) in form.durations" :key="dur.months" class="grid-row" :class="{ 'row-active': dur.is_active }">
              <div class="month-label">📅 الاشتراك لمدة <strong>{{ dur.months }}</strong> شهر</div>
              <div>
                <input 
                  type="number" 
                  v-model.number="dur.price" 
                  placeholder="السعر" 
                  :disabled="!dur.is_active"
                  class="price-input"
                />
              </div>
              <div class="checkbox-container">
                <label class="switch">
                  <input type="checkbox" v-model="dur.is_active" />
                  <span class="slider"></span>
                </label>
                <span class="switch-text">{{ dur.is_active ? '✔ OK شغالة' : '❌ معطلة' }}</span>
              </div>
            </div>
          </div>

          <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
          <p v-if="successMsg" class="success-msg"> {{ successMsg }}</p>

          <div class="buttons-row">
            <button type="button" @click="currentStep = 1" class="btn-secondary">⬅️ رجوع للخلف</button>
            <button type="submit" class="btn-success">حفظ وتشغيل الباقة نهائياً 🚀</button>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentStep = ref(1);
const errorMsg = ref('');
const successMsg = ref('');

const daysOptions = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const selectedDays = ref([]);

// متغيرات الوقت المفتوح الجديدة
const timeFrom = ref('');
const timeTo = ref('');
const selectedPeriods = ref([]);

const form = ref({
  sport_name: '', // تحويلها لاسم نصي
  name: '',
  days: '',
  session_time: '',
  durations: Array.from({ length: 12 }, (_, i) => ({
    months: i + 1,
    price: null,
    is_active: false
  }))
});

const goToStep2 = () => {
  errorMsg.value = '';
  
  // تجميع الأيام المختارة
  form.value.days = selectedDays.value.join(' - ');

  // تجميع وقراءة الوقت المفتوح المختار بنظام الـ 24 ساعة والفترات المحددة
  if (timeFrom.value && timeTo.value && selectedPeriods.value.length > 0) {
    const periodsStr = selectedPeriods.value.join(' و ');
    form.value.session_time = `من ${timeFrom.value} إلى ${timeTo.value} (${periodsStr})`;
  } else {
    form.value.session_time = '';
  }

  // التحقق من صحة الإدخال الكامل للخطوة الأولى
  if (!form.value.sport_name.trim() || !form.value.name.trim() || selectedDays.value.length === 0 || !form.value.session_time) {
    errorMsg.value = 'الرجاء كتابة اسم الرياضة، اسم الباقة، واختيار الأيام مع تحديد الوقت والفترة بالكامل.';
    return;
  }
  currentStep.value = 2;
};

const savePackage = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  const hasActive = form.value.durations.some(d => d.is_active && d.price > 0);
  if (!hasActive) {
    errorMsg.value = 'يجب تفعيل شهر واحد على الأقل ووضع سعر له ليظهر للموظف في لوحة التسجيل.';
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form.value)
    });

    const data = await response.json();
    if (response.ok) {
      successMsg.value = data.message;
      setTimeout(() => router.push('/dashboard'), 2500);
    } else {
      errorMsg.value = data.message;
    }
  } catch (error) {
    errorMsg.value = 'حدث خطأ في الاتصال بالسيرفر أثناء حفظ الباقة.';
  }
};
</script>

<style scoped>
.package-container { display: flex; justify-content: center; padding: 40px 20px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.package-card { background: white; padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); width: 100%; max-width: 750px; }

.wizard-header { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; gap: 15px; }
.step-indicator { padding: 8px 16px; border-radius: 20px; background: #e2e8f0; color: #64748b; font-weight: bold; font-size: 14px; }
.step-indicator.active { background: #3b82f6; color: white; }
.step-line { height: 2px; background: #e2e8f0; width: 60px; }

h2 { text-align: center; color: #1e293b; margin: 0; font-size: 22px; }
.subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-top: 5px; margin-bottom: 30px; }
.info-alert { background: #f0fdf4; border-right: 4px solid #22c55e; color: #166534; padding: 12px; border-radius: 6px; font-size: 14px; margin-bottom: 20px; text-align: right; }

.form-group { margin-bottom: 20px; display: flex; flex-direction: column; text-align: right; }
label { font-weight: 600; margin-bottom: 8px; color: #334155; font-size: 14px; }
input[type="text"], input[type="time"] { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; width: 100%; box-sizing: border-box; background: #fff; }
.input-highlight { border: 2px solid #3b82f6; font-weight: bold; }

/* حاوية تجميع الوقت المفتوح الجديد */
.time-open-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.time-pickers-row { display: flex; gap: 20px; }
.time-field { flex: 1; display: flex; flex-direction: column; gap: 5px; font-weight: bold; color: #475569; font-size: 13px; }
.period-selectors { display: flex; flex-direction: column; gap: 8px; margin-top: 5px; font-weight: bold; color: #475569; font-size: 13px; }
.border-none { border: none !important; padding: 0 !important; background: transparent !important; }

/* تصميم لوحة الـ Checkbox للأيام والوقت */
.checkbox-group-box { display: flex; flex-wrap: wrap; gap: 10px; background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
.custom-checkbox { display: flex; align-items: center; cursor: pointer; position: relative; }
.custom-checkbox input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
.checkmark-box, .checkmark-box☀️, .checkmark-box🌙 { background: white; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 6px; font-size: 14px; font-weight: bold; color: #475569; display: inline-block; transition: all 0.2s; user-select: none; text-align: center; }
.custom-checkbox input:checked + .checkmark-box { background: #e0f2fe; border-color: #3b82f6; color: #0284c7; }
.custom-checkbox input:checked + .checkmark-box☀️ { background: #fef08a; border-color: #eab308; color: #854d0e; }
.custom-checkbox input:checked + .checkmark-box🌙 { background: #e0e7ff; border-color: #6366f1; color: #3730a3; }

/* جدول الفترات والأشهر */
.durations-grid { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 25px; }
.grid-header { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr; background: #f1f5f9; padding: 12px; font-weight: bold; color: #475569; font-size: 14px; text-align: center; border-bottom: 1px solid #e2e8f0; }
.grid-row { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr; padding: 12px; align-items: center; text-align: center; border-bottom: 1px solid #f1f5f9; background: #fafafa; }
.row-active { background: #fff !important; }
.month-label { text-align: right; padding-right: 15px; color: #334155; }
.price-input { text-align: center; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 80%; }

.checkbox-container { display: flex; align-items: center; justify-content: center; gap: 8px; }
.switch { position: relative; display: inline-block; width: 44px; height: 22px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 22px; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: #22c55e; }
input:checked + .slider:before { transform: translateX(22px); }
.switch-text { font-size: 13px; font-weight: bold; width: 75px; text-align: right; }

.buttons-row { display: flex; justify-content: space-between; margin-top: 30px; gap: 15px; }
.justify-end { justify-content: flex-end; }
button { padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; border: none; }
.btn-next { background: #3b82f6; color: white; }
.btn-success { background: #22c55e; color: white; flex-grow: 2; }
.btn-secondary { background: #94a3b8; color: white; }
button:hover { opacity: 0.9; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; }
.success-msg { color: #22c55e; background: #f0fdf4; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; }
</style>