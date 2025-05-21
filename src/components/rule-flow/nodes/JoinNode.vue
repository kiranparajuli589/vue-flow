<!-- src/components/rule-flow/nodes/JoinNode.vue -->
<template>
  <div
    class="join-node"
    :class="{ 'error': isInvalid }"
  >
    <div class="handle handle-target" v-handle-target />

    <div class="node-content">
      <select v-model="localOperator" @change="handleUpdate">
        <option v-for="op in joinOperators" :key="op.value" :value="op.value">
          {{ op.label }}
        </option>
      </select>
    </div>

    <div class="handle handle-source" v-handle-source />

    <button @click="onRemove" class="remove-btn">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
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
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.join-node.error {
  border-color: #f56565;
  background-color: #fff5f5;
}

.node-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.join-node select {
  width: 80%;
  padding: 4px;
  border: 1px solid #63b3ed;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  background-color: white;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  color: #a0aec0;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 0;
}

.remove-btn:hover {
  color: #f56565;
  border-color: #f56565;
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
