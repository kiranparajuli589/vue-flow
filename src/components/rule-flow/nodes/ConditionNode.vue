<!-- src/components/rule-flow/nodes/ConditionNode.vue -->
<template>
  <div v-if="isReady" class="condition-node" :class="{ 'error': !isValid, 'valid': isValid }">
    <div class="node-header">
      <span class="node-title">Condition</span>
      <!-- Validation status icon -->
      <div class="validation-status">
        <img v-if="isValid" src="@/assets/icons/check.svg" class="validation-icon valid-icon" />
        <img v-else src="@/assets/icons/exclamation.svg" class="validation-icon error-icon" />
      </div>
    </div>

    <!-- Show only general validation errors at the top -->
    <div v-if="generalErrors.length > 0" class="validation-errors">
      <div v-for="error in generalErrors" :key="error" class="error-item">
        <svg class="error-bullet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <div class="node-content">
      <div class="form-group">
        <label>Field <span class="required">*</span></label>
        <select 
          :value="nodeData.field" 
          @change="updateField($event)" 
          class="form-select"
          :class="{ 'error': fieldErrors.field }"
        >
          <option value="">Select field...</option>
          <option v-for="field in fields" :key="field.value" :value="field.value">
            {{ field.label }}
          </option>
        </select>
        <div v-if="fieldErrors.field" class="field-error">
          {{ fieldErrors.field }}
        </div>
      </div>

      <div class="form-group">
        <label>Operator <span class="required">*</span></label>
        <select 
          :value="nodeData.operator" 
          @change="updateOperator($event)" 
          class="form-select"
          :class="{ 'error': fieldErrors.operator }"
        >
          <option value="">Select operator...</option>
          <option v-for="op in operators" :key="op.value" :value="op.value">
            {{ op.label }}
          </option>
        </select>
        <div v-if="fieldErrors.operator" class="field-error">
          {{ fieldErrors.operator }}
        </div>
      </div>

      <div class="form-group">
        <label>Value <span class="required">*</span></label>
        <input
          :value="nodeData.value"
          @input="updateValue($event)"
          @blur="validateAndUpdate"
          :placeholder="fieldPlaceholder"
          class="form-input"
          :class="{ 'error': fieldErrors.value }"
        />
        <!-- Dynamic description based on selected field -->
        <div v-if="fieldDescription" class="field-description">
          {{ fieldDescription }}
        </div>
        <div v-if="fieldErrors.value" class="field-error">
          {{ fieldErrors.value }}
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
      :class="{ 'connected': hasTopConnection }"
      :style="{ top: '-8px', left: '50%', transform: 'translateX(-50%)' }"
    />
    
    <!-- Bottom handle - Flow output (simple connection) -->
    <Handle
      id="bottom"
      type="source"
      :position="Position.Bottom"
      :isConnectable="true"
      class="vf-handle flow-handle source-handle"
      :class="{ 'connected': hasBottomConnection }"
      :style="{ bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }"
    />
    
    <!-- Left handle - Join input (join connection) -->
    <Handle
      id="left"
      type="target"
      :position="Position.Left"
      :isConnectable="true"
      class="vf-handle join-handle target-handle"
      :class="{ 'connected': hasLeftConnection }"
      :style="{ left: '-8px', top: '50%', transform: 'translateY(-50%)' }"
    />
    
    <!-- Right handle - Join output (join connection) -->
    <Handle
      id="right"
      type="source"
      :position="Position.Right"
      :isConnectable="true"
      class="vf-handle join-handle source-handle"
      :class="{ 'connected': hasRightConnection }"
      :style="{ right: '-8px', top: '50%', transform: 'translateY(-50%)' }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
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
const { updateNode, getEdges } = useVueFlow();
const { fields, operators, validateField } = useConditionService();

// Initialize with default values
const nodeData = reactive({
  field: '',
  operator: '',
  value: '',
  error: null
});

// Connection status tracking
const hasTopConnection = ref(false);
const hasBottomConnection = ref(false);
const hasLeftConnection = ref(false);
const hasRightConnection = ref(false);

// Watch for edge changes to update connection status
watch(() => getEdges.value, (edges) => {
  hasTopConnection.value = edges.some(edge => edge.target === props.id && edge.targetHandle === 'top');
  hasBottomConnection.value = edges.some(edge => edge.source === props.id && edge.sourceHandle === 'bottom');
  hasLeftConnection.value = edges.some(edge => edge.target === props.id && edge.targetHandle === 'left');
  hasRightConnection.value = edges.some(edge => edge.source === props.id && edge.sourceHandle === 'right');
}, { deep: true, immediate: true });

// Comprehensive validation
const validationErrors = computed(() => {
  const errors = [];
  
  // Required field validations
  if (!nodeData.field) {
    errors.push('Field is required');
  }
  
  if (!nodeData.operator) {
    errors.push('Operator is required');
  }
  
  if (!nodeData.value) {
    errors.push('Value is required');
  }
  
  // Field-specific validation error
  if (nodeData.error) {
    errors.push(nodeData.error);
  }
  
  // Connection validation - at least one handle must be connected
  const hasAnyConnection = hasTopConnection.value || hasBottomConnection.value || 
                          hasLeftConnection.value || hasRightConnection.value;
  
  if (!hasAnyConnection) {
    errors.push('Node must be connected to at least one other node');
  }
  
  return errors;
});

// Overall validation status
const isValid = computed(() => {
  return validationErrors.value.length === 0;
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
    nodeData.field = props.data.field || '';
    nodeData.operator = props.data.operator || '';
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
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  width: 280px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
}

.condition-node.valid {
  border-color: #48bb78;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.2);
}

.condition-node.error {
  border-color: #f56565;
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.2);
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

.validation-status {
  display: flex;
  align-items: center;
}

.validation-icon {
  width: 20px;
  height: 20px;
}

.valid-icon {
  color: #48bb78;
}

.error-icon {
  color: #f56565;
}

.validation-errors {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 12px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #e53e3e;
  margin-bottom: 4px;
}

.error-item:last-child {
  margin-bottom: 0;
}

.error-bullet {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.required {
  color: #f56565;
  font-weight: bold;
}

.form-group select.error,
.form-group input.error {
  border-color: #f56565;
  background-color: #fff5f5;
}

.field-error {
  color: #f56565;
  font-size: 12px;
  margin-top: 4px;
}

.field-description {
  color: #718096;
  font-size: 11px;
  margin-top: 4px;
  font-style: italic;
}

/* Handle connection indicators */
.vf-handle.connected {
  background-color: #48bb78 !important;
  box-shadow: 0 0 8px rgba(72, 187, 120, 0.5);
}

.vf-handle.connected:hover {
  background-color: #38a169 !important;
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