<!-- src/components/rule-flow/nodes/BracketNode.vue -->
<template>
  <div
    class="bracket-node"
    :class="{ 'opening': isOpening, 'closing': !isOpening, 'error': !isPaired }"
  >
    <div class="node-header">
      <span class="node-title">Bracket</span>
      <button @click="onRemove" class="remove-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="node-content">
      <span class="bracket-symbol">{{ isOpening ? '(' : ')' }}</span>
      <select v-model="localIsOpening" @change="handleUpdateNode" class="bracket-type">
        <option :value="true">Opening</option>
        <option :value="false">Closing</option>
      </select>
    </div>

    <!-- Use the correct handle syntax for brackets -->
    <div v-if="!isOpening" class="vue-flow__handle vue-flow__handle-top" data-type="target" data-handle-id="target"></div>
    <div v-if="isOpening" class="vue-flow__handle vue-flow__handle-bottom" data-type="source" data-handle-id="source"></div>
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

  // Correct updateNode usage
  updateNode(props.id, {
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
  width: 150px;
  padding: 12px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d6bcfa;
}

.node-title {
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
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
  padding: 6px 10px;
  border: 1px solid #d6bcfa;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  background-color: white;
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
