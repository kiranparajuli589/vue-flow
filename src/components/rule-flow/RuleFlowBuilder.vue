<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { useRuleService } from '@/composables/useRuleService'
import { useRuleAutomation } from '@/composables/useRuleAutomation'
import useDragAndDrop from '@/composables/useDragAndDrop'
import Sidebar from './FlowSidebar.vue'
import DropzoneBackground from './DropzoneBackground.vue'

import edgeTypes from './edges'
import nodeTypes from './nodes'
import { NodeType, FieldType, OperatorType } from '@/types/rule-builder'

const { createSmartEdge } = useRuleService()
const { 
  autoCompleteBracketGroup,
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
  selectedNodes
} = useRuleAutomation()

const { onConnect, addEdges, onNodeDragStop, onNodesChange, addNodes, screenToFlowCoordinate } = useVueFlow()

const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop()

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
  const edge = createSmartEdge(params.source, params.target, params.sourceHandle, params.targetHandle)
  console.log('Created edge:', edge)
  addEdges([edge])
})

// Handle node drag stop for auto-completion (remove this since we're using drop handler now)
// onNodeDragStop is no longer needed for auto-completion

// Track selected nodes through node changes
onNodesChange((changes) => {
  const currentNodes = nodes.value
  const selected = currentNodes.filter(node => node.selected).map(n => n.id)
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
      case '2': // Ctrl+2 = Add Open Bracket
        event.preventDefault()
        addOpenBracket(centerPosition)
        break
      case '3': // Ctrl+3 = Add Close Bracket
        event.preventDefault()
        addCloseBracket(centerPosition)
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

// Individual node creation functions
function addConditionNode(position: { x: number; y: number }) {
  const nodeId = `condition_${Date.now()}`
  const flowPosition = screenToFlowCoordinate(position)
  
  addNodes([{
    id: nodeId,
    type: NodeType.CONDITION,
    position: getSmartPosition(flowPosition),
    data: {
      field: 'req.uri.path',
      operator: '==',
      value: ''
    }
  }])
}

function addOpenBracket(position: { x: number; y: number }) {
  const nodeId = `bracket_open_${Date.now()}`
  const flowPosition = screenToFlowCoordinate(position)
  
  addNodes([{
    id: nodeId,
    type: NodeType.BRACKET_OPEN,
    position: getSmartPosition(flowPosition),
    data: { isOpening: true }
  }])
}

function addCloseBracket(position: { x: number; y: number }) {
  const nodeId = `bracket_close_${Date.now()}`
  const flowPosition = screenToFlowCoordinate(position)
  
  addNodes([{
    id: nodeId,
    type: NodeType.BRACKET_CLOSE,
    position: getSmartPosition(flowPosition),
    data: { isOpening: false }
  }])
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
    const hasOverlap = currentNodes.some(node => {
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
</script>

<template>
  <div 
    class="dnd-flow" 
    @drop="handleDrop"
    @keydown="handleKeyDown"
    tabindex="0"
  >
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
        
        <!-- Keyboard shortcuts help -->
        <div class="shortcuts-help" v-if="!isDragOver">
          <div class="shortcuts-title">⌨️ Keyboard Shortcuts</div>
          <div class="shortcuts-list">
            <div><strong>Ctrl+1:</strong> Add Condition</div>
            <div><strong>Ctrl+2:</strong> Add Open Bracket</div>
            <div><strong>Ctrl+3:</strong> Add Close Bracket</div>
            <div><strong>Ctrl+G:</strong> Insert AND Group</div>
            <div><strong>Ctrl+Shift+G:</strong> Insert OR Group</div>
            <div><strong>Ctrl+D:</strong> Duplicate</div>
            <div><strong>Ctrl+C/V:</strong> Copy/Paste</div>
            <div><strong>Ctrl+B:</strong> Wrap in Brackets</div>
            <div><strong>Ctrl+A:</strong> Align Horizontal</div>
            <div><strong>Ctrl+F:</strong> Fit to View</div>
          </div>
        </div>
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

.shortcuts-help {
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-width: 280px;
}

.shortcuts-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: #4a5568;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #718096;
}

.shortcuts-list div {
  padding: 2px 0;
}

.shortcuts-list strong {
  color: #4a5568;
}
</style>