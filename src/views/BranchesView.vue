<template>
  <div class="branches-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>
    <div class="branches-card">
      <h2>🏢 مركز قيادة ومقارنة الفروع المتعددة</h2>
      <p class="subtitle">راقب أداء الفروع مالياً، وقارن إنجازاتها، وقم بإدارة المنتسبين إليها بكل سهولة</p>

      <!-- 📊 1. بطاقات الأداء السريعة والمقارنة الحية -->
      <div class="metrics-grid" v-if="branches.length > 0">
        <div class="metric-box best-revenue">
          <span class="icon">🏆</span>
          <div class="metric-info">
            <h4>الفرع الأعلى إيراداً</h4>
            <p>{{ bestBranch.name || 'لا يوجد' }}</p>
            <small>{{ bestBranch.revenue || 0 }} ريال</small>
          </div>
        </div>

        <div class="metric-box best-activity">
          <span class="icon">🔥</span>
          <div class="metric-info">
            <h4>الفرع الأكثر لاعبين</h4>
            <p>{{ mostActiveBranch.name || 'لا يوجد' }}</p>
            <small>{{ mostActiveBranch.players || 0 }} لاعب مسجل</small>
          </div>
        </div>
      </div>

      <!-- 📈 2. جدول مقارنة أداء الفروع تفصيلياً -->
      <div class="comparison-section">
        <h3>📊 جدول مقارنة أداء الفروع العام</h3>
        <div class="table-responsive">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>اسم الفرع</th>
                <th>المدينة</th>
                <th>المدير المسؤول</th>
                <th>عدد اللاعبين</th>
                <th>الاشتراكات المفعلة</th>
                <th>إجمالي الإيرادات</th>
                <th>الحصة السوقية والأداء</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in branches" :key="branch.id">
                <td><strong>📍 {{ branch.name }}</strong></td>
                <td>{{ branch.city }}</td>
                <td>👤 {{ branch.manager || 'غير معين' }}</td>
                <td><span class="badge players-badge">{{ branch.total_players }} لاعب</span></td>
                <td><span class="badge subs-badge">{{ branch.total_subscriptions }} اشتراك</span></td>
                <td class="revenue-text">{{ branch.total_revenue }} ريال</td>
                <td>
                  <!-- شريط تقدم تفاعلي يوضح نسبة الفرع من الإيراد الإجمالي للشركة -->
                  <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ width: getRevenuePercentage(branch.total_revenue) + '%' }"></div>
                    <span class="progress-label">{{ getRevenuePercentage(branch.total_revenue) }}%</span>
                  </div>
                </td>
              </tr>
              <tr v-if="branches.length === 0">
                <td colspan="7" class="no-data">يرجى تسجيل فرع واحد على الأقل للبدء بالمقارنة.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 🛠️ 3. التوزيع الثنائي: تفاصيل الفرع العميق + نموذج إضافة فرع -->
      <div class="split-layout">
        
        <!-- الأيمن: كاشف تفاصيل فرع محدد وإدارة لاعبيه -->
        <div class="detail-section">
          <h3>🔍 منظار تفاصيل الفرع الذكي</h3>
          <div class="form-group">
            <label>اختر فرعاً لمعاينة بياناته العميقة ولاعبيه:</label>
            <select v-model="selectedBranchId" @change="onBranchSelect" class="form-input branch-select">
              <option value="" disabled>-- حدد الفرع --</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">📍 {{ b.name }}</option>
            </select>
          </div>

          <!-- تفاصيل الفرع المحدد -->
          <div v-if="selectedBranchId && activeBranchDetails" class="branch-deep-info">
            <div class="info-card">
              <p>📞 <strong>هاتف التواصل:</strong> {{ activeBranchDetails.phone || 'غير مسجل' }}</p>
              <p>🗺️ <strong>عنوان الفرع:</strong> {{ activeBranchDetails.address || 'غير مسجل' }}</p>
            </div>

            <!-- أداة سريعة لنقل وتعيين لاعب للفرع -->
            <div class="assign-player-box">
              <h5>➕ تعيين / نقل لاعب لهذا الفرع:</h5>
              <div class="assign-inputs">
                <select v-model="assignedPlayerId" class="form-input">
                  <option value="" disabled>-- اختر اللاعب المراد نقله --</option>
                  <option v-for="p in allPlayers" :key="p.id" :value="p.id">
                    {{ p.name }} (#{{ p.member_number || 'بدون' }})
                  </option>
                </select>
                <button @click="assignPlayerToBranch" class="btn-assign">⚡ ربط بالفرع</button>
              </div>
            </div>

            <!-- قائمة اللاعبين الحاليين بالفرع -->
            <h5 class="list-title">🏃‍♂️ قائمة لاعبي الفرع المنتسبين حالياً ({{ branchPlayers.length }} لاعب):</h5>
            <div class="players-list-scroll">
              <div v-for="bp in branchPlayers" :key="bp.id" class="player-item">
                <span>👤 {{ bp.name }} (#{{ bp.member_number || 'بدون' }})</span>
                <span class="phone">📞 {{ bp.parent_phone }}</span>
              </div>
              <p v-if="branchPlayers.length === 0" class="empty-list">لا يوجد أي لاعبين منتسبين لهذا الفرع حالياً.</p>
            </div>
          </div>
          <div v-else class="empty-select-prompt">
            👈 الرجاء اختيار فرع من القائمة بالأعلى لعرض تقاريره المفصلة وقائمة لاعبيه المسجلين فيه!
          </div>
        </div>

        <!-- الأيسر: نموذج إضافة فرع جديد -->
        <div class="form-section">
          <h3>➕ تسجيل فرع جديد للأكاديمية</h3>
          <form @submit.prevent="submitBranch" class="branch-form">
            <div class="form-group">
              <label>اسم الفرع:</label>
              <input type="text" v-model="form.name" required class="form-input" placeholder="مثال: فرع جدة الشمالي" />
            </div>

            <div class="row">
              <div class="form-group">
                <label>المدينة:</label>
                <input type="text" v-model="form.city" required class="form-input" placeholder="الرياض، جدة..." />
              </div>
              <div class="form-group">
                <label>هاتف التواصل:</label>
                <input type="text" v-model="form.phone" class="form-input" placeholder="05xxxxxxxx" />
              </div>
            </div>

            <div class="form-group">
              <label>المدير المسؤول:</label>
              <input type="text" v-model="form.manager" class="form-input" placeholder="اسم مدير الفرع الجديد" />
            </div>

            <div class="form-group">
              <label>العنوان التفصيلي:</label>
              <input type="text" v-model="form.address" class="form-input" placeholder="الحي، الشارع..." />
            </div>

            <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

            <button type="submit" class="btn-branch-submit">🏢 اعتماد وإطلاق الفرع الجديد</button>
          </form>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, computed, onMounted } from 'vue';

const branches = ref([]);
const allPlayers = ref([]);
const branchPlayers = ref([]);
const selectedBranchId = ref('');
const assignedPlayerId = ref('');

const successMsg = ref('');
const errorMsg = ref('');

const form = ref({
  name: '',
  city: '',
  phone: '',
  manager: '',
  address: ''
});

// جلب البيانات الأساسية للوحة التحكم
const loadDashboardData = async () => {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  try {
    const res = await fetch(API + '/api/branches/comparison', { headers });
    if (res.ok) branches.value = await res.json();

    const resPlayers = await fetch(API + '/api/players', { headers });
    if (resPlayers.ok) allPlayers.value = await resPlayers.json();
  } catch (err) {
    console.error('خطأ في جلب بيانات الفروع:', err);
  }
};

onMounted(loadDashboardData);

// حساب إجمالي أرباح جميع الفروع لتقييم الحصص النسبية
const totalAllBranchesRevenue = computed(() => {
  return branches.value.reduce((sum, b) => sum + b.total_revenue, 0);
});

// حساب نسبة مبيعات الفرع من الإجمالي
const getRevenuePercentage = (rev) => {
  if (totalAllBranchesRevenue.value === 0) return 0;
  return Math.round((rev / totalAllBranchesRevenue.value) * 100);
};

// حساب الفرع الأعلى أرباحاً
const bestBranch = computed(() => {
  if (branches.value.length === 0) return { name: '', revenue: 0 };
  const sorted = [...branches.value].sort((a, b) => b.total_revenue - a.total_revenue);
  return { name: sorted[0].name, revenue: sorted[0].total_revenue };
});

// حساب الفرع الأكثر استقبالاً للاعبين
const mostActiveBranch = computed(() => {
  if (branches.value.length === 0) return { name: '', players: 0 };
  const sorted = [...branches.value].sort((a, b) => b.total_players - a.total_players);
  return { name: sorted[0].name, players: sorted[0].total_players };
});

// إظهار تفاصيل الفرع المفتوح حالياً
const activeBranchDetails = computed(() => {
  return branches.value.find(b => b.id === selectedBranchId.value);
});

// عند تغيير الفرع المختار، جلب اللاعبين التابعين له فورا
const onBranchSelect = async () => {
  assignedPlayerId.value = '';
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API}/api/branches/${selectedBranchId.value}/players`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      branchPlayers.value = await response.json();
    }
  } catch (err) {
    console.error('خطأ في جلب لاعبي الفرع:', err);
  }
};

// تعيين لاعب للفرع المحدد حالياً
const assignPlayerToBranch = async () => {
  if (!assignedPlayerId.value || !selectedBranchId.value) return;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(API + '/api/players/assign-branch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        player_id: assignedPlayerId.value,
        branch_id: selectedBranchId.value
      })
    });

    if (response.ok) {
      await loadDashboardData(); // تحديث أرقام وإحصائيات الفروع بالجدول الأعلى
      await onBranchSelect();    // تحديث قائمة اللاعبين بالفرع فوراً
      assignedPlayerId.value = '';
    }
  } catch (err) {
    console.error('فشل ربط اللاعب بالفرع:', err);
  }
};

// تسجيل فرع جديد
const submitBranch = async () => {
  successMsg.value = '';
  errorMsg.value = '';
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(API + '/api/branches', {
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
      form.value = { name: '', city: '', phone: '', manager: '', address: '' };
      await loadDashboardData(); // تحديث القائمة والجدول والمقارنات فورا
    } else {
      errorMsg.value = data.message;
    }
  } catch (err) {
    errorMsg.value = 'فشل في عملية الاتصال لإرسال بيانات الفرع الجديد.';
  }
};
</script>

<style scoped>
.branches-container { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; background: #f1f5f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { width: 100%; max-width: 1200px; margin-bottom: 15px; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }
.branches-card { background: white; padding: 35px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 1200px; text-align: right; }

h2 { color: #0f172a; margin: 0; font-size: 24px; text-align: center; }
.subtitle { color: #64748b; font-size: 14px; margin-top: 5px; margin-bottom: 30px; text-align: center; }

/* 📊 ألوان وإستايل بطاقات الإحصائيات والمقارنة الحية */
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
.metric-box { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b; }
.metric-box .icon { font-size: 35px; }
.metric-info h4 { margin: 0; font-size: 13px; color: #64748b; }
.metric-info p { margin: 5px 0; font-size: 18px; font-weight: bold; color: #0f172a; }
.metric-info small { font-weight: 600; font-size: 14px; }

.best-revenue { background: #fffbeb; border-right: 5px solid #f59e0b; }
.best-revenue small { color: #b45309; }
.best-activity { background: #f0fdf4; border-right: 5px solid #22c55e; }
.best-activity small { color: #15803d; }

/* 📈 قسم جدول المقارنة العام */
.comparison-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 35px; }
.comparison-section h3 { margin-top: 0; font-size: 16px; color: #0f172a; margin-bottom: 15px; }
.table-responsive { overflow-x: auto; }
.comparison-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.comparison-table th { background: #f1f5f9; color: #475569; padding: 12px; font-weight: bold; text-align: right; }
.comparison-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }

.badge { font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 6px; }
.players-badge { background: #e0f2fe; color: #0369a1; }
.subs-badge { background: #f3e8ff; color: #6b21a8; }
.revenue-text { font-weight: bold; color: #15803d; }

/* أشرطة الأداء الحركية */
.progress-bar-container { display: flex; align-items: center; gap: 10px; min-width: 120px; }
.progress-bar { height: 8px; background: #10b981; border-radius: 4px; transition: width 0.5s ease; }
.progress-label { font-size: 11px; font-weight: bold; color: #64748b; }

/* 🛠️ التصميم التفصيلي الثنائي */
.split-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; }
.detail-section, .form-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; }
h3 { margin-top: 0; font-size: 16px; color: #0f172a; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }

/* نموذج الفروع */
.branch-form { display: flex; flex-direction: column; gap: 15px; }
.form-group { display: flex; flex-direction: column; flex: 1; }
.row { display: flex; gap: 15px; }
label { font-weight: 600; margin-bottom: 6px; color: #475569; font-size: 13px; }
.form-input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: white; outline: none; }
.form-input:focus { border-color: #3b82f6; }
.branch-select { border-color: #3b82f6; font-weight: bold; color: #1e3a8a; }

.btn-branch-submit { background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.btn-branch-submit:hover { background: #2563eb; }

/* قسم مستكشف الفروع الداخلي */
.branch-deep-info { margin-top: 20px; display: flex; flex-direction: column; gap: 15px; }
.info-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; font-size: 13px; color: #475569; }
.info-card p { margin: 5px 0; }

/* كرت تعيين لاعب */
.assign-player-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; }
.assign-player-box h5 { margin: 0 0 10px; color: #0369a1; font-size: 13px; }
.assign-inputs { display: flex; gap: 10px; }
.btn-assign { background: #0284c7; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; white-space: nowrap; }
.btn-assign:hover { background: #0369a1; }

.list-title { margin: 15px 0 8px; color: #334155; font-size: 13px; }
.players-list-scroll { background: white; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 200px; overflow-y: auto; padding: 10px; }
.player-item { display: flex; justify-content: space-between; padding: 8px 5px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.player-item:last-child { border-bottom: none; }
.player-item .phone { color: #64748b; font-style: italic; }

.empty-list { text-align: center; color: #94a3b8; font-size: 12px; margin: 20px 0; }
.empty-select-prompt { text-align: center; color: #64748b; padding: 50px 20px; font-size: 14px; line-height: 1.6; }

.success-msg { color: #16a34a; font-weight: bold; font-size: 13px; text-align: center; margin-top: 5px; }
.error-msg { color: #dc2626; font-weight: bold; font-size: 13px; text-align: center; margin-top: 5px; }

@media (max-width: 900px) {
  .split-layout { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
  .row, .assign-inputs { flex-direction: column; gap: 10px; }
}
</style>