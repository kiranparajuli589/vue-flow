<!-- src/components/rule-flow/RuleFlowBuilder.vue -->
<template>
  <div class="rule-flow-builder">
    <FlowSidebar :on-drag-start="onDragStart" />

    <div class="flow-container">
      <vue-flow
        v-model="elements"
        @dragover="onDragOver"
        @dragLeave="onDragLeave"
      >
        <DropzoneBackground
          :style="{
          backgroundColor: isDragOver ? '#e7f3ff' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
        >
          <p v-if="isDragOver">Drop here</p>
        </DropzoneBackground>
      </vue-flow>
    </div>
  </div>

  <div class="preview-panel">
    <h3>Rule Preview</h3>
    <div class="preview-content">
      <rule-preview :elements="elements" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import {
  VueFlow, useVueFlow,
} from '@vue-flow/core';
import { FieldType, OperatorType, JoinOperatorType, NodeType } from '@/types/rule-builder';
import RulePreview from './RulePreview.vue';
import { useDragAndDrop } from '@/composables/useDragAndDrop';
import FlowSidebar from '@/components/rule-flow/FlowSidebar.vue'
import DropzoneBackground from '@/components/rule-flow/DropzoneBackground.vue'

const props = defineProps<{
  initialRule?: any; // Initial rule data (if importing)
  modelValue?: any; // v-model support
}>();

const emit = defineEmits(['update:rule', 'validate', 'update:modelValue']);

// Setup vue-flow
const elements = ref<any[]>([]);
const {
  onConnect,
  addEdges,
  getNodes,
  getEdges,
  findNode,
  addNodes,
} = useVueFlow();

// Set up drag and drop
const {
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
} = useDragAndDrop();

onConnect((params) => {
  console.log('Connection created:', params);
  addEdges([
    {
      ...params,
      animated: false,
      style: { stroke: '#4299e1', strokeWidth: 2 },
    },
  ]);

  // Update the rule after a new connection
  updateRule();
});

function convertFlowToRule() {
  const nodes = getNodes.value;
  const edges = getEdges.value;

  // Skip if there are no nodes
  if (nodes.length === 0) {
    return {
      create_pattern: {
        conditions: []
      }
    };
  }

  // Find the starting node (node with no incoming edges)
  let startNodeId = nodes.find(node =>
    !edges.some(edge => edge.target === node.id)
  )?.id;

  // If no clear start node, just pick the first one
  if (!startNodeId && nodes.length > 0) {
    startNodeId = nodes[0].id;
  }

  // Store positions for re-importing later
  const positions = nodes.reduce((acc, node) => {
    acc[node.id] = { x: node.position.x, y: node.position.y };
    return acc;
  }, {});

  // Build the rule structure by traversing the flow
  const conditions = buildConditionsArray(startNodeId);

  return {
    create_pattern: {
      conditions,
      positions
    }
  };
}

// Recursive function to build the conditions array
function buildConditionsArray(nodeId: string, visitedNodes = new Set()) {
  if (!nodeId || visitedNodes.has(nodeId)) return [];

  visitedNodes.add(nodeId);
  const node = findNode(nodeId);
  if (!node) return [];

  const edges = getEdges.value;
  const outgoingEdges = edges.filter(edge => edge.source === nodeId);
  const conditions = [];

  switch (node.type) {
    case NodeType.CONDITION:
      // Add this condition
      conditions.push({
        field: node.data.field,
        operator: node.data.operator,
        value: node.data.value,
        isGroup: false
      });

      // If there's an outgoing edge, follow it
      if (outgoingEdges.length > 0) {
        const nextNodeId = outgoingEdges[0].target;
        const nextNode = findNode(nextNodeId);

        if (nextNode && nextNode.type === NodeType.JOIN) {
          // Add join operator to the condition
          conditions[0].joinOperator = nextNode.data.operator;

          // Follow nodes after the join
          const joinOutgoingEdges = edges.filter(edge => edge.source === nextNodeId);

          if (joinOutgoingEdges.length > 0) {
            const afterJoinNodeId = joinOutgoingEdges[0].target;
            const afterJoinConditions = buildConditionsArray(afterJoinNodeId, visitedNodes);

            // Add conditions after the join
            conditions.push(...afterJoinConditions);
          }
        }
      }
      break;

    case NodeType.BRACKET_OPEN:
      // Find the matching closing bracket by following the connections
      let currentNodeId = nodeId;
      let bracketContent = [];
      let depth = 1;

      while (depth > 0 && outgoingEdges.length > 0) {
        const nextNodeId = outgoingEdges[0].target;
        const nextNode = findNode(nextNodeId);

        if (!nextNode) break;

        if (nextNode.type === NodeType.BRACKET_OPEN) {
          depth++;
        } else if (nextNode.type === NodeType.BRACKET_CLOSE) {
          depth--;

          if (depth === 0) {
            // We found the matching closing bracket
            break;
          }
        } else {
          // Process the node inside the brackets
          const innerConditions = buildConditionsArray(nextNodeId, new Set([...visitedNodes]));
          bracketContent.push(...innerConditions);
        }

        currentNodeId = nextNodeId;
        outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      }

      // If we have bracket content, create a group
      if (bracketContent.length > 0) {
        const joinOperator = bracketContent.length > 1 ?
          bracketContent[0].joinOperator || JoinOperatorType.AND :
          JoinOperatorType.AND;

        conditions.push({
          isGroup: true,
          joinOperator,
          conditions: bracketContent
        });

        // If there's a join after the closing bracket, follow it
        const closingBracketEdges = edges.filter(edge =>
          edge.source === currentNodeId && edge.target !== nodeId
        );

        if (closingBracketEdges.length > 0) {
          const joinNodeId = closingBracketEdges[0].target;
          const joinNode = findNode(joinNodeId);

          if (joinNode && joinNode.type === NodeType.JOIN) {
            // Add join operator to the group
            conditions[conditions.length - 1].joinOperator = joinNode.data.operator;

            // Follow nodes after the join
            const afterJoinEdges = edges.filter(edge => edge.source === joinNodeId);

            if (afterJoinEdges.length > 0) {
              const afterJoinNodeId = afterJoinEdges[0].target;
              const afterJoinConditions = buildConditionsArray(afterJoinNodeId, visitedNodes);

              // Add conditions after the join
              conditions.push(...afterJoinConditions);
            }
          }
        }
      }
      break;
  }

  return conditions;
}

