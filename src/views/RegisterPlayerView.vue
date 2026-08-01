<template>
  <div class="register-container">
    <!-- 3️⃣ شريط التنقل العلوي مع زر الرجوع للرئيسية -->
    <div class="top-nav-bar">
      <button type="button" @click="goHome" class="btn-home">🏠 العودة للصفحة الرئيسية</button>
    </div>

    <div class="form-card">
      <div class="card-header">
        <h2>📝 استمارة تسجيل لاعب جديد</h2>
        <p class="subtitle">يرجى إدخال البيانات الشخصية والطبية للاعب بدقة</p>
      </div>

      <form @submit.prevent="submitForm" class="player-form">
        
        <!-- 👤 البيانات الشخصية -->
        <div class="section-title">👤 البيانات الشخصية الأساسية</div>
        
        <div class="form-row">
          <div class="form-group flex-2">
            <label>اسم اللاعب الثلاثي <span class="required">*</span></label>
            <input 
              type="text" 
              v-model="form.name" 
              placeholder="أدخل الاسم الكامل" 
              required 
            />
          </div>
          <div class="form-group flex-1">
            <label>رقم المشترك (توليد تلقائي ⚡)</label>
            <input 
              type="text" 
              v-model="form.member_number" 
              placeholder="سيولد تلقائياً" 
              readonly 
              class="read-only-input" 
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>تاريخ الميلاد <span class="required">*</span></label>
            <input 
              type="date" 
              v-model="form.birth_date" 
              @change="calculateAgeAndValidate" 
              required 
            />
          </div>
          <div class="form-group flex-1">
            <label>العمر المحسوب</label>
            <div class="age-display" :class="{ 'has-age': playerAge !== null }">
              {{ playerAge !== null ? playerAge + ' سنة' : '---' }}
            </div>
          </div>
        </div>

        <!-- 4️⃣ التنبيه في حال مخالفة السن المسموح مع خيار التجاوز الاستثنائي -->
        <div class="age-warning-box" v-if="ageViolation">
          <p>⚠️ عمر اللاعب (<strong>{{ playerAge }} سنة</strong>) خارج نطاق الفئة العمرية المسموحة (من {{ minAllowedAge }} إلى {{ maxAllowedAge }} سنة).</p>
        </div>

        <div class="override-option" v-if="ageViolation">
          <input type="checkbox" id="bypass" v-model="bypassAgeRestriction" />
          <label for="bypass">🔓 تفعيل الاستثناء وفك القيود الإدارية لتسجيل هذا اللاعب (مدير فقط)</label>
        </div>

        <!-- 📞 بيانات التواصل ومعلومات أرقام الهواتف -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label>رقم هاتف ولي الأمر <span class="required">*</span></label>
            <input 
              type="tel" 
              v-model="form.parent_phone" 
              maxlength="10" 
              placeholder="05xxxxxxxx" 
              required 
              @input="filterPhoneNumber('parent_phone')" 
            />
          </div>
          <div class="form-group flex-1">
            <label>صلة قرابة لجهة اتصال أخرى</label>
            <input 
              type="text" 
              v-model="form.relative_relation" 
              placeholder="مثال: العم / الخال" 
            />
          </div>
          <div class="form-group flex-1">
            <label>رقم هاتف القريب</label>
            <input 
              type="tel" 
              v-model="form.relative_phone" 
              maxlength="10" 
              placeholder="05xxxxxxxx" 
              @input="filterPhoneNumber('relative_phone')" 
            />
          </div>
        </div>

        <!-- 🏥 البيانات الطبية والمقاييس -->
        <div class="section-title">🏥 الملف الطبي والمقاييس الجسمانية</div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>الطول (سم)</label>
            <input type="number" v-model="form.height" placeholder="مثال: 152" />
          </div>
          <div class="form-group flex-1">
            <label>الوزن (كجم)</label>
            <input type="number" v-model="form.weight" placeholder="مثال: 45" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>الحساسية (إن وجدت)</label>
            <input type="text" v-model="form.allergies" placeholder="مثال: حساسية الطعام أو الأدوية" />
          </div>
          <div class="form-group flex-1">
            <label>الأمراض المزمنة</label>
            <input type="text" v-model="form.chronic_diseases" placeholder="مثال: الربو، السكري" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>إصابات سابقة</label>
            <input type="text" v-model="form.past_injuries" placeholder="مثال: كسر سابق في القدم" />
          </div>
          <div class="form-group flex-1">
            <label>أدوية مستمرة</label>
            <input type="text" v-model="form.current_medications" placeholder="مثال: بخاخ الربو" />
          </div>
        </div>

        <!-- رسائل الخطأ والنجاح -->
        <div v-if="errorMessage" class="alert-box error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert-box success">{{ successMessage }}</div>

        <!-- أزرار الحفظ والإلغاء -->
        <div class="buttons-row">
          <button type="button" @click="goHome" class="btn-secondary">إلغاء والعودة</button>
          <button type="submit" class="btn-primary" :disabled="ageViolation && !bypassAgeRestriction">
            حفظ وتسجيل اللاعب ⚽
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const errorMessage = ref('')
const successMessage = ref('')
const playerAge = ref(null)

