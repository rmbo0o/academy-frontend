<template>
  <div class="reports-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>
    <div class="reports-card">
      <h2>📊 التقارير المالية والرياضية الشاملة</h2>
      <p class="subtitle">تقرير هذا الشهر الحالي والتحليلات الحسابية الحية للأكاديمية</p>

      <!-- 💵 لوحة الإحصائيات السريعة -->
      <div class="stats-grid">
        <div class="stat-box income">
          <span class="icon">💰</span>
          <div class="stat-info">
            <h4>إجمالي الدخل (الشهر الحالي)</h4>
            <p>{{ report.totalIncome }} ريال</p>
          </div>
        </div>

        <div class="stat-box refunds">
          <span class="icon">💸</span>
          <div class="stat-info">
            <h4>إجمالي المستردات</h4>
            <p>{{ report.totalRefunds }} ريال</p>
          </div>
        </div>

        <div class="stat-box net">
          <span class="icon">📈</span>
          <div class="stat-info">
            <h4>صافي الأرباح (بعد الخصم)</h4>
            <p class="net-text">{{ report.netIncome }} ريال</p>
          </div>
        </div>

        <div class="stat-box players">
          <span class="icon">🏃‍♂️</span>
          <div class="stat-info">
            <h4>إجمالي لاعبي الأكاديمية</h4>
            <p>{{ report.totalPlayers }} لاعب</p>
          </div>
        </div>
      </div>

      <div class="split-sections">
        <!-- ⚽ إحصائيات اللاعبين في كل رياضة -->
        <div class="section-box">
          <h3>🏆 عدد اللاعبين المسجلين حسب الرياضة</h3>
          <div class="sports-list">
            <div v-for="sport in report.playersPerSport" :key="sport.sport_name" class="sport-stat-item">
              <span class="sport-name">💪 {{ sport.sport_name }}</span>
              <span class="sport-badge">{{ sport.player_count }} لاعب</span>
            </div>
            <div v-if="report.playersPerSport.length === 0" class="empty-text">لا توجد إحصائيات رياضية حالية.</div>
          </div>
        </div>

        <!-- 💰 نموذج تسجيل مبلغ مسترد للاعب -->
        <div class="section-box">
          <h3>💸 تسجيل مبلغ مسترد (Refund)</h3>
          <form @submit.prevent="submitRefund" class="refund-form">
            <div class="form-group">
              <label>اختر اللاعب المعني:</label>
              <select v-model="refundForm.player_id" required class="form-input">
                <option value="" disabled>-- حدد اللاعب --</option>
                <option v-for="player in players" :key="player.id" :value="player.id">
                  {{ player.name }} (#{{ player.member_number || 'بدون رقم' }})
                </option>
              </select>
            </div>

            <div class="row">
              <div class="form-group">
                <label>المبلغ المسترد:</label>
                <input type="number" v-model.number="refundForm.amount" required class="form-input" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label>تاريخ الاسترداد:</label>
                <input type="date" v-model="refundForm.date" required class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label>سبب الاسترداد:</label>
              <input type="text" v-model="refundForm.reason" placeholder="مثال: انسحاب اللاعب بسبب الانتقال من المدينة" class="form-input" />
            </div>

            <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

            <button type="submit" class="btn-refund-submit">💾 اعتماد وحفظ كشف المسترد</button>
          </form>
        </div>
      </div>

      <!-- 📝 كشف بآخر العمليات المستردة المسجلة -->
      <div class="recent-refunds-section">
        <h3>📄 كشف آخر 10 عمليات مستردة تم تسجيلها</h3>
        <table class="refund-table">
          <thead>
            <tr>
              <th>اسم اللاعب</th>
              <th>المبلغ المسترد</th>
              <th>التاريخ</th>
              <th>السبب</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="refItem in report.recentRefundsList" :key="refItem.id">
              <td><strong>{{ refItem.player_name }}</strong></td>
              <td class="table-refund-amount">- {{ refItem.amount }} ريال</td>
              <td>{{ refItem.date }}</td>
              <td class="reason-text">{{ refItem.reason || 'لم يذكر' }}</td>
            </tr>
            <tr v-if="report.recentRefundsList.length === 0">
              <td colspan="4" class="no-data">لم يتم تسجيل أي مستردات مالية بعد.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';

const report = ref({
  totalIncome: 0,
  totalRefunds: 0,
  netIncome: 0,
  playersPerSport: [],
  totalPlayers: 0,
  recentRefundsList: []
});

const players = ref([]);
const successMsg = ref('');
const errorMsg = ref('');

const refundForm = ref({
  player_id: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  reason: ''
});

// جلب بيانات التقارير واللاعبين
const fetchReportData = async () => {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    const resReport = await fetch(API + '/api/reports/summary', { headers });
    if (resReport.ok) report.value = await resReport.json();

    const resPlayers = await fetch(API + '/api/players', { headers });
    if (resPlayers.ok) players.value = await resPlayers.json();
  } catch (err) {
    console.error('خطأ في الاتصال بالخادم:', err);
  }
};

