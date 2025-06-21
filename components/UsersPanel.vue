<template>
  <section class="users-panel">
    <h2>Users</h2>
    <div class="users-actions">
      <button @click="onRefreshUsers">Refresh Users</button>
      <form @submit.prevent="handleCreateUser" class="inline-form">
        <input v-model="newUser.name" placeholder="Name" required />
        <input v-model="newUser.email" placeholder="Email" required />
        <input v-model="newUser.avatarUrl" placeholder="Avatar URL" />
        <button type="submit">Create</button>
      </form>
      <form @submit.prevent="handleGetUser" class="inline-form">
        <input v-model="searchUuid" placeholder="User UUID" required />
        <button type="submit">Find</button>
      </form>
    </div>
    <div v-if="loading" class="loading">Loading users...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <ul class="user-list" v-if="users.length">
      <li v-for="user in users" :key="user.uuid" :class="{selected: selectedUser && selectedUser.uuid === user.uuid}" @click="onSelectUser(user)">
        <img :src="user.avatarUrl" alt="avatar" class="avatar" />
        <div class="user-info">
          <span class="user-name">{{ user.name }}</span>
          <span class="email">{{ user.email }}</span>
        </div>
        <button class="delete-btn" @click.stop="onDeleteUser(user.uuid)">Delete</button>
      </li>
    </ul>
    <div v-if="selectedUser" class="user-edit-box">
      <h3>Edit User</h3>
      <form @submit.prevent="handleUpdateUser">
        <input v-model="editUser.name" placeholder="Name" required />
        <input v-model="editUser.email" placeholder="Email" required />
        <input v-model="editUser.avatarUrl" placeholder="Avatar URL" />
        <button type="submit">Update</button>
      </form>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps({
  users: Array,
  selectedUser: Object,
  onSelectUser: Function,
  onRefreshUsers: Function,
  onCreateUser: Function,
  onUpdateUser: Function,
  onDeleteUser: Function,
  onGetUser: Function,
  loading: Boolean,
  error: String
})
const { users, selectedUser, onSelectUser, onRefreshUsers, onCreateUser, onUpdateUser, onDeleteUser, onGetUser, loading, error } = props
const newUser = ref({ name: '', email: '', avatarUrl: '' })
const editUser = ref({ name: '', email: '', avatarUrl: '' })
const searchUuid = ref('')
watch(() => props.selectedUser, (val) => {
  if (val) editUser.value = { ...val }
})
function handleCreateUser() {
  onCreateUser({ ...newUser.value })
  newUser.value = { name: '', email: '', avatarUrl: '' }
}
function handleUpdateUser() {
  onUpdateUser({ ...editUser.value })
}
function handleGetUser() {
  onGetUser(searchUuid.value)
  searchUuid.value = ''
}
</script>
<style scoped>
.users-panel { padding: 1.2rem; }
.users-actions { display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1.2rem; }
.inline-form { display: flex; gap: 0.5rem; align-items: center; }
input { background: #23262f; color: #e3eaff; border: 1px solid #23262f; border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.97rem; }
button { background: #23262f; color: #7ab7ff; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
button:hover, button:focus { background: #1a73e8; color: #fff; border: 1px solid #1a73e8; }
.user-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.user-list li { display: flex; align-items: center; background: #20222b; border: 1px solid #23262f; border-radius: 10px; box-shadow: 0 1px 6px #0002; padding: 0.7rem 1.1rem; cursor: pointer; transition: background 0.15s, border 0.15s, box-shadow 0.15s; margin: 0; }
.user-list li.selected { border-color: #1a73e8; background: #23262f; }
.avatar { width: 38px; height: 38px; border-radius: 50%; margin-right: 1.1rem; border: 1.5px solid #1a73e8; background: #23262f; object-fit: cover; }
.user-info { display: flex; flex-direction: column; gap: 0.1rem; }
.user-name { font-size: 1.01rem; font-weight: 600; color: #fff; }
.email { color: #b3c7e6; font-size: 0.97em; margin-top: 0.1rem; }
.delete-btn { margin-left: auto; background: #23262f; color: #ff6b6b; border: 1px solid #23262f; border-radius: 7px; padding: 0.32rem 0.9rem; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s, border 0.15s; outline: none; }
.delete-btn:hover, .delete-btn:focus { background: #ff6b6b; color: #fff; border: 1px solid #ff6b6b; }
.user-edit-box { background: #20222b; border-radius: 10px; padding: 1rem; margin-top: 1rem; }
.loading { color: #7ab7ff; margin-top: 1rem; }
.error { color: #ff6b6b; margin-top: 1rem; }
</style> 