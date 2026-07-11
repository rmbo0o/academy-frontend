<template>
  <div class="register-container">
    <div class="form-card">
      <h2>📝 استمارة تسجيل لاعب جديد</h2>
      <p class="subtitle">يرجى ملء البيانات الشخصية والطبية للاعب</p>
      
      <form @submit.prevent="submitForm">
        
        <div class="section-title">👤 البيانات الشخصية الأساسية</div>
        
        <div class="form-row">
          <div class="form-group flex-2">
            <label>اسم اللاعب الثلاثي *</label>
            <input type="text" v-model="form.name" placeholder="أدخل الاسم الكامل" />
          </div>
          <div class="form-group flex-1">
            <label>رقم المشترك (إن وجد)</label>
            <input type="text" v-model="form.member_number" placeholder="اختياري" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>تاريخ الميلاد *</label>
            <input type="date" v-model="form.birth_date" @input="calculateAge" />
          </div>
          <div class="form-group flex-1">
            <label>العمر الحالي</label>
            <div class="age-display" :class="{ 'has-age': playerAge }">
              {{ playerAge ? playerAge : 'يحسب تلقائياً' }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>رقم هاتف ولي الأمر *</label>
          <input 
            type="tel" 
            v-model="form.parent_phone" 
            maxlength="10" 
            placeholder="05xxxxxxxx" 
            @input="filterPhoneNumber('parent_phone')"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>صلة قرابة الهاتف البديل</label>
            <input type="text" v-model="form.relative_relation" placeholder="مثال: الأم، الأخ، العم" />
          </div>
          <div class="form-group">
            <label>رقم هاتف القريب </label>
            <input 
              type="tel" 
              v-model="form.relative_phone" 
              maxlength="10" 
              placeholder="05xxxxxxxx (اختياري)" 
              @input="filterPhoneNumber('relative_phone')"
            />
          </div>
        </div>

        <div class="section-title">🏥 الملف الطبي والمقاييس الجسمانية</div>

        <div class="form-row">
          <div class="form-group">
            <label>الطول (سم)</label>
            <input type="number" v-model="form.height" placeholder="مثال: 152" />
          </div>
          <div class="form-group">
            <label>الوزن (كجم)</label>
            <input type="number" v-model="form.weight" placeholder="مثال: 46" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>هل يعاني من أي حساسية؟</label>
            <input type="text" v-model="form.allergies" placeholder="اكتبها هنا (إن وجدت)" />
          </div>
          <div class="form-group">
            <label>هل يعاني من أمراض مزمنة؟</label>
            <input type="text" v-model="form.chronic_diseases" placeholder="ربو، سكري، إلخ... (إن وجد)" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>إصابات أو عمليات سابقة؟</label>
            <input type="text" v-model="form.past_injuries" placeholder="كسور، غضروف، إلخ... (إن وجد)" />
          </div>
          <div class="form-group">
            <label>أدوية حالية مستخدمة؟</label>
            <input type="text" v-model="form.current_medications" placeholder="اسم الدواء ومواعيده (إن وجد)" />
          </div>
        </div>

        <p v-if="errorMessage" class="error-msg">⚠️ {{ errorMessage }}</p>
        <p v-if="successMessage" class="success-msg"> {{ successMessage }}</p>

        <div class="buttons-row">
          <button type="button" @click="router.push('/dashboard')" class="btn-secondary">إلغاء والعودة</button>
          <button type="submit" class="btn-success">إتمام وحفظ اللاعب ⚽</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const errorMessage = ref('');
const successMessage = ref('');
const playerAge = ref('');

// كائن البيانات المحدث بالكامل بناء على طلبك
const form = ref({
  name: '',
  birth_date: '',
  parent_phone: '',
  relative_relation: '',
  relative_phone: '',
  member_number: '',
  height: null,
  weight: null,
  allergies: '',
  chronic_diseases: '',
  past_injuries: '',
  current_medications: ''
});

// دالة تمنع كتابة أي شيء عدا الأرقام وتضمن عدم تجاوز الطول المطلق
const filterPhoneNumber = (field) => {
  form.value[field] = form.value[field].replace(/\D/g, ''); // حذف أي حرف ليس رقماً
};

// دالة حساب العمر التلقائي فور إدخال التاريخ
const calculateAge = () => {
  if (!form.value.birth_date) {
    playerAge.value = '';
    return;
  }
  const birth = new Date(form.value.birth_date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  playerAge.value = age >= 0 ? `${age} سنة` : 'غير صالح';
};

// إرسال الاستمارة المحدثة
const submitForm = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // 1. التحقق من الحقول الإلزامية
  if (!form.value.name || !form.value.birth_date || !form.value.parent_phone) {
    errorMessage.value = 'الرجاء ملء الحقول الإلزامية: اسم اللاعب، تاريخ الميلاد، ورقم هاتف ولي الأمر.';
    return;
  }

  // 2. التحقق من طول رقم جوال ولي الأمر (يجب ألا يزيد عن 10 أرقام، ويفضل أن يكون 10 تماماً)
  if (form.value.parent_phone.length > 10) {
    errorMessage.value = 'رقم هاتف ولي الأمر لا يمكن أن يزيد عن 10 أرقام.';
    return;
  }

  // 3. التحقق من رقم هاتف القريب إن كُتب
  if (form.value.relative_phone && form.value.relative_phone.length > 10) {
    errorMessage.value = 'رقم هاتف القريب البديل لا يمكن أن يزيد عن 10 أرقام.';
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    });

    const data = await response.json();
    if (response.ok) {
      successMessage.value = data.message;
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      errorMessage.value = data.message;
    }
  } catch (error) {
    errorMessage.value = 'فشل الاتصال بالسيرفر أثناء حفظ البيانات.';
  }
};
</script>

<style scoped>
.register-container { display: flex; justify-content: center; padding: 40px 20px; background: #f4f6f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.form-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 700px; }
h2 { text-align: center; color: #2c3e50; margin-bottom: 5px; }
.subtitle { text-align: center; color: #7f8c8d; margin-bottom: 25px; font-size: 14px; }
.section-title { font-size: 16px; font-weight: bold; color: #2980b9; margin: 25px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #edf2f7; text-align: right; }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; text-align: right; }
.form-row { display: flex; gap: 20px; }
.form-row .form-group { flex: 1; }
.flex-2 { flex: 2 !important; }
.flex-1 { flex: 1 !important; }
label { font-weight: 600; margin-bottom: 8px; color: #34495e; font-size: 13px; }
input { padding: 11px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 15px; width: 100%; box-sizing: border-box; background: #fff; }
input:focus { border-color: #2980b9; outline: none; box-shadow: 0 0 5px rgba(41,128,185,0.2); }
.age-display { padding: 11px; background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 15px; color: #94a3b8; text-align: center; font-weight: bold; min-height: 43px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
.age-display.has-age { background: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
.buttons-row { display: flex; justify-content: space-between; margin-top: 35px; gap: 15px; }
button { padding: 12px 25px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; border: none; }
.btn-success { background: #27ae60; color: white; flex-grow: 2; }
.btn-secondary { background: #95a5a6; color: white; flex-grow: 1; }
button:hover { opacity: 0.9; }
.error-msg { color: #c0392b; background: #fde8e7; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-top: 15px; }
.success-msg { color: #27ae60; background: #e8f8f0; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-top: 15px; }
</style>