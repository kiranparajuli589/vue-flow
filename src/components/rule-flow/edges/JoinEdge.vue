<!-- src/components/rule-flow/edges/JoinEdge.vue -->
<template>
  <BaseEdge
    :id="id"
    :path="edgePath"
    :marker-end="markerEnd"
    class="join-edge"
    :class="{ selected }"
    @click="onEdgeClick"
  >
    <!-- Edge background to make clicking easier -->
    <path
      :d="edgePath"
      class="edge-interaction-path"
      @click="onEdgeClick"
    />

    <!-- Edge label -->
    <EdgeLabelRenderer>
      <div
        class="edge-label-container"
        :style="labelPositionStyle"
        @click.stop="showSelectMenu = !showSelectMenu"
      >
        <!-- Display select menu when active -->
        <select
          v-if="showSelectMenu"
          v-model="currentOperator"
          class="operator-select"
          @change="updateOperator"
          @blur="showSelectMenu = false"
          ref="selectRef"
          @click.stop
        >
          <option :value="JoinOperatorType.AND">AND</option>
          <option :value="JoinOperatorType.OR">OR</option>
        </select>

        <!-- Display current operator when not editing -->
        <div v-else class="edge-label">
          {{ edgeLabel }}
        </div>
      </div>
    </EdgeLabelRenderer>
  </BaseEdge>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core';
import { JoinOperatorType } from '@/types/rule-builder';

// Props
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  sourceX: {
    type: Number,
    required: true,
  },
  sourceY: {
    type: Number,
    required: true,
  },
  targetX: {
    type: Number,
    required: true,
  },
  targetY: {
    type: Number,
    required: true,
  },
  sourcePosition: {
    type: String,
    required: false,
  },
  targetPosition: {
    type: String,
    required: false,
  },
  data: {
    type: Object,
    required: false,
    default: () => ({ operator: JoinOperatorType.AND }),
  },
  markerEnd: {
    type: String,
    required: false,
  },
  selected: {
    type: Boolean,
    required: false,
  },
  style: {
    type: Object,
    required: false,
  },
});

// Get Vue Flow utilities
const { updateEdge } = useVueFlow();

// Local state
const showSelectMenu = ref(false);
const currentOperator = ref(props.data?.operator || JoinOperatorType.AND);
const selectRef = ref<HTMLSelectElement | null>(null);

// Compute path for the edge
const edgePathParams = computed(() => {
  return {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  };
});

// Create the path and label position
const edgePathData = computed(() => {
  return getBezierPath(edgePathParams.value);
});

const edgePath = computed(() => edgePathData.value[0]);
const labelX = computed(() => edgePathData.value[1]);
const labelY = computed(() => edgePathData.value[2]);

// Label position style
const labelPositionStyle = computed(() => {
  return {
    transform: `translate(-50%, -50%) translate(${labelX.value}px, ${labelY.value}px)`,
  };
});

// Edge label
const edgeLabel = computed(() => {
  return currentOperator.value === JoinOperatorType.AND ? 'AND' : 'OR';
});

// Watch for data changes
watch(() => props.data, (newData) => {
  if (newData && newData.operator) {
    currentOperator.value = newData.operator;
  }
}, { deep: true });

// Update operator when select changes
function updateOperator() {
  updateEdge(props.id, {
    data: { operator: currentOperator.value },
    label: currentOperator.value,
  });
  showSelectMenu.value = false;
}

// Focus select element when it appears
watch(showSelectMenu, (show) => {
  if (show) {
    nextTick(() => {
      if (selectRef.value) {
        selectRef.value.focus();
      }
    });
  }
});

// Handle edge click
function onEdgeClick(event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault();

  // Toggle select menu
  showSelectMenu.value = !showSelectMenu.value;
}
</script>

<style>
.join-edge {
  stroke: #4299e1;
  stroke-width: 2;
  cursor: pointer;
}

.join-edge.selected {
  stroke: #805ad5;
  stroke-width: 3;
}

/* Wider invisible path for easier interaction */
.edge-interaction-path {
  stroke: transparent;
  stroke-width: 15;
  cursor: pointer;
  pointer-events: all;
  fill: none;
}

.edge-label-container {
  pointer-events: all;
  cursor: pointer;
  position: absolute;
  font-size: 12px;
  background-color: #f0f9ff;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid #bee3f8;
  white-space: nowrap;
  z-index: 1000;
  transition: all 0.2s ease;
  user-select: none;
}

.edge-label-container:hover {
  background-color: #ebf8ff;
  transform: scale(1.05);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.edge-label {
  font-weight: 600;
  color: #4299e1;
}

/* Operator select style */
.operator-select {
  background-color: white;
  border: 1px solid #4299e1;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
  color: #4299e1;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  min-width: 70px;
}

.operator-select:focus {
  border-color: #3182ce;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.3);
}
</style>
