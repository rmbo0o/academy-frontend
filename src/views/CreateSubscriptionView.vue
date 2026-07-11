<template>
  <div class="subscription-container">
    <div class="subscription-card">
      <h2>💳 شاشة تسجيل وتجديد الاشتراكات</h2>
      <p class="subtitle">اختر المشترك ثم حدد الباقة المتاحة لتوليد التواريخ والأسعار تلقائياً</p>

      <form @submit.prevent="submitSubscription">
        
        <!-- 1. خانة اختيار المشترك -->
        <div class="form-group">
          <label>اختر اللاعب المشترك *</label>
          <select v-model="form.player_id" class="select-highlight">
            <option value="">-- اضغط هنا لاختيار اسم اللاعب --</option>
            <option v-for="player in players" :key="player.id" :value="player.id">
              ⚽ {{ player.name }} ({{ player.member_number || 'بدون رقم' }})
            </option>
          </select>
        </div>

        <!-- 2. خانة اختيار الباقة - [تم إصلاح مشكلة الأقواس النصية هنا] -->
        <div class="form-group">
          <label>اختر الباقة والمدة التدريبية المتاحة *</label>
          <select v-model="form.duration_id" @change="onPackageChange">
            <option value="">-- اختر الباقة التي تم إعدادها وتشغيلها --</option>
            <option v-for="pkg in activePackages" :key="pkg.duration_id" :value="pkg.duration_id">
              🏆 [{{ pkg.sport_name }}] {{ pkg.package_name }} - لمدة ({{ pkg.months }} أشهر)
            </option>
          </select>
        </div>

        <!-- 3. عرض السعر التلقائي بناء على الباقة المختار -->
        <div class="form-group">
          <label>سعر الاشتراك التلقائي للمدة المحددة</label>
          <div class="price-box" :class="{ 'price-active': form.price > 0 }">
            {{ form.price > 0 ? form.price + ' دولار أمريكي' : 'سيظهر السعر هنا بمجرد اختيار الباقة' }}
          </div>
        </div>

        <!-- 4. تواريخ بدء وانتهاء الاشتراك الديناميكية [تبدأ من تاريخ اليوم تلقائياً] -->
        <div class="form-row">
          <div class="form-group">
            <label>تاريخ بدء الاشتراك *</label>
            <input type="date" v-model="form.start_date" @change="calculateEndDate" />
          </div>
          <div class="form-group">
            <label>تاريخ انتهاء الاشتراك (حسب مدة الباقة تلقائياً)</label>
            <input type="date" v-model="form.end_date" disabled class="disabled-input" />
          </div>
        </div>

        <!-- رسائل النظام للمستخدم -->
        <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg"> {{ successMsg }}</p>

        <!-- الأزرار -->
        <div class="buttons-row">
          <button type="button" @click="router.push('/dashboard')" class="btn-secondary">إلغاء</button>
          <button type="submit" class="btn-primary">تفعيل الاشتراك الحالي 🚀</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const players = ref([]);
const activePackages = ref([]);
const selectedPackageDetails = ref(null);
const errorMsg = ref('');
const successMsg = ref('');

// ضبط تاريخ اليوم بتوقيت محلي متوافق مع خانة الـ input date
const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - (offset * 60 * 1000));
  return localToday.toISOString().split('T')[0];
};

const form = ref({
  player_id: '',
  duration_id: '',
  price: 0,
  start_date: getTodayDateString(), // وضع تاريخ اليوم تلقائياً عند فتح الصفحة
  end_date: ''
});

onMounted(async () => {
  const token = localStorage.getItem('token');
  try {
    const resPlayers = await fetch('http://localhost:5000/api/players', { headers: { 'Authorization': `Bearer ${token}` } });
    players.value = await resPlayers.json();

    const resPackages = await fetch('http://localhost:5000/api/active-packages', { headers: { 'Authorization': `Bearer ${token}` } });
    activePackages.value = await resPackages.json();
  } catch (error) {
    errorMsg.value = 'حدث خطأ أثناء تحميل البيانات من السيرفر.';
  }
});

// عند اختيار باقة: يتم تحديث السعر وحساب التواريخ فوراً بناءً على عدد أشهر الباقة المحددة و تاريخ اليوم
const onPackageChange = () => {
  const selected = activePackages.value.find(p => p.duration_id === form.value.duration_id);
  if (selected) {
    form.value.price = selected.price;
    selectedPackageDetails.value = selected;
    calculateEndDate(); // حساب التغير التلقائي فوراً
  } else {
    form.value.price = 0;
    selectedPackageDetails.value = null;
    form.value.end_date = '';
  }
};

// دالة حساب تاريخ الانتهاء تلقائياً بناءً على عدد الأشهر للباقة المختارة
const calculateEndDate = () => {
  if (form.value.start_date && selectedPackageDetails.value) {
    const startDateObj = new Date(form.value.start_date);
    // إضافة عدد الأشهر ديناميكياً (1، 3، 6، 12 شهر)
    startDateObj.setMonth(startDateObj.getMonth() + selectedPackageDetails.value.months);
    form.value.end_date = startDateObj.toISOString().split('T')[0];
  }
};

const submitSubscription = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  if (!form.value.player_id || !form.value.duration_id || !form.value.start_date) {
    errorMsg.value = 'الرجاء اختيار اللاعب، الباقة المتاحة، وتاريخ بدء الاشتراك.';
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        player_id: form.value.player_id,
        duration_id: form.value.duration_id,
        start_date: form.value.start_date,
        end_date: form.value.end_date
      })
    });

    const data = await response.json();
    if (response.ok) {
      successMsg.value = data.message;
      setTimeout(() => router.push('/dashboard'), 2000);
    } else {
      errorMsg.value = data.message;
    }
  } catch (error) {
    errorMsg.value = 'فشل الاتصال بالسيرفر لحفظ الاشتراك.';
  }
};
</script>

<style scoped>
.subscription-container { display: flex; justify-content: center; padding: 40px 20px; background: #f1f5f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.subscription-card { background: white; padding: 35px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 650px; }
h2 { text-align: center; color: #1e293b; margin-bottom: 5px; }
.subtitle { text-align: center; color: #64748b; margin-bottom: 30px; font-size: 14px; }
.form-group { margin-bottom: 22px; display: flex; flex-direction: column; text-align: right; }
.form-row { display: flex; gap: 20px; }
.form-row .form-group { flex: 1; }
label { font-weight: 600; margin-bottom: 8px; color: #334155; font-size: 14px; }
select, input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; width: 100%; box-sizing: border-box; background: #fff; }
.select-highlight { border: 2px solid #3b82f6; background: #f0f9ff; font-weight: bold; color: #1d4ed8; }
.price-box { padding: 15px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-size: 16px; color: #64748b; text-align: center; font-weight: bold; }
.price-active { background: #f0fdf4; border-color: #22c55e; color: #15803d; font-size: 18px; }
.disabled-input { background: #e2e8f0; color: #1e293b; cursor: not-allowed; font-weight: bold; border-color: #cbd5e1; }
.buttons-row { display: flex; justify-content: space-between; margin-top: 35px; gap: 15px; }
button { padding: 12px 25px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; border: none; }
.btn-primary { background: #3b82f6; color: white; flex-grow: 2; }
.btn-secondary { background: #94a3b8; color: white; flex-grow: 1; }
button:hover { opacity: 0.9; }
.error-msg { color: #ef4444; background: #fee2e2; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; }
.success-msg { color: #22c55e; background: #f0fdf4; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; }
</style>