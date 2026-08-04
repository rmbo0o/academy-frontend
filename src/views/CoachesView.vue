<template>
  <div class="users-container">
    <div class="back-bar">
      <button type="button" @click="$router.push('/dashboard')" class="btn-home">🏠 العودة للرئيسية</button>
    </div>

    <div class="users-grid">
      <!-- نموذج إضافة مستخدم جديد -->
      <div class="add-user-card">
        <h2>➕ إضافة مستخدم جديد</h2>
        <p class="subtitle">أنشئ حساب موظف أو مدرب أو مدير فرع وحدد صلاحياته على الصفحات</p>

        <form @submit.prevent="addUser">
          <div class="form-group">
            <label>اسم المستخدم <span class="req">*</span></label>
            <input type="text" v-model="form.name" required placeholder="مثال: كابتن أحمد محمد" />
          </div>
          <div class="form-group">
            <label>البريد الإلكتروني <span class="req">*</span></label>
            <input type="email" v-model="form.email" required placeholder="user@academy.com" />
          </div>
          <div class="form-group">
            <label>كلمة المرور <span class="req">*</span></label>
            <input type="password" v-model="form.password" required placeholder="كلمة مرور الدخول" minlength="6" />
          </div>
          <div class="form-group">
            <label>الدور</label>
            <select v-model="form.role" class="form-input">
              <option v-for="r in ROLES" :key="r.key" :value="r.key">{{ r.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>الفرع المرتبط</label>
            <select v-model="form.branch_id" class="form-input">
              <option value="">-- بدون فرع (عام) --</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }} - {{ branch.city }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>الصلاحيات على الصفحات:</label>
            <div class="perms-grid">
              <label v-for="p in ALL_PAGES" :key="p.key" class="perm-check">
                <input type="checkbox" :value="p.key" v-model="form.permissions" />
                <span>{{ p.icon }} {{ p.label }}</span>
              </label>
            </div>
            <p v-if="form.role === 'admin'" class="admin-hint">ℹ️ المدير العام يملك كل الصلاحيات تلقائياً</p>
          </div>

          <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
          <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

          <button type="submit" class="btn-add" :disabled="saving">
            {{ saving ? 'جاري الحفظ...' : '💾 حفظ المستخدم' }}
          </button>
        </form>
      </div>

      <!-- قائمة المستخدمين -->
      <div class="users-list-card">
        <h2>📋 قائمة المستخدمين ({{ users.length }})</h2>
        <p class="subtitle">جميع الحسابات وصلاحياتها في النظام</p>

        <div v-if="loading" class="loading-state">🔄 جاري تحميل المستخدمين...</div>

        <div v-else-if="users.length === 0" class="empty-state">
          ⚠️ لا يوجد مستخدمون مسجلون حالياً.
        </div>

        <ul v-else class="users-list">
          <li v-for="user in users" :key="user.id" class="user-item">
            <div class="user-main">
              <div class="user-avatar">👤</div>
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
              <span class="role-badge" :class="user.role">{{ roleLabel(user.role) }}</span>
            </div>
            <div class="user-details">
              <span class="branch-chip">🏢 {{ branchName(user.branch_id) }}</span>
              <div class="perm-chips">
                <span v-for="p in parsePerms(user.permissions)" :key="p" class="perm-chip">{{ permLabel(p) }}</span>
                <span v-if="user.role === 'admin'" class="perm-chip all-chip">كل الصلاحيات</span>
                <span v-if="parsePerms(user.permissions).length === 0 && user.role !== 'admin'" class="no-perm">بدون صلاحيات</span>
              </div>
            </div>
            <div class="user-actions">
              <button class="btn-edit" @click="openEdit(user)">✏️ تعديل</button>
              <button class="btn-delete" @click="deleteUser(user)">🗑️ حذف</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- نافذة تعديل مستخدم -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEdit">
      <div class="modal-box">
        <div class="modal-header">
          <h3>✏️ تعديل {{ editForm.name }}</h3>
          <button class="modal-close" @click="closeEdit">✕</button>
        </div>
        <form @submit.prevent="saveEdit">
          <div class="form-group">
            <label>اسم المستخدم</label>
            <input type="text" v-model="editForm.name" required />
          </div>
          <div class="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" v-model="editForm.email" required />
          </div>
          <div class="form-group">
            <label>كلمة المرور (اتركها فارغة للإبقاء على الحالية)</label>
            <input type="password" v-model="editForm.password" placeholder="كلمة مرور جديدة اختيارية" minlength="6" />
          </div>
          <div class="form-group">
            <label>الدور</label>
            <select v-model="editForm.role" class="form-input">
              <option v-for="r in ROLES" :key="r.key" :value="r.key">{{ r.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>الفرع المرتبط</label>
            <select v-model="editForm.branch_id" class="form-input">
              <option value="">-- بدون فرع (عام) --</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }} - {{ branch.city }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>الصلاحيات على الصفحات:</label>
            <div class="perms-grid">
              <label v-for="p in ALL_PAGES" :key="p.key" class="perm-check">
                <input type="checkbox" :value="p.key" v-model="editForm.permissions" />
                <span>{{ p.icon }} {{ p.label }}</span>
              </label>
            </div>
            <p v-if="editForm.role === 'admin'" class="admin-hint">ℹ️ المدير العام يملك كل الصلاحيات تلقائياً</p>
          </div>

          <p v-if="editError" class="error-msg">⚠️ {{ editError }}</p>
          <p v-if="editSuccess" class="success-msg">✅ {{ editSuccess }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeEdit">إلغاء</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ref, onMounted } from 'vue';
import { ALL_PAGES, ROLES, roleLabel } from '../permissions';

const users = ref([]);
const branches = ref([]);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const form = ref({
  name: '', email: '', password: '', role: 'employee', branch_id: '', permissions: []
});

const showEditModal = ref(false);
const editForm = ref({ id: null, name: '', email: '', password: '', role: 'employee', branch_id: '', permissions: [] });
const editError = ref('');
const editSuccess = ref('');

const fetchUsers = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) users.value = await res.json();
  } catch (err) {
    console.error('خطأ في جلب المستخدمين:', err);
  } finally {
    loading.value = false;
  }
};

