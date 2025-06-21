<template>
  <div class="dashboard-layout">
    <!-- Sidebar de navegación -->
    <aside class="sidebar-nav">
      <nav class="nav-list">
        <button :class="{active: section==='auth'}" @click="section='auth'">Auth</button>
        <button :class="{active: section==='users'}" @click="section='users'">Users</button>
        <button :class="{active: section==='sessions'}" @click="section='sessions'" :disabled="!selectedUser">Sessions</button>
        <button :class="{active: section==='apikeys'}" @click="section='apikeys'" :disabled="!selectedUser">API Keys</button>
      </nav>
      <div class="sidebar-divider"></div>
      <div class="sidebar-user">
        <div v-if="currentUser" class="current-user-panel">
          <img :src="currentUser.avatarUrl" alt="avatar" class="avatar-large" />
          <div class="user-fields">
            <div><span class="field-label">Name:</span> <span>{{ currentUser.name }}</span></div>
            <div><span class="field-label">Email:</span> <span>{{ currentUser.email }}</span></div>
          </div>
        </div>
        <div v-else class="no-data-panel">No user authenticated</div>
      </div>
    </aside>

    <!-- Panel central dinámico -->
    <main class="main-panel">
      <component :is="sectionComponent"
        :users="users"
        :selected-user="selectedUser"
        :on-select-user="selectUser"
        :on-refresh-users="fetchUsers"
        :on-refresh-current-user="getCurrentUser"
        :on-create-user="createUser"
        :on-update-user="updateUser"
        :on-delete-user="deleteUser"
        :on-get-user="getUserByUuid"
        :on-login="loginWithGoogle"
        :on-logout="logout"
        :on-refresh-token="refreshToken"
        :on-get-sessions="getSessions"
        :on-get-active-sessions="getActiveSessions"
        :on-get-revoked-sessions="getRevokedSessions"
        :on-revoke-all-sessions="revokeAllSessions"
        :on-get-session="getSessionById"
        :on-revoke-session="revokeSessionById"
        :sessions="sessions"
        :session-details="sessionDetails"
        :session-error="sessionError"
        :api-keys="apiKeys"
        :api-key-details="apiKeyDetails"
        :api-key-secret="apiKeySecret"
        :api-key-error="apiKeyError"
        :on-get-api-keys="getApiKeys"
        :on-get-active-api-keys="getActiveApiKeys"
        :on-get-revoked-api-keys="getRevokedApiKeys"
        :on-revoke-all-api-keys="revokeAllApiKeys"
        :on-get-api-key="getApiKey"
        :on-revoke-api-key="revokeApiKey"
        :on-regenerate-api-key="regenerateApiKey"
        :on-create-api-key="createApiKey"
        :loading="loading"
        :error="error"
      />
    </main>

    <!-- Panel derecho: API Timeline -->
    <aside class="timeline-panel">
      <h2 class="section-title">API Timeline</h2>
      <div v-if="!Object.keys(groupedLogs).length" class="no-data-panel">No API requests yet</div>
      <div v-for="(requests, endpoint) in groupedLogs" :key="endpoint" class="endpoint-group">
        <div class="endpoint-title">{{ endpoint }}</div>
        <div class="timeline-list">
          <div v-for="(log, idx) in requests" :key="idx" class="timeline-entry" :class="log.statusClass" @click="toggleExpand(log)">
            <div class="timeline-dot"></div>
            <div class="timeline-summary">
              <span class="timeline-method">{{ log.method }}</span>
              <span class="timeline-status" :class="log.statusClass">{{ log.status }}</span>
              <span class="timeline-time">{{ log.startTime }}</span>
              <span class="timeline-duration">{{ log.duration ? log.duration + ' ms' : '' }}</span>
              <span class="timeline-expand">{{ log.expanded ? '▼' : '▶' }}</span>
            </div>
            <transition name="expand">
              <div v-if="log.expanded" class="timeline-details">
                <div v-if="log.params" class="timeline-params">
                  <span class="params-label">Params:</span>
                  <pre>{{ log.params }}</pre>
                </div>
                <div v-if="log.body" class="timeline-response">
                  <span class="response-label">Response:</span>
                  <pre>{{ log.body }}</pre>
                </div>
                <div v-if="log.error" class="timeline-error">{{ log.error }}</div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRuntimeConfig } from '#imports'
