<template>
  <div class="subscription-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>
    <div class="subscription-card">
      <h2>الاشتراك في باقة رياضية</h2>
      <p class="subtitle">اختر اللاعب ثم حدد الرياضة والباقة المناسبة لتفعيل الاشتراك</p>

      <form @submit.prevent="submitSubscription">
        
        <!-- 1. اختيار اللاعب -->
        <div class="form-group">
          <label>اللاعب المشترك:</label>
          <select v-model="form.player_id" required class="form-input">
            <option value="" disabled>-- اختر اللاعب --</option>
            <option v-for="player in players" :key="player.id" :value="player.id">
              {{ player.name }} (#{{ player.member_number || 'بدون رقم' }})
            </option>
          </select>
        </div>

        <div class="row">
          <!-- 2. قائمة الرياضات الافتراضية الذكية -->
          <div class="form-group">
            <label>نوع الرياضة:</label>
            <select v-model="selectedSport" @change="onSportChange" required class="form-input">
              <option value="" disabled>-- اختر الرياضة أولاً --</option>
              <option v-for="sport in uniqueSports" :key="sport" :value="sport">
                {{ sport }}
              </option>
            </select>
          </div>

          <!-- 3. قائمة الباقات المرتبطة بالرياضة المحددة فقط -->
          <div class="form-group">
            <label>الباقة والمدة المتاحة:</label>
            <select v-model="form.duration_id" :disabled="!selectedSport" required class="form-input">
              <option value="" disabled>
                {{ selectedSport ? '-- اختر الباقة والمدة --' : '⚠️ يرجى اختيار الرياضة أولاً' }}
              </option>
              <option v-for="pkg in filteredPackages" :key="pkg.duration_id" :value="pkg.duration_id">
                {{ pkg.package_name }} - لمده {{ pkg.months }} أشهر [ المتاح: {{ pkg.max_subscribers - pkg.current_subscribers }} من {{ pkg.max_subscribers }} ]
              </option>
            </select>
          </div>
        </div>

        <div class="row">
          <!-- 💰 1. خانة عرض السعر المستقلة المحدثة تلقائياً -->
          <div class="form-group">
            <label>سعر الباقة المحدد:</label>
            <input type="text" :value="selectedPackagePrice" disabled class="form-input read-only-input text-bold" placeholder="0.00" />
          </div>

          <!-- 📅 2. تاريخ بدء الاشتراك -->
          <div class="form-group">
            <label>تاريخ بدء الاشتراك:</label>
            <input type="date" v-model="form.start_date" required class="form-input" />
          </div>
        </div>

        <div class="row">
          <!-- 📅 2. تاريخ انتهاء الاشتراك (محسوب ومقفل تلقائياً لعدم التلاعب) -->
          <div class="form-group">
            <label>تاريخ انتهاء الاشتراك (محسوب تلقائياً):</label>
            <input type="date" v-model="form.end_date" readonly required class="form-input read-only-input text-bold" />
          </div>
        </div>

        <!-- رسائل الحالة والتنبيهات الملونة -->
        <div v-if="ageMismatch" class="age-warning-box">
          <p>⚠️ عمر المشترك (<strong>{{ selectedPlayerAge }}</strong> سنة) لا يناسب الفئة السنية للباقة (<strong>{{ packageAgeRange }}</strong> سنة).</p>
        </div>

        <!-- خيار فك القيود العمرية - متاح للمدير ومدير الفرع فقط -->
        <div class="bypass-section">
          <div class="override-option">
            <input type="checkbox" id="bypassSub" v-model="bypassAgeRestriction" :disabled="userRole === 'coach'" />
            <label for="bypassSub" :class="{ disabled: userRole === 'coach' }">
              🔓 تفعيل الاستثناء وفك القيود للتسجيل في رياضة خارج الفئة العمرية
            </label>
            <span v-if="userRole === 'coach'" class="role-restriction">(غير متاح للمدربين)</span>
            <span v-else class="role-allowed">(متاح للمدير ومدير الفرع)</span>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg">🎉 {{ successMsg }}</p>

        <!-- زر التفعيل -->
        <button type="submit" class="btn-submit">⚡ تفعيل اشتراك اللاعب</button>
      </form>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, computed, onMounted, watch } from 'vue';

