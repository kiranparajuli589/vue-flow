<script setup lang="ts">
import { ref, watch, provide } from 'vue'

import { VueFlow, useVueFlow } from '@vue-flow/core'
import { useRuleService } from '@/composables/useRuleService'
import { useRuleAutomation } from '@/composables/useRuleAutomation'
import { useRootNodeManager } from '@/composables/useRootNodeManager'
import useDragAndDrop from '@/composables/useDragAndDrop'
import Sidebar from './FlowSidebar.vue'
import DropzoneBackground from './DropzoneBackground.vue'
import ShortcutsOverlay from './ShortcutsOverlay.vue'

import edgeTypes from './edges'
import nodeTypes from './nodes'
import { NodeType, FieldType, OperatorType } from '@/types/rule-builder'

// Add emit for flow data changes
const emit = defineEmits(['update:modelValue', 'validate', 'flow-change'])

const { createSmartEdge } = useRuleService()
const {
  promptForBracketAutomation,
  insertAndGroup,
  insertOrGroup,
  duplicateNodes,
  copyNodes,
  pasteNodes,
  wrapInBrackets,
  alignNodesHorizontally,
  alignNodesVertically,
  spaceNodesEvenly,
  autoFitView,
  selectedNodes,
} = useRuleAutomation()

const {
  onConnect,
  addEdges,
  onNodesChange,
  addNodes,
  screenToFlowCoordinate,
  removeNodes,
  removeEdges,
} = useVueFlow()

const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop()

// Root node management
const rootNodeManager = useRootNodeManager()
provide('rootNodeManager', rootNodeManager)

// Custom drop handler that triggers auto-completion immediately
function handleDrop(event: DragEvent) {
  // Call the original onDrop first
  onDrop(event)

  // Wait for the node to be added, then prompt for auto-completion
  setTimeout(() => {
    const latestNodes = nodes.value
    const latestNode = latestNodes[latestNodes.length - 1]

    if (latestNode && latestNode.type === NodeType.BRACKET_OPEN) {
      promptForBracketAutomation(latestNode.id, latestNode.position)
    }
  }, 100)
}

const nodes = ref([])
const edges = ref([])

// Handle connection with smart edge type detection
onConnect((params) => {
  console.log('Connection params:', params)
  const edge = createSmartEdge(
    params.source,
    params.target,
    params.sourceHandle,
    params.targetHandle,
  )
  console.log('Created edge:', edge)
  addEdges([edge])
})

// Track selected nodes through node changes
onNodesChange((changes) => {
  const currentNodes = nodes.value
  const selected = currentNodes.filter((node) => node.selected).map((n) => n.id)
  selectedNodes.value = selected
})

// Keyboard shortcuts for automation
function handleKeyDown(event: KeyboardEvent) {
  // Don't trigger if user is typing in input fields
  if ((event.target as HTMLElement)?.tagName.toLowerCase() === 'input') return

  const isCtrl = event.ctrlKey || event.metaKey
  const centerPosition = { x: 400, y: 300 } // Center of canvas

  if (isCtrl) {
    switch (event.key.toLowerCase()) {
      case '1': // Ctrl+1 = Add Condition Node
        event.preventDefault()
        addConditionNode(centerPosition)
        break
      case '2': // Ctrl+2 = Add Bracket Pair
        event.preventDefault()
        addBracketPair(centerPosition)
        break
      case 'g': // Ctrl+G = Insert AND group
        event.preventDefault()
        if (event.shiftKey) {
          insertOrGroup(centerPosition) // Ctrl+Shift+G = OR group
        } else {
          insertAndGroup(centerPosition) // Ctrl+G = AND group
        }
        break
      case 'd': // Ctrl+D = Duplicate
        event.preventDefault()
        duplicateNodes()
        break
      case 'c': // Ctrl+C = Copy
        event.preventDefault()
        copyNodes()
        break
      case 'v': // Ctrl+V = Paste
        event.preventDefault()
        pasteNodes(centerPosition)
        break
      case 'b': // Ctrl+B = Wrap in brackets
        event.preventDefault()
        wrapInBrackets()
        break
      case 'a': // Ctrl+A = Align
        event.preventDefault()
        if (event.shiftKey) {
          alignNodesVertically() // Ctrl+Shift+A = Vertical
        } else {
          alignNodesHorizontally() // Ctrl+A = Horizontal
        }
        break
      case 'f': // Ctrl+F = Fit view
        event.preventDefault()
        autoFitView()
        break
      case 's': // Ctrl+S = Space evenly
        event.preventDefault()
        spaceNodesEvenly()
        break
    }
  }
}

// Individual node creation functions with default values
function addConditionNode(position: { x: number; y: number }) {
  const nodeId = `condition_${Date.now()}`
  const flowPosition = screenToFlowCoordinate(position)

  addNodes([
    {
      id: nodeId,
      type: NodeType.CONDITION,
      position: getSmartPosition(flowPosition),
      data: {
        field: FieldType.URI_PATH,
        operator: OperatorType.EQUALS,
        value: '',
      },
    },
  ])
}

