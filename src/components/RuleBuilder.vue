<template>
  <div class="rule-builder">
    <div class="sidebar">
      <h3>Nodes</h3>
      <div
        class="dndnode condition-node"
        draggable="true" @dragstart="onDragStart($event, 'conditionNode')"
      >
        Condition
      </div>
      <div class="dndnode join-node" draggable="true" @dragstart="onDragStart($event, 'joinNode')">
        Join
      </div>
      <div class="controls">
        <button @click="deleteSelected" class="control-button">Delete Selected</button>
        <button @click="clearCanvas" class="control-button">Clear All</button>
      </div>
    </div>
    <div class="flow-wrapper">
      <VueFlow
        v-model="elements"
        @connect="onConnect"
        @paneReady="onPaneReady"
        @nodeClick="onNodeClick"
        @nodeDragStop="onNodeDragStop"
        @elementsRemove="onElementsRemove"
        @edgeUpdate="onEdgeUpdate"
        @selectionChange="onSelectionChange"
        :node-types="nodeTypes"
        :delete-key-code="['Delete', 'Backspace']"
        class="flow"
      >
        <template #node-condition="props">
          <ConditionNode :data="props.data" :id="props.id" />
        </template>
        <template #node-join="props">
          <JoinNode :data="props.data" :id="props.id" />
        </template>
        <Background pattern-color="#aaa" gap="8" />
        <Controls />
        <MiniMap />
        <Panel position="bottom-center" class="rule-expression-panel">
          <div class="rule-expression">{{ ruleExpression }}</div>
        </Panel>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="js">
import { ref, onMounted , markRaw, watch } from 'vue'
import { VueFlow, Panel, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

import ConditionNode from './ConditionNode.vue'
import JoinNode from './JoinNode.vue'

const nodeTypes = {
  conditionNode: markRaw(ConditionNode),
  joinNode: markRaw(JoinNode),
}

const elements = ref([])
const selectedElements = ref([])
const {
  project,
  addNodes,
  addEdges,
  onConnect: flowConnect,
  removeElements,
  // getEdges,
  // getNodes,
  findNode,
  findEdge,
} = useVueFlow()

const getNodes = () => {
  return elements.value.filter((el) => el.type === 'conditionNode' || el.type === 'joinNode')
}

const getEdges = () => {
  return elements.value.filter((el) => el.source && el.target)
}

const importRuleConfig = (ruleConfig) => {
  // First add all nodes
  const newNodes = ruleConfig.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    connectable: true,
    selectable: true,
  }))

  // Add all edges
  const newEdges = ruleConfig.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
  }))

  // Add to Vue Flow
  addNodes(newNodes)
  addEdges(newEdges)

  // Update the ID counter to prevent duplicates
  const maxId = Math.max(
    ...ruleConfig.nodes.map((node) => {
      const idNum = parseInt(node.id.replace('node_', ''))
      return isNaN(idNum) ? 0 : idNum
    }),
    0,
  )

  id = maxId + 1
}

// Generate a unique ID
let id = 0
const getId = () => `node_${id++}`

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/vueflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

const onPaneReady = (instance) => {
  instance.fitView()

  // Set up drop listener
  const el = document.querySelector('.vue-flow')
  el.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  })

  el.addEventListener('drop', onDrop)
}

const onDrop = (event) => {
  event.preventDefault()

  const nodeType = event.dataTransfer.getData('application/vueflow')
  if (!nodeType) return

  // Get the drop position
  const position = project({
    x: event.clientX,
    y: event.clientY,
  })

  const newNodeId = getId()

  if (nodeType === 'conditionNode') {
    addNodes({
      id: newNodeId,
      type: 'conditionNode',
      position,
      data: {
        field: 'path',
        operator: '==',
        value: '',
        fieldOptions: ['path', 'method', 'agent', 'referrer'],
        operatorOptions: ['==', '!=', '~='],
      },
      connectable: true,
      selectable: true,
    })
  } else if (nodeType === 'joinNode') {
    addNodes({
      id: newNodeId,
      type: 'joinNode',
      position,
      data: {
        joinType: 'AND',
        joinOptions: ['AND', 'OR', 'XOR'],
      },
      connectable: true,
      selectable: true,
    })
  }
}

const onConnect = (params) => {
  // Check if connection is valid
  const sourceNode = elements.value.find((el) => el.id === params.source)
  const targetNode = elements.value.find((el) => el.id === params.target)

  if (!sourceNode || !targetNode) return

  // Rules for connections:
  // 1. Cannot connect same types directly (condition to condition or join to join)
  if (sourceNode.type === targetNode.type) {
    console.warn('Cannot connect same node types directly')
    return
  }

  // 2. First/last nodes must be condition nodes
  // This is enforced by the connection rules

  // Check for existing connections
  const edges = getEdges()
  const existingSourceEdges = edges.filter((e) => e.source === params.source)
  const existingTargetEdges = edges.filter((e) => e.target === params.target)

  // Add the edge with a unique ID
  const edgeId = `edge_${sourceNode.id}-${targetNode.id}`
  addEdges([
    {
      id: edgeId,
      source: params.source,
      target: params.target,
      animated: true,
    },
  ])
}

const onNodeClick = (event, node) => {
  console.log('Node clicked:', node)
}