// البيانات القادمة من السيرفر
const players = ref([]);
const allActivePackages = ref([]);

// المتغيرات الخاصة بالفلترة والتحديد
const selectedSport = ref('');
const errorMsg = ref('');
const successMsg = ref('');

// متغيرات فك القيود العمري
const selectedPlayerAge = ref(null);
const packageAgeRange = ref('');
const ageMismatch = ref(false);
const bypassAgeRestriction = ref(false);

// استخراج صلاحية المستخدم من التوكن
const userRole = ref('');
const initUserRole = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole.value = payload.role || '';
    } catch (e) { userRole.value = ''; }
  }
};
initUserRole();

// نموذج إرسال البيانات للسيرفر
const form = ref({
  player_id: '',
  duration_id: '',
  start_date: new Date().toISOString().split('T')[0], // تاريخ اليوم افتراضياً
  end_date: ''
});

// جلب البيانات عند تحميل الصفحة
const loadData = async () => {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  try {
    const resPlayers = await fetch(API + '/api/players', { headers });
    if (resPlayers.ok) players.value = await resPlayers.json();

    const resPackages = await fetch(API + '/api/active-packages', { headers });
    if (resPackages.ok) allActivePackages.value = await resPackages.json();
  } catch (err) {
    errorMsg.value = 'حدث خطأ أثناء الاتصال بالسيرفر وجلب البيانات.';
  }
};

onMounted(loadData);

// استخراج الرياضات الفريدة المتوفرة
const uniqueSports = computed(() => {
  const sports = allActivePackages.value.map(p => p.sport_name);
  return [...new Set(sports)];
});

// فلترة الباقات حسب الرياضة المختارة
const filteredPackages = computed(() => {
  if (!selectedSport.value) return [];
  return allActivePackages.value.filter(p => p.sport_name === selectedSport.value);
});

// الكائن الكامل للباقة المحددة حالياً
const selectedPackageObj = computed(() => {
  return allActivePackages.value.find(p => p.duration_id === form.value.duration_id);
});

// 💰 1. حساب السعر الفوري وعرضه
const selectedPackagePrice = computed(() => {
  if (selectedPackageObj.value) {
    return `${selectedPackageObj.value.price} ريال/دولار`;
  }
  return 'يرجى تحديد الباقة';
});

// 📅 2. دالة حساب تاريخ الانتهاء تلقائياً بناءً على عدد شهور الباقة
const calculateEndDate = () => {
  if (!form.value.start_date || !form.value.duration_id || !selectedPackageObj.value) {
    form.value.end_date = '';
    return;
  }
  
  const monthsToAdd = selectedPackageObj.value.months;
  const startDate = new Date(form.value.start_date);
  
  // إضافة الأشهر بشكل يحمي من تداخل الشهور غير المتساوية بالأيام
  startDate.setMonth(startDate.getMonth() + monthsToAdd);
  
  form.value.end_date = startDate.toISOString().split('T')[0];
};

// 🔄 مراقبة أي تغيير في تاريخ البدء أو الباقة المختارة لتحديث تاريخ الانتهاء فوراً
watch(() => [form.value.start_date, form.value.duration_id], () => {
  calculateEndDate();
});

