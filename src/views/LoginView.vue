<template>
  <div class="login-container">
    <div class="login-card">
      <h2>تسجيل الدخول - أكاديمية الكرة</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>البريد الإلكتروني</label>
          <input type="email" v-model="email" required placeholder="admin@academy.com" />
        </div>
        <div class="input-group">
          <label>كلمة المرور</label>
          <input type="password" v-model="password" required placeholder="******" />
        </div>
        <button type="submit">دخول</button>
      </form>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    });

    const data = await response.json();

if (!response.ok) {
      errorMessage.value = data.message;
    } else {
      // نحفظ التوكن فقط في المتصفح لحمايته
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    }
  } catch (error) {
    errorMessage.value = 'فشل الاتصال بالسيرفر. تأكد من تشغيل الـ Backend.';
  }
};
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; font-family: sans-serif; direction: rtl; }
.login-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
.input-group { margin-bottom: 15px; text-align: right; }
.input-group label { display: block; margin-bottom: 5px; color: #333; }
.input-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
button { width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
button:hover { background: #218838; }
.error { color: red; margin-top: 15px; }
</style>