<!-- src/components/rule-flow/RuleFlowBuilder.vue -->
<template>
  <div class="rule-flow-builder">
    <div class="sidebar">
      <div class="sidebar-title">Rule Elements</div>
      <div
        class="dnd-item condition-item"
        draggable="true"
        @dragstart="onDragStart($event, 'condition')"
      >
        Condition
      </div>
      <div
        class="dnd-item join-item"
        draggable="true"
        @dragstart="onDragStart($event, 'join')"
      >
        Join (AND/OR)
      </div>
      <div
        class="dnd-item bracket-item"
        draggable="true"
        @dragstart="onDragStart($event, 'bracket')"
      >
        Bracket
      </div>
    </div>

    <div class="flow-container">
      <vue-flow
        v-model="elements"
        @drop="onDrop"
        @dragover="onDragOver"
        @connect="handleConnect"
        @node-drag-stop="onNodeDragStop"
        @pane-click="onPaneClick"
        @edge-update="onEdgeUpdate"
        @edge-update-end="onEdgeUpdateEnd"
        @edge-update-start="onEdgeUpdateStart"
      >
        <template #node-condition="nodeProps">
          <condition-node
            v-bind="nodeProps"
            @node-update="onNodeUpdate"
            @node-remove="onNodeRemove"
          />
        </template>

        <template #node-join="nodeProps">
          <join-node
            v-bind="nodeProps"
            @node-update="onNodeUpdate"
            @node-remove="onNodeRemove"
          />
        </template>

        <template #node-bracketOpen="nodeProps">
          <bracket-node
            v-bind="nodeProps"
            @node-update="onNodeUpdate"
            @node-remove="onNodeRemove"
          />
        </template>

        <template #node-bracketClose="nodeProps">
          <bracket-node
            v-bind="nodeProps"
            @node-update="onNodeUpdate"
            @node-remove="onNodeRemove"
          />
        </template>

        <template #edge-default="{ id, source, target, selected }">
          <base-edge
            :id="id"
            :source="source"
            :target="target"
            :selected="selected"
            :markerEnd="{ type: 'arrow', width: 20, height: 20 }"
          />
        </template>

        <background />
        <controls />
        <mini-map />
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
import { ref, onMounted } from 'vue';
import {
  VueFlow, useVueFlow,
  NodeMouseEvent, Connection, Edge, BaseEdge
} from '@vue-flow/core';
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';

import { FieldType, OperatorType, JoinOperatorType, NodeType } from '@/types/rule-builder';
import ConditionNode from './nodes/ConditionNode.vue';
import JoinNode from './nodes/JoinNode.vue';
import BracketNode from './nodes/BracketNode.vue';
import RulePreview from './RulePreview.vue';
import { generateUniqueId } from '@/utils/helpers';

// Props and emits
const props = defineProps<{
  initialRule?: any; // Initial rule data (if importing)
}>();

const emit = defineEmits(['update:rule', 'validate']);

// Setup vue-flow
const elements = ref([]);
const {
  addNodes,
  addEdges,
  getNodes,
  getEdges,
  findNode
} = useVueFlow();

