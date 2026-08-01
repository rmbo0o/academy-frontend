<template>
  <div class="evaluations-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>

    <div class="eval-card">
      <h2>📊 تقييم الأداء الشهري لللاعبين</h2>
      <p class="subtitle">قم بتقييم أداء اللاعب ثم أرسل التقرير لولي الأمر عبر الواتساب</p>

      <form @submit.prevent="saveEvaluation" class="eval-form">
        <div class="form-row">
          <div class="form-group flex-1">
            <label>اختر اللاعب <span class="required">*</span></label>
            <select v-model="form.player_id" required>
              <option value="" disabled>-- اختر اللاعب --</option>
              <option v-for="player in players" :key="player.id" :value="player.id">
                {{ player.name }} (#{{ player.member_number }})
              </option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>الشهر <span class="required">*</span></label>
            <input type="month" v-model="form.month" required />
          </div>
        </div>

        <div class="section-title">⚡ تقييم المهارات الرياضية (من 1 إلى 10)</div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>تمرير الكرة 🎯</label>
            <div class="score-input">
              <input type="range" v-model.number="form.passing_score" min="1" max="10" class="range-input" />
              <span class="score-value">{{ form.passing_score }}/10</span>
            </div>
          </div>
          <div class="form-group flex-1">
            <label>التسديد والضرب 🥅</label>
            <div class="score-input">
              <input type="range" v-model.number="form.shooting_score" min="1" max="10" class="range-input" />
              <span class="score-value">{{ form.shooting_score }}/10</span>
            </div>
          </div>
          <div class="form-group flex-1">
            <label>السرعة والجري 🏃</label>
            <div class="score-input">
              <input type="range" v-model.number="form.running_score" min="1" max="10" class="range-input" />
              <span class="score-value">{{ form.running_score }}/10</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>ملاحظات المدرب 📝</label>
          <textarea v-model="form.notes" rows="4" placeholder="اكتب ملاحظاتك التفصيلية عن أداء اللاعب هذا الشهر..."></textarea>
        </div>

        <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

        <div class="buttons-row">
          <button type="submit" class="btn-save" :disabled="saving">
            {{ saving ? 'جاري الحفظ...' : '💾 حفظ التقييم' }}
          </button>
          <button type="button" @click="sendWhatsApp" class="btn-whatsapp" :disabled="!lastEvaluation">
            📱 إرسال التقرير عبر الواتساب
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';

const players = ref([]);
const errorMsg = ref('');
const successMsg = ref('');
const saving = ref(false);
const lastEvaluation = ref(null);

const form = ref({
  player_id: '',
  month: new Date().toISOString().slice(0, 7),
  passing_score: 5,
  shooting_score: 5,
  running_score: 5,
  notes: ''
});

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/players', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      players.value = await response.json();
    }
  } catch (err) {
    console.error(err);
  }
});

const saveEvaluation = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  saving.value = true;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/evaluations', {
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
      lastEvaluation.value = { ...form.value };
      const player = players.value.find(p => p.id === form.value.player_id);
      if (player) lastEvaluation.value.player_name = player.name;
    } else {
      errorMsg.value = data.message || data.error || 'حدث خطأ';
    }
  } catch (err) {
    errorMsg.value = 'فشل الاتصال بالسيرفر';
  } finally {
    saving.value = false;
  }
};

const sendWhatsApp = () => {
  if (!lastEvaluation.value) return;

  const playerName = lastEvaluation.value.player_name || 'اللاعب';
  const month = lastEvaluation.value.month;
  const passing = lastEvaluation.value.passing_score;
  const shooting = lastEvaluation.value.shooting_score;
  const running = lastEvaluation.value.running_score;
  const avg = Math.round((passing + shooting + running) / 3 * 10) / 10;
  const notes = lastEvaluation.value.notes || 'لا توجد ملاحظات';

  const message = `تقرير الأداء الشهري - ${playerName}
الشهر: ${month}

评估 المهارات الرياضية:
🎯 نسبة التمرير: ${passing}/10
⚽ نسبة التسديد: ${shooting}/10
🏃 نسبة الجري: ${running}/10
📊 المتوسط العام: ${avg}/10

📝 ملاحظات المدرب:
${notes}

---
أكاديمية النجوم الرياضية`;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};
</script>

<style scoped>
.evaluations-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 800px; margin: 0 auto 20px auto; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }

.eval-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; }
h2 { color: #1e3a8a; margin: 0 0 10px 0; text-align: center; }
.subtitle { color: #64748b; font-size: 14px; text-align: center; margin-bottom: 25px; }
.section-title { font-size: 15px; font-weight: bold; color: #0284c7; margin: 20px 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }

.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
.flex-1 { flex: 1; }

label { font-weight: bold; margin-bottom: 6px; color: #334155; font-size: 14px; }
.required { color: #ef4444; }
select, input[type="month"] { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: white; }
select:focus, input:focus { border-color: #2563eb; }

textarea { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; resize: vertical; width: 100%; box-sizing: border-box; font-family: inherit; }
textarea:focus { border-color: #2563eb; }

.score-input { display: flex; align-items: center; gap: 12px; }
.range-input { flex: 1; accent-color: #2563eb; }
.score-value { font-weight: bold; color: #1e3a8a; font-size: 16px; min-width: 45px; }

.buttons-row { display: flex; gap: 15px; margin-top: 20px; }
.btn-save { background: #10b981; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer; flex: 1; }
.btn-save:hover { background: #059669; }
.btn-save:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-whatsapp { background: #25d366; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer; flex: 1; }
.btn-whatsapp:hover { background: #128c7e; }
.btn-whatsapp:disabled { background: #94a3b8; cursor: not-allowed; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.success-msg { color: #10b981; background: #dcfce7; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
</style>