// Update the rule when the flow changes
function updateRule() {
  const rule = convertFlowToRule();

  // Update v-model if provided
  if (props.modelValue !== undefined) {
    emit('update:modelValue', rule);
  }

  emit('update:rule', rule);

  // Validate the rule
  const isValid = validateRule(rule);
  emit('validate', isValid);
}

// Basic validation of the rule
function validateRule(rule: any) {
  if (!rule.create_pattern || !rule.create_pattern.conditions) {
    return false;
  }

  // Must have at least one condition
  if (rule.create_pattern.conditions.length === 0) {
    return false;
  }

  // Check for any error in condition nodes
  const hasConditionError = getNodes.value
    .filter(node => node.type === NodeType.CONDITION)
    .some(node => node.data.error);

  if (hasConditionError) {
    return false;
  }

  // Check bracket pairing
  const bracketOpenCount = getNodes.value
    .filter(node => node.type === NodeType.BRACKET_OPEN).length;
  const bracketCloseCount = getNodes.value
    .filter(node => node.type === NodeType.BRACKET_CLOSE).length;

  if (bracketOpenCount !== bracketCloseCount) {
    return false;
  }

  // Additional validation rules can be added here

  return true;
}

// Import an existing rule into the flow
function importRule(rule: any) {
  if (!rule || !rule.create_pattern || !rule.create_pattern.conditions) {
    return;
  }

  // Clear existing elements
  elements.value = [];

  // Extract saved positions if available
  const positions = rule.create_pattern.positions || {};

  // Create nodes and edges from the rule structure
  createNodesFromConditions(rule.create_pattern.conditions, positions);
}

// Initialize
onMounted(() => {
  // Register connection handlers

  // Initialize with any provided rule
  if (props.initialRule) {
    importRule(props.initialRule);
  } else {
    // Start with a single condition node
    addNodes([{
      id: 'start-condition',
      type: NodeType.CONDITION,
      position: { x: 250, y: 100 },
      data: {
        field: FieldType.URI_PATH,
        operator: OperatorType.EQUALS,
        value: ''
      },
    }]);
  }

  // Log initial state for debugging
  setTimeout(() => {
    console.log('Initial nodes:', getNodes.value);
    console.log('Initial edges:', getEdges.value);
  }, 500);
});

// Watch for changes to the initialRule prop
watch(() => props.initialRule, (newValue) => {
  if (newValue) {
    importRule(newValue);
  }
}, { deep: true });

// Watch for external v-model changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && JSON.stringify(newValue) !== JSON.stringify(convertFlowToRule())) {
    importRule(newValue);
  }
}, { deep: true });
</script>

<style>
.rule-flow-builder {
  display: flex;
  height: 600px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 16px;
  z-index: 5;
}

.sidebar-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 16px;
  color: #1a202c;
}

.dnd-item {
  padding: 12px;
  margin-bottom: 12px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}

.condition-item {
  background-color: #ebf8ff;
  border-color: #90cdf4;
  color: #2b6cb0;
}

.join-item {
  background-color: #faf5ff;
  border-color: #d6bcfa;
  color: #6b46c1;
}

.bracket-item {
  background-color: #e6fffa;
  border-color: #81e6d9;
  color: #2c7a7b;
}

.flow-container {
  flex-grow: 1;
  height: 100%;
  position: relative;
}

.preview-panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

/* Fix node sizes */
.vue-flow__node-condition {
  width: fit-content;
}

/* Vue Flow handle styles */
.vue-flow__handle {
  width: 12px !important;
  height: 12px !important;
  background-color: #4299e1 !important;
  border: 2px solid white !important;
  border-radius: 50% !important;
}

.vue-flow__handle:hover {
  background-color: #2b6cb0 !important;
}

/* Edge styles */
.vue-flow__edge path {
  stroke: #4299e1;
  stroke-width: 2;
}

.vue-flow__edge.selected path {
  stroke: #805ad5;
  stroke-width: 3;
}

.vue-flow__connection-path {
  stroke: #4299e1;
  stroke-width: 2;
}

.vue-flow__edge-text {
  font-size: 12px;
}
</style>