// Methods for drag & drop
function onDragStart(event: DragEvent, type: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', type);
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onDragOver(event: DragEvent) {
  if (event.preventDefault) {
    event.preventDefault();
  }

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  return false;
}

function onDrop(event: DragEvent) {
  if (!event.dataTransfer) return;

  const type = event.dataTransfer.getData('application/vueflow');
  const vueFlowBounds = event.target.getBoundingClientRect();
  const position = {
    x: event.clientX - vueFlowBounds.left,
    y: event.clientY - vueFlowBounds.top,
  };

  createNode(type, position);
}

function createNode(type: string, position = { x: 0, y: 0 }) {
  const id = generateUniqueId();
  let nodeType: NodeType;
  let nodeData: any = {};

  switch (type) {
    case 'condition':
      nodeType = NodeType.CONDITION;
      nodeData = {
        field: FieldType.URI_PATH,
        operator: OperatorType.EQUALS,
        value: ''
      };
      break;
    case 'join':
      nodeType = NodeType.JOIN;
      nodeData = {
        operator: JoinOperatorType.AND
      };
      break;
    case 'bracket':
      nodeType = NodeType.BRACKET_OPEN;
      nodeData = {
        isOpening: true
      };
      break;
    default:
      return;
  }

  const newNode = {
    id,
    type: nodeType,
    position,
    data: nodeData,
    draggable: true
  };

  addNodes([newNode]);

  // Auto-connect to the last node if applicable
  autoConnectNodes(id);

  updateRule();
}

function autoConnectNodes(newNodeId: string) {
  const nodes = getNodes.value;
  const edges = getEdges.value;

  // Skip if there's only one node
  if (nodes.length <= 1) return;

  // Find nodes without outgoing connections
  const terminatingNodes = nodes.filter(node => {
    return !edges.some(edge => edge.source === node.id) && node.id !== newNodeId;
  });

  if (terminatingNodes.length === 1) {
    const source = terminatingNodes[0].id;
    const target = newNodeId;

    // Only connect if valid connection type
    if (isValidConnection(source, target)) {
      addEdges([{
        id: `e-${source}-${target}`,
        source,
        target,
        type: 'default',
        animated: false
      }]);
    }
  }
}

function isValidConnection(source: string, target: string) {
  const sourceNode = findNode(source);
  const targetNode = findNode(target);

  if (!sourceNode || !targetNode) return false;

  // Condition can only connect to Join
  if (sourceNode.type === NodeType.CONDITION && targetNode.type !== NodeType.JOIN) {
    return false;
  }

  // Join can connect to Condition or Bracket
  if (sourceNode.type === NodeType.JOIN &&
    (targetNode.type !== NodeType.CONDITION &&
      targetNode.type !== NodeType.BRACKET_OPEN)) {
    return false;
  }

  // Opening Bracket can connect to Condition or Join
  if (sourceNode.type === NodeType.BRACKET_OPEN &&
    (targetNode.type !== NodeType.CONDITION &&
      targetNode.type !== NodeType.JOIN)) {
    return false;
  }

  // Closing Bracket can't have outgoing connections
  if (sourceNode.type === NodeType.BRACKET_CLOSE) {
    return false;
  }

  return true;
}

function handleConnect(connection: Connection) {
  // Check if the connection is valid
  if (isValidConnection(connection.source, connection.target)) {
    addEdges([{
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      type: 'default',
      animated: false
    }]);

    updateRule();
  }
}

function onNodeUpdate(nodeData: any) {
  updateRule();
}

function onNodeRemove(nodeId: string) {
  // Find and remove the node
  const nodes = getNodes.value.filter(n => n.id !== nodeId);
  const edges = getEdges.value.filter(e => e.source !== nodeId && e.target !== nodeId);

  // Update the flow
  elements.value = [...nodes, ...edges];

  updateRule();
}

function onNodeDragStop(event: NodeMouseEvent) {
  updateRule();
}

function onPaneClick() {
  // Deselect all nodes when clicking on the pane
  // This can be used to reset any selected state
}

function onEdgeUpdate(oldEdge: Edge, newConnection: Connection) {
  if (isValidConnection(newConnection.source, newConnection.target)) {
    const edges = getEdges.value.filter(e => e.id !== oldEdge.id);
    const newEdge = {
      ...oldEdge,
      ...newConnection,
      id: `e-${newConnection.source}-${newConnection.target}`
    };

    elements.value = [...getNodes.value, ...edges, newEdge];
    updateRule();
  }
}

function onEdgeUpdateStart() {
  // Handle edge update start if needed
}

function onEdgeUpdateEnd() {
  // Handle edge update end if needed
}

// Convert the flow to a rule structure
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

// Recursively create nodes from conditions
function createNodesFromConditions(
  conditions: any[],
  positions: Record<string, { x: number; y: number }>,
  parentId?: string,
  startX = 50,
  startY = 50,
  horizontalGap = 200,
  verticalGap = 150
) {
  if (!conditions || conditions.length === 0) return;

  let currentX = startX;
  let currentY = startY;
  let prevNodeId = parentId;

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const id = generateUniqueId();

    if (condition.isGroup) {
      // Create opening bracket
      const openingBracketId = `bracket-open-${id}`;
      const openingBracketPos = positions[openingBracketId] || { x: currentX, y: currentY };

      addNodes([{
        id: openingBracketId,
        type: NodeType.BRACKET_OPEN,
        position: openingBracketPos,
        data: { isOpening: true },
        draggable: true
      }]);

      if (prevNodeId) {
        // If there's a previous node, add join node first
        const joinId = `join-${prevNodeId}-${openingBracketId}`;
        const joinPos = positions[joinId] || {
          x: (openingBracketPos.x + currentX) / 2,
          y: currentY
        };

        addNodes([{
          id: joinId,
          type: NodeType.JOIN,
          position: joinPos,
          data: { operator: condition.joinOperator || JoinOperatorType.AND },
          draggable: true
        }]);

        // Connect previous node -> join -> opening bracket
        addEdges([
          {
            id: `e-${prevNodeId}-${joinId}`,
            source: prevNodeId,
            target: joinId,
            type: 'default'
          },
          {
            id: `e-${joinId}-${openingBracketId}`,
            source: joinId,
            target: openingBracketId,
            type: 'default'
          }
        ]);
      }

      // Recursively create nodes for conditions inside the group
      createNodesFromConditions(
        condition.conditions,
        positions,
        openingBracketId,
        currentX + horizontalGap,
        currentY,
        horizontalGap,
        verticalGap
      );

      // Create closing bracket
      const closingBracketId = `bracket-close-${id}`;
      const closingBracketPos = positions[closingBracketId] || {
        x: currentX + horizontalGap,
        y: currentY + (condition.conditions.length * verticalGap) + 100
      };

      addNodes([{
        id: closingBracketId,
        type: NodeType.BRACKET_CLOSE,
        position: closingBracketPos,
        data: { isOpening: false, pairedNodeId: openingBracketId },
        draggable: true
      }]);

      // Update the opening bracket with paired ID
      const openingBracket = findNode(openingBracketId);
      if (openingBracket) {
        openingBracket.data.pairedNodeId = closingBracketId;
      }

      // Connect the last node inside the group to the closing bracket
      const innerNodes = getNodes.value.filter(n =>
        n.position.x > openingBracketPos.x &&
        n.position.x < closingBracketPos.x &&
        n.position.y > openingBracketPos.y &&
        n.position.y < closingBracketPos.y
      );

      if (innerNodes.length > 0) {
        const terminalInnerNodes = innerNodes.filter(n =>
          !getEdges.value.some(e => e.source === n.id)
        );

        if (terminalInnerNodes.length > 0) {
          addEdges([{
            id: `e-${terminalInnerNodes[0].id}-${closingBracketId}`,
            source: terminalInnerNodes[0].id,
            target: closingBracketId,
            type: 'default'
          }]);
        }
      }

      prevNodeId = closingBracketId;
      currentY += (condition.conditions.length * verticalGap) + 200;
    } else {
      // Create condition node
      const conditionId = `condition-${id}`;
      const conditionPos = positions[conditionId] || { x: currentX, y: currentY };

      addNodes([{
        id: conditionId,
        type: NodeType.CONDITION,
        position: conditionPos,
        data: {
          field: condition.field,
          operator: condition.operator,
          value: condition.value
        },
        draggable: true
      }]);

      if (prevNodeId) {
        // If there's a previous node, add join node first
        const joinId = `join-${prevNodeId}-${conditionId}`;
        const joinPos = positions[joinId] || {
          x: (conditionPos.x + currentX) / 2,
          y: currentY
        };

        addNodes([{
          id: joinId,
          type: NodeType.JOIN,
          position: joinPos,
          data: { operator: condition.joinOperator || JoinOperatorType.AND },
          draggable: true
        }]);

        // Connect previous node -> join -> condition
        addEdges([
          {
            id: `e-${prevNodeId}-${joinId}`,
            source: prevNodeId,
            target: joinId,
            type: 'default'
          },
          {
            id: `e-${joinId}-${conditionId}`,
            source: joinId,
            target: conditionId,
            type: 'default'
          }
        ]);
      }

      prevNodeId = conditionId;
      currentY += verticalGap;
    }
  }
}

// Initialize with any provided rule
onMounted(() => {
  if (props.initialRule) {
    importRule(props.initialRule);
  } else {
    // Start with a single condition node
    createNode('condition', { x: 250, y: 100 });
  }
});
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
}

.preview-panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
