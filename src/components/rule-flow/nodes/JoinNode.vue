<!-- src/components/rule-flow/nodes/JoinNode.vue -->
<template>
  <div
    class="join-node"
    :class="{ 'error': isInvalid }"
  >
    <div class="node-header">
      <span class="node-title">Join Operator</span>
      <button @click="onRemove" class="remove-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="node-content">
      <select v-model="localOperator" @change="handleUpdate">
        <option v-for="op in joinOperators" :key="op.value" :value="op.value">
          {{ op.label }}
        </option>
      </select>
    </div>

    <!-- Use the correct handle syntax as demonstrated in the Vue Flow example -->
    <div class="vue-flow__handle vue-flow__handle-top" data-type="target" data-handle-id="target"></div>
    <div class="vue-flow__handle vue-flow__handle-bottom" data-type="source" data-handle-id="source"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { JoinData, JoinOperatorType } from '@/types/rule-builder';
import { useConditionService } from '@/composables/useConditionService';

const props = defineProps<{
  id: string;
  data: JoinData;
  selected: boolean;
}>();

const emit = defineEmits(['nodeUpdate', 'nodeRemove']);
const { updateNode, getEdges } = useVueFlow();
const { joinOperators } = useConditionService();

const localOperator = ref<JoinOperatorType>(props.data.operator || JoinOperatorType.AND);

const isInvalid = computed(() => {
  const edges = getEdges.value;
  const incomingEdges = edges.filter(edge => edge.target === props.id);
  const outgoingEdges = edges.filter(edge => edge.source === props.id);

  // A join node is invalid if it doesn't have both incoming and outgoing edges
  return incomingEdges.length === 0 || outgoingEdges.length === 0;
});

function handleUpdate() {
  const updatedData: JoinData = {
    operator: localOperator.value
  };

  // Correct updateNode usage
  updateNode(props.id, {
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
  localOperator.value = props.data.operator || JoinOperatorType.AND;
});

watch(() => props.data, (newData) => {
  localOperator.value = newData.operator || JoinOperatorType.AND;
}, { deep: true });
</script>

<style scoped>
.join-node {
  background-color: #ebf8ff;
  border: 1px solid #63b3ed;
  border-radius: 8px;
  width: 180px; /* Rectangular design */
  padding: 12px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.join-node.error {
  border-color: #f56565;
  background-color: #fff5f5;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #bee3f8;
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
  justify-content: center;
  padding: 4px 0;
}

.join-node select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #63b3ed;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

/* Vue Flow handle styles */
.vue-flow__handle-top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
}

.vue-flow__handle-bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
}
</style>
