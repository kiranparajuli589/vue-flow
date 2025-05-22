<!-- src/components/rule-flow/nodes/BracketNode.vue -->
<template>
  <div
    class="bracket-node"
    :class="{ 'opening': isOpening, 'closing': !isOpening, 'error': !isPaired }"
  >
    <div class="node-header">
      <span class="node-title">{{ isOpening ? 'Opening Bracket' : 'Closing Bracket' }}</span>
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

    <!-- Vue Flow native handles -->
    <Handle
      v-if="!isOpening"
      type="target"
      :position="Position.Top"
      :isConnectable="isConnectable"
      class="vf-handle target-handle"
    />
    <Handle
      v-if="isOpening"
      type="source"
      :position="Position.Bottom"
      :isConnectable="isConnectable"
      class="vf-handle source-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useVueFlow, Position, Handle } from '@vue-flow/core';
import { BracketData, NodeType } from '@/types/rule-builder';

const props = defineProps<{
  id: string;
  data: BracketData;
  selected: boolean;
  type?: string;
  isConnectable?: boolean;
}>();

const emit = defineEmits(['nodeUpdate', 'nodeRemove']);
const { updateNode, getNodes } = useVueFlow();

// Local state
const localIsOpening = ref<boolean>(
  props.type === NodeType.BRACKET_OPEN ||
  (props.data && props.data.isOpening !== undefined ? props.data.isOpening : true)
);

const isConnectable = computed(() => props.isConnectable !== false);

// Computed properties
const isOpening = computed(() => localIsOpening.value);

const isPaired = computed(() => {
  const nodes = getNodes.value;
  const bracketNodes = nodes.filter(node =>
    node.type === NodeType.BRACKET_OPEN || node.type === NodeType.BRACKET_CLOSE
  );

  // Count opening and closing brackets
  const openingCount = bracketNodes.filter(node =>
    node.type === NodeType.BRACKET_OPEN || (node.type === 'bracket' && node.data.isOpening)
  ).length;

  const closingCount = bracketNodes.filter(node =>
    node.type === NodeType.BRACKET_CLOSE || (node.type === 'bracket' && !node.data.isOpening)
  ).length;

  return openingCount === closingCount;
});

function handleUpdateNode() {
  const updatedData: BracketData = {
    isOpening: localIsOpening.value,
    pairedNodeId: props.data.pairedNodeId
  };

  // Update node type based on bracket type
  const nodeType = localIsOpening.value ? NodeType.BRACKET_OPEN : NodeType.BRACKET_CLOSE;

  updateNode(props.id, {
    type: nodeType,
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
  // Set initial opening state based on props
  if (props.type === NodeType.BRACKET_OPEN) {
    localIsOpening.value = true;
  } else if (props.type === NodeType.BRACKET_CLOSE) {
    localIsOpening.value = false;
  } else if (props.data) {
    localIsOpening.value = props.data.isOpening;
  }
});

watch(() => props.data, (newData) => {
  if (newData) {
    localIsOpening.value = newData.isOpening;
  }
}, { deep: true });

watch(() => props.type, (newType) => {
  if (newType === NodeType.BRACKET_OPEN) {
    localIsOpening.value = true;
  } else if (newType === NodeType.BRACKET_CLOSE) {
    localIsOpening.value = false;
  }
});
</script>

<style scoped>
.bracket-node {
  background-color: white;
  border: 1px solid #d6bcfa;
  border-radius: 8px;
  width: 150px;
  padding: 12px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bracket-node.opening {
  border-left-width: 4px;
  border-left-color: #805ad5;
}

.bracket-node.closing {
  border-right-width: 4px;
  border-right-color: #805ad5;
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
  font-size: 28px;
  font-weight: bold;
  color: #805ad5;
  line-height: 1;
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

/* Enhanced handle styles */
.vf-handle {
  width: 16px !important;
  height: 16px !important;
  background-color: #805ad5 !important;
  border: 2px solid white !important;
  border-radius: 50% !important;
  transition: all 0.2s ease;
  cursor: crosshair !important;
}

.vf-handle:hover {
  transform: scale(1.2);
  background-color: #6b46c1 !important;
}

.target-handle {
  top: -8px;
}

.source-handle {
  bottom: -8px;
}
</style>
