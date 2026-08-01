<template>
  <div class="attendance-container">
    <!-- 3️⃣ أزرار التنقل السريعة -->
    <div class="back-bar">
      <button type="button" @click="router.push('/dashboard')" class="btn-nav">🏠 الصفحة الرئيسية</button>
      <button type="button" @click="router.push('/schedule')" class="btn-nav secondary">⬅️ جدول الحصص</button>
    </div>

    <div class="attendance-card">
      <div class="session-info-header">
        <div>
          <h2>📝 كشف الحضور والغياب للحصة</h2>
          <p class="subtitle">قم بتحديد حالة حضور كل لاعب للحصة الرياضية المحدد تاريخها</p>
        </div>
        <div class="date-picker-box">
          <label>📅 تاريخ الحصة:</label>
          <input type="date" v-model="selectedDate" @change="fetchAttendance" />
        </div>
      </div>

      <!-- 8️⃣ الجدول التفاعلي المعالج بالكامل -->
      <div class="players-attendance-list">
        <table class="attendance-table" v-if="players.length > 0">
          <thead>
            <tr>
              <th>رقم المشترك</th>
              <th>اسم اللاعب الكروي</th>
              <th style="text-align: center;">حالة الحضور والغياب</th>
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
                    @click="setStatus(player.id, 'حاضر')" 
                    class="btn-status present" 
                    :class="{ active: attendanceMap[player.id] === 'حاضر' }"
                  >
                    🟢 حاضر
                  </button>
                  <button 
                    type="button" 
                    @click="setStatus(player.id, 'متأخر')" 
                    class="btn-status late" 
                    :class="{ active: attendanceMap[player.id] === 'متأخر' }"
                  >
                    🟡 متأخر
                  </button>
                  <button 
                    type="button" 
                    @click="setStatus(player.id, 'غائب')" 
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

        <div v-else-if="loading" class="loading-state">
          🔄 جاري تحميل قائمة المشتركين...
        </div>

        <div v-else class="empty-state">
          ⚠️ لا يوجد لاعبون مسجلون في هذه الحصة حالياً.
        </div>
      </div>

      <div class="footer-actions" v-if="players.length > 0">
        <button type="button" @click="saveAttendance" class="btn-save" :disabled="saving">
          {{ saving ? 'جاري الحفظ...' : '💾 حفظ كشف الحضور والغياب ⚽' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const sessionId = route.params.id
const players = ref([])
const attendanceMap = ref({})
const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  await fetchPlayers()
  await fetchAttendance()
})

// جلب قائمة المشتركين
const fetchPlayers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/sessions/${sessionId}/players`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      players.value = await res.json()
      players.value.forEach(p => {
        if (!attendanceMap.value[p.id]) {
          attendanceMap.value[p.id] = 'حاضر'
        }
      })
    }
  } catch (err) {
    console.error('حدث خطأ أثناء جلب اللاعبين:', err)
  } finally {
    loading.value = false
  }
}

// جلب الحضور المسجل مسبقاً في هذا التاريخ إن وجد
const fetchAttendance = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/sessions/${sessionId}/attendance?date=${selectedDate.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const saved = await res.json()
      saved.forEach(rec => {
        attendanceMap.value[rec.player_id] = rec.status
      })
    }
  } catch (err) {
    console.error('خطأ في جلب السجلات:', err)
  }
}

const setStatus = (playerId, status) => {
  attendanceMap.value[playerId] = status
}

// حفظ الكشف إلى السيرفر
const saveAttendance = async () => {
  saving.value = true
  const records = Object.keys(attendanceMap.value).map(playerId => ({
    player_id: parseInt(playerId),
    status: attendanceMap.value[playerId]
  }))

  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/sessions/${sessionId}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: selectedDate.value,
        records
      })
    })

    if (res.ok) {
      alert('🎉 تم حفظ كشف الحضور بنجاح!')
      router.push('/schedule')
    } else {
      alert('حدث خطأ أثناء الحفظ!')
    }
  } catch (err) {
    alert('فشل الاتصال بالخادم.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.attendance-container {
  padding: 30px 15px;
  background-color: #f8fafc;
  min-height: 100vh;
  direction: rtl;
}

.back-bar {
  max-width: 850px;
  margin: 0 auto 20px auto;
  display: flex;
  gap: 10px;
}

.btn-nav {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background-color: #2563eb;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.btn-nav.secondary {
  background-color: #64748b;
}

.attendance-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  max-width: 850px;
  margin: 0 auto;
}

.session-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
}

.date-picker-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: bold;
}

.date-picker-box input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.attendance-table th, .attendance-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f1f5f9;
  text-align: right;
}

.member-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 13px;
}

.status-selector {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-status {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background-color: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-status.present.active {
  background-color: #dcfce7;
  color: #15803d;
  border-color: #86efac;
  font-weight: bold;
}

.btn-status.late.active {
  background-color: #fef9c3;
  color: #a16207;
  border-color: #fde047;
  font-weight: bold;
}

.btn-status.absent.active {
  background-color: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
  font-weight: bold;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.footer-actions {
  margin-top: 25px;
  text-align: left;
}

.btn-save {
  background-color: #16a34a;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
}
</style>