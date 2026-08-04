// قائمة الصفحات المتاحة للمنح في نظام الصلاحيات
export const ALL_PAGES = [
  { key: 'players', label: 'المشتركين واللاعبين', icon: '📝' },
  { key: 'subscriptions', label: 'تسجيل الاشتراكات', icon: '💳' },
  { key: 'packages', label: 'إدارة الباقات', icon: '📦' },
  { key: 'schedule', label: 'الحضور والجدول', icon: '📋' },
  { key: 'evaluations', label: 'تقييم اللاعبين', icon: '📊' },
  { key: 'reports', label: 'التقارير المالية', icon: '📈' },
  { key: 'branches', label: 'الفروع', icon: '🏢' },
  { key: 'holidays', label: 'الإجازات', icon: '🏖️' },
]

export const ROLES = [
  { key: 'admin', label: 'مدير النظام' },
  { key: 'branch_manager', label: 'مدير فرع' },
  { key: 'coach', label: 'مدرب' },
  { key: 'employee', label: 'موظف' },
]

export const roleLabel = (role) => {
  const r = ROLES.find((x) => x.key === role)
  return r ? r.label : role
}

// استخراج بيانات المستخدم من التوكن
export const getUserFromToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch (e) {
    return null
  }
}

// هل يملك المستخدم صلاحية معينة؟ (المدير العام يملك كل شيء تلقائياً)
export const hasPermission = (perm) => {
  const user = getUserFromToken()
  if (!user) return false
  if (user.role === 'admin') return true
  return (user.permissions || []).includes(perm)
}

// قائمة الصلاحيات الفعلية (المدير العام يملك الكل)
export const effectivePermissions = () => {
  const user = getUserFromToken()
  if (!user) return []
  if (user.role === 'admin') return ALL_PAGES.map((p) => p.key)
  return user.permissions || []
}