function addBracketPair(position: { x: number; y: number }) {
  // This will be handled by the updated drag and drop system
  // when we drop a "bracket-pair" type
  const flowPosition = screenToFlowCoordinate(position)

  // Simulate the bracket pair creation from drag and drop
  const event = new DragEvent('drop', {
    clientX: position.x,
    clientY: position.y,
  })

  // Set the dragged type to bracket-pair and handle drop
  const { draggedType } = useDragAndDrop()
  draggedType.value = 'bracket-pair'
  handleDrop(event)
}

// Smart positioning to avoid overlaps
function getSmartPosition(position: { x: number; y: number }) {
  const currentNodes = nodes.value
  const gridSize = 50
  const nodeWidth = 280
  const nodeHeight = 150

  // Snap to grid
  let x = Math.round(position.x / gridSize) * gridSize
  let y = Math.round(position.y / gridSize) * gridSize

  // Check for overlaps and adjust
  let attempts = 0
  while (attempts < 20) {
    const hasOverlap = currentNodes.some((node) => {
      const dx = Math.abs(node.position.x - x)
      const dy = Math.abs(node.position.y - y)
      return dx < nodeWidth && dy < nodeHeight
    })

    if (!hasOverlap) break

    // Try next position
    x += nodeWidth + 20
    if (x > position.x + 500) {
      x = position.x
      y += nodeHeight + 20
    }
    attempts++
  }

  return { x, y }
}

// Reset canvas function
function resetCanvas() {
  // Confirm with user before resetting
  if (confirm('Are you sure you want to reset the canvas? This will remove all nodes and edges.')) {
    console.log('Resetting canvas...')

    // Get all current nodes and edges
    const allNodes = nodes.value
    const allEdges = edges.value

    console.log('Removing nodes:', allNodes.length, 'edges:', allEdges.length)

    // Remove all nodes and edges
    if (allNodes.length > 0) {
      removeNodes(allNodes.map((n) => n.id))
    }
    if (allEdges.length > 0) {
      removeEdges(allEdges.map((e) => e.id))
    }

    // Clear local refs
    nodes.value = []
    edges.value = []

    console.log('Canvas reset complete')
  }
}

// Watch nodes and edges and emit changes (only connected flow)
watch(
  [nodes, edges],
  ([newNodes, newEdges]) => {
    // Get only the connected flow for preview
    const connectedFlow = rootNodeManager.getConnectedFlow()
    emit('flow-change', {
      nodes: connectedFlow.nodes,
      edges: connectedFlow.edges,
      rootNodeId: rootNodeManager.currentRootNodeId.value,
      hasValidFlow: rootNodeManager.hasValidFlow(),
    })
  },
  { deep: true },
)

// Also emit on node changes
onNodesChange((changes) => {
  const currentNodes = nodes.value
  const selected = currentNodes.filter((node) => node.selected).map((n) => n.id)
  selectedNodes.value = selected

  // Emit flow change
  setTimeout(() => {
    const connectedFlow = rootNodeManager.getConnectedFlow()
    emit('flow-change', {
      nodes: connectedFlow.nodes,
      edges: connectedFlow.edges,
      rootNodeId: rootNodeManager.currentRootNodeId.value,
      hasValidFlow: rootNodeManager.hasValidFlow(),
    })
  }, 0)
})
</script>

<template>
  <div class="dnd-flow" @drop="handleDrop" @keydown="handleKeyDown" tabindex="0">
    <Sidebar />

    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      :edges-updatable="true"
      :edge-types="edgeTypes"
      :node-types="nodeTypes"
    >
      <DropzoneBackground
        :style="{
          backgroundColor: isDragOver ? '#e7f3ff' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
      >
        <div class="drop-here" v-if="isDragOver">Drop here</div>

        <!-- Flow status indicator -->
        <div class="flow-status" v-if="!isDragOver">
          <div class="flow-info">
            <div v-if="rootNodeManager.currentRootNodeId.value" class="root-info">
              📍 Root: {{ rootNodeManager.currentRootNodeId.value.substring(0, 8) }}...
            </div>
            <div v-if="!rootNodeManager.hasValidFlow()" class="connection-hint">
              💡 Connect at least 2 nodes to see preview
            </div>
            <div v-else class="flow-ready">
              ✅ {{ rootNodeManager.getConnectedFlow().nodes.length }} connected nodes
            </div>
          </div>

          <!-- Reset button -->
          <button
            v-if="nodes.length > 0"
            @click="resetCanvas"
            class="reset-btn"
            title="Reset canvas - clears all nodes and edges"
          >
            Reset
          </button>
        </div>

        <!-- Shortcuts overlay component -->
        <ShortcutsOverlay v-if="!isDragOver" />
      </DropzoneBackground>
    </VueFlow>
  </div>
</template>

<style scoped>
.dnd-flow {
  height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: start;
  border: 1px solid rgb(153, 153, 153);
  outline: none;
}

.drop-here {
  padding: 16px;
  background-color: #e7f3ff;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.flow-status {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-width: 280px;

  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.flow-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.root-info {
  color: #4299e1;
  font-weight: 600;
}

.connection-hint {
  color: #ed8936;
  font-weight: 500;
}

.flow-ready {
  color: #48bb78;
  font-weight: 500;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 6px 10px;
  background-color: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background-color: #e53e3e;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(245, 101, 101, 0.3);
}

.reset-btn svg {
  width: 14px;
  height: 14px;
}
</style>
