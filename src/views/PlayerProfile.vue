<template>
  <div class="profile-container" v-if="profileData">
    
    <!-- شريط الإجراءات العلوي (يختفي تلقائياً عند الطباعة) -->
    <div class="action-bar no-print">
      <button @click="router.push('/dashboard')" class="btn-back">⬅️ العودة للوحة التحكم</button>
      <div class="action-buttons">
        <button @click="toggleEdit" class="btn-edit" :class="{ active: isEditing }">
          {{ isEditing ? '❌ إلغاء التعديل' : '✏️ تعديل البيانات' }}
        </button>
        <button @click="printReport" class="btn-print">🖨️ طباعة التقرير</button>
      </div>
    </div>

    <!-- بطاقة اللاعب الشاملة (التي سيتم طباعتها) -->
    <div class="player-card-sheet printable-area">
      
      <!-- الهيدر الرسمي للتقرير -->
      <div class="report-header">
        <div class="academy-logo">⚽ أكاديمية النجوم الرياضية</div>
        <div class="report-title">
          <h1>بطاقة الأداء الرياضي والملف الشامل</h1>
          <p>العام التدريبي: 2026</p>
        </div>
        <div class="member-id">رقم المشترك: <span>{{ profileData.player.member_number }}</span></div>
      </div>

      <hr class="divider" />

      <!-- القسم الأول: الهوية الشخصية ونسبة الالتزام -->
      <div class="profile-main-section">
        <div class="avatar-box">
          <!-- صورة افتراضية ذكية تناسب الرياضيين -->
          <div class="player-avatar">🏃‍♂️</div>
          <h3>{{ profileData.player.name }}</h3>
          <span class="branch-badge">فرع الأكاديمية الرئيسي</span>
        </div>

        <div class="metrics-box">
          <div class="metric-card">
            <span class="metric-title">نسبة الالتزام بالحضور والشغف</span>
            <div class="progress-container">
              <div class="progress-bar" :style="{ width: profileData.attendance.rate + '%' }"></div>
            </div>
            <span class="metric-value">{{ profileData.attendance.rate }}%</span>
            <p class="metric-hint">حضر {{ profileData.attendance.attended }} من أصل {{ profileData.attendance.total }} حصة تدريبية هذا الشهر.</p>
          </div>
        </div>
      </div>

      <!-- القسم الثاني: البيانات الشخصية والطبية في جدول متناسق -->
      <div class="info-grid">
        <div class="info-block">
          <div class="block-title">📋 البيانات الشخصية</div>
          <table class="profile-table">
            <tbody>
              <tr>
                <td>تاريخ الميلاد:</td>
                <td v-if="!isEditing">{{ profileData.player.birth_date }}</td>
                <td v-else><input type="date" v-model="editForm.birth_date" class="edit-input" /></td>
              </tr>
              <tr>
                <td>رقم هاتف ولي الأمر:</td>
                <td v-if="!isEditing">{{ profileData.player.parent_phone }}</td>
                <td v-else><input type="tel" v-model="editForm.parent_phone" class="edit-input" maxlength="10" /></td>
              </tr>
              <tr>
                <td>الطول الحالي:</td>
                <td v-if="!isEditing">{{ profileData.player.height ? profileData.player.height + ' سم' : 'غير مسجل' }}</td>
                <td v-else><input type="number" v-model="editForm.height" class="edit-input" placeholder="سم" /></td>
              </tr>
              <tr>
                <td>الوزن الحالي:</td>
                <td v-if="!isEditing">{{ profileData.player.weight ? profileData.player.weight + ' كجم' : 'غير مسجل' }}</td>
                <td v-else><input type="number" v-model="editForm.weight" class="edit-input" placeholder="كجم" /></td>
              </tr>
            </tbody>
          </table>
          <div v-if="isEditing" class="save-edit-section">
            <button @click="saveProfile" class="btn-save-profile" :disabled="saving">
              {{ saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات' }}
            </button>
          </div>
        </div>

        <div class="info-block">
          <div class="block-title">🏥 الحالة الصحية والوقائية</div>
          <div class="medical-status" :class="hasMedicalIssues ? 'warning-health' : 'clear-health'">
            <p v-if="!hasMedicalIssues">✅ اللاعب سليم معافى ولا يعاني من أي مشاكل صحية أو حساسية تمنعه من ممارسة الرياضة.</p>
            <table class="profile-table" v-if="hasMedicalIssues">
              <tbody>
                <tr v-if="profileData.player.allergies">
                  <td>الحساسية:</td>
                  <td>{{ profileData.player.allergies }}</td>
                </tr>
                <tr v-if="profileData.player.chronic_diseases">
                  <td>الأمراض المزمنة:</td>
                  <td>{{ profileData.player.chronic_diseases }}</td>
                </tr>
                <tr v-if="profileData.player.past_injuries">
                  <td>إصابات سابقة:</td>
                  <td>{{ profileData.player.past_injuries }}</td>
                </tr>
                <tr v-if="profileData.player.current_medications">
                  <td>أدوية مستمرة:</td>
                  <td>{{ profileData.player.current_medications }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- القسم الثالث: السجل الإداري والاشتراكات -->
      <div class="subscriptions-section">
        <div class="block-title">💳 سجل الاشتراكات والحزم التدريبية</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>اسم الباقة المشترك بها</th>
              <th>تاريخ البدء</th>
              <th>تاريخ الانتهاء</th>
              <th>المدة</th>
              <th>السعر</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in profileData.subscriptions" :key="sub.id">
              <td>{{ sub.package_name }}</td>
              <td>{{ sub.start_date }}</td>
              <td v-if="editingSubId !== sub.id">{{ sub.end_date }}</td>
              <td v-else><input type="date" v-model="editingEndDate" class="edit-input-sm" /></td>
              <td>{{ sub.months ? sub.months + ' شهر' : '-' }}</td>
              <td>{{ sub.price ? sub.price + ' ريال' : '-' }}</td>
              <td>
                <button v-if="editingSubId !== sub.id" @click="startEditSub(sub)" class="btn-edit-sub no-print">✏️ تعديل</button>
                <button v-else @click="saveEditSub(sub.id)" class="btn-save-sub no-print" :disabled="savingSub">
                  {{ savingSub ? '...' : '💾 حفظ' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="profileData.subscriptions.length === 0" class="empty-text">لا توجد اشتراكات مسجلة لهذا اللاعب.</p>
      </div>

      <!-- تذييل التقرير للتوقيع الرسمي -->
      <div class="report-footer">
        <div class="signature-space">توقيع المدير الفني للأكاديمية: .........................</div>
        <div class="signature-space">ختم الأكاديمية الرسمي: .........................</div>
      </div>

    </div>
  </div>
  <div v-else class="loading-state">جاري تحميل ملف اللاعب الشامل... ⚽</div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const profileData = ref(null);
const isEditing = ref(false);
const saving = ref(false);
const editForm = ref({});
const editingSubId = ref(null);
const editingEndDate = ref('');
const savingSub = ref(false);

// التحقق من وجود أي مشاكل طبية مسبقة للاعب لعرض التنبيه المناسب
const hasMedicalIssues = computed(() => {
  if (!profileData.value) return false;
  const p = profileData.value.player;
  return p.allergies || p.chronic_diseases || p.past_injuries || p.current_medications;
});

onMounted(async () => {
  const playerId = route.params.id || 1; // استخدام الكود الممرر عبر الرابط أو الافتراضي 1 لتجربة الواجهة
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/players/${playerId}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      profileData.value = await response.json();
    } else {
      alert('فشل جلب ملف اللاعب من السيرفر');
    }
  } catch (error) {
    console.error('Error fetching player profile:', error);
  }
});

// دالة الطباعة السحرية
const printReport = () => {
  window.print();
};

// دالة تبديل وضع التعديل
const toggleEdit = () => {
  if (isEditing.value) {
    isEditing.value = false;
    return;
  }
  editForm.value = {
    name: profileData.value.player.name,
    birth_date: profileData.value.player.birth_date,
    parent_phone: profileData.value.player.parent_phone,
    height: profileData.value.player.height || '',
    weight: profileData.value.player.weight || '',
    allergies: profileData.value.player.allergies || '',
    chronic_diseases: profileData.value.player.chronic_diseases || '',
    past_injuries: profileData.value.player.past_injuries || '',
    current_medications: profileData.value.player.current_medications || ''
  };
  isEditing.value = true;
};

// حفظ التعديلات
const saveProfile = async () => {
  saving.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/players/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editForm.value)
    });
    const data = await response.json();
    if (response.ok) {
      profileData.value.player = { ...profileData.value.player, ...editForm.value };
      isEditing.value = false;
      alert(data.message);
    } else {
      alert(data.message || 'حدث خطأ أثناء الحفظ');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('فشل الاتصال بالسيرفر');
  } finally {
    saving.value = false;
  }
};

