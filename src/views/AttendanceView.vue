<template>
  <div class="attendance-container">
    <div class="back-bar">
      <button @click="router.push('/schedule')" class="btn-back">⬅️ العودة لجدول الحصص</button>
    </div>

    <div class="attendance-card" v-if="sessionDetails">
      <!-- هيدر تفاصيل الحصة -->
      <div class="session-info-header">
        <div class="info-meta">
          <h2>📝 كشف تحضير: {{ sessionDetails.title }}</h2>
          <p>👨‍🏫 المدرب الكابتن: {{ sessionDetails.coach_name }} | ⏰ الوقت: {{ sessionDetails.start_time }} {{ sessionDetails.end_time ? ' - ' + sessionDetails.end_time : '' }}</p>
        </div>
        <!-- التقويم التلقائي -->
        <div class="date-picker-box">
          <label>تاريخ الحصة التدريبية:</label>
          <input type="date" v-model="selectedDate" @change="fetchAttendance" />
        </div>
      </div>

      <!-- كشف التحضير التلقائي للاعبين -->
      <div class="players-attendance-list">
        <table class="attendance-table" v-if="players.length > 0">
          <thead>
            <tr>
              <th>رقم المشترك</th>
              <th>اسم اللاعب</th>
              <th style="text-align: center;">حالة الحضور</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in players" :key="player.id">
              <td><span class="member-badge">{{ player.member_number }}</span></td>
              <td class="player-name">{{ player.name }}</td>
              <td>
                <div class="status-selector">
                  <button 
                    type="button" 
                    @click="setPlayerStatus(player.id, 'حاضر')" 
                    class="btn-status present"
                    :class="{ active: attendanceMap[player.id] === 'حاضر' }"
                  >
                    🟢 حاضر
                  </button>
                  <button 
                    type="button" 
                    @click="setPlayerStatus(player.id, 'متأخر')" 
                    class="btn-status late"
                    :class="{ active: attendanceMap[player.id] === 'متأخر' }"
                  >
                    🟡 متأخر
                  </button>
                  <button 
                    type="button" 
                    @click="setPlayerStatus(player.id, 'غائب')" 
                    class="btn-status absent"
                    :class="{ active: attendanceMap[player.id] === 'غائب' }"
                  >
                    🔴 غائب
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-players">
          ⚠️ لا يوجد لاعبون مسجلون ونشطون في باقة هذه الحصة حالياً.
          <br>
          <small style="color: #64748b;">بمجرد اشتراك لاعب في هذه الباقة، سيظهر اسمه هنا تلقائياً.</small>
        </div>
      </div>

      <div class="footer-actions" v-if="players.length > 0">
        <button @click="saveAttendance" class="btn-save-attendance">💾 حفظ وإغلاق كشف الحصّة ⚽</button>
      </div>
    </div>
    
    <div v-else class="loading">جاري تحميل كشف الحصة...</div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;

const sessionDetails = ref(null);
const players = ref([]);
const selectedDate = ref(new Date().toISOString().split('T')[0]); // التاريخ الافتراضي لليوم (2026-07-16)
const attendanceMap = ref({}); // خريطة لتخزين حالات الحضور { playerId: status }

onMounted(async () => {
  await fetchSessionDetails();
  await fetchPlayers();
  await fetchAttendance();
});

const fetchSessionDetails = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const allSessions = await response.json();
      sessionDetails.value = allSessions.find(s => s.id === parseInt(sessionId));
    }
  } catch (err) {
    console.error(err);
  }
};

const fetchPlayers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/sessions/${sessionId}/players`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      players.value = await response.json();
      // تحضير افتراضي سريع "حاضر" لتوفير الوقت على الكباتن والمدربين
      players.value.forEach(p => {
        attendanceMap.value[p.id] = 'حاضر';
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// جلب التحضير السابق لنفس اليوم إن وجد لإجراء التعديلات
const fetchAttendance = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/sessions/${sessionId}/attendance?date=${selectedDate.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const savedAttendance = await response.json();
      savedAttendance.forEach(rec => {
        attendanceMap.value[rec.player_id] = rec.status;
      });
    }
  } catch (err) {
    console.error(err);
  }
};

const setPlayerStatus = (playerId, status) => {
  attendanceMap.value[playerId] = status;
};

const saveAttendance = async () => {
  const records = Object.keys(attendanceMap.value).map(playerId => ({
    player_id: parseInt(playerId),
    status: attendanceMap.value[playerId]
  }));

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/sessions/${sessionId}/attendance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: selectedDate.value,
        records
      })
    });

    if (response.ok) {
      alert('تم حفظ الحضور والغياب لهذه الحصة التدريبية بنجاح! 🎉');
      router.push('/schedule');
    } else {
      alert('حدث خطأ أثناء حفظ كشف التحضير.');
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
  }
};
</script>

<style scoped>
.attendance-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 800px; margin: 0 auto 20px auto; }
.btn-back { padding: 10px 15px; border: none; background: #64748b; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; }

.attendance-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; }

.session-info-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
.info-meta h2 { margin: 0 0 5px 0; color: #1e3a8a; }
.info-meta p { margin: 0; color: #64748b; font-size: 14px; }

.date-picker-box { display: flex; flex-direction: column; gap: 6px; }
.date-picker-box label { font-size: 13px; font-weight: bold; color: #475569; }
.date-picker-box input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; }

.attendance-table { width: 100%; border-collapse: collapse; text-align: right; }
.attendance-table th { padding: 12px; background: #f8fafc; color: #475569; font-size: 14px; border-bottom: 2px solid #e2e8f0; }
.attendance-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

.player-name { font-weight: bold; color: #1e293b; }
.member-badge { background: #f1f5f9; color: #475569; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 12px; }

/* مفاتيح التحديد الدائرية الجذابة */
.status-selector { display: flex; gap: 10px; justify-content: center; }
.btn-status { border: 1px solid #e2e8f0; background: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; color: #64748b; transition: all 0.2s; }

.btn-status.present:hover, .btn-status.present.active { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.btn-status.late:hover, .btn-status.late.active { background: #fef9c3; color: #a16207; border-color: #fef08a; }
.btn-status.absent:hover, .btn-status.absent.active { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

.empty-players { text-align: center; padding: 40px; color: #ef4444; font-weight: bold; line-height: 1.8; }

.footer-actions { margin-top: 30px; text-align: center; }
.btn-save-attendance { background: #10b981; color: white; border: none; padding: 12px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
.btn-save-attendance:hover { background: #059669; }

.loading { text-align: center; font-size: 18px; font-weight: bold; padding: 50px; }
</style>