const onNodeDragStop = (event, node) => {
  console.log('Node dragged:', node)
}

const onElementsRemove = (elements) => {
  console.log('Elements removed:', elements)
  generateRuleExpression()
}

const onEdgeUpdate = (oldEdge, newConnection) => {
  console.log('Edge updated:', oldEdge, newConnection)
}

const onSelectionChange = (elements) => {
  selectedElements.value = elements
}

const deleteSelected = () => {
  if (selectedElements.value.length > 0) {
    removeElements(selectedElements.value)
    selectedElements.value = []
  }
}

const clearCanvas = () => {
  removeElements(elements.value)
}

// Generate the rule expression based on the current graph
const ruleExpression = ref('Drag and drop nodes to create a rule')

const generateRuleExpression = () => {
  const nodes = getNodes()
  const edges = getEdges()

  if (nodes.length === 0) {
    ruleExpression.value = 'Drag and drop nodes to create a rule'
    return
  }

  // Find root nodes (nodes with no incoming edges)
  const rootNodes = nodes.filter((node) => {
    return !edges.some((edge) => edge.target === node.id)
  })

  if (rootNodes.length === 0) {
    ruleExpression.value = 'Create a starting node'
    return
  }

  // Start from root nodes and traverse the graph
  try {
    const expressions = rootNodes.map((rootNode) => traverseGraph(rootNode.id, edges, nodes))
    ruleExpression.value = expressions.join(' ')
  } catch (error) {
    ruleExpression.value = `Error generating expression: ${error.message}`
  }
}

const traverseGraph = (nodeId, edges, nodes, visited = new Set()) => {
  if (visited.has(nodeId)) {
    return '' // Prevent infinite recursion
  }

  visited.add(nodeId)
  const node = nodes.find((n) => n.id === nodeId)

  if (!node) {
    return ''
  }

  // Find outgoing and incoming edges
  const outgoingEdges = edges.filter((edge) => edge.source === nodeId)
  const incomingEdges = edges.filter((edge) => edge.target === nodeId)

  if (node.type === 'conditionNode') {
    // Format condition node: field operator value
    const condition = `${node.data.field} ${node.data.operator} '${node.data.value}'`

    if (outgoingEdges.length === 0) {
      return condition
    }

    // If there are outgoing edges to join nodes, process them
    const expressions = outgoingEdges
      .map((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target)
        if (targetNode && targetNode.type === 'joinNode') {
          return traverseGraph(edge.target, edges, nodes, new Set(visited))
        }
        return ''
      })
      .filter(Boolean)

    if (expressions.length === 0) {
      return condition
    } else if (expressions.length === 1) {
      return `${condition} ${expressions[0]}`
    } else {
      return `${condition} ${expressions.join(' ')}`
    }
  } else if (node.type === 'joinNode') {
    // Get the join operator
    const joinOperator =
      node.data.joinType === 'AND'
        ? '&&'
        : node.data.joinType === 'OR'
          ? '||'
          : node.data.joinType === 'XOR'
            ? '^'
            : '&&'

    // Process incoming connections (should be condition nodes)
    const sourceExpressions = incomingEdges
      .map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        if (sourceNode && sourceNode.type === 'conditionNode') {
          // Return just the condition, not the full traversal
          return `${sourceNode.data.field} ${sourceNode.data.operator} '${sourceNode.data.value}'`
        }
        return ''
      })
      .filter(Boolean)

    // Process outgoing connections (to next nodes)
    const targetExpressions = outgoingEdges
      .map((edge) => {
        return traverseGraph(edge.target, edges, nodes, new Set(visited))
      })
      .filter(Boolean)

    // Combine source and target expressions
    let allExpressions = [...sourceExpressions]

    if (targetExpressions.length > 0) {
      allExpressions = [...allExpressions, ...targetExpressions]
    }

    if (allExpressions.length === 0) {
      return ''
    } else if (allExpressions.length === 1) {
      return allExpressions[0]
    } else {
      // Special case for nested conditions like path == 'abc' && (method == 200 || method == 201)
      const needsParentheses = incomingEdges.length > 0 && outgoingEdges.length > 0

      // Create a proper expression with the join operator
      const expression = allExpressions.join(` ${joinOperator} `)

      return needsParentheses ? `(${expression})` : expression
    }
  }

  return ''
}
// Re-generate expression whenever the graph changes
watch(
  () => elements.value,
  () => {
    generateRuleExpression()
  },
  { deep: true },
)

onMounted(() => {
  console.log('Rule Builder mounted')
})

// Add these to defineExpose
defineExpose({
  getNodes,
  getEdges,
  clearCanvas,
  importRuleConfig,
})
</script>

<style scoped>
.rule-builder {
  display: flex;
  width: 100%;
  height: 100vh;
}

.sidebar {
  width: 200px;
  padding: 10px;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.controls {
  margin-top: auto;
  padding-top: 20px;
}

.control-button {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.control-button:hover {
  background-color: #e6e6e6;
}

.flow-wrapper {
  flex-grow: 1;
  position: relative;
  height: 100%;
}

.flow {
  height: 100%;
}

.dndnode {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: grab;
  text-align: center;
  background: white;
}

.condition-node {
  background: #e6f7ff;
}

.join-node {
  background: #ffe6e6;
}

.rule-expression-panel {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 80%;
}

.rule-expression {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