// مراقبة تغيير اللاعب لجلب عمره والتحقق من تطابق الفئة العمرية
watch(() => form.value.player_id, async (newPlayerId) => {
  bypassAgeRestriction.value = false;
  selectedPlayerAge.value = null;
  ageMismatch.value = false;
  
  if (!newPlayerId) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/players/${newPlayerId}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.player && data.player.birth_date) {
        const birth = new Date(data.player.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        selectedPlayerAge.value = age;
        checkAgeMismatch();
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// مراقبة تغيير الباقة للتحقق من الفئة العمرية
watch(() => form.value.duration_id, () => {
  checkAgeMismatch();
});

// استخراج الفئة العمرية من اسم الباقة (مثال: "الفئة السنية 6-8 سنوات" → min:6, max:8)
const extractAgeFromPackageName = (packageName) => {
  if (!packageName) return null;
  const match = packageName.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  return null;
};

// التحقق من عدم تطابق الفئة العمرية
const checkAgeMismatch = () => {
  ageMismatch.value = false;
  packageAgeRange.value = '';
  
  if (!selectedPlayerAge.value || !selectedPackageObj.value) return;
  
  const ageRange = extractAgeFromPackageName(selectedPackageObj.value.package_name);
  if (!ageRange) return;
  
  packageAgeRange.value = `${ageRange.min}-${ageRange.max}`;
  
  if (selectedPlayerAge.value < ageRange.min || selectedPlayerAge.value > ageRange.max) {
    ageMismatch.value = true;
  }
};

const onSportChange = () => {
  form.value.duration_id = '';
  form.value.end_date = '';
};

// إرسال طلب الاشتراك مع التحقق النهائي من السعة
const submitSubscription = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  // 🛑 3. الفحص والمنع الفوري على الواجهة قبل الذهاب للسيرفر
  if (selectedPackageObj.value) {
    const { max_subscribers, current_subscribers, package_name } = selectedPackageObj.value;
    if (max_subscribers > 0 && current_subscribers >= max_subscribers) {
      errorMsg.value = `لا يمكن إضافة المشترك! الباقة (${package_name}) ممتلئة بالكامل وقد وصلت للحد الأقصى المسموح به وهو (${max_subscribers}) طلاب فقط.`;
      return;
    }
  }

  // فحص الفئة العمرية
  if (ageMismatch.value && !bypassAgeRestriction.value) {
    errorMsg.value = `عمر المشترك (${selectedPlayerAge.value} سنة) لا يناسب الفئة السنية للباقة (${packageAgeRange.value} سنة). يرجى تفعيل خيار فك القيود للمتابعة.`;
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const payload = { ...form.value, age_bypass: bypassAgeRestriction.value };
    const response = await fetch(API + '/api/subscriptions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
      successMsg.value = data.message;
      form.value.player_id = '';
      form.value.duration_id = '';
      selectedSport.value = '';
      await loadData(); // إعادة تحديث العدادات من السيرفر مباشرة
    } else {
      errorMsg.value = data.message;
    }
  } catch (err) {
    errorMsg.value = 'فشل تفعيل الاشتراك، يرجى المحاولة لاحقاً.';
  }
};
</script>

<style scoped>
.subscription-container { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; background: #f1f5f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { width: 100%; max-width: 700px; margin-bottom: 15px; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }
.subscription-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 700px; text-align: right; }

h2 { color: #0f172a; margin: 0; font-size: 22px; text-align: center; }
.subtitle { color: #64748b; font-size: 14px; margin-top: 5px; margin-bottom: 25px; text-align: center; }

.form-group { display: flex; flex-direction: column; margin-bottom: 20px; flex: 1; }
.row { display: flex; gap: 20px; }

label { font-weight: 600; margin-bottom: 6px; color: #334155; font-size: 14px; }
.form-input { padding: 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; background: white; outline: none; transition: border 0.2s; width: 100%; }
.form-input:focus { border-color: #3b82f6; }
.form-input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

/* ستايل مخصص للحقول المقفلة لتبدو احترافية */
.read-only-input { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; cursor: not-allowed; }
.text-bold { font-weight: bold; color: #1e3a8a; }

.btn-submit { background: #10b981; color: white; border: none; padding: 13px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-submit:hover { background: #059669; }

.error-msg { color: #ef4444; font-weight: bold; margin-bottom: 15px; text-align: center; background: #fee2e2; padding: 10px; border-radius: 8px; border: 1px solid #fca5a5; }
.success-msg { color: #10b981; font-weight: bold; margin-bottom: 15px; text-align: center; background: #dcfce7; padding: 10px; border-radius: 8px; border: 1px solid #86efac; }

.age-warning-box { background-color: #fffbeb; border: 1px solid #fde047; color: #854d0e; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
.age-warning-box p { margin: 0; font-weight: bold; }

.bypass-section { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px; }
.override-option { display: flex; align-items: center; gap: 8px; font-weight: bold; color: #1e40af; flex-wrap: wrap; }
.override-option label { cursor: pointer; }
.override-option label.disabled { color: #94a3b8; cursor: not-allowed; }
.role-restriction { color: #ef4444; font-size: 12px; font-weight: bold; }
.role-allowed { color: #10b981; font-size: 12px; font-weight: bold; }

@media (max-width: 600px) {
  .row { flex-direction: column; gap: 0; }
}
</style>