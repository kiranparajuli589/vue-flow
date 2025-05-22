<script setup lang="ts">
import useDragAndDrop from '@/composables/useDragAndDrop'
import { NodeType } from '@/types/rule-builder'
const { onDragStart } = useDragAndDrop()
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar--container">
      <div class="sidebar-title">Rule Elements</div>

    <div
      class="dnd-item condition-item"
      draggable="true"
      @dragstart="onDragStart($event, NodeType.CONDITION)"
    >
      <img src="@/assets/icons/condition.svg" alt="Condition" class="icon" />
      <span>Condition</span>
    </div>

    <div
      class="dnd-item bracket-item"
      draggable="true"
      @dragstart="onDragStart($event, NodeType.BRACKET_OPEN)"
    >
      <img src="@/assets/icons/bracket.svg" alt="Bracket" class="icon" />
      <span>Bracket Open</span>
    </div>

    <div
      class="dnd-item bracket-item"
      draggable="true"
      @dragstart="onDragStart($event, NodeType.BRACKET_CLOSE)"
    >
      <img src="@/assets/icons/bracket.svg" alt="Bracket" class="icon" />
      <span>Bracket Close</span>
    </div>

    <div class="info-box">
      <div class="info-title">
        <img src="@/assets/icons/info.svg" alt="Info" class="info-icon" />
        <span>How to Join Nodes</span>
      </div>
      <p>
        Connect nodes by dragging from one handle to another. Click on the connection line to set AND/OR operators.
      </p>
    </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  flex-grow: 1;
  max-width: 220px;
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  z-index: 5;
  overflow-y: auto;
  height: 100%;
}

.sidebar--container {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 16px;
  color: #1a202c;
}

.dnd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dnd-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.dnd-item:active {
  cursor: grabbing;
}

.icon {
  width: 20px;
  height: 20px;
}

.condition-item {
  background-color: #ebf8ff;
  border-color: #90cdf4;
  color: #2b6cb0;
}

.bracket-item {
  background-color: #e6fffa;
  border-color: #81e6d9;
  color: #2c7a7b;
}

.info-box {
  margin-top: 24px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #bee3f8;
  border-radius: 4px;
  font-size: 13px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #3182ce;
}

.info-icon {
  width: 16px;
  height: 16px;
}

.info-box p {
  color: #4a5568;
  line-height: 1.4;
  margin: 0;
}
</style>
