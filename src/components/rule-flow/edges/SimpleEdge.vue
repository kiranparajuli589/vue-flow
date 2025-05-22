<!-- src/components/rule-flow/edges/SimpleEdge.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { BaseEdge, getBezierPath } from '@vue-flow/core';

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

// Create the path
const edgePathData = computed(() => {
  return getBezierPath(edgePathParams.value);
});

const edgePath = computed(() => edgePathData.value[0]);
</script>

<template>
  <g>
    <!-- Main edge path with Vue Flow's built-in animation -->
    <BaseEdge
      :id="id"
      :path="edgePath"
      :marker-end="markerEnd"
      class="simple-edge"
      :class="{ selected, 'vue-flow__edge-animated': true }"
      :style="{
        stroke: '#6b7280',
        strokeWidth: selected ? 3 : 2,
        ...style
      }"
    />
    
    <!-- Invisible wider path for easier selection -->
    <path
      :d="edgePath"
      class="edge-interaction-path"
      fill="none"
      stroke="transparent"
      stroke-width="20"
    />
  </g>
</template>

<style scoped>
.simple-edge {
  cursor: pointer;
  transition: stroke-width 0.2s ease;
}

.simple-edge.selected {
  filter: drop-shadow(0 0 3px rgba(107, 114, 128, 0.5));
}

.edge-interaction-path {
  cursor: pointer;
}
</style>