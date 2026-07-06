<template>
  <div class="register-container">
    <div class="wizard-card">
      <h2>📝 استمارة تسجيل لاعب جديد</h2>
      
      <div class="steps-bar">
        <div class="step" :class="{ active: currentStep >= 1 }">1. الشخصية</div>
        <div class="step" :class="{ active: currentStep >= 2 }">2. الأكاديمية</div>
        <div class="step" :class="{ active: currentStep >= 3 }">3. الطبية</div>
        <div class="step" :class="{ active: currentStep >= 4 }">4. الدفع</div>
      </div>

      <form @submit.prevent="submitForm">
        
        <div v-if="currentStep === 1" class="step-content">
          <h3>[1] البيانات الشخصية للاعب</h3>
          <div class="form-group">
            <label>اسم اللاعب الثلاثي *</label>
            <input type="text" v-model="form.name" placeholder="أدخل الاسم الكامل" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>تاريخ الميلاد *</label>
              <input type="date" v-model="form.birth_date" />
            </div>
            <div class="form-group">
              <label>مركز اللعب المفصل *</label>
              <select v-model="form.position">
                <option value="">اختر المركز</option>
                <option value="حارس مرمى">حارس مرمى</option>
                <option value="مدافع">مدافع</option>
                <option value="لاعب وسط">لاعب وسط</option>
                <option value="مهاجم">مهاجم</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>رقم هاتف ولي الأمر *</label>
              <input type="tel" v-model="form.phone" placeholder="05xxxxxxxx" />
            </div>
            <div class="form-group">
              <label>رقم المشترك (إن وجد)</label>
              <input type="text" v-model="form.member_number" placeholder="اختياري" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>الجنس *</label>
              <select v-model="form.gender">
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>
            <div class="form-group">
              <label>القدم المفضلة *</label>
              <select v-model="form.preferred_foot">
                <option value="اليمنى">اليمنى</option>
                <option value="اليسرى">اليسرى</option>
                <option value="كلتاهما">كلتاهما</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>العنوان</label>
            <input type="text" v-model="form.address" placeholder="المدينة، الحي، الشارع" />
          </div>
        </div>

        <div v-if="currentStep === 2" class="step-content">
          <h3>[2] بيانات الاشتراك والأكاديمية</h3>
          <div class="form-row">
            <div class="form-group">
              <label>نوع البرنامج التدريبي *</label>
              <input type="text" v-model="form.program_type" placeholder="مثال: فئة البراعم، تطوير المهارات" />
            </div>
            <div class="form-group">
              <label>الفرع والملعب *</label>
              <input type="text" v-model="form.branch" placeholder="مثال: الفرع الرئيسي - ملعب السد" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>تاريخ بدء الاشتراك *</label>
              <input type="date" v-model="form.start_date" @change="calculateEndDate" />
            </div>
            <div class="form-group">
              <label>تاريخ انتهاء الاشتراك (تلقائي بناءً على شهر كامل)</label>
              <input type="date" v-model="form.end_date" disabled class="disabled-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>وقت الحصص التدريبية *</label>
              <input type="time" v-model="form.session_time" />
            </div>
            <div class="form-group">
              <label>عدد الجلسات/الحصص في الأسبوع *</label>
              <input type="number" v-model="form.session_count" placeholder="مثال: 3" />
            </div>
          </div>
        </div>

        <div v-if="currentStep === 3" class="step-content">
          <h3>[3] الملف الطبي للاعب (اختياري / للسلامة)</h3>
          <div class="form-row">
            <div class="form-group">
              <label>هل يعاني من أي حساسية؟</label>
              <input type="text" v-model="form.allergies" placeholder="اكتبها هنا إن وجدت" />
            </div>
            <div class="form-group">
              <label>أمراض مزمنة؟</label>
              <input type="text" v-model="form.chronic_diseases" placeholder="سكري، ربو، إلخ..." />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>إصابات أو عمليات سابقة؟</label>
              <input type="text" v-model="form.past_injuries" placeholder="كسور، أربطة، إلخ..." />
            </div>
            <div class="form-group">
              <label>أدوية حالية مستخدمة؟</label>
              <input type="text" v-model="form.current_medications" placeholder="اسم الدواء ومواعيده" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>الطول (سم)</label>
              <input type="number" v-model="form.height" placeholder="مثال: 145" />
            </div>
            <div class="form-group">
              <label>الوزن (كجم)</label>
              <input type="number" v-model="form.weight" placeholder="مثال: 40" />
            </div>
          </div>
        </div>

        <div v-if="currentStep === 4" class="step-content">
          <h3>[4] البيانات المالية وإتمام التسجيل</h3>
          <div class="form-row">
            <div class="form-group">
              <label>قيمة الاشتراك الأساسية ($) *</label>
              <input type="number" v-model="form.fee" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>قيمة الخصم إن وجدت ($)</label>
              <input type="number" v-model="form.discount" placeholder="0.00" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>تاريخ الدفع *</label>
              <input type="date" v-model="form.payment_date" />
            </div>
            <div class="form-group">
              <label>طريقة الدفع *</label>
              <select v-model="form.payment_method">
                <option value="نقداً">نقداً</option>
                <option value="بطاقة بنكية">بطاقة بنكية</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
              </select>
            </div>
          </div>

          <div class="terms-container">
            <input type="checkbox" id="terms" v-model="form.terms_accepted" />
            <label for="terms">أقر وأوافق على الشروط والأحكام الخاصة بأكاديمية كرة القدم والالتزام باللوائح الداخلية والسلامة الصحية. *</label>
          </div>
        </div>

        <p v-if="validationError" class="error-msg">⚠️ {{ validationError }}</p>
        <p v-if="serverMessage" class="success-msg"> {{ serverMessage }}</p>

        <div class="buttons-row">
          <button type="button" v-if="currentStep > 1" @click="prevStep" class="btn-secondary">السابق</button>
          <button type="button" v-if="currentStep < 4" @click="nextStep" class="btn-primary">التالي</button>
          <button type="submit" v-if="currentStep === 4" class="btn-success">إتمام وحفظ اللاعب ⚽</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const currentStep = ref(1);
