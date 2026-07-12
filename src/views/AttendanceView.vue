<template>
  <div class="attendance-container">
    <div class="attendance-card">
      <h2>📝 دفتر الحضور والغياب اليومي</h2>
      <p class="subtitle">اختر الباقة الرياضية لتحضير اللاعبين وتنبيه الغائبين فوراً</p>

      <!-- خيارات التصفية: اختيار الباقة والتاريخ -->
      <div class="filter-section">
        <div class="form-group">
          <label>الباقة التدريبية:</label>
          <select v-model="selectedPackage" @change="fetchPlayers" class="select-input">
            <option value="" disabled>-- اختر الباقة المستهدفة --</option>
            <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">
              {{ pkg.sport_name }} - {{ pkg.package_name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>تاريخ التحضير:</label>
          <input type="date" v-model="attendanceDate" class="date-input" />
        </div>
      </div>

      <hr class="divider" />

      <!-- حالة عدم اختيار باقة أو عدم وجود لاعبين -->
      <div v-if="!selectedPackage" class="info-msg animate-pulse">
        💡 يرجى اختيار باقة رياضية من الأعلى لعرض كشف أسماء المشتركين.
      </div>
      <div v-else-if="players.length === 0" class="error-msg">
        ⚠️ لا يوجد لاعبين مشتركين في هذه الباقة حالياً.
      </div>

      <!-- لوحة القوائم الديناميكية (تظهر فقط عند وجود لاعبين) -->
      <div v-grid v-if="selectedPackage && players.length > 0" class="lists-wrapper">
        
        <!-- القائمة الرئيسية: غير المحضرين / الكل -->
        <div class="list-box all-players">
          <h3>👥 قائمة المشتركين بالباقة ({{ players.length }})</h3>
          <div class="players-scroll">
            <div v-for="player in players" :key="player.id" class="player-item" :class="player.status">
              <div class="player-info">
                <span class="member-badge">#{{ player.member_number || 'بدون' }}</span>
                <strong>{{ player.name }}</strong>
              </div>
              <div class="action-buttons">
                <button type="button" @click="setStatus(player, 'present')" class="btn-present-sm">حاضر ✓</button>
                <button type="button" @click="setStatus(player, 'absent')" class="btn-absent-sm">غائب ✗</button>
              </div>
            </div>
          </div>
        </div>

        <!-- قوائم الفرز السريع والتحريك التلقائي -->
        <div class="side-lists">
          
          <!-- قائمة الحاضرين -->
          <div class="list-box present-box">
            <h3 class="text-success">🟢 الحاضرون الآن ({{ presentList.length }})</h3>
            <div class="compact-list">
              <div v-for="player in presentList" :key="player.id" class="compact-item">
                <span>{{ player.name }}</span>
                <span class="badge-success">حاضر</span>
              </div>
            </div>
          </div>

          <!-- قائمة الغائبين -->
          <div class="list-box absent-box">
            <h3 class="text-danger">🔴 الغائبون اليوم ({{ absentList.length }})</h3>
            <div class="compact-list">
              <div v-for="player in absentList" :key="player.id" class="compact-item">
                <span>{{ player.name }}</span>
                <span class="badge-danger" @click="triggerParentAlert(player)" style="cursor: pointer;" title="اضغط لإظهار رقم ولي الأمر">⚠️ إشعار</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- زر الحفظ النهائي للملف -->
      <div v-if="selectedPackage && players.length > 0" class="submit-section">
        <p v-if="errorMsg" class="error-msg-text">⚠️ {{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg-text">🎉 {{ successMsg }}</p>
        <button @click="saveAttendance" class="btn-submit-attendance">💾 اعتماد وحفظ كشف التحضير النهائي</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const packages = ref([]);
const selectedPackage = ref('');
// تحديد تاريخ اليوم تلقائياً بصيغة YYYY-MM-DD
const attendanceDate = ref(new Date().toISOString().split('T')[0]);
const players = ref([]);

const errorMsg = ref('');
const successMsg = ref('');

// جلب الباقات عند تحميل الصفحة
onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/packages-list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      packages.value = await response.json();
    }
  } catch (error) {
    console.error('خطأ في جلب الباقات:', error);
  }
});