import AuthPanel from './components/AuthPanel.vue'
import UsersPanel from './components/UsersPanel.vue'
import SessionsPanel from './components/SessionsPanel.vue'
import ApiKeysPanel from './components/ApiKeysPanel.vue'

const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'https://apitest.timefly.dev'

const section = ref('auth')
const sectionComponent = computed(() => {
  if (section.value === 'auth') return AuthPanel
  if (section.value === 'users') return UsersPanel
  if (section.value === 'sessions') return SessionsPanel
  if (section.value === 'apikeys') return ApiKeysPanel
  return AuthPanel
})

const users = ref<any[]>([])
const selectedUser = ref<any | null>(null)
const sessions = ref<any[]>([])
const sessionDetails = ref<any | null>(null)
const sessionError = ref('')
const apiKeys = ref<any[]>([])
const apiKeyDetails = ref<any | null>(null)
const apiKeySecret = ref('')
const apiKeyError = ref('')
const loading = ref(false)
const error = ref('')
const currentUser = ref<any | null>(null)
const logs = ref<any[]>([])

function statusClass(status: number) {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'error'
  if (status >= 500) return 'error'
  return 'info'
}

function logApi({ method, url, status, body, params, startTime, duration, error }) {
  // Pretty print params and body if they are objects
  let prettyParams = params
  if (params && typeof params === 'object') {
    try { prettyParams = JSON.stringify(params, null, 2) } catch { prettyParams = String(params) }
  }
  let prettyBody = body
  if (body && typeof body === 'object') {
    try { prettyBody = JSON.stringify(body, null, 2) } catch { prettyBody = String(body) }
  }
  logs.value.unshift({
    method,
    url,
    status,
    statusClass: statusClass(status),
    body: prettyBody,
    params: prettyParams,
    startTime: startTime || new Date().toLocaleTimeString(),
    duration,
    error,
    expanded: false
  })
}

function toggleExpand(log) {
  log.expanded = !log.expanded
}

// --- AUTH ---
function loginWithGoogle() {
  window.location.href = `${API_BASE}/api/auth/google`
}