const validationError = ref('');
const serverMessage = ref('');
const router = useRouter();

// البيانات الأولية للاستمارة
const form = ref({
  name: '', birth_date: '', position: '', phone: '', member_number: '', address: '', gender: 'ذكر', preferred_foot: 'اليمنى',
  program_type: '', branch: '', start_date: '', end_date: '', session_time: '', session_count: '',
  allergies: '', chronic_diseases: '', past_injuries: '', current_medications: '', height: null, weight: null,
  fee: '', payment_date: '', payment_method: 'نقداً', discount: 0, terms_accepted: false
});

// الحساب التلقائي لتاريخ الانتهاء (شهر من تاريخ البدء)
const calculateEndDate = () => {
  if (form.value.start_date) {
    const date = new Date(form.value.start_date);
    date.setMonth(date.getMonth() + 1);
    form.value.end_date = date.toISOString().split('T')[0];
  }
};

// التحقق من الحقول المطلوبة قبل الانتقال للمرحلة التالية
const validateStep = () => {
  validationError.value = '';
  if (currentStep.value === 1) {
    if (!form.value.name || !form.value.birth_date || !form.value.position || !form.value.phone || !form.value.gender || !form.value.preferred_foot) {
      validationError.value = 'يرجى ملء جميع الحقول الإلزامية المميزة بنجمة (*) في هذه المرحلة لكي تعبر.';
      return false;
    }
  } else if (currentStep.value === 2) {
    if (!form.value.program_type || !form.value.branch || !form.value.start_date || !form.value.session_time || !form.value.session_count) {
      validationError.value = 'جميع بيانات الأكاديمية وتاريخ البدء وتوقيت الحصص مطلوبة.';
      return false;
    }
  } else if (currentStep.value === 4) {
    if (!form.value.fee || !form.value.payment_date || !form.value.payment_method) {
      validationError.value = 'يرجى إكمال البيانات المالية لعملية الدفع أولاً.';
      return false;
    }
    if (!form.value.terms_accepted) {
      validationError.value = 'يجب الموافقة على الشروط والأحكام لإتمام التسجيل بالنظام.';
      return false;
    }
  }
  return true;
};

const nextStep = () => { if (validateStep()) currentStep.value++; };
const prevStep = () => { validationError.value = ''; currentStep.value--; };

// إرسال الاستمارة النهائية للسيرفر
const submitForm = async () => {
  if (!validateStep()) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    });

    const data = await response.json();
    if (response.ok) {
      serverMessage.value = data.message;
      setTimeout(() => {
        router.push('/dashboard'); // العودة للوحة التحكم بعد النجاح
      }, 2000);
    } else {
      validationError.value = data.message;
    }
  } catch (error) {
    validationError.value = 'فشل الاتصال بالسيرفر أثناء حفظ اللاعب.';
  }
};
</script>

<style scoped>
.register-container { display: flex; justify-content: center; padding: 40px 20px; background: #f4f6f9; min-height: 100vh; direction: rtl; font-family: sans-serif; }
.wizard-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 750px; }
h2 { text-align: center; color: #2c3e50; margin-bottom: 25px; }
.steps-bar { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
.step { font-weight: bold; color: #95a5a6; padding: 5px 10px; }
.step.active { color: #27ae60; border-bottom: 3px solid #27ae60; }
h3 { color: #2980b9; margin-bottom: 20px; font-size: 18px; border-right: 4px solid #2980b9; padding-right: 10px; }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; text-align: right; }
.form-row { display: flex; gap: 20px; }
.form-row .form-group { flex: 1; }
label { font-weight: 600; margin-bottom: 6px; color: #333; font-size: 14px; }
input, select, textarea { padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; width: 100%; box-sizing: border-box; }
input:focus, select:focus { border-color: #2980b9; outline: none; }
.disabled-input { background: #eaeded; color: #7f8c8d; cursor: not-allowed; font-weight: bold; }
.terms-container { display: flex; align-items: flex-start; gap: 10px; margin: 25px 0; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px dashed #cbd5e1; }
.terms-container input { width: auto; margin-top: 4px; }
.terms-container label { font-weight: normal; color: #555; cursor: pointer; line-height: 1.5; }
.buttons-row { display: flex; justify-content: space-between; margin-top: 30px; gap: 15px; }
button { padding: 12px 25px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; border: none; }
.btn-primary { background: #2980b9; color: white; margin-right: auto; }
.btn-secondary { background: #7f8c8d; color: white; }
.btn-success { background: #27ae60; color: white; margin-right: auto; width: 100%; max-width: 250px; }
button:hover { opacity: 0.9; }
.error-msg { color: #c0392b; background: #fde8e7; padding: 10px; border-radius: 6px; font-weight: bold; margin-top: 15px; text-align: center;}
.success-msg { color: #27ae60; background: #e8f8f0; padding: 10px; border-radius: 6px; font-weight: bold; margin-top: 15px; text-align: center;}
</style>