const fetchBranches = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/branches', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) branches.value = await res.json();
  } catch (err) {
    console.error('خطأ في جلب الفروع:', err);
  }
};

const parsePerms = (permissions) => {
  if (!permissions) return [];
  return String(permissions).split(',').filter(Boolean);
};

const permLabel = (key) => {
  const p = ALL_PAGES.find((x) => x.key === key);
  return p ? `${p.icon} ${p.label}` : key;
};

const branchName = (id) => {
  if (!id) return 'بدون فرع';
  const b = branches.value.find((x) => x.id === id);
  return b ? b.name : `فرع #${id}`;
};

const addUser = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  saving.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();
    if (res.ok) {
      successMsg.value = data.message;
      form.value = { name: '', email: '', password: '', role: 'employee', branch_id: '', permissions: [] };
      await fetchUsers();
    } else {
      errorMsg.value = data.message;
    }
  } catch (err) {
    errorMsg.value = 'فشل الاتصال بالسيرفر.';
  } finally {
    saving.value = false;
  }
};

const openEdit = (user) => {
  editForm.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    branch_id: user.branch_id || '',
    permissions: parsePerms(user.permissions)
  };
  editError.value = '';
  editSuccess.value = '';
  showEditModal.value = true;
};

const closeEdit = () => {
  showEditModal.value = false;
};

const saveEdit = async () => {
  editError.value = '';
  editSuccess.value = '';
  saving.value = true;
  try {
    const token = localStorage.getItem('token');
    const payload = { ...editForm.value };
    delete payload.id;
    if (!payload.password) delete payload.password;
    const res = await fetch(API + '/api/users/' + editForm.value.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      editSuccess.value = data.message;
      await fetchUsers();
      setTimeout(() => closeEdit(), 1200);
    } else {
      editError.value = data.message;
    }
  } catch (err) {
    editError.value = 'فشل الاتصال بالسيرفر.';
  } finally {
    saving.value = false;
  }
};