async function logout() {
  const url = `${API_BASE}/api/auth/logout`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    body = await res.text()
    window.location.href = '/'
    logApi({ method: 'GET', url, status, body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    logApi({ method: 'GET', url, status, body, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function refreshToken() {
  const url = `${API_BASE}/api/auth/refresh`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'POST', credentials: 'include' })
    status = res.status
    body = await res.text()
    logApi({ method: 'POST', url, status, body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    logApi({ method: 'POST', url, status, body, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getCurrentUser() {
  const url = `${API_BASE}/api/users/me`
  let status = 0, body = '', start = Date.now()
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
    logApi({ method: 'GET', url, status, body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    logApi({ method: 'GET', url, status, body, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

// --- USERS ---
async function fetchUsers() {
  loading.value = true
  error.value = ''
  selectedUser.value = null
  const url = `${API_BASE}/api/users`
  let status = 0, body = '', start = Date.now()
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
    logApi({ method: 'GET', url, status, body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    error.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } finally {
    loading.value = false
  }
}

function selectUser(user: any) {
  selectedUser.value = user
  section.value = 'sessions'
  // Al seleccionar usuario, refresca sesiones automáticamente
  getSessions()
}

async function createUser(user: any) {
  const url = `${API_BASE}/api/users`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user)
    })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 201) {
      await fetchUsers()
    } else {
      error.value = 'Failed to create user.'
    }
    logApi({ method: 'POST', url, status, body, params: user, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    error.value = 'Network error.'
    logApi({ method: 'POST', url, status, body, params: user, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function updateUser(user: any) {
  const url = `${API_BASE}/api/users/${user.uuid}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user)
    })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      await fetchUsers()
    } else {
      error.value = 'Failed to update user.'
    }
    logApi({ method: 'PUT', url, status, body, params: user, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    error.value = 'Network error.'
    logApi({ method: 'PUT', url, status, body, params: user, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function deleteUser(uuid: string) {
  const url = `${API_BASE}/api/users/${uuid}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      await fetchUsers()
      if (selectedUser.value && selectedUser.value.uuid === uuid) selectedUser.value = null
    } else {
      error.value = 'Failed to delete user.'
    }
    logApi({ method: 'DELETE', url, status, body, params: { uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    error.value = 'Network error.'
    logApi({ method: 'DELETE', url, status, body, params: { uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getUserByUuid(uuid: string) {
  const url = `${API_BASE}/api/users/${uuid}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      selectedUser.value = data
    } else {
      selectedUser.value = null
    }
    logApi({ method: 'GET', url, status, body, params: { uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

// --- SESSIONS ---
async function getSessions() {
  if (!selectedUser.value) return
  sessionDetails.value = null
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/sessions`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      sessions.value = data
      sessionError.value = ''
    } else {
      sessions.value = []
      sessionError.value = 'Failed to fetch sessions.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    sessionError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getActiveSessions() {
  if (!selectedUser.value) return
  sessionDetails.value = null
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/sessions/active`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      sessions.value = data
      sessionError.value = ''
    } else {
      sessions.value = []
      sessionError.value = 'Failed to fetch active sessions.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    sessionError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getRevokedSessions() {
  if (!selectedUser.value) return
  sessionDetails.value = null
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/sessions/revoked`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      sessions.value = data
      sessionError.value = ''
    } else {
      sessions.value = []
      sessionError.value = 'Failed to fetch revoked sessions.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    sessionError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function revokeAllSessions() {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/sessions`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    await getSessions()
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    sessionError.value = 'Network error.'
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getSessionById(sessionId: string) {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/sessions/${sessionId}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      sessionDetails.value = data
      sessionError.value = ''
    } else {
      sessionDetails.value = null
      sessionError.value = 'Session not found.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid, sessionId }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    sessionError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid, sessionId }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function revokeSessionById(sessionId: string) {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/sessions/${sessionId}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    await getSessions()
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid, sessionId }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    sessionError.value = 'Network error.'
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid, sessionId }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

// --- API KEYS ---
async function getApiKeys() {
  if (!selectedUser.value) return
  apiKeyDetails.value = null
  apiKeySecret.value = ''
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      apiKeys.value = data
      apiKeyError.value = ''
    } else {
      apiKeys.value = []
      apiKeyError.value = 'Failed to fetch API keys.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getActiveApiKeys() {
  if (!selectedUser.value) return
  apiKeyDetails.value = null
  apiKeySecret.value = ''
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys/active`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      apiKeys.value = data
      apiKeyError.value = ''
    } else {
      apiKeys.value = []
      apiKeyError.value = 'Failed to fetch active API keys.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getRevokedApiKeys() {
  if (!selectedUser.value) return
  apiKeyDetails.value = null
  apiKeySecret.value = ''
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys/revoked`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      apiKeys.value = data
      apiKeyError.value = ''
    } else {
      apiKeys.value = []
      apiKeyError.value = 'Failed to fetch revoked API keys.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function revokeAllApiKeys() {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    await getApiKeys()
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function getApiKey(keyUuid: string) {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys/${keyUuid}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200) {
      apiKeyDetails.value = data
      apiKeyError.value = ''
    } else {
      apiKeyDetails.value = null
      apiKeyError.value = 'API key not found.'
    }
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid, keyUuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'GET', url, status, body, params: { uuid: selectedUser.value.uuid, keyUuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function revokeApiKey(keyUuid: string) {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys/${keyUuid}`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    await getApiKeys()
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid, keyUuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'DELETE', url, status, body, params: { uuid: selectedUser.value.uuid, keyUuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function regenerateApiKey(keyUuid: string) {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys/${keyUuid}/regenerate`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, { method: 'POST', credentials: 'include' })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 200 && data && data.apiKey) {
      apiKeySecret.value = data.apiKey
      apiKeyDetails.value = data.apiKeyPublic
      apiKeyError.value = ''
      await getApiKeys()
    } else {
      apiKeyError.value = 'Failed to regenerate API key.'
    }
    logApi({ method: 'POST', url, status, body, params: { uuid: selectedUser.value.uuid, keyUuid }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'POST', url, status, body, params: { uuid: selectedUser.value.uuid, keyUuid }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

async function createApiKey({ label, description }) {
  if (!selectedUser.value) return
  const url = `${API_BASE}/api/users/${selectedUser.value.uuid}/api-keys`
  let status = 0, body = '', start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ label, description })
    })
    status = res.status
    let data = null
    try { data = await res.json(); body = data } catch { body = await res.text() }
    if (res.status === 201 && data && data.apiKey) {
      apiKeySecret.value = data.apiKey
      apiKeyDetails.value = data.apiKeyPublic
      apiKeyError.value = ''
      await getApiKeys()
    } else {
      apiKeyError.value = 'Failed to create API key.'
    }
    logApi({ method: 'POST', url, status, body, params: { uuid: selectedUser.value.uuid, label, description }, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  } catch (e) {
    body = e?.message || 'Network error.'
    apiKeyError.value = 'Network error.'
    logApi({ method: 'POST', url, status, body, params: { uuid: selectedUser.value.uuid, label, description }, error: body, startTime: new Date(start).toLocaleTimeString(), duration: Date.now() - start })
  }
}

// Agrupar logs por endpoint
const groupedLogs = computed(() => {
  const groups = {} as Record<string, any[]>
  for (const log of logs.value) {
    const endpoint = log.url.replace(API_BASE, '')
    if (!groups[endpoint]) groups[endpoint] = []
    groups[endpoint].push(log)
  }
  return groups
})

// --- UX: refresco y limpieza de estado al cambiar de tab ---
watch(section, (val) => {
  error.value = ''
  loading.value = false
  sessionError.value = ''
  apiKeyError.value = ''
  apiKeySecret.value = ''
  if (val === 'users') {
    fetchUsers()
    selectedUser.value = null
  }
  if (val === 'sessions') {
    if (selectedUser.value) getSessions()
    else section.value = 'users' // No user selected, vuelve a users
  }
  if (val === 'apikeys') {
    if (selectedUser.value) getApiKeys()
    else section.value = 'users'
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
:root {
  color-scheme: dark;
}
body, html {
  background: #16181d;
  color: #e3eaff;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
.dashboard-layout {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  background: #16181d;
}
.sidebar-nav {
  width: 220px;
  background: #181a20;
  border-right: 1.5px solid #23262f;
  padding: 1.2rem 0.7rem 1.2rem 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 100vh;
}
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  margin-top: 1.2rem;
}
.nav-list button {
  background: #23262f;
  color: #7ab7ff;
  border: 1px solid #23262f;
  border-radius: 7px;
  padding: 0.32rem 0.9rem;
  font-size: 0.93rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border 0.15s;
  outline: none;
  margin-bottom: 0.1rem;
}
.nav-list button:hover, .nav-list button:focus {
  background: #1a73e8;
  color: #fff;
  border: 1px solid #1a73e8;
}
.nav-list button.active {
  background: #1a73e8;
  color: #fff;
  border: 1px solid #1a73e8;
}
.sidebar-divider {
  height: 1px;
  background: #23262f;
  margin: 1.2rem 0;
}
.sidebar-user {
  width: 100%;
  background: #20222b;
  border-radius: 10px;
  box-shadow: 0 2px 12px #0002;
  padding: 0.7rem 0.5rem 0.7rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.2rem;
}
.avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-bottom: 0.7rem;
  border: 1.5px solid #1a73e8;
  box-shadow: 0 2px 12px #1a73e830;
  background: #23262f;
  object-fit: cover;
}
.user-fields {
  width: 100%;
  font-size: 0.93em;
  color: #e3eaff;
  margin-bottom: 0.3rem;
}
.field-label {
  color: #7ab7ff;
  font-weight: 600;
  margin-right: 0.3em;
}
.no-data-panel {
  color: #888;
  background: #20222b;
  border-radius: 10px;
  padding: 1.2rem 1rem;
  text-align: center;
  font-size: 1em;
  margin-top: 1.5rem;
}
.main-panel {
  flex: 1 1 0;
  padding: 1.2rem 0.7rem 1.2rem 0.7rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  margin-bottom: 1.2rem;
}
.timeline-panel {
  width: 300px;
  background: #181a20;
  border-left: 1.5px solid #23262f;
  padding: 1.2rem 0.7rem 1.2rem 0.7rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.endpoint-group {
  margin-bottom: 2.2rem;
}
.endpoint-title {
  font-size: 1.01rem;
  font-weight: 700;
  color: #e3eaff;
  margin-bottom: 0.7rem;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #23262f;
  padding-bottom: 0.3rem;
}
.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  position: relative;
  margin-left: 1.2rem;
}
.timeline-entry {
  background: #20222b;
  border: 1px solid #23262f;
  border-radius: 10px;
  box-shadow: 0 1px 6px #0002;
  padding: 0.5rem 1rem 0.5rem 1.5rem;
  font-size: 0.97em;
  margin: 0;
  transition: border 0.15s, box-shadow 0.15s;
  position: relative;
  cursor: pointer;
}
.timeline-entry.success {
  border-left: 4px solid #00e676;
}
.timeline-entry.error {
  border-left: 4px solid #ff6b6b;
}
.timeline-entry.info {
  border-left: 4px solid #7ab7ff;
}
.timeline-dot {
  position: absolute;
  left: -1.2rem;
  top: 1.1rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #23262f;
  border: 2.5px solid #7ab7ff;
  z-index: 2;
}
.timeline-entry.success .timeline-dot {
  border-color: #00e676;
}
.timeline-entry.error .timeline-dot {
  border-color: #ff6b6b;
}
.timeline-entry.info .timeline-dot {
  border-color: #7ab7ff;
}
.timeline-summary {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.97em;
}
.timeline-method {
  font-weight: bold;
  color: #7ab7ff;
  letter-spacing: 0.5px;
  font-size: 0.97em;
}
.timeline-status {
  font-weight: bold;
  padding: 0.1rem 0.7rem;
  border-radius: 6px;
  font-size: 0.97em;
}
.timeline-status.success {
  color: #00e676;
  background: rgba(0, 230, 118, 0.08);
}
.timeline-status.error {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.08);
}
.timeline-status.info {
  color: #7ab7ff;
  background: rgba(122, 183, 255, 0.08);
}
.timeline-time {
  color: #b3c7e6;
  font-size: 0.97em;
}
.timeline-duration {
  color: #888;
  font-size: 0.97em;
  margin-left: 0.5rem;
}
.timeline-expand {
  margin-left: auto;
  color: #7ab7ff;
  font-size: 1.1em;
  font-weight: bold;
  user-select: none;
}
.expand-enter-active, .expand-leave-active {
  transition: max-height 0.2s cubic-bezier(.4,2,.6,1), opacity 0.2s;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 400px;
  opacity: 1;
}
.timeline-details {
  margin-top: 0.5rem;
  padding-left: 0.2rem;
}
.timeline-params, .timeline-response {
  margin-top: 0.2rem;
}
.params-label, .response-label {
  color: #7ab7ff;
  font-weight: 600;
  font-size: 0.97em;
  margin-right: 0.3em;
}
.timeline-error {
  color: #ff6b6b;
  font-size: 0.97em;
  margin-top: 0.3rem;
}
pre {
  background: #23262f;
  color: #e3eaff;
  border-radius: 7px;
  padding: 0.5rem 0.7rem;
  font-size: 0.97em;
  margin: 0.2rem 0 0.2rem 0;
  font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
  box-shadow: 0 1px 6px #0001;
  overflow-x: auto;
}
.timeline-params pre, .timeline-response pre {
  max-width: 100%;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  background: #181a20;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.95em;
  margin: 0.2rem 0;
}
@media (max-width: 900px) {
  .dashboard-layout {
    flex-direction: column;
  }
  .sidebar-nav {
    width: 100vw;
    min-height: unset;
    border: none;
    padding: 1.2rem 0.7rem;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
  .main-panel {
    padding: 1.2rem 0.7rem;
  }
}
</style>
