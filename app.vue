<template>
  <div class="admin-container">
    <header>
      <h1>TimeFly Admin (Debug Panel)</h1>
      <div class="session-actions">
        <button @click="loginWithGoogle">Login with Google</button>
        <button @click="logout">Logout</button>
        <button @click="getCurrentUser">Get current user</button>
        <button @click="refreshToken">Refresh token</button>
        <button @click="fetchUsers">Refresh users</button>
      </div>
    </header>
    <main>
      <section>
        <h2>Users</h2>
        <div v-if="loading" class="loading">Loading users...</div>
        <div v-if="error" class="error">{{ error }}</div>
        <ul class="user-list" v-if="users.length">
          <li v-for="user in users" :key="user.uuid" @click="selectUser(user)">
            <img :src="user.avatarUrl" alt="avatar" class="avatar" />
            <span>{{ user.name }}</span>
            <span class="email">{{ user.email }}</span>
            <span class="providers" v-if="user.providerIdentities && user.providerIdentities.length">
              <span v-for="p in user.providerIdentities" :key="p.provider" class="provider-chip">{{ p.provider }}</span>
            </span>
          </li>
        </ul>
        <div v-if="selectedUser" class="user-details">
          <h3>User details</h3>
          <p><b>UUID:</b> {{ selectedUser.uuid }}</p>
          <p><b>Name:</b> {{ selectedUser.name }}</p>
          <p><b>Email:</b> {{ selectedUser.email }}</p>
          <img :src="selectedUser.avatarUrl" alt="avatar" class="avatar-large" />
          <p><b>Created:</b> {{ formatDate(selectedUser.createdAt) }}</p>
          <p><b>Updated:</b> {{ formatDate(selectedUser.updatedAt) }}</p>
          <div v-if="selectedUser.providerIdentities && selectedUser.providerIdentities.length">
            <b>Provider Identities:</b>
            <ul>
              <li v-for="p in selectedUser.providerIdentities" :key="p.provider">
                <span class="provider-chip">{{ p.provider }}</span> - <span>{{ p.providerUserId }}</span>
              </li>
            </ul>
          </div>
          <button @click="selectedUser = null">Close</button>
        </div>
      </section>
      <section class="logs-section">
        <h2>API Logs & Responses</h2>
        <div v-for="(log, idx) in logs" :key="idx" class="log-entry">
          <div class="log-meta">
            <span class="log-method">{{ log.method }}</span>
            <span class="log-url">{{ log.url }}</span>
            <span class="log-status" :class="{ success: log.status >= 200 && log.status < 300, error: log.status >= 400 }">{{ log.status }}</span>
            <span class="log-time">{{ log.time }}</span>
          </div>
          <pre class="log-body">{{ log.body }}</pre>
        </div>
      </section>
      <section v-if="currentUser" class="current-user-section">
        <h2>Current User</h2>
        <div class="user-details">
          <p><b>UUID:</b> {{ currentUser.uuid }}</p>
          <p><b>Name:</b> {{ currentUser.name }}</p>
          <p><b>Email:</b> {{ currentUser.email }}</p>
          <img :src="currentUser.avatarUrl" alt="avatar" class="avatar-large" />
          <p><b>Created:</b> {{ formatDate(currentUser.createdAt) }}</p>
          <p><b>Updated:</b> {{ formatDate(currentUser.updatedAt) }}</p>
          <div v-if="currentUser.providerIdentities && currentUser.providerIdentities.length">
            <b>Provider Identities:</b>
            <ul>
              <li v-for="p in currentUser.providerIdentities" :key="p.provider">
                <span class="provider-chip">{{ p.provider }}</span> - <span>{{ p.providerUserId }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3001'

const users = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const selectedUser = ref<any | null>(null)
const logs = ref<any[]>([])
const currentUser = ref<any | null>(null)

function logApi({ method, url, status, body }) {
  logs.value.unshift({
    method,
    url,
    status,
    body: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
    time: new Date().toLocaleTimeString()
  })
}

function loginWithGoogle() {
  window.location.href = `${API_BASE}/api/auth/google`
}

async function logout() {
  const url = `${API_BASE}/api/auth/logout`
  let status = 0, body = ''
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    body = await res.text()
    window.location.href = '/'
  } catch (e) {
    body = e?.message || 'Network error.'
  } finally {
    logApi({ method: 'GET', url, status, body })
  }
}

