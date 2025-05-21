<!-- src/views/RuleBuilderPage.vue -->
<template>
  <div class="rule-builder-page">
    <div class="page-header">
      <h1>Rule Builder</h1>
      <button @click="showRuleList = !showRuleList" class="toggle-btn">
        {{ showRuleList ? 'Create New Rule' : 'View Rules' }}
      </button>
    </div>

    <div v-if="showRuleList" class="rule-list-container">
      <h2>Existing Rules</h2>
      <rule-list
        :rules="rules"
        config-key="path"
        @create="createNewRule"
        @edit="editRule"
        @delete="deleteRule"
        @toggle-status="toggleRuleStatus"
      />
    </div>

    <div v-else class="rule-editor-container">
      <rule-builder
        :initial-rule="currentRule"
        :meta="{ configKey: 'path' }"
        @submit="saveRule"
        @cancel="cancelEdit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RuleList from '@/components/rule-flow/RuleList.vue';
import RuleBuilder from '@/components/RuleBuilder.vue';

// State
const rules = ref([]);
const showRuleList = ref(true);
const currentRule = ref(null);

// Methods
function createNewRule() {
  currentRule.value = null;
  showRuleList.value = false;
}

function editRule(rule) {
  currentRule.value = rule;
  showRuleList.value = false;
}

function saveRule(rule) {
  // Handle API save here
  // For demo, just update local array
  if (rule.id) {
    // Update existing rule
    const index = rules.value.findIndex(r => r.id === rule.id);
    if (index !== -1) {
      rules.value[index] = rule;
    }
  } else {
    // Add new rule with generated ID
    rule.id = `rule_${Date.now()}`;
    rules.value.push(rule);
  }

  showRuleList.value = true;
}

function deleteRule(rule) {
  // Handle API delete here
  // For demo, just update local array
  const index = rules.value.findIndex(r => r.id === rule.id);
  if (index !== -1) {
    rules.value.splice(index, 1);
  }
}

function toggleRuleStatus(rule, configKey, status) {
  // Handle API update here
  // For demo, just update local array
  const index = rules.value.findIndex(r => r.id === rule.id);
  if (index !== -1) {
    rules.value[index].enabled = status;
  }
}

function cancelEdit() {
  showRuleList.value = true;
}
</script>

<!-- Continuing src/views/RuleBuilderPage.vue -->
<style scoped>
.rule-builder-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
}

.toggle-btn {
  padding: 10px 20px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background-color: #3182ce;
}

.rule-list-container, .rule-editor-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.rule-list-container h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
}
</style>