onMounted(fetchReportData);

// حفظ وحساب عملية استرجاع مالي جديدة
const submitRefund = async () => {
  successMsg.value = '';
  errorMsg.value = '';

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API + '/api/refunds', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(refundForm.value)
    });

    const data = await response.json();
    if (response.ok) {
      successMsg.value = data.message;
      // مسح المدخلات ما عدا التاريخ
      refundForm.value.player_id = '';
      refundForm.value.amount = '';
      refundForm.value.reason = '';
      // تحديث الواجهة والتقارير فورا
      await fetchReportData();
    } else {
      errorMsg.value = data.message;
    }
  } catch (err) {
    errorMsg.value = 'خطأ في عملية الإرسال.';
  }
};
</script>

<style scoped>
.reports-container { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; background: #f1f5f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { width: 100%; max-width: 1000px; margin-bottom: 15px; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }
.reports-card { background: white; padding: 35px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 1000px; text-align: right; }

h2 { color: #0f172a; margin: 0; font-size: 24px; text-align: center; }
.subtitle { color: #64748b; font-size: 14px; margin-top: 5px; margin-bottom: 30px; text-align: center; }

/* لوحة الإحصائيات */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 35px; }
.stat-box { display: flex; align-items: center; gap: 15px; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b; background: #f8fafc; }
.stat-box .icon { font-size: 32px; }
.stat-info h4 { margin: 0; font-size: 13px; color: #64748b; font-weight: 600; }
.stat-info p { margin: 5px 0 0; font-size: 20px; font-weight: bold; }

/* ألوان ذكية لصناديق الإحصاء */
.income { border-right: 5px solid #22c55e; }
.refunds { border-right: 5px solid #ef4444; }
.net { border-right: 5px solid #3b82f6; background: #f0fdf4; }
.net-text { color: #15803d; }
.players { border-right: 5px solid #a855f7; }

/* التقسيم الثنائي */
.split-sections { display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; margin-bottom: 35px; }
.section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.section-box h3 { margin-top: 0; font-size: 16px; color: #0f172a; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }

/* قائمة الرياضات */
.sports-list { display: flex; flex-direction: column; gap: 12px; }
.sport-stat-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
.sport-name { font-weight: bold; color: #334155; }
.sport-badge { background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 6px; }

/* نموذج المستردات */
.refund-form { display: flex; flex-direction: column; gap: 15px; }
.form-group { display: flex; flex-direction: column; flex: 1; }
.row { display: flex; gap: 15px; }
label { font-weight: 600; margin-bottom: 6px; color: #475569; font-size: 13px; }
.form-input { padding: 9px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: white; outline: none; }
.btn-refund-submit { background: #ef4444; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.btn-refund-submit:hover { background: #dc2626; }

.success-msg { color: #16a34a; font-weight: bold; font-size: 13px; text-align: center; margin: 5px 0; }
.error-msg { color: #dc2626; font-weight: bold; font-size: 13px; text-align: center; margin: 5px 0; }

/* جدول الكشف */
.recent-refunds-section h3 { font-size: 16px; color: #0f172a; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
.refund-table { width: 100%; border-collapse: collapse; text-align: right; font-size: 14px; }
.refund-table th { background: #f1f5f9; color: #475569; padding: 12px; font-weight: bold; }
.refund-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
.table-refund-amount { color: #b91c1c; font-weight: bold; }
.reason-text { color: #64748b; font-style: italic; }
.no-data { text-align: center; color: #94a3b8; padding: 20px; }

@media (max-width: 768px) {
  .split-sections { grid-template-columns: 1fr; }
  .row { flex-direction: column; gap: 0; }
}
</style>