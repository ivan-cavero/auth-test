<template>
  <section class="api-keys-panel">
    <h2>User API Keys</h2>
    <div class="api-keys-actions">
      <button @click="onGetApiKeys">All Keys</button>
      <button @click="onGetActiveApiKeys">Active</button>
      <button @click="onGetRevokedApiKeys">Revoked</button>
      <button @click="onRevokeAllApiKeys">Revoke All</button>
    </div>
    <form @submit.prevent="handleCreateApiKey" class="inline-form">
      <input v-model="newKey.label" placeholder="Label" required />
      <input v-model="newKey.description" placeholder="Description" />
      <button type="submit">Create</button>
    </form>
    <div v-if="apiKeyError" class="error">{{ apiKeyError }}</div>
    <ul class="api-key-list" v-if="apiKeys.length">
      <li v-for="key in apiKeys" :key="key.uuid" :class="{selected: apiKeyDetails && apiKeyDetails.uuid === key.uuid}" @click="onGetApiKey(key.uuid)">
        <span class="api-key-label">{{ key.label }}</span>
        <span class="api-key-status" :class="{revoked: key.revokedAt}">{{ key.revokedAt ? 'Revoked' : 'Active' }}</span>
        <button class="revoke-btn" v-if="!key.revokedAt" @click.stop="onRevokeApiKey(key.uuid)">Revoke</button>
        <button class="regen-btn" v-if="!key.revokedAt" @click.stop="onRegenerateApiKey(key.uuid)">Regenerate</button>
      </li>
    </ul>
    <div v-if="apiKeyDetails" class="api-key-details-box">
      <h3>API Key Details</h3>
      <div><b>UUID:</b> {{ apiKeyDetails.uuid }}</div>
      <div><b>Label:</b> {{ apiKeyDetails.label }}</div>
      <div><b>Description:</b> {{ apiKeyDetails.description }}</div>
      <div><b>Created:</b> {{ apiKeyDetails.createdAt }}</div>
      <div><b>Last Used:</b> {{ apiKeyDetails.lastUsedAt }}</div>
      <div><b>Revoked:</b> {{ apiKeyDetails.revokedAt || 'No' }}</div>
      <div><b>Deleted:</b> {{ apiKeyDetails.deletedAt || 'No' }}</div>
    </div>
    <div v-if="apiKeySecret" class="api-key-secret-box">
      <h4>API Key (copy and save, only shown once!):</h4>
      <pre>{{ apiKeySecret }}</pre>
      <button @click="apiKeySecret = ''">Hide</button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps({
  apiKeys: Array,
  apiKeyDetails: Object,
  apiKeySecret: String,
  apiKeyError: String,
  onGetApiKeys: Function,
  onGetActiveApiKeys: Function,
  onGetRevokedApiKeys: Function,
  onRevokeAllApiKeys: Function,
  onGetApiKey: Function,
  onRevokeApiKey: Function,
  onRegenerateApiKey: Function,
  onCreateApiKey: Function
})
const { apiKeys, apiKeyDetails, apiKeySecret, apiKeyError, onGetApiKeys, onGetActiveApiKeys, onGetRevokedApiKeys, onRevokeAllApiKeys, onGetApiKey, onRevokeApiKey, onRegenerateApiKey, onCreateApiKey } = props
const newKey = ref({ label: '', description: '' })
function handleCreateApiKey() {
  onCreateApiKey({ ...newKey.value })
  newKey.value = { label: '', description: '' }
}
</script>
<style scoped>
.api-keys-panel { padding: 1.2rem; }
.api-keys-actions { display: flex; gap: 0.7rem; margin-bottom: 1.2rem; }
.inline-form { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.2rem; }
input { background: #23262f; color: #e3eaff; border: 1px solid #23262f; border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.97rem; }
button { background: #23262f; color: #7ab7ff; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
button:hover, button:focus { background: #1a73e8; color: #fff; border: 1px solid #1a73e8; }
.api-key-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.api-key-list li { display: flex; align-items: center; background: #20222b; border: 1px solid #23262f; border-radius: 10px; box-shadow: 0 1px 6px #0002; padding: 0.7rem 1.1rem; cursor: pointer; transition: background 0.15s, border 0.15s, box-shadow 0.15s; margin: 0; }
.api-key-list li.selected { border-color: #1a73e8; background: #23262f; }
.api-key-label { font-size: 1.01rem; font-weight: 600; color: #fff; margin-right: 1.2rem; }
.api-key-status { font-size: 0.97em; margin-right: 1.2rem; }
.api-key-status.revoked { color: #ff6b6b; }
.revoke-btn, .regen-btn { margin-left: 0.5rem; background: #23262f; color: #ff6b6b; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
.revoke-btn:hover, .revoke-btn:focus, .regen-btn:hover, .regen-btn:focus { background: #ff6b6b; color: #fff; border: 1px solid #ff6b6b; }
.api-key-details-box { background: #20222b; border-radius: 10px; padding: 1rem; margin-top: 1rem; }
.api-key-secret-box { background: #181a20; border-radius: 10px; padding: 1rem; margin-top: 1rem; color: #00e676; }
pre { background: #23262f; color: #00e676; border-radius: 7px; padding: 0.5rem 0.7rem; font-size: 1.05em; margin: 0.2rem 0 0.2rem 0; font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace; box-shadow: 0 1px 6px #0001; overflow-x: auto; }
.error { color: #ff6b6b; margin-top: 1rem; }
</style> 