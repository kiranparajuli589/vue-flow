<!-- src/components/rule-flow/nodes/BracketNode.vue -->
<template>
  <div
    class="bracket-node"
    :class="{ 'opening': isOpening, 'closing': !isOpening, 'error': !isPaired }"
  >
    <div class="handle handle-target" v-if="!isOpening" v-handle-target />

    <div class="node-content">
      <span class="bracket-symbol">{{ isOpening ? '(' : ')' }}</span>
      <select v-model="localIsOpening" @change="handleUpdateNode" class="bracket-type">
        <option :value="true">Opening</option>
        <option :value="false">Closing</option>
      </select>
    </div>

    <div class="handle handle-source" v-if="isOpening" v-handle-source />

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
import { BracketData } from '@/types/rule-builder';

const props = defineProps<{
  id: string;
  data: BracketData;
  selected: boolean;
}>();

const emit = defineEmits(['nodeUpdate', 'nodeRemove']);
const { updateNode, getNodes } = useVueFlow();

const localIsOpening = ref<boolean>(props.data.isOpening);

const isOpening = computed(() => localIsOpening.value);

const isPaired = computed(() => {
  const nodes = getNodes.value;
  const bracketNodes = nodes.filter(node =>
    node.type === 'bracketOpen' || node.type === 'bracketClose'
  );

  // Count opening and closing brackets
  const openingCount = bracketNodes.filter(node =>
    node.type === 'bracketOpen' || (node.type === 'bracket' && node.data.isOpening)
  ).length;

  const closingCount = bracketNodes.filter(node =>
    node.type === 'bracketClose' || (node.type === 'bracket' && !node.data.isOpening)
  ).length;

  return openingCount === closingCount;
});

function handleUpdateNode() {
  const updatedData: BracketData = {
    isOpening: localIsOpening.value,
    pairedNodeId: props.data.pairedNodeId
  };

  updateNode({
    id: props.id,
    type: localIsOpening.value ? 'bracketOpen' : 'bracketClose',
    data: updatedData
  });

  emit('nodeUpdate', {
    id: props.id,
    data: updatedData
  });
}

function onRemove() {
  // If this bracket has a paired bracket, remove that one as well
  if (props.data.pairedNodeId) {
    emit('nodeRemove', props.data.pairedNodeId);
  }

  emit('nodeRemove', props.id);
}

// Initialize and keep in sync with props
onMounted(() => {
  localIsOpening.value = props.data.isOpening;
});

watch(() => props.data, (newData) => {
  localIsOpening.value = newData.isOpening;
}, { deep: true });
</script>

<style scoped>
.bracket-node {
  background-color: #faf5ff;
  border: 1px solid #d6bcfa;
  border-radius: 8px;
  width: 120px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 8px;
}

.bracket-node.opening {
  border-left-width: 4px;
}

.bracket-node.closing {
  border-right-width: 4px;
}

.bracket-node.error {
  border-color: #f56565;
  background-color: #fff5f5;
}

.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bracket-symbol {
  font-size: 24px;
  font-weight: bold;
  color: #805ad5;
}

.bracket-type {
  width: 100%;
  padding: 4px;
  border: 1px solid #d6bcfa;
  border-radius: 4px;
  font-size: 12px;
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
  background-color: #805ad5;
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
