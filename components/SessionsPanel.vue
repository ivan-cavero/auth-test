<template>
  <section class="sessions-panel">
    <h2>User Sessions</h2>
    <div class="sessions-actions">
      <button @click="onGetSessions">All Sessions</button>
      <button @click="onGetActiveSessions">Active</button>
      <button @click="onGetRevokedSessions">Revoked</button>
      <button @click="onRevokeAllSessions">Revoke All</button>
    </div>
    <div v-if="sessionError" class="error">{{ sessionError }}</div>
    <ul class="session-list" v-if="sessions.length">
      <li v-for="session in sessions" :key="session.id" :class="{selected: sessionDetails && sessionDetails.id === session.id}" @click="onGetSession(session.id)">
        <span class="session-id">{{ session.uuid }}</span>
        <span class="session-status" :class="{revoked: session.revokedAt}">{{ session.revokedAt ? 'Revoked' : 'Active' }}</span>
        <button class="revoke-btn" v-if="!session.revokedAt" @click.stop="onRevokeSession(session.id)">Revoke</button>
      </li>
    </ul>
    <div v-if="sessionDetails" class="session-details-box">
      <h3>Session Details</h3>
      <div><b>ID:</b> {{ sessionDetails.id }}</div>
      <div><b>UUID:</b> {{ sessionDetails.uuid }}</div>
      <div><b>User Agent:</b> {{ sessionDetails.userAgent }}</div>
      <div><b>IP:</b> {{ sessionDetails.ipAddress }}</div>
      <div><b>Created:</b> {{ sessionDetails.createdAt }}</div>
      <div><b>Expires:</b> {{ sessionDetails.expiresAt }}</div>
      <div><b>Last Used:</b> {{ sessionDetails.lastUsedAt }}</div>
      <div><b>Revoked:</b> {{ sessionDetails.revokedAt || 'No' }}</div>
      <div><b>Deleted:</b> {{ sessionDetails.deletedAt || 'No' }}</div>
    </div>
  </section>
</template>
<script setup lang="ts">
const props = defineProps({
  sessions: Array,
  sessionDetails: Object,
  sessionError: String,
  onGetSessions: Function,
  onGetActiveSessions: Function,
  onGetRevokedSessions: Function,
  onRevokeAllSessions: Function,
  onGetSession: Function,
  onRevokeSession: Function
})
const { sessions, sessionDetails, sessionError, onGetSessions, onGetActiveSessions, onGetRevokedSessions, onRevokeAllSessions, onGetSession, onRevokeSession } = props
</script>
<style scoped>
.sessions-panel { padding: 1.2rem; }
.sessions-actions { display: flex; gap: 0.7rem; margin-bottom: 1.2rem; }
button { background: #23262f; color: #7ab7ff; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
button:hover, button:focus { background: #1a73e8; color: #fff; border: 1px solid #1a73e8; }
.session-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.session-list li { display: flex; align-items: center; background: #20222b; border: 1px solid #23262f; border-radius: 10px; box-shadow: 0 1px 6px #0002; padding: 0.7rem 1.1rem; cursor: pointer; transition: background 0.15s, border 0.15s, box-shadow 0.15s; margin: 0; }
.session-list li.selected { border-color: #1a73e8; background: #23262f; }
.session-id { font-size: 0.97em; color: #7ab7ff; margin-right: 1.2rem; }
.session-status { font-size: 0.97em; margin-right: 1.2rem; }
.session-status.revoked { color: #ff6b6b; }
.revoke-btn { margin-left: auto; background: #23262f; color: #ff6b6b; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
.revoke-btn:hover, .revoke-btn:focus { background: #ff6b6b; color: #fff; border: 1px solid #ff6b6b; }
.session-details-box { background: #20222b; border-radius: 10px; padding: 1rem; margin-top: 1rem; }
.error { color: #ff6b6b; margin-top: 1rem; }
</style> 