// تعديل تاريخ انتهاء الاشتراك
const startEditSub = (sub) => {
  editingSubId.value = sub.id;
  editingEndDate.value = sub.end_date;
};

const saveEditSub = async (subId) => {
  savingSub.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/subscriptions/${subId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ end_date: editingEndDate.value })
    });
    const data = await response.json();
    if (response.ok) {
      const sub = profileData.value.subscriptions.find(s => s.id === subId);
      if (sub) sub.end_date = editingEndDate.value;
      editingSubId.value = null;
      alert(data.message);
    } else {
      alert(data.message || 'حدث خطأ أثناء الحفظ');
    }
  } catch (error) {
    alert('فشل الاتصال بالسيرفر');
  } finally {
    savingSub.value = false;
  }
};
</script>

<style scoped>
.profile-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.loading-state { text-align: center; padding: 50px; font-size: 18px; font-weight: bold; }

/* شريط التحكم العلوي */
.action-bar { display: flex; justify-content: space-between; max-width: 900px; margin: 0 auto 20px auto; }
.action-buttons { display: flex; gap: 10px; }
button { padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; border: none; transition: 0.2s; }
.btn-back { background: #64748b; color: white; }
.btn-edit { background: #f59e0b; color: white; }
.btn-edit.active { background: #ef4444; }
.btn-print { background: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
button:hover { opacity: 0.9; transform: translateY(-1px); }

.edit-input { width: 100%; padding: 8px 12px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 14px; background: #eff6ff; outline: none; box-sizing: border-box; }
.edit-input:focus { border-color: #2563eb; background: white; }
.save-edit-section { margin-top: 15px; text-align: center; }
.btn-save-profile { background: #10b981; color: white; padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold; cursor: pointer; }
.btn-save-profile:hover { background: #059669; }
.btn-save-profile:disabled { background: #94a3b8; cursor: not-allowed; }

.edit-input-sm { width: 100%; padding: 6px 10px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 13px; background: #eff6ff; outline: none; box-sizing: border-box; }
.btn-edit-sub { background: #f59e0b; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; }
.btn-edit-sub:hover { background: #d97706; }
.btn-save-sub { background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; }
.btn-save-sub:hover { background: #059669; }
.btn-save-sub:disabled { background: #94a3b8; cursor: not-allowed; }
.empty-text { text-align: center; color: #94a3b8; padding: 15px; font-size: 14px; }

/* ورقة التقرير الفاخرة */
.player-card-sheet { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 900px; margin: 0 auto; border: 1px solid #e2e8f0; }
.report-header { display: flex; justify-content: space-between; align-items: center; }
.academy-logo { font-size: 18px; font-weight: bold; color: #1e3a8a; }
.report-title { text-align: center; }
.report-title h1 { font-size: 22px; color: #0f172a; margin: 0 0 5px 0; }
.report-title p { margin: 0; color: #64748b; font-size: 14px; }
.member-id { font-size: 14px; color: #475569; font-weight: bold; }
.member-id span { color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; }
.divider { margin: 25px 0; border: 0; border-top: 2px solid #f1f5f9; }

/* قسم الهوية الشخصية ونسبة الحضور */
.profile-main-section { display: flex; gap: 30px; margin-bottom: 30px; align-items: center; }
.avatar-box { flex: 1; text-align: center; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; }
.player-avatar { font-size: 50px; margin-bottom: 10px; }
.avatar-box h3 { margin: 0 0 5px 0; color: #0f172a; font-size: 18px; }
.branch-badge { background: #f0fdf4; color: #16a34a; font-size: 12px; padding: 3px 8px; border-radius: 12px; font-weight: bold; }

.metrics-box { flex: 2; }
.metric-card { background: #fff; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center; }
.metric-title { font-weight: bold; color: #334155; display: block; margin-bottom: 12px; }
.progress-container { background: #e2e8f0; border-radius: 10px; height: 14px; overflow: hidden; margin-bottom: 8px; }
.progress-bar { background: linear-gradient(90px, #3b82f6, #2563eb); height: 100%; transition: width 0.5s ease-in-out; }
.metric-value { font-size: 28px; font-weight: bold; color: #2563eb; display: block; }
.metric-hint { font-size: 12px; color: #64748b; margin: 5px 0 0 0; }

/* شبكة البيانات */
.info-grid { display: flex; gap: 20px; margin-bottom: 30px; }
.info-block { flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
.block-title { font-weight: bold; color: #1e3a8a; margin-bottom: 12px; font-size: 15px; border-right: 4px solid #2563eb; padding-right: 8px; }
.profile-table { width: 100%; border-collapse: collapse; text-align: right; }
.profile-table td { padding: 8px 4px; font-size: 14px; color: #334155; }
.profile-table td:first-child { font-weight: bold; color: #64748b; width: 40%; }

/* الحالات الطبية */
.medical-status { padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.6; }
.clear-health { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.warning-health { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }

/* جداول الحزم والاشتراكات */
.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: right; }
.data-table th { background: #f8fafc; color: #475569; padding: 10px; font-size: 13px; font-weight: bold; border-bottom: 2px solid #e2e8f0; }
.data-table td { padding: 12px 10px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
.status-badge { font-size: 12px; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
.status-badge.active { background: #dcfce7; color: #15803d; }

.report-footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 13px; color: #475569; font-weight: bold; }

/* 🖨️ التنسيق السحري الخاص بالطباعة والـ PDF */
@media print {
  body { background: white; color: black; }
  .no-print { display: none !important; } /* إخفاء الأزرار تلقائياً عند الطباعة */
  .profile-container { padding: 0; background: transparent; }
  .player-card-sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
  .progress-container { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #e2e8f0 !important; }
  .progress-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #2563eb !important; }
  .branch-badge, .status-badge, .clear-health, .warning-health { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>