async function fetchUsers() {
  loading.value = true
  error.value = ''
  const url = `${API_BASE}/api/users`
  let status = 0, body = ''
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    if (res.status === 200) {
      const data = await res.json()
      users.value = data
      body = data
    } else {
      users.value = []
      body = await res.text()
      error.value = 'Failed to fetch users.'
    }
  } catch (e) {
    body = e?.message || 'Network error.'
    error.value = 'Network error.'
  } finally {
    logApi({ method: 'GET', url, status, body })
    loading.value = false
  }
}

async function getCurrentUser() {
  const url = `${API_BASE}/api/users/me`
  let status = 0, body = ''
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    if (res.status === 200) {
      const data = await res.json()
      currentUser.value = data
      body = data
    } else {
      currentUser.value = null
      body = await res.text()
    }
  } catch (e) {
    body = e?.message || 'Network error.'
  } finally {
    logApi({ method: 'GET', url, status, body })
  }
}

async function refreshToken() {
  const url = `${API_BASE}/api/auth/refresh`
  let status = 0, body = ''
  try {
    const res = await fetch(url, { method: 'POST', credentials: 'include' })
    status = res.status
    body = await res.text()
  } catch (e) {
    body = e?.message || 'Network error.'
  } finally {
    logApi({ method: 'POST', url, status, body })
  }
}

function selectUser(user: any) {
  selectedUser.value = user
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}
</script>

<style>
:root {
  color-scheme: dark;
}
body, html {
  background: #181a20;
  color: #f1f1f1;
  font-family: 'Inter', Arial, sans-serif;
  margin: 0;
  padding: 0;
}
.admin-container {
  max-width: 1000px;
  margin: 2rem auto;
  background: #23262f;
  border-radius: 16px;
  box-shadow: 0 4px 32px #0008;
  padding: 2rem;
}
header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}
h1 {
  font-size: 2rem;
  letter-spacing: 1px;
}
.session-actions {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.session-actions button {
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.session-actions button:hover {
  background: #155ab6;
}
main {
  min-height: 300px;
}
.refresh {
  margin-bottom: 1rem;
  background: #333;
  color: #fff;
  border-radius: 6px;
  border: none;
  padding: 0.3rem 1rem;
  cursor: pointer;
  float: right;
}
.refresh:hover {
  background: #444;
}
.loading {
  color: #aaa;
  margin: 1rem 0;
}
.error {
  color: #ff6b6b;
  margin: 1rem 0;
}
.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.user-list li {
  display: flex;
  align-items: center;
  background: #23262f;
  border: 1px solid #333;
  border-radius: 8px;
  margin-bottom: 0.7rem;
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
}
.user-list li:hover {
  background: #1a1c22;
  border-color: #1a73e8;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 1rem;
  border: 2px solid #333;
}
.email {
  margin-left: auto;
  color: #aaa;
  font-size: 0.95em;
}
.providers {
  margin-left: 1rem;
  display: flex;
  gap: 0.3rem;
}
.provider-chip {
  background: #1a73e8;
  color: #fff;
  border-radius: 6px;
  padding: 0.1rem 0.6rem;
  font-size: 0.85em;
  margin-right: 0.2rem;
  display: inline-block;
}
.user-details {
  background: #181a20;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 2px 16px #0004;
}
.user-details h3 {
  margin-top: 0;
}
.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 1rem 0;
  border: 3px solid #1a73e8;
}
.user-details button {
  background: #333;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1.2rem;
  margin-top: 1rem;
  cursor: pointer;
}
.user-details button:hover {
  background: #444;
}
.logs-section {
  margin-top: 2.5rem;
}
.logs-section h2 {
  margin-bottom: 1rem;
}
.log-entry {
  background: #181a20;
  border: 1px solid #333;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
  font-size: 0.98em;
  box-shadow: 0 1px 8px #0002;
}
.log-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.95em;
}
.log-method {
  font-weight: bold;
  color: #1a73e8;
}
.log-url {
  color: #aaa;
}
.log-status {
  font-weight: bold;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}
.log-status.success {
  color: #0f0;
}
.log-status.error {
  color: #ff6b6b;
}
.log-time {
  color: #888;
  margin-left: auto;
}
.log-body {
  background: #23262f;
  color: #f1f1f1;
  border-radius: 6px;
  padding: 0.5rem;
  overflow-x: auto;
  font-size: 0.97em;
  margin: 0;
}
.current-user-section {
  margin-top: 2.5rem;
}
</style>
