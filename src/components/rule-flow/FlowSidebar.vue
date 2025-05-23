<script setup lang="ts">
import useDragAndDrop from '@/composables/useDragAndDrop'
import { useRuleTemplates } from '@/composables/useRuleTemplates'
import { NodeType } from '@/types/rule-builder'

const { onDragStart } = useDragAndDrop()
const { getTemplates } = useRuleTemplates()

const templates = getTemplates()
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar--container">
      <div class="sidebar-title">Rule Elements</div>

      <!-- Basic Elements -->
      <div class="section">
        <div class="section-header">Basic Elements</div>

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
          @dragstart="onDragStart($event, 'bracket-pair')"
        >
          <img src="@/assets/icons/bracket.svg" alt="Bracket" class="icon" />
          <span>Bracket Pair</span>
        </div>
      </div>

      <!-- Templates -->
      <div class="section">
        <div class="section-header">Templates</div>

        <div
          v-for="template in templates"
          :key="template.id"
          class="dnd-item template-item"
          draggable="true"
          @dragstart="onDragStart($event, `template:${template.id}`)"
          :title="template.description"
        >
          <span class="template-icon">{{ template.icon }}</span>
          <div class="template-info">
            <div class="template-name">{{ template.name }}</div>
            <div class="template-desc">{{ template.description }}</div>
          </div>
        </div>
      </div>

      <div class="info-box">
        <div class="info-title">
          <img src="@/assets/icons/info.svg" alt="Info" class="info-icon" />
          <span>How to Use</span>
        </div>
        <p>
          <strong>Condition:</strong> Add individual conditions<br>
          <strong>Bracket Pair:</strong> Creates both opening and closing brackets<br>
          <strong>Templates:</strong> Pre-built common patterns<br>
          <strong>Root Node:</strong> Check the checkbox to set as starting point<br>
          <strong>Connections:</strong> Drag from handles to connect nodes
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

.section {
  margin-bottom: 20px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.dnd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 8px;
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
  flex-shrink: 0;
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

.template-item {
  background-color: #fef5e7;
  border-color: #f6cc8f;
  color: #c05621;
  align-items: flex-start;
  padding: 10px 12px;
}

.template-item:hover {
  background-color: #fed7aa;
}

.template-icon {
  font-size: 18px;
  margin-top: 2px;
  flex-shrink: 0;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.template-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.template-desc {
  font-size: 11px;
  color: #92400e;
  line-height: 1.3;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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