<template>
  <div class="edit-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
      <button type="button" @click="$router.push(`/players/${playerId}`)" class="btn-view">👁️ عرض الملف</button>
    </div>

    <div class="edit-card" v-if="form.name !== undefined">
      <h2>✏️ تعديل بيانات المشترك</h2>
      <p class="subtitle">{{ form.name }} - رقم المشترك: {{ form.member_number }}</p>

      <form @submit.prevent="savePlayer">
        <!-- البيانات الشخصية -->
        <div class="section-title">👤 البيانات الشخصية</div>
        <div class="form-row">
          <div class="form-group flex-2">
            <label>اسم اللاعب الثلاثي <span class="req">*</span></label>
            <input type="text" v-model="form.name" required />
          </div>
          <div class="form-group flex-1">
            <label>تاريخ الميلاد <span class="req">*</span></label>
            <input type="date" v-model="form.birth_date" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>رقم هاتف ولي الأمر <span class="req">*</span></label>
            <input type="tel" v-model="form.parent_phone" maxlength="10" required />
          </div>
          <div class="form-group flex-1">
            <label>صلة القرابة</label>
            <input type="text" v-model="form.relative_relation" placeholder="مثال: العم" />
          </div>
          <div class="form-group flex-1">
            <label>رقم هاتف القريب</label>
            <input type="tel" v-model="form.relative_phone" maxlength="10" />
          </div>
        </div>

        <!-- البيانات الطبية -->
        <div class="section-title">🏥 البيانات الطبية والمقاييس</div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>الطول (سم)</label>
            <input type="number" v-model="form.height" placeholder="152" />
          </div>
          <div class="form-group flex-1">
            <label>الوزن (كجم)</label>
            <input type="number" v-model="form.weight" placeholder="45" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>الحساسية</label>
            <input type="text" v-model="form.allergies" placeholder="إن وجدت" />
          </div>
          <div class="form-group flex-1">
            <label>الأمراض المزمنة</label>
            <input type="text" v-model="form.chronic_diseases" placeholder="إن وجدت" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>إصابات سابقة</label>
            <input type="text" v-model="form.past_injuries" placeholder="إن وجدت" />
          </div>
          <div class="form-group flex-1">
            <label>أدوية مستمرة</label>
            <input type="text" v-model="form.current_medications" placeholder="إن وجدت" />
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

        <div class="buttons-row">
          <button type="button" @click="$router.push('/dashboard')" class="btn-secondary">إلغاء</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'جاري الحفظ...' : '💾 حفظ جميع التعديلات' }}
          </button>
        </div>
      </form>
    </div>
    <div v-else class="loading">جاري تحميل بيانات المشترك...</div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const playerId = route.params.id;

const form = ref({});
const errorMsg = ref('');
const successMsg = ref('');
const saving = ref(false);

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/players/${playerId}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      form.value = {
        name: data.player.name || '',
        birth_date: data.player.birth_date || '',
        parent_phone: data.player.parent_phone || '',
        relative_relation: data.player.relative_relation || '',
        relative_phone: data.player.relative_phone || '',
        height: data.player.height || '',
        weight: data.player.weight || '',
        allergies: data.player.allergies || '',
        chronic_diseases: data.player.chronic_diseases || '',
        past_injuries: data.player.past_injuries || '',
        current_medications: data.player.current_medications || ''
      };
    }
  } catch (err) {
    errorMsg.value = 'خطأ في جلب البيانات';
  }
});

const savePlayer = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  saving.value = true;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/players/${playerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();
    if (res.ok) {
      successMsg.value = data.message;
      setTimeout(() => router.push(`/players/${playerId}`), 1500);
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
.back-bar { max-width: 800px; margin: 0 auto 20px auto; display: flex; gap: 10px; }
.btn-home { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #475569; }
.btn-view { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-view:hover { background: #1d4ed8; }

.edit-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; }
h2 { color: #1e3a8a; margin: 0 0 5px 0; text-align: center; }
.subtitle { color: #64748b; font-size: 14px; text-align: center; margin-bottom: 25px; }

.section-title { font-size: 15px; font-weight: bold; color: #0284c7; margin: 20px 0 12px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }

.form-row { display: flex; gap: 15px; margin-bottom: 12px; }
.form-group { display: flex; flex-direction: column; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

label { font-weight: bold; margin-bottom: 5px; color: #334155; font-size: 13px; }
.req { color: #ef4444; }
input { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
input:focus { border-color: #2563eb; }

.buttons-row { display: flex; gap: 15px; margin-top: 25px; }
.btn-primary { background: #10b981; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 2; }
.btn-primary:hover { background: #059669; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-secondary { background: #64748b; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.success-msg { color: #10b981; background: #dcfce7; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.loading { text-align: center; font-size: 16px; padding: 50px; color: #64748b; }
</style>