const minAllowedAge = ref(6)
const maxAllowedAge = ref(14)
const ageViolation = ref(false)
const bypassAgeRestriction = ref(false)

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
})

const goHome = () => {
  router.push('/dashboard')
}

// تنقية مدخلات الهاتف لتقبل الأرقام فقط
const filterPhoneNumber = (field) => {
  form.value[field] = form.value[field].replace(/\D/g, '')
}

// حساب السن والتحقق من النطاق العمري
const calculateAgeAndValidate = () => {
  if (!form.value.birth_date) return
  const birth = new Date(form.value.birth_date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  playerAge.value = age
  
  if (age < minAllowedAge.value || age > maxAllowedAge.value) {
    ageViolation.value = true
  } else {
    ageViolation.value = false;
  }
}

// إرسال البيانات إلى السيرفر
const submitForm = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (ageViolation.value && !bypassAgeRestriction.value) {
    errorMessage.value = 'لا يمكن التسجيل بسبب قيود العمر. يرجى تفعيل خيار فك القيود للإكمال.'
    return
  }

  // إضافة علامة فك القيود للبيانات المرسلة
  const payload = { ...form.value }
  if (bypassAgeRestriction.value) {
    payload.age_bypass = true
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(API + '/api/players', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok) {
      successMessage.value = `🎉 تم التسجيل بنجاح! رقم المشترك الخاص باللاعب: (${data.member_number})`
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      errorMessage.value = data.message || 'حدث خطأ أثناء حفظ البيانات.'
    }
  } catch (err) {
    errorMessage.value = 'فشل الاتصال بالسيرفر. يرجى التأكد من تشغيل backend.'
  }
}
</script>

<style scoped>
.register-container {
  padding: 30px 15px;
  background-color: #f1f5f9;
  min-height: 100vh;
  direction: rtl;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-nav-bar {
  width: 100%;
  max-width: 800px;
  margin-bottom: 15px;
}

.btn-home {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-home:hover {
  background-color: #1d4ed8;
}

.form-card {
  background: white;
  padding: 35px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 800px;
}

.card-header h2 {
  margin: 0;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  margin-top: 5px;
  font-size: 14px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #0284c7;
  margin: 25px 0 15px 0;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

label {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #334155;
}

.required {
  color: #ef4444;
}

input {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

input:focus {
  border-color: #2563eb;
}

.read-only-input {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.age-display {
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  color: #64748b;
}

.age-display.has-age {
  color: #0284c7;
  background: #f0f9ff;
}

.age-warning-box {
  background-color: #fffbebf8;
  border: 1px solid #fde047;
  color: #854d0e;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.override-option {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #1e40af;
}

.alert-box {
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  font-weight: bold;
}

.alert-box.error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-box.success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.buttons-row {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

button {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #16a34a;
  color: white;
  flex: 2;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #64748b;
  color: white;
  flex: 1;
}
</style>