// جلب اللاعبين عند تغيير الباقة المحددة
const fetchPlayers = async () => {
  if (!selectedPackage.value) return;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/packages/${selectedPackage.value}/players`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      // إضافة حالة افتراضية (status) لكل لاعب للتحكم بها بالواجهة
      players.value = data.map(p => ({ ...p, status: 'unmarked' }));
    }
  } catch (error) {
    errorMsg.value = 'حدث خطأ أثناء سحب قوائم اللاعبين.';
  }
};

// فرز ديناميكي مذهل باستخدام الـ Computed Properties للتحرك التلقائي للاعبين
const presentList = computed(() => players.value.filter(p => p.status === 'present'));
const absentList = computed(() => players.value.filter(p => p.status === 'absent'));

// وظيفة تحديد وتغيير حالة اللاعب وإطلاق التنبيه الفوري عند الغياب
const setStatus = (player, status) => {
  player.status = status;
  
  // إذا تم تحديد اللاعب كغائب، تظهر نافذة تنبيه للمدرب أو المدير فوراً لإرسال الرسالة لولي أمره
  if (status === 'absent') {
    triggerParentAlert(player);
  }
};

// دالة إظهار التنبيه الذكي مع بيانات التواصل
const triggerParentAlert = (player) => {
  alert(`🚨 [تنبيه الغياب الإداري]\n\nاللاعب: ${player.name} تم تسجيله (غائب).\nيرجى من الإدارة أو المدرب التواصل فوراً مع ولي الأمر لإشعاره بعدم حضور الابن.\n📞 رقم ولي الأمر: ${player.parent_phone}`);
};

// حفظ البيانات في قاعدة البيانات
const saveAttendance = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  // التأكد من أن جميع اللاعبين تم تحديد حالتهم
  const hasUnmarked = players.value.some(p => p.status === 'unmarked');
  if (hasUnmarked) {
    errorMsg.value = 'الرجاء تحديد حالة (حاضر أو غائب) لجميع اللاعبين قبل الحفظ النهائي.';
    return;
  }

  // تجهيز القائمة النظيفة لإرسالها
  const attendancePayload = {
    package_id: selectedPackage.value,
    date: attendanceDate.value,
    attendance_list: players.value.map(p => ({ player_id: p.id, status: p.status }))
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(attendancePayload)
    });

    const data = await response.json();
    if (response.ok) {
      successMsg.value = data.message;
    } else {
      errorMsg.value = data.message;
    }
  } catch (error) {
    errorMsg.value = 'فشل الاتصال بالسيرفر لحفظ كشف التحضير.';
  }
};
</script>

<style scoped>
.attendance-container { display: flex; justify-content: center; padding: 40px 20px; background: #f1f5f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.attendance-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 950px; }

h2 { text-align: center; color: #0f172a; margin: 0; font-size: 24px; }
.subtitle { text-align: center; color: #64748b; font-size: 14px; margin-top: 5px; margin-bottom: 25px; }

.filter-section { display: flex; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
.form-group { flex: 1; display: flex; flex-direction: column; text-align: right; }
label { font-weight: 600; margin-bottom: 6px; color: #334155; font-size: 14px; }
.select-input, .date-input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; background: white; width: 100%; }

.divider { border: 0; height: 1px; background: #e2e8f0; margin-bottom: 25px; }

.lists-wrapper { display: grid; grid-template-columns: 1.2fr 1fr; gap: 25px; margin-bottom: 35px; }
.list-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
.list-box h3 { margin-top: 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }

.players-scroll { max-height: 400px; overflow-y: auto; padding-left: 5px; }
.player-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; transition: all 0.3s; }
.player-item.present { border-right: 5px solid #22c55e; background: #f0fdf4; }
.player-item.absent { border-right: 5px solid #ef4444; background: #fee2e2; }

.player-info { display: flex; align-items: center; gap: 10px; }
.member-badge { background: #e2e8f0; font-size: 11px; font-weight: bold; padding: 3px 6px; border-radius: 4px; color: #475569; }

.action-buttons { display: flex; gap: 8px; }
.btn-present-sm { background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
.btn-absent-sm { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
button:hover { opacity: 0.85; }

.side-lists { display: flex; flex-direction: column; gap: 20px; }
.compact-list { max-height: 160px; overflow-y: auto; }
.compact-item { display: flex; justify-content: space-between; background: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 13px; font-weight: 500; border: 1px dashed #cbd5e1; }

.badge-success { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
.badge-danger { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; animation: pulse 2s infinite; }

.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }

.submit-section { text-align: center; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
.btn-submit-attendance { background: #3b82f6; color: white; border: none; padding: 14px 40px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
.btn-submit-attendance:hover { background: #2563eb; }

.info-msg { background: #eff6ff; color: #1d4ed8; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }
.error-msg { background: #fff5f5; color: #c53030; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }

.error-msg-text { color: #ef4444; font-weight: bold; margin-bottom: 10px; }
.success-msg-text { color: #22c55e; font-weight: bold; margin-bottom: 10px; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}
</style>