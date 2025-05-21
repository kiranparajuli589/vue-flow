import { useVueFlow } from '@vue-flow/core';
import { ref, watch } from 'vue';
import { generateUniqueId } from '@/utils/helpers';
import { NodeType, FieldType, OperatorType, JoinOperatorType } from '@/types/rule-builder';

const state = {
  draggedType: ref(null),
  isDragOver: ref(false),
  isDragging: ref(false),
};

export function useDragAndDrop() {
  const { draggedType, isDragOver, isDragging } = state;
  const { addNodes, screenToFlowCoordinate, onNodesInitialized, updateNode } = useVueFlow();

  watch(isDragging, (dragging) => {
    document.body.style.userSelect = dragging ? 'none' : '';
  });

  function onDragStart(event, type) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/vueflow', type);
      event.dataTransfer.effectAllowed = 'move';
    }
    draggedType.value = type;
    isDragging.value = true;
    document.addEventListener('drop', onDragEnd);
  }

  function onDragOver(event) {
    event.preventDefault();
    if (draggedType.value) {
      isDragOver.value = true;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  function onDragLeave() {
    isDragOver.value = false;
  }

  function onDragEnd() {
    isDragging.value = false;
    isDragOver.value = false;
    draggedType.value = null;
    document.removeEventListener('drop', onDragEnd);
  }

  function onDrop(event) {
    event.preventDefault();

    if (!draggedType.value) return;

    const position = screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY,
    });

    const nodeId = generateUniqueId();
    let nodeType;
    let nodeData = {};

    switch (draggedType.value) {
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
      id: nodeId,
      type: nodeType,
      position,
      data: nodeData,
      draggable: true
    };

    // Align node position after drop to center it with the mouse
    const { off } = onNodesInitialized(() => {
      updateNode(nodeId, (node) => ({
        position: {
          x: node.position.x - node.dimensions.width / 2,
          y: node.position.y - node.dimensions.height / 2
        },
      }));
      off();
    });

    addNodes(newNode);

    return nodeId;
  }

  return {
    draggedType,
    isDragOver,
    isDragging,
    onDragStart,
    onDragLeave,
    onDragOver,
    onDrop,
    onDragEnd
  };
}
