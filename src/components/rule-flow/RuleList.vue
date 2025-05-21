<!-- src/components/rule-flow/RuleList.vue -->
<template>
  <div class="rule-list">
    <div class="toolbar">
      <button @click="$emit('create')" class="create-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Create Rule
      </button>

      <div class="search-container">
        <input
          v-model="searchQuery"
          @input="filterRules"
          placeholder="Search rules..."
          type="text"
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <div class="rules-table">
      <table>
        <thead>
        <tr>
          <th width="50">#</th>
          <th>Rule Name</th>
          <th width="80">Status</th>
          <th width="150">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(rule, index) in filteredRules" :key="rule.id">
          <td>{{ index + 1 }}</td>
          <td>{{ rule.name }}</td>
          <td>
            <div class="toggle-switch">
              <input
                :id="`toggle-${rule.id}`"
                type="checkbox"
                :checked="rule.enabled"
                @change="toggleStatus(rule, $event.target.checked)"
              />
              <label :for="`toggle-${rule.id}`"></label>
            </div>
          </td>
          <td>
            <div class="actions">
              <button @click="$emit('edit', rule)" class="edit-btn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
              <button @click="confirmDelete(rule)" class="delete-btn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="filteredRules.length === 0">
          <td colspan="4" class="empty-state">
            <div v-if="searchQuery" class="no-results">
              No rules match your search "{{ searchQuery }}"
            </div>
            <div v-else class="no-rules">
              No rules available. Create your first rule!
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  rules: any[];
  configKey: string;
}>();

const emit = defineEmits(['create', 'edit', 'delete', 'toggle-status']);

const searchQuery = ref('');
const filteredRules = ref([]);

// Methods
function filterRules() {
  if (!searchQuery.value) {
    filteredRules.value = [...props.rules];
    return;
  }

  const query = searchQuery.value.toLowerCase();
  filteredRules.value = props.rules.filter(rule =>
    rule.name.toLowerCase().includes(query)
  );
}

function clearSearch() {
  searchQuery.value = '';
  filterRules();
}

function toggleStatus(rule: any, status: boolean) {
  emit('toggle-status', rule, props.configKey, status);
}

function confirmDelete(rule: any) {
  if (confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
    emit('delete', rule, props.configKey);
  }
}

// Initialize and watch for changes
watch(() => props.rules, () => {
  filterRules();
}, { immediate: true, deep: true });
</script>

<style scoped>
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background-color: #3182ce;
}

.search-container {
  position: relative;
  max-width: 300px;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  padding-right: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
}

.clear-btn:hover {
  color: #718096;
}

.rules-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  font-weight: 600;
  color: #4a5568;
  background-color: #f7fafc;
}

tr:hover td {
  background-color: #f7fafc;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  transition: .4s;
  border-radius: 34px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: #4299e1;
}

.toggle-switch input:checked + label:before {
  transform: translateX(16px);
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background-color: #ebf8ff;
  color: #3182ce;
  border: 1px solid #bee3f8;
}

.edit-btn:hover {
  background-color: #bee3f8;
}

.delete-btn {
  background-color: #fff5f5;
  color: #e53e3e;
  border: 1px solid #fed7d7;
}

.delete-btn:hover {
  background-color: #fed7d7;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: #718096;
}

.no-results, .no-rules {
  font-style: italic;
}
</style>
