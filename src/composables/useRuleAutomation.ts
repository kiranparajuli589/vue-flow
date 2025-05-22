// src/composables/useRuleAutomation.ts
import { ref, nextTick } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { NodeType, FieldType, OperatorType, JoinOperatorType, EdgeType } from '@/types/rule-builder';
import { generateUniqueId } from '@/utils/helpers';
import { useRuleService } from '@/composables/useRuleService';

export function useRuleAutomation() {
  const { 
    addNodes, 
    addEdges, 
    getNodes, 
    getEdges, 
    updateNode, 
    removeNodes, 
    removeEdges,
    findNode,
    screenToFlowCoordinate,
    fitView
  } = useVueFlow();
  
  const { createSmartEdge } = useRuleService();
  
  const selectedNodes = ref([]);
  const clipboard = ref(null);

  /**
   * 1. AUTO-COMPLETE BRACKET GROUPS
   * When user drops an open bracket, show prompt for automation
   */
  function promptForBracketAutomation(openBracketId: string, position: { x: number; y: number }) {
    const shouldAutomate = confirm('Auto-complete this bracket group with conditions?');
    
    if (!shouldAutomate) {
      return; // Just leave the single bracket node
    }
    
    // Ask for number of conditions
    const conditionCount = prompt('How many conditions inside this bracket? (2-5)', '2');
    const count = parseInt(conditionCount || '2');
    
    if (isNaN(count) || count < 2 || count > 5) {
      return; // Invalid input, just leave the bracket
    }
    
    autoCompleteBracketGroup(openBracketId, position, count);
  }

  function autoCompleteBracketGroup(openBracketId: string, position: { x: number; y: number }, conditionCount: number = 2) {
    const nodes = [];
    const edges = [];

    // Create condition nodes and closing bracket
    const conditionIds = [];
    for (let i = 0; i < conditionCount; i++) {
      conditionIds.push(generateUniqueId());
    }
    const closeBracketId = generateUniqueId();

    // Calculate positioning for multiple conditions
    const horizontalSpacing = 450;
    const verticalSpacing = 250;
    const totalWidth = (conditionCount - 1) * horizontalSpacing;
    const startX = position.x - totalWidth / 2;
    
    // Create condition nodes with default values
    conditionIds.forEach((conditionId, index) => {
      const conditionX = startX + (index * horizontalSpacing);
      const conditionY = position.y + verticalSpacing;
      
      nodes.push({
        id: conditionId,
        type: NodeType.CONDITION,
        position: { x: conditionX, y: conditionY },
        data: {
          field: FieldType.URI_PATH,
          operator: OperatorType.EQUALS,
          value: ''
        }
      });
    });

    // Create closing bracket (centered below)
    const closeBracketX = position.x;
    const closeBracketY = position.y + (verticalSpacing * 3);
    
    nodes.push({
      id: closeBracketId,
      type: NodeType.BRACKET_CLOSE,
      position: { x: closeBracketX, y: closeBracketY },
      data: { isOpening: false }
    });

    // Create edges
    // 1. Open bracket to all conditions (simple edges)
    conditionIds.forEach(conditionId => {
      edges.push(createSmartEdge(openBracketId, conditionId));
    });

    // 2. Chain conditions with JOIN edges (for OR logic) - Force JOIN type
    for (let i = 0; i < conditionIds.length - 1; i++) {
      const sourceId = conditionIds[i];
      const targetId = conditionIds[i + 1];
      
      // Create JOIN edge manually to ensure it's JOIN type
      const edgeId = generateUniqueId();
      const joinEdge = {
        id: `edge-${edgeId}`,
        source: sourceId,
        target: targetId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: EdgeType.JOIN,
        label: JoinOperatorType.OR,
        labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
        labelStyle: { fontWeight: 700, fill: '#4299e1' },
        data: { operator: JoinOperatorType.OR },
        style: { stroke: '#4299e1', strokeWidth: 2 },
      };
      edges.push(joinEdge);
    }

    // 3. All conditions to closing bracket (simple edges)
    conditionIds.forEach(conditionId => {
      edges.push(createSmartEdge(conditionId, closeBracketId));
    });

    addNodes(nodes);
    addEdges(edges);

    return { nodes, edges };
  }

  /**
   * 2. SMART NODE INSERTION
   */
  
  // Double-click empty space to add condition
  function insertConditionAtPosition(position: { x: number; y: number }) {
    const nodeId = generateUniqueId();
    const flowPosition = screenToFlowCoordinate(position);
    
    addNodes([{
      id: nodeId,
      type: NodeType.CONDITION,
      position: getSmartPosition(flowPosition),
      data: {
        field: FieldType.URI_PATH,
        operator: OperatorType.EQUALS,
        value: ''
      }
    }]);

    return nodeId;
  }

  // Insert condition in the middle of an edge
  function insertConditionOnEdge(edgeId: string, position: { x: number; y: number }) {
    const edges = getEdges.value;
    const edge = edges.find(e => e.id === edgeId);
    
    if (!edge) return;

    const newNodeId = generateUniqueId();
    const flowPosition = screenToFlowCoordinate(position);

    // Create new condition node with default values
    addNodes([{
      id: newNodeId,
      type: NodeType.CONDITION,
      position: flowPosition,
      data: {
        field: FieldType.URI_PATH,
        operator: OperatorType.EQUALS,
        value: ''
      }
    }]);

    // Remove old edge and create two new ones
    removeEdges([edgeId]);
    
    addEdges([
      createSmartEdge(edge.source, newNodeId, edge.sourceHandle),
      createSmartEdge(newNodeId, edge.target, undefined, edge.targetHandle)
    ]);

    return newNodeId;
  }

  /**
   * 3. PATTERN TEMPLATES
   */
  
  // Insert AND group: (condition1 && condition2)
  function insertAndGroup(position: { x: number; y: number }) {
    const flowPosition = screenToFlowCoordinate(position);
    return insertBracketGroup(flowPosition, JoinOperatorType.AND);
  }

  // Insert OR group: (condition1 || condition2)
  function insertOrGroup(position: { x: number; y: number }) {
    const flowPosition = screenToFlowCoordinate(position);
    return insertBracketGroup(flowPosition, JoinOperatorType.OR);
  }

  function insertBracketGroup(position: { x: number; y: number }, operator: JoinOperatorType) {
    const nodes = [];
    const edges = [];
    
    const openBracketId = generateUniqueId();
    const condition1Id = generateUniqueId();
    const condition2Id = generateUniqueId();
    const closeBracketId = generateUniqueId();

    // Better positioning - same as autoCompleteBracketGroup
    const horizontalSpacing = 320;
    const verticalSpacing = 180;
    
    const condition1X = position.x - horizontalSpacing / 2;
    const condition2X = position.x + horizontalSpacing / 2;
    const conditionY = position.y + verticalSpacing;
    const closeBracketX = position.x;
    const closeBracketY = conditionY + verticalSpacing;

    nodes.push(
      // Opening bracket
      {
        id: openBracketId,
        type: NodeType.BRACKET_OPEN,
        position: getSmartPosition(position),
        data: { isOpening: true }
      },
      // First condition (left) with default values
      {
        id: condition1Id,
        type: NodeType.CONDITION,
        position: { x: condition1X, y: conditionY },
        data: {
          field: FieldType.URI_PATH,
          operator: OperatorType.EQUALS,
          value: ''
        }
      },
      // Second condition (right) with default values
      {
        id: condition2Id,
        type: NodeType.CONDITION,
        position: { x: condition2X, y: conditionY },
        data: {
          field: FieldType.URI_PATH,
          operator: OperatorType.EQUALS,
          value: ''
        }
      },
      // Closing bracket (centered below)
      {
        id: closeBracketId,
        type: NodeType.BRACKET_CLOSE,
        position: { x: closeBracketX, y: closeBracketY },
        data: { isOpening: false }
      }
    );

    edges.push(
      // Open bracket to both conditions (simple edges)
      createSmartEdge(openBracketId, condition1Id),
      createSmartEdge(openBracketId, condition2Id),
      // Both conditions to closing bracket (simple edges)
      createSmartEdge(condition1Id, closeBracketId),
      createSmartEdge(condition2Id, closeBracketId)
    );

    // Create JOIN edge between conditions manually
    const edgeId = generateUniqueId();
    const joinEdge = {
      id: `edge-${edgeId}`,
      source: condition1Id,
      target: condition2Id,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: EdgeType.JOIN,
      label: operator,
      labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
      labelStyle: { fontWeight: 700, fill: '#4299e1' },
      data: { operator },
      style: { stroke: '#4299e1', strokeWidth: 2 },
    };
    edges.push(joinEdge);

    addNodes(nodes);
    addEdges(edges);

    return { openBracketId, condition1Id, condition2Id, closeBracketId };
  }

  /**
   * 4. AUTO-LAYOUT & POSITIONING
   */
  
  // Get smart position that avoids overlaps
  function getSmartPosition(position: { x: number; y: number }) {
    const nodes = getNodes.value;
    const gridSize = 50;
    const nodeWidth = 280;
    const nodeHeight = 150;
    
    // Snap to grid
    let x = Math.round(position.x / gridSize) * gridSize;
    let y = Math.round(position.y / gridSize) * gridSize;
    
    // Check for overlaps and adjust
    let attempts = 0;
    while (attempts < 20) {
      const hasOverlap = nodes.some(node => {
        const dx = Math.abs(node.position.x - x);
        const dy = Math.abs(node.position.y - y);
        return dx < nodeWidth && dy < nodeHeight;
      });
      
      if (!hasOverlap) break;
      
      // Try next position
      x += nodeWidth + 20;
      if (x > position.x + 500) {
        x = position.x;
        y += nodeHeight + 20;
      }
      attempts++;
    }
    
    return { x, y };
  }

  // Auto-align selected nodes
  function alignNodesHorizontally() {
    if (selectedNodes.value.length < 2) return;
    
    const nodes = selectedNodes.value.map(id => findNode(id)).filter(Boolean);
    const avgY = nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;
    
    nodes.forEach(node => {
      updateNode(node.id, { position: { ...node.position, y: avgY } });
    });
  }

  function alignNodesVertically() {
    if (selectedNodes.value.length < 2) return;
    
    const nodes = selectedNodes.value.map(id => findNode(id)).filter(Boolean);
    const avgX = nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
    
    nodes.forEach(node => {
      updateNode(node.id, { position: { ...node.position, x: avgX } });
    });
  }

  // Auto-space nodes evenly
  function spaceNodesEvenly(direction: 'horizontal' | 'vertical' = 'horizontal') {
    if (selectedNodes.value.length < 2) return;
    
    const nodes = selectedNodes.value.map(id => findNode(id)).filter(Boolean);
    nodes.sort((a, b) => direction === 'horizontal' ? 
      a.position.x - b.position.x : 
      a.position.y - b.position.y
    );
    
    const spacing = direction === 'horizontal' ? 300 : 200;
    const startPos = direction === 'horizontal' ? nodes[0].position.x : nodes[0].position.y;
    
    nodes.forEach((node, index) => {
      const newPos = startPos + (index * spacing);
      updateNode(node.id, { 
        position: {
          ...node.position,
          [direction === 'horizontal' ? 'x' : 'y']: newPos
        }
      });
    });
  }

  /**
   * 5. QUICK ACTIONS
   */
  
  // Duplicate selected nodes
  function duplicateNodes() {
    if (selectedNodes.value.length === 0) return;
    
    const nodes = selectedNodes.value.map(id => findNode(id)).filter(Boolean);
    const newNodes = nodes.map(node => ({
      ...node,
      id: generateUniqueId(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      }
    }));
    
    addNodes(newNodes);
    return newNodes.map(n => n.id);
  }

  // Copy nodes to clipboard
  function copyNodes() {
    if (selectedNodes.value.length === 0) return;
    
    const nodes = selectedNodes.value.map(id => findNode(id)).filter(Boolean);
    clipboard.value = {
      nodes: nodes.map(node => ({ ...node })),
      timestamp: Date.now()
    };
  }

  // Paste nodes from clipboard
  function pasteNodes(position?: { x: number; y: number }) {
    if (!clipboard.value) return;
    
    const basePosition = position || screenToFlowCoordinate({ x: 100, y: 100 });
    const newNodes = clipboard.value.nodes.map((node, index) => ({
      ...node,
      id: generateUniqueId(),
      position: {
        x: basePosition.x + (index * 50),
        y: basePosition.y + (index * 50)
      }
    }));
    
    addNodes(newNodes);
    return newNodes.map(n => n.id);
  }

  // Wrap selected nodes in brackets
  function wrapInBrackets() {
    if (selectedNodes.value.length === 0) return;
    
    const nodes = selectedNodes.value.map(id => findNode(id)).filter(Boolean);
    if (nodes.length === 0) return;
    
    // Calculate bounds
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y));
    const centerY = (minY + maxY) / 2;
    
    const openBracketId = generateUniqueId();
    const closeBracketId = generateUniqueId();
    
    // Add brackets
    addNodes([
      {
        id: openBracketId,
        type: NodeType.BRACKET_OPEN,
        position: { x: minX - 200, y: centerY },
        data: { isOpening: true }
      },
      {
        id: closeBracketId,
        type: NodeType.BRACKET_CLOSE,
        position: { x: maxX + 350, y: centerY },
        data: { isOpening: false }
      }
    ]);
    
    return { openBracketId, closeBracketId };
  }

  // Convert AND to OR and vice versa
  function toggleJoinOperator(edgeId: string) {
    const edges = getEdges.value;
    const edge = edges.find(e => e.id === edgeId);
    
    if (!edge || edge.type !== EdgeType.JOIN || !edge.data?.operator) return;
    
    const newOperator = edge.data.operator === JoinOperatorType.AND ? 
      JoinOperatorType.OR : JoinOperatorType.AND;
    
    // Update edge
    removeEdges([edgeId]);
    const newEdge = {
      ...edge,
      data: { ...edge.data, operator: newOperator },
      label: newOperator
    };
    addEdges([newEdge]);
    
    return newOperator;
  }

  // Auto-fit view to show all nodes
  function autoFitView() {
    nextTick(() => {
      fitView({ padding: 50 });
    });
  }

  return {
    // Auto-complete
    autoCompleteBracketGroup,
    promptForBracketAutomation,
    
    // Smart insertion
    insertConditionAtPosition,
    insertConditionOnEdge,
    
    // Pattern templates
    insertAndGroup,
    insertOrGroup,
    insertBracketGroup,
    
    // Layout & positioning
    getSmartPosition,
    alignNodesHorizontally,
    alignNodesVertically,
    spaceNodesEvenly,
    autoFitView,
    
    // Quick actions
    duplicateNodes,
    copyNodes,
    pasteNodes,
    wrapInBrackets,
    toggleJoinOperator,
    
    // State
    selectedNodes,
    clipboard
  };
}