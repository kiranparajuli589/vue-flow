import { useVueFlow } from '@vue-flow/core'
import { ref, watch } from 'vue'
import { NodeType } from '@/types/rule-builder'
import { generateUniqueId } from '@/utils/helpers'
import { useRuleTemplates } from '@/composables/useRuleTemplates'

let id = 0

function getId() {
  return `dndnode_${id++}`
}

const state = {
  draggedType: ref(null),
  isDragOver: ref(false),
  isDragging: ref(false),
}

export default function useDragAndDrop() {
  const { draggedType, isDragOver, isDragging } = state

  const { addNodes, screenToFlowCoordinate, onNodesInitialized, updateNode } = useVueFlow()
  const { applyTemplate } = useRuleTemplates()

  watch(isDragging, (dragging) => {
    document.body.style.userSelect = dragging ? 'none' : ''
  })

  function onDragStart(event, type) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/vueflow', type)
      event.dataTransfer.effectAllowed = 'move'
    }

    draggedType.value = type
    isDragging.value = true

    document.addEventListener('drop', onDragEnd)
  }

  /**
   * Handles the drag over event.
   *
   * @param {DragEvent} event
   */
  function onDragOver(event) {
    event.preventDefault()

    if (draggedType.value) {
      isDragOver.value = true

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }
    }
  }

  function onDragLeave() {
    isDragOver.value = false
  }

  function onDragEnd() {
    isDragging.value = false
    isDragOver.value = false
    draggedType.value = null
    document.removeEventListener('drop', onDragEnd)
  }

  /**
   * Handles the drop event.
   *
   * @param {DragEvent} event
   */
  function onDrop(event) {
    const position = screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY,
    })

    // Handle template application
    if (draggedType.value && draggedType.value.startsWith('template:')) {
      const templateId = draggedType.value.replace('template:', '')
      console.log('Applying template:', templateId)
      applyTemplate(templateId, { x: event.clientX, y: event.clientY })
      return
    }

    // Handle bracket pair creation
    if (draggedType.value === 'bracket-pair') {
      createBracketPair(position)
    } else {
      // Handle single node creation
      const nodeId = getId()
      const newNode = {
        id: nodeId,
        type: draggedType.value,
        position,
        data: getDefaultNodeData(draggedType.value),
      }

      const { off } = onNodesInitialized(() => {
        updateNode(nodeId, (node) => ({
          position: { x: node.position.x - node.dimensions.width / 2, y: node.position.y - node.dimensions.height / 2 },
        }))

        off()
      })

      addNodes(newNode)
    }
  }

  /**
   * Create a bracket pair (opening and closing brackets)
   */
  function createBracketPair(centerPosition) {
    const openBracketId = `bracket_open_${generateUniqueId()}`
    const closeBracketId = `bracket_close_${generateUniqueId()}`

    // Position brackets with some spacing
    const spacing = 200
    const openPosition = {
      x: centerPosition.x - spacing,
      y: centerPosition.y
    }
    const closePosition = {
      x: centerPosition.x + spacing,
      y: centerPosition.y
    }

    const nodes = [
      {
        id: openBracketId,
        type: NodeType.BRACKET_OPEN,
        position: openPosition,
        data: { isOpening: true, pairedNodeId: closeBracketId }
      },
      {
        id: closeBracketId,
        type: NodeType.BRACKET_CLOSE,
        position: closePosition,
        data: { isOpening: false, pairedNodeId: openBracketId }
      }
    ]

    // Add positioning logic for both nodes
    const initPromises = nodes.map(node => {
      return new Promise(resolve => {
        const { off } = onNodesInitialized(() => {
          updateNode(node.id, (n) => ({
            position: {
              x: n.position.x - n.dimensions.width / 2,
              y: n.position.y - n.dimensions.height / 2
            },
          }))
          off()
          resolve(true)
        })
      })
    })

    addNodes(nodes)
  }

  /**
   * Get default data for different node types
   */
  function getDefaultNodeData(nodeType) {
    switch (nodeType) {
      case NodeType.CONDITION:
        return {
          field: 'req.uri.path',
          operator: '==',
          value: ''
        }
      case NodeType.BRACKET_OPEN:
        return { isOpening: true }
      case NodeType.BRACKET_CLOSE:
        return { isOpening: false }
      default:
        return { label: `Node ${nodeType}` }
    }
  }

  return {
    draggedType,
    isDragOver,
    isDragging,
    onDragStart,
    onDragLeave,
    onDragOver,
    onDrop,
  }
}