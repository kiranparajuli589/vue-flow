<template>
  <div class="rule-builder">
    <div class="rule-builder-header">
      <h1>{{ isEditing ? 'Edit Rule' : 'Create Rule' }}</h1>
      <div class="rule-name-input">
        <label>Rule Name</label>
        <input
          v-model="ruleName"
          @input="validateName"
          placeholder="Enter rule name"
          :class="{ 'error': nameError }"
        />
        <div v-if="nameError" class="error-message">{{ nameError }}</div>
      </div>
    </div>

    <div class="rule-builder-sections">
      <div class="section">
        <h2>Create Pattern</h2>
        <p>Define the conditions that will match this rule</p>

        <rule-flow-builder
          v-model="createPattern"
          :initial-rule="initialRule"
          @validate="flowValid = $event"
          @flow-change="handleFlowChange"
        />
      </div>

      <div class="section">
        <h2>Replace Pattern</h2>
        <p>Define how to modify matched requests</p>

        <div class="replace-pattern-tabs">
          <div
            class="tab"
            :class="{ 'active': replacePatternType === 'standard' }"
            @click="replacePatternType = 'standard'"
          >
            Standard
          </div>
          <div
            class="tab"
            :class="{ 'active': replacePatternType === 'parameters' }"
            @click="replacePatternType = 'parameters'"
          >
            Parameters
          </div>
        </div>

        <component
          :is="replacePatternComponent"
          v-model="replacePattern"
          @validate="replacePatternValid = $event"
        />
      </div>
    </div>

    <div class="rule-builder-actions">
      <button
        @click="saveRule"
        class="btn btn-primary"
        :disabled="!isValid"
      >
        {{ isEditing ? 'Update Rule' : 'Create Rule' }}
      </button>
      <button @click="resetForm" class="btn btn-secondary">
        Reset
      </button>
    </div>

    <div class="section">
      <h2>Rule Preview</h2>
      <p>Preview how your rule will look and the JSON payload</p>

      <rule-preview
        :create-pattern="createPattern"
        :replace-pattern="replacePattern"
        :replace-type="replacePatternType"
        :rule-name="ruleName"
        :nodes="flowNodes"
        :edges="flowEdges"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import RuleFlowBuilder from './rule-flow/RuleFlowBuilder.vue';
import StandardReplacePattern from './replace-pattern/StandardReplacePattern.vue';
import ParametersReplacePattern from './replace-pattern/ParametersReplacePattern.vue';
import RulePreview from './rule-flow/RulePreview.vue';
import { convertFlowToRuleFormat } from '@/utils/helpers';

// Props and emits
const props = defineProps<{
  initialRule?: any;
  meta?: any;
}>();

const emit = defineEmits(['submit', 'cancel']);

// State
const ruleName = ref('');
const nameError = ref('');
const createPattern = ref({ create_pattern: { conditions: [] }});
const replacePattern = ref({});
const replacePatternType = ref('standard');
const flowValid = ref(false);
const replacePatternValid = ref(false);

// Add state for flow data
const flowNodes = ref([]);
const flowEdges = ref([]);

function handleFlowChange(flowData: { nodes: any[], edges: any[] }) {
  flowNodes.value = flowData.nodes;
  flowEdges.value = flowData.edges;
}

// Computed
const isEditing = computed(() => !!props.initialRule && !!props.initialRule.id);

const replacePatternComponent = computed(() => {
  return replacePatternType.value === 'standard'
    ? StandardReplacePattern
    : ParametersReplacePattern;
});

const isValid = computed(() => {
  return !!ruleName.value && !nameError.value && flowValid.value && replacePatternValid.value;
});

const initialRule = computed(() => {
  if (!props.initialRule) return null;

  // Extract create pattern directly to avoid prop mismatch warnings
  return {
    create_pattern: props.initialRule.create_pattern
  };
});

// Methods
function validateName() {
  nameError.value = '';

  if (!ruleName.value) {
    nameError.value = 'Rule name is required';
    return false;
  }

  if (ruleName.value.length < 3) {
    nameError.value = 'Rule name must be at least 3 characters';
    return false;
  }

  return true;
}

function saveRule() {
  if (!isValid.value) return;

  // Prepare the final rule
  const rule = {
    name: ruleName.value,
    id: props.initialRule?.id,
    ...createPattern.value
  };

  // Add replace pattern based on type
  if (replacePatternType.value === 'standard') {
    rule.replace_pattern = replacePattern.value;
  } else {
    rule.parameters = replacePattern.value;
  }

  // Clean the rule for API submission
  const cleanedRule = convertFlowToRuleFormat(rule);

  // Add any metadata provided
  if (props.meta) {
    cleanedRule.meta = props.meta;
  }

  emit('submit', cleanedRule);
}

function resetForm() {
  // Confirm with the user before resetting
  if (confirm('Are you sure you want to reset the form? All changes will be lost.')) {
    if (props.initialRule) {
      // Reset to initial values if editing
      loadInitialRule();
    } else {
      // Clear form if creating new
      ruleName.value = '';
      createPattern.value = { create_pattern: { conditions: [] }};
      replacePattern.value = {};
      replacePatternType.value = 'standard';
    }
  }
}

function loadInitialRule() {
  if (!props.initialRule) return;

  ruleName.value = props.initialRule.name || '';

  // Load create pattern
  if (props.initialRule.create_pattern) {
    createPattern.value = {
      create_pattern: props.initialRule.create_pattern
    };
  }

  // Load replace pattern
  if (props.initialRule.replace_pattern) {
    replacePatternType.value = 'standard';
    replacePattern.value = props.initialRule.replace_pattern;
  } else if (props.initialRule.parameters) {
    replacePatternType.value = 'parameters';
    replacePattern.value = props.initialRule.parameters;
  }
}

// Initialize
onMounted(() => {
  loadInitialRule();
});
</script>

<style scoped>
.rule-builder {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rule-builder-header {
  margin-bottom: 24px;
}

.rule-builder-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2d3748;
}

.rule-name-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-name-input label {
  font-weight: 500;
  font-size: 14px;
  color: #4a5568;
}

.rule-name-input input {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  max-width: 400px;
}

.rule-name-input input.error {
  border-color: #f56565;
}

.error-message {
  color: #f56565;
  font-size: 12px;
  margin-top: 4px;
}

.rule-builder-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
}

.section p {
  color: #718096;
  margin-bottom: 24px;
}

.replace-pattern-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.tab {
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  color: #4a5568;
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
}

.rule-builder-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4299e1;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3182ce;
}

.btn-primary:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}
</style>
