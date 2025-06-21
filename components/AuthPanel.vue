<template>
  <section class="auth-panel">
    <h2>Authentication</h2>
    <div class="auth-actions">
      <button @click="onLogin">Login with Google</button>
      <button @click="onLogout">Logout</button>
      <button @click="onRefreshToken">Refresh Token</button>
      <button @click="onRefreshCurrentUser">Get Current User</button>
    </div>
    <div v-if="currentUser" class="current-user-box">
      <h3>Current User</h3>
      <img :src="currentUser.avatarUrl" alt="avatar" class="avatar" />
      <div><b>Name:</b> {{ currentUser.name }}</div>
      <div><b>Email:</b> {{ currentUser.email }}</div>
      <div><b>UUID:</b> {{ currentUser.uuid }}</div>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>
  </section>
</template>
<script setup lang="ts">
const props = defineProps({
  currentUser: Object,
  onLogin: Function,
  onLogout: Function,
  onRefreshToken: Function,
  onRefreshCurrentUser: Function,
  loading: Boolean,
  error: String
})
const { currentUser, onLogin, onLogout, onRefreshToken, onRefreshCurrentUser, loading, error } = props
</script>
<style scoped>
.auth-panel { padding: 1.2rem; }
.auth-actions { display: flex; gap: 0.7rem; margin-bottom: 1.2rem; }
button { background: #23262f; color: #7ab7ff; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
button:hover, button:focus { background: #1a73e8; color: #fff; border: 1px solid #1a73e8; }
.current-user-box { background: #20222b; border-radius: 10px; padding: 1rem; margin-top: 1rem; }
.avatar { width: 38px; height: 38px; border-radius: 50%; margin-bottom: 0.7rem; border: 1.5px solid #1a73e8; background: #23262f; object-fit: cover; }
.error { color: #ff6b6b; margin-top: 1rem; }
.loading { color: #7ab7ff; margin-top: 1rem; }
</style> 