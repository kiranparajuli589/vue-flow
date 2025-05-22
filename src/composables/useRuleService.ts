// src/composables/useRuleService.ts
import { ref, computed } from 'vue';
import { type Edge, useVueFlow } from '@vue-flow/core'
import { NodeType, FieldType, OperatorType, JoinOperatorType, EdgeType } from '@/types/rule-builder';
import type { RuleOutput, FlowNode, FlowEdge } from '@/types/rule-builder';
import { generateUniqueId } from '@/utils/helpers';

export function useRuleService() {
  const {
    getNodes,
    getEdges,
    findNode,
    addNodes,
    addEdges,
  } = useVueFlow();

  const flowValid = ref(false);

  /**
   * Determines the appropriate edge type based on source and target nodes and handles
   */
  function determineEdgeType(sourceNodeId: string, targetNodeId: string, sourceHandle?: string, targetHandle?: string): EdgeType {
    const sourceNode = findNode(sourceNodeId);
    const targetNode = findNode(targetNodeId);

    if (!sourceNode || !targetNode) {
      return EdgeType.SIMPLE; // Default fallback
    }

    // BRACKET-SPECIFIC RULES (highest priority)
    
    // Rule 1: → Opening Bracket (incoming) = JOIN edge
    if (targetNode.type === NodeType.BRACKET_OPEN) {
      return EdgeType.JOIN;
    }
    
    // Rule 2: Opening Bracket → (outgoing) = SIMPLE edge
    if (sourceNode.type === NodeType.BRACKET_OPEN) {
      return EdgeType.SIMPLE;
    }
    
    // Rule 3: → Closing Bracket (incoming) = SIMPLE edge
    if (targetNode.type === NodeType.BRACKET_CLOSE) {
      return EdgeType.SIMPLE;
    }
    
    // Rule 4: Closing Bracket → (outgoing) = JOIN edge
    if (sourceNode.type === NodeType.BRACKET_CLOSE) {
      return EdgeType.JOIN;
    }

    // HANDLE-SPECIFIC RULES (for condition-to-condition connections)
    if (sourceHandle && targetHandle) {
      // Join edge if using left/right handles (green handles)
      if ((sourceHandle === 'right' || sourceHandle === 'left') && 
          (targetHandle === 'left' || targetHandle === 'right')) {
        return EdgeType.JOIN;
      }
      
      // Simple edge if using top/bottom handles (blue handles)
      if ((sourceHandle === 'top' || sourceHandle === 'bottom') && 
          (targetHandle === 'top' || targetHandle === 'bottom')) {
        return EdgeType.SIMPLE;
      }
    }

    // FALLBACK RULES
    // Join edge case (condition to condition) - but only if no specific handles specified
    if (sourceNode.type === NodeType.CONDITION && 
        targetNode.type === NodeType.CONDITION && 
        !sourceHandle && !targetHandle) {
      return EdgeType.JOIN;
    }

    // Default to simple for other cases
    return EdgeType.SIMPLE;
  }

  /**
   * Creates an edge with the appropriate type based on the connected nodes
   */
  function createSmartEdge(sourceNodeId: string, targetNodeId: string, sourceHandle?: string, targetHandle?: string): Edge {
    const edgeId = `edge-${generateUniqueId()}`;
    const edgeType = determineEdgeType(sourceNodeId, targetNodeId, sourceHandle, targetHandle);

    const baseEdge = {
      id: edgeId,
      source: sourceNodeId,
      target: targetNodeId,
      type: edgeType,
      sourceHandle,
      targetHandle,
    };

    if (edgeType === EdgeType.JOIN) {
      // Join edge with default AND operator
      const operator = JoinOperatorType.AND;
      return {
        ...baseEdge,
        label: operator,
        labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
        labelStyle: { fontWeight: 700, fill: '#4299e1' },
        data: { operator },
        style: { stroke: '#4299e1', strokeWidth: 2 },
      };
    } else {
      // Simple edge with animation
      return {
        ...baseEdge,
        animated: true,
        style: { stroke: '#6b7280', strokeWidth: 2 },
      };
    }
  }

  /**
   * Validates the entire rule flow
   */
  const validateFlow = computed(() => {
    // Check if we have at least one condition
    const conditionNodes = getNodes.value.filter(node => node.type === NodeType.CONDITION);
    if (conditionNodes.length === 0) {
      return {
        valid: false,
        message: 'At least one condition is required.'
      };
    }

    // Check if any condition has validation errors
    const errorCondition = conditionNodes.find(node => !!node.data.error);
    if (errorCondition) {
      return {
        valid: false,
        message: `Condition has error: ${errorCondition.data.error}`
      };
    }

    // Check bracket pairing
    const openBrackets = getNodes.value.filter(node => node.type === NodeType.BRACKET_OPEN).length;
    const closeBrackets = getNodes.value.filter(node => node.type === NodeType.BRACKET_CLOSE).length;
    if (openBrackets !== closeBrackets) {
      return {
        valid: false,
        message: 'Unbalanced brackets. Each opening bracket must have a matching closing bracket.'
      };
    }

    // Check if there are disconnected nodes (except possibly the last one)
    const edges = getEdges.value;
    const nodes = getNodes.value;

    if (nodes.length > 1) {
      // Ensure there's at least N-1 edges for N nodes
      if (edges.length < nodes.length - 1) {
        return {
          valid: false,
          message: 'Some nodes are disconnected. Please connect all nodes.'
        };
      }
    }

    return {
      valid: true,
      message: 'Rule is valid'
    };
  });

  /**
   * Converts the flow structure to a rule format
   */
  function convertFlowToRule(): RuleOutput {
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

    // Find root nodes (nodes with no incoming edges)
    const rootNodeIds = nodes
      .filter(node => !edges.some(edge => edge.target === node.id))
      .map(node => node.id);

    // Store positions for re-importing later
    const positions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    // Build the rule structure from each root node
    let conditions: any[] = [];

    for (const rootNodeId of rootNodeIds) {
      const rootConditions = buildConditionsFromNode(rootNodeId);
      conditions = conditions.concat(rootConditions);
    }

    return {
      create_pattern: {
        conditions,
        positions
      }
    };
  }

  /**
   * Recursive function to build conditions from a node and its descendants
   */
  function buildConditionsFromNode(nodeId: string, visited = new Set<string>()): any[] {
    if (visited.has(nodeId)) return [];

    visited.add(nodeId);

    const node = findNode(nodeId);
    if (!node) return [];

    // Get outgoing edges from this node
    const outgoingEdges = getEdges.value.filter(edge => edge.source === nodeId);

    // Base case: this is a condition node
    if (node.type === NodeType.CONDITION) {
      const condition = {
        field: node.data.field,
        operator: node.data.operator,
        value: node.data.value,
        isGroup: false
      };

      // If this node has no outgoing edges, just return the condition
      if (outgoingEdges.length === 0) {
        return [condition];
      }

      // Only add join operator if the edge is a JOIN type
      const joinEdges = outgoingEdges.filter(edge => edge.type === EdgeType.JOIN);
      if (joinEdges.length > 0 && joinEdges[0].data?.operator) {
        condition.joinOperator = joinEdges[0].data.operator;
      }

      // Process the next node
      const nextNodeId = outgoingEdges[0].target;
      const nextConditions = buildConditionsFromNode(nextNodeId, visited);

      return [condition, ...nextConditions];
    }

    // Handle bracket node (for grouping)
    if (node.type === NodeType.BRACKET_OPEN) {
      // We'll need to find the matching closing bracket
      const bracketGroup = {
        isGroup: true,
        conditions: [] as any[],
        joinOperator: JoinOperatorType.AND
      };

      // Find the path through the brackets
      const innerConditions = traverseBracketContent(nodeId);
      if (innerConditions.length > 0) {
        bracketGroup.conditions = innerConditions;

        // Find if there's an outgoing edge from the closing bracket
        const lastBracketNode = findMatchingCloseBracket(nodeId);
        if (lastBracketNode) {
          const bracketOutEdges = getEdges.value.filter(edge => 
            edge.source === lastBracketNode.id && edge.type === EdgeType.JOIN);

          if (bracketOutEdges.length > 0) {
            // Get the join operator from this edge
            if (bracketOutEdges[0].data?.operator) {
              bracketGroup.joinOperator = bracketOutEdges[0].data.operator;
            }

            // Process the next node after the bracket group
            const nextNodeId = bracketOutEdges[0].target;
            const nextConditions = buildConditionsFromNode(nextNodeId, visited);

            return [bracketGroup, ...nextConditions];
          }
        }

        return [bracketGroup];
      }
    }

    // Skip closing brackets - they should be handled by the opening brackets
    if (node.type === NodeType.BRACKET_CLOSE) {
      if (outgoingEdges.length > 0) {
        // If there's an outgoing edge, follow it
        const nextNodeId = outgoingEdges[0].target;
        return buildConditionsFromNode(nextNodeId, visited);
      }
      return [];
    }

    return [];
  }

  /**
   * Find content between an opening bracket and its matching closing bracket
   */
  function traverseBracketContent(openBracketId: string, visited = new Set<string>()): any[] {
    const openNode = findNode(openBracketId);
    if (!openNode || openNode.type !== NodeType.BRACKET_OPEN || visited.has(openBracketId)) {
      return [];
    }

    visited.add(openBracketId);

    // Get the outgoing edge from the opening bracket
    const outgoingEdges = getEdges.value.filter(edge => edge.source === openBracketId);

    if (outgoingEdges.length === 0) {
      return [];
    }

    // Get the next node after the opening bracket
    const nextNodeId = outgoingEdges[0].target;
    const nextNode = findNode(nextNodeId);

    if (!nextNode) {
      return [];
    }

    // If next node is a closing bracket, there's no content
    if (nextNode.type === NodeType.BRACKET_CLOSE) {
      return [];
    }

    // Process content within brackets
    return buildConditionsFromNode(nextNodeId, new Set([...visited, openBracketId]));
  }

  /**
   * Find the matching closing bracket for an opening bracket
   */
  function findMatchingCloseBracket(openBracketId: string): any {
    const openNode = findNode(openBracketId);
    if (!openNode || openNode.type !== NodeType.BRACKET_OPEN) {
      return null;
    }

    // BFS to find the closing bracket
    const visited = new Set<string>();
    const queue: string[] = [];

    // Start with the outgoing nodes from the opening bracket
    const outgoingEdges = getEdges.value.filter(edge => edge.source === openBracketId);
    outgoingEdges.forEach(edge => queue.push(edge.target));

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      const current = findNode(currentId);

      if (!current) {
        continue;
      }

      // Found a closing bracket
      if (current.type === NodeType.BRACKET_CLOSE) {
        return current;
      }

      // Add outgoing nodes to the queue
      const currentOutgoingEdges = getEdges.value.filter(edge => edge.source === currentId);
      currentOutgoingEdges.forEach(edge => queue.push(edge.target));
    }

    return null;
  }

  /**
   * Imports an existing rule into the flow
   */
  function importRule(rule: any) {
    if (!rule || !rule.create_pattern || !rule.create_pattern.conditions) {
      return;
    }

    // Extract saved positions if available
    const positions = rule.create_pattern.positions || {};

    // Create nodes and edges from the rule structure
    const { nodes, edges } = createNodesFromConditions(rule.create_pattern.conditions, positions);

    // Add nodes and edges to the flow
    if (nodes.length > 0) {
      addNodes(nodes);
    }

    if (edges.length > 0) {
      addEdges(edges);
    }
  }

  /**
   * Creates flow nodes from rule conditions
   */
  function createNodesFromConditions(conditions: any[], positions: Record<string, { x: number; y: number }> = {}) {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let lastNodeId: string | null = null;

    // Helper function to process conditions recursively
    function processCondition(condition: any, x = 100, y = 100, level = 0): string | null {
      if (condition.isGroup) {
        // Create bracket group
        const openBracketId = generateUniqueId();
        const openBracketPosition = positions[openBracketId] || { x, y };

        // Create opening bracket
        nodes.push({
          id: openBracketId,
          type: NodeType.BRACKET_OPEN,
          position: openBracketPosition,
          data: { isOpening: true }
        });

        // Connect to previous node if there is one
        if (lastNodeId) {
          const edge = createSmartEdge(lastNodeId, openBracketId);
          // Set the join operator if specified and it's a join edge
          if (condition.joinOperator && edge.type === EdgeType.JOIN) {
            edge.data = { ...edge.data, operator: condition.joinOperator };
            edge.label = condition.joinOperator;
          }
          edges.push(edge);
        }

        // Process conditions inside the bracket
        let innerLastNodeId: string | null = null;

        condition.conditions.forEach((innerCondition: any, index: number) => {
          const newNodeId = processCondition(
            innerCondition,
            x + 150,
            y + index * 100,
            level + 1
          );

          // Connect the inner node to the opening bracket if it's the first one
          if (newNodeId && innerLastNodeId === null) {
            edges.push(createSmartEdge(openBracketId, newNodeId));
          }

          innerLastNodeId = newNodeId;
        });

        // Create closing bracket
        const closeBracketId = generateUniqueId();
        const closeBracketPosition = positions[closeBracketId] || {
          x: x + 300,
          y
        };

        nodes.push({
          id: closeBracketId,
          type: NodeType.BRACKET_CLOSE,
          position: closeBracketPosition,
          data: { isOpening: false }
        });

        // Connect last inner node to closing bracket if there is one
        if (innerLastNodeId) {
          edges.push(createSmartEdge(innerLastNodeId, closeBracketId));
        } else {
          // If no inner conditions, connect opening directly to closing
          edges.push(createSmartEdge(openBracketId, closeBracketId));
        }

        lastNodeId = closeBracketId;
        return closeBracketId;
      } else {
        // Regular condition node with default values fallback
        const conditionId = generateUniqueId();
        const conditionPosition = positions[conditionId] || { x, y };

        nodes.push({
          id: conditionId,
          type: NodeType.CONDITION,
          position: conditionPosition,
          data: {
            field: condition.field || FieldType.URI_PATH,
            operator: condition.operator || OperatorType.EQUALS,
            value: condition.value || ''
          }
        });

        // Connect to previous node if there is one
        if (lastNodeId) {
          const edge = createSmartEdge(lastNodeId, conditionId);
          // Set the join operator if specified and it's a join edge
          if (condition.joinOperator && edge.type === EdgeType.JOIN) {
            edge.data = { ...edge.data, operator: condition.joinOperator };
            edge.label = condition.joinOperator;
          }
          edges.push(edge);
        }

        lastNodeId = conditionId;
        return conditionId;
      }
    }

    // Process each condition in sequence
    conditions.forEach((condition, index) => {
      processCondition(condition, 100, 100 + index * 150);
    });

    return { nodes, edges };
  }

  /**
   * Creates a default start node with proper defaults
   */
  function createDefaultStartNode() {
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

  // Legacy function for backward compatibility
  function createDefaultEdge(source: string, target: string, sourceHandle?: string, targetHandle?: string): Edge {
    return createSmartEdge(source, target, sourceHandle, targetHandle);
  }

  return {
    convertFlowToRule,
    importRule,
    createDefaultStartNode,
    createDefaultEdge,
    createSmartEdge,
    determineEdgeType,
    validateFlow,
    flowValid
  };
}