<!-- src/components/rule-flow/nodes/ConditionNode.vue -->
<template>
  <div v-if="isReady" class="condition-node" :class="{ 'error': !!nodeData.error }">
    <div class="node-header">
      <span class="node-title">Condition</span>
      <button @click="onRemove" class="remove-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="node-content">
      <div class="form-group">
        <label>Field</label>
        <select :value="nodeData.field" @change="updateField($event)" class="form-select">
          <option v-for="field in fields" :key="field.value" :value="field.value">
            {{ field.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Operator</label>
        <select :value="nodeData.operator" @change="updateOperator($event)" class="form-select">
          <option v-for="op in operators" :key="op.value" :value="op.value">
            {{ op.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Value</label>
        <input
          :value="nodeData.value"
          @input="updateValue($event)"
          @blur="validateAndUpdate"
          :placeholder="fieldPlaceholder"
          class="form-input"
        />
        <div v-if="nodeData.error" class="error-text">
          {{ nodeData.error }}
        </div>
      </div>
    </div>

    <!-- Vue Flow native handles -->
    <Handle
      type="target"
      :position="Position.Top"
      :isConnectable="true"
      class="vf-handle target-handle"
    />
    <Handle
      type="source"
      :position="Position.Bottom"
      :isConnectable="true"
      class="vf-handle source-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useVueFlow, Position, Handle } from '@vue-flow/core';
import { FieldType, OperatorType } from '@/types/rule-builder';
import { useConditionService } from '@/composables/useConditionService';

// Flag to prevent rendering until ready
const isReady = ref(false);

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => null },
  selected: { type: Boolean, default: false }
});

const emit = defineEmits(['nodeUpdate', 'nodeRemove']);
const { updateNode } = useVueFlow();
const { fields, operators, validateField } = useConditionService();

// Initialize with default values
const nodeData = reactive({
  field: FieldType.URI_PATH,
  operator: OperatorType.EQUALS,
  value: '',
  error: null
});

// Computed placeholder for field
const fieldPlaceholder = computed(() => {
  const field = fields.value.find(f => f.value === nodeData.field);
  return field?.meta?.placeholder || 'Enter value';
});

// Direct update functions to avoid v-model issues
function updateField(event) {
  nodeData.field = event.target.value;
  handleUpdate();
}

function updateOperator(event) {
  nodeData.operator = event.target.value;
  handleUpdate();
}

function updateValue(event) {
  nodeData.value = event.target.value;
  handleUpdate();
}

// Update node data without validation
function handleUpdate() {
  updateNode(props.id, {
    data: {
      field: nodeData.field,
      operator: nodeData.operator,
      value: nodeData.value,
      error: nodeData.error
    }
  });

  emit('nodeUpdate', {
    id: props.id,
    data: {
      field: nodeData.field,
      operator: nodeData.operator,
      value: nodeData.value,
      error: nodeData.error
    }
  });
}

// Validate the value and update node
function validateAndUpdate() {
  const error = validateField(nodeData.field, nodeData.value);
  nodeData.error = error || null;
  handleUpdate();
}

function onRemove() {
  emit('nodeRemove', props.id);
}

// Initialize component with data if available
function initializeNodeData() {
  if (props.data) {
    nodeData.field = props.data.field || FieldType.URI_PATH;
    nodeData.operator = props.data.operator || OperatorType.EQUALS;
    nodeData.value = props.data.value || '';
    nodeData.error = props.data.error || null;
  }
  // Mark component as ready to render
  isReady.value = true;
}

// Initialize when mounted
onMounted(() => {
  // Initialize from props data
  initializeNodeData();
});
</script>

<style scoped>
.condition-node {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  width: 280px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.condition-node.error {
  border-color: #f56565;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.node-title {
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
}

.remove-btn {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
}

.remove-btn:hover {
  color: #f56565;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  color: #4a5568;
  font-weight: 500;
}

.form-select, .form-input {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.error-text {
  color: #f56565;
  font-size: 12px;
  margin-top: 4px;
}

/* Enhanced handle styles */
.vf-handle {
  width: 16px !important;
  height: 16px !important;
  background-color: #4299e1 !important;
  border: 2px solid white !important;
  border-radius: 50% !important;
  transition: all 0.2s ease;
  cursor: crosshair !important;
}

.vf-handle:hover {
  transform: scale(1.2);
  background-color: #2b6cb0 !important;
}

.target-handle {
  top: -8px;
}

.source-handle {
  bottom: -8px;
}
</style>