const deleteUser = async (user) => {
  if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/users/' + user.id, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      await fetchUsers();
      alert(data.message);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('فشل الاتصال بالسيرفر.');
  }
};

onMounted(() => {
  fetchUsers();
  fetchBranches();
});
</script>

<style scoped>
.users-container { padding: 30px; background: #f8fafc; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.back-bar { max-width: 1200px; margin: 0 auto 20px auto; }
.btn-home { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-home:hover { background: #1d4ed8; }

.users-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 25px; max-width: 1200px; margin: 0 auto; align-items: start; }

.add-user-card, .users-list-card { background: white; padding: 28px; border-radius: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
h2 { color: #1e3a8a; margin: 0 0 5px 0; font-size: 19px; }
.subtitle { color: #64748b; font-size: 13px; margin: 0 0 20px 0; }

.form-group { display: flex; flex-direction: column; margin-bottom: 14px; }
label { font-weight: bold; margin-bottom: 5px; color: #334155; font-size: 13px; }
.req { color: #ef4444; }
input, select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
input:focus, select:focus { border-color: #2563eb; }

.perms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
.perm-check { display: flex; align-items: center; gap: 6px; font-weight: normal; font-size: 13px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 7px 10px; border-radius: 6px; cursor: pointer; }
.perm-check input { width: auto; }
.admin-hint { color: #64748b; font-size: 12px; margin-top: 8px; }

.btn-add { background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer; width: 100%; }
.btn-add:hover { background: #059669; }
.btn-add:disabled { background: #94a3b8; cursor: not-allowed; }

.error-msg { color: #ef4444; background: #fee2e2; padding: 9px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }
.success-msg { color: #10b981; background: #dcfce7; padding: 9px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 10px; }

.users-list { list-style: none; padding: 0; margin: 0; }
.user-item { border: 1px solid #eef2f7; border-radius: 10px; margin-bottom: 12px; padding: 14px; background: #fafbfc; }
.user-main { display: flex; align-items: center; gap: 12px; }
.user-avatar { font-size: 26px; }
.user-info { flex: 1; display: flex; flex-direction: column; }
.user-name { font-weight: bold; color: #1e293b; font-size: 14px; }
.user-email { color: #64748b; font-size: 12px; }
.role-badge { font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 20px; color: white; }
.role-badge.admin { background: #ef4444; }
.role-badge.branch_manager { background: #f59e0b; }
.role-badge.coach { background: #10b981; }
.role-badge.employee { background: #6366f1; }
.user-details { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.branch-chip { font-size: 12px; color: #475569; background: #f1f5f9; padding: 3px 10px; border-radius: 20px; display: inline-block; width: fit-content; }
.perm-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.perm-chip { font-size: 11px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 20px; }
.perm-chip.all-chip { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.no-perm { font-size: 11px; color: #94a3b8; }
.user-actions { display: flex; gap: 8px; margin-top: 10px; }
.btn-edit { background: #2563eb; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; }
.btn-edit:hover { background: #1d4ed8; }
.btn-delete { background: #ef4444; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; }
.btn-delete:hover { background: #dc2626; }

.loading-state, .empty-state { text-align: center; padding: 30px; color: #64748b; }

/* النافذة المنبثقة */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(3px); }
.modal-box { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 460px; box-shadow: 0 25px 60px rgba(0,0,0,0.3); direction: rtl; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.modal-header h3 { color: #1e3a8a; margin: 0; }
.modal-close { background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; color: #64748b; }
.modal-close:hover { background: #e2e8f0; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 11px; border: 1px solid #cbd5e1; background: white; color: #475569; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-cancel:hover { background: #f1f5f9; }
.btn-save { flex: 2; padding: 11px; border: none; background: #10b981; color: white; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-save:hover { background: #059669; }
.btn-save:disabled { background: #94a3b8; cursor: not-allowed; }

@media (max-width: 900px) {
  .users-grid { grid-template-columns: 1fr; }
  .perms-grid { grid-template-columns: 1fr; }
}
</style>
