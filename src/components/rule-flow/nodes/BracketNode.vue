<script setup lang="ts">
import { computed, inject } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => null },
  selected: { type: Boolean, default: false },
  isOpening: { type: Boolean, required: true }
});

// Inject root node management
const rootNodeManager = inject('rootNodeManager', {
  isRootNode: () => false,
  setRootNode: () => {},
  moveNodeToTop: () => {}
});

// Root node status
const isRootNode = computed(() => rootNodeManager.isRootNode(props.id));

// Root node toggle
function toggleRootNode() {
  if (isRootNode.value) {
    // Cannot uncheck if already root - there must be a root
    return;
  }
  rootNodeManager.setRootNode(props.id);
  rootNodeManager.moveNodeToTop(props.id);
}
</script>

<template>
    <div class="bracket-node">
        <div class="node-header">
            <div class="header-left">
                <input
                    type="checkbox"
                    :checked="isRootNode"
                    @change="toggleRootNode"
                    class="root-checkbox"
                    :id="`root-${id}`"
                />
                <label :for="`root-${id}`" class="root-label">Root</label>
                <span class="node-title">{{ isOpening ? 'Opening' : 'Closing' }} Bracket</span>
            </div>
        </div>

        <div class="node-content">
            <span class="bracket-symbol">
                {{ isOpening ? '(' : ')' }}
            </span>
        </div>

        <!-- Only two handles: one target (top) and one source (bottom) -->
        <!-- Target handle - Input -->
        <Handle
            id="target"
            type="target"
            :position="Position.Top"
            :isConnectable="true"
            class="vf-handle target-handle"
            :style="{ top: '-8px', left: '50%', transform: 'translateX(-50%)' }"
        />

        <!-- Source handle - Output -->
        <Handle
            id="source"
            type="source"
            :position="Position.Bottom"
            :isConnectable="true"
            class="vf-handle source-handle"
            :style="{ bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }"
        />
    </div>
</template>

<style scoped>
.bracket-node {
    background-color: white;
    border: 1px solid #d6bcfa;
    border-radius: 8px;
    width: 180px;
    padding: 12px;
    position: relative;
}

.node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.root-checkbox {
    width: 14px;
    height: 14px;
    margin: 0;
}

.root-label {
    font-size: 11px;
    color: #718096;
    font-weight: 500;
    margin: 0;
    cursor: pointer;
}

.node-title {
    font-weight: 600;
    color: #805ad5;
    font-size: 14px;
}

.node-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 40px;
}

.bracket-symbol {
    font-size: 28px;
    font-weight: bold;
    color: #805ad5;
}

/* Simple handle styles */
.vf-handle {
    width: 16px !important;
    height: 16px !important;
    border: 2px solid white !important;
    border-radius: 50% !important;
    transition: all 0.2s ease;
    cursor: crosshair !important;
    position: absolute;
    background-color: #805ad5 !important;
}

.vf-handle:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    background-color: #6b46c1 !important;
}

/* Simple tooltips */
.target-handle::before {
    content: 'Input';
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

.source-handle::before {
    content: 'Output';
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
    top: 120%;
    left: 50%;
    transform: translateX(-50%);
}

.vf-handle:hover::before {
    opacity: 1;
}
</style>