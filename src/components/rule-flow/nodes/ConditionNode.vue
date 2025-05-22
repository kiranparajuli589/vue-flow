<!-- src/components/rule-flow/nodes/ConditionNode.vue -->
<template>
  <div v-if="isReady" class="condition-node" :class="{ 'error': !!nodeData.error }">
    <div class="node-header">
      <span class="node-title">Condition</span>
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

    <!-- Vue Flow handles with visual indicators -->
    <!-- Top handle - Flow input (simple connection) -->
    <Handle
      id="top"
      type="target"
      :position="Position.Top"
      :isConnectable="true"
      class="vf-handle flow-handle target-handle"
      :style="{ top: '-8px', left: '50%', transform: 'translateX(-50%)' }"
    />
    
    <!-- Bottom handle - Flow output (simple connection) -->
    <Handle
      id="bottom"
      type="source"
      :position="Position.Bottom"
      :isConnectable="true"
      class="vf-handle flow-handle source-handle"
      :style="{ bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }"
    />
    
    <!-- Left handle - Join input (join connection) -->
    <Handle
      id="left"
      type="target"
      :position="Position.Left"
      :isConnectable="true"
      class="vf-handle join-handle target-handle"
      :style="{ left: '-8px', top: '50%', transform: 'translateY(-50%)' }"
    />
    
    <!-- Right handle - Join output (join connection) -->
    <Handle
      id="right"
      type="source"
      :position="Position.Right"
      :isConnectable="true"
      class="vf-handle join-handle source-handle"
      :style="{ right: '-8px', top: '50%', transform: 'translateY(-50%)' }"
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

const emit = defineEmits(['nodeUpdate']);
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
  justify-content: center;
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

/* Enhanced handle styles with visual indicators */
.vf-handle {
  width: 16px !important;
  height: 16px !important;
  border: 2px solid white !important;
  border-radius: 50% !important;
  transition: all 0.2s ease;
  cursor: crosshair !important;
  position: absolute;
}

.vf-handle:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

/* Flow handles (top/bottom) - for simple connections */
.flow-handle {
  background-color: #4299e1 !important;
}

.flow-handle:hover {
  background-color: #2b6cb0 !important;
}

/* Join handles (left/right) - for join connections */
.join-handle {
  background-color: #48bb78 !important;
}

.join-handle:hover {
  background-color: #38a169 !important;
}

/* Simple CSS tooltips that don't flicker */
.flow-handle::before {
  content: 'Flow';
  position: absolute;
  background-color: #2d3748;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
}

.join-handle::before {
  content: 'AND/OR';
  position: absolute;
  background-color: #2d3748;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000;
  top: 50%;
  left: 120%;
  transform: translateY(-50%);
}

.vf-handle:hover::before {
  opacity: 1;
}
</style>