<!-- src/components/rule-flow/nodes/ConditionNode.vue -->
<template>
  <div
    class="condition-node"
    :class="{ 'error': hasError }"
  >
    <div class="node-header">
      <div class="handle handle-target" v-handle-target />
      <span class="node-title">Condition</span>
      <button v-if="!isStartNode" @click="onRemove" class="remove-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="node-content">
      <div class="form-group">
        <label>Field</label>
        <select v-model="localData.field" @change="handleUpdate">
          <option v-for="field in fields" :key="field.value" :value="field.value">
            {{ field.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Operator</label>
        <select v-model="localData.operator" @change="handleUpdate">
          <option v-for="op in operators" :key="op.value" :value="op.value">
            {{ op.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Value</label>
        <input
          v-model="localData.value"
          @blur="validateAndUpdate"
          :placeholder="getFieldMeta.placeholder || 'Enter value'"
        />
        <div v-if="localData.error" class="error-text">
          {{ localData.error }}
        </div>
      </div>
    </div>

    <div class="handle handle-source" v-handle-source />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useVueFlow, NodeProps } from '@vue-flow/core';
import { ConditionData, FieldType, OperatorType, NodeType } from '@/types/rule-builder';
import { useConditionService } from '@/composables/useConditionService';

const props = defineProps<{
  id: string;
  data: ConditionData;
  selected: boolean;
}>();

const emit = defineEmits(['nodeUpdate', 'nodeRemove']);
const { updateNode } = useVueFlow();
const { fields, operators, validateField } = useConditionService();

const localData = ref<ConditionData>({
  field: props.data.field || FieldType.URI_PATH,
  operator: props.data.operator || OperatorType.EQUALS,
  value: props.data.value || '',
  error: props.data.error
});

const getFieldMeta = computed(() => {
  const field = fields.value.find(f => f.value === localData.value.field);
  return field?.meta || {};
});

const hasError = computed(() => {
  return !!localData.value.error;
});

const isStartNode = computed(() => {
  const { getNodes, getEdges } = useVueFlow();
  const nodes = getNodes.value;
  const edges = getEdges.value;

  // If this is the only node or it doesn't have any incoming edges, it's the start node
  return nodes.length === 1 || !edges.some(edge => edge.target === props.id);
});

function validateAndUpdate() {
  const fieldMeta = getFieldMeta.value;
  const error = validateField(localData.value.field, localData.value.value);

  localData.value.error = error;
  handleUpdate();
}

function handleUpdate() {
  const updatedData = { ...localData.value };
  updateNode({
    id: props.id,
    data: updatedData
  });
  emit('nodeUpdate', {
    id: props.id,
    data: updatedData
  });
}

function onRemove() {
  emit('nodeRemove', props.id);
}

// Initialize and keep in sync with props
onMounted(() => {
  localData.value = { ...props.data };
});

watch(() => props.data, (newData) => {
  localData.value = { ...newData };
}, { deep: true });
</script>

<style scoped>
.condition-node {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  width: 280px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.condition-node.error {
  border-color: #f56565;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-title {
  font-weight: 600;
  color: #4a5568;
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

.form-group select, .form-group input {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.error-text {
  color: #f56565;
  font-size: 12px;
  margin-top: 4px;
}

.handle {
  width: 12px;
  height: 12px;
  background-color: #4299e1;
  border-radius: 50%;
}

.handle-target {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.handle-source {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
