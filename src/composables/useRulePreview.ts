// src/composables/useRulePreview.ts
import { NodeType, JoinOperatorType } from '@/types/rule-builder';
import { DEFAULTS } from '@/composables/useConditionService';

export function useRulePreview() {
  /**
   * Convert create pattern from flow to readable format
   */
  function formatCreatePatternReadable(createPattern: any): string {
    if (!createPattern?.create_pattern?.conditions || createPattern.create_pattern.conditions.length === 0) {
      return 'No conditions';
    }

    const formatted = formatConditionsReadable(createPattern.create_pattern.conditions);
    return formatted || 'Empty conditions';
  }

  /**
   * Recursively format conditions to readable text
   */
  function formatConditionsReadable(conditions: any[]): string {
    if (!conditions || conditions.length === 0) return '';

    const parts: string[] = [];

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];

      if (condition.isGroup) {
        // Group condition - wrap in parentheses
        const groupContent = formatConditionsReadable(condition.conditions);
        if (groupContent) {
          parts.push(`(${groupContent})`);
        } else {
          parts.push('()');
        }
      } else {
        // Simple condition - use defaults for empty values
        const field = condition.field || DEFAULTS.FIELD;
        const operator = condition.operator ? formatOperatorReadable(condition.operator) : formatOperatorReadable(DEFAULTS.OPERATOR);

        // Handle value formatting
        let formattedValue: string;
        if (condition.value !== undefined && condition.value !== null && condition.value !== '') {
          formattedValue = `"${condition.value}"`;
        } else {
          formattedValue = DEFAULTS.EMPTY_VALUE_DISPLAY;
        }

        parts.push(`${field} ${operator} ${formattedValue}`);
      }

      // Add join operator if not the last condition
      if (i < conditions.length - 1) {
        const joinOp = condition.joinOperator || JoinOperatorType.AND;
        parts.push(` ${joinOp} `);
      }
    }

    return parts.join('');
  }

  /**
   * Convert replace pattern to readable format
   */
  function formatReplacePatternReadable(replacePattern: any, replaceType: string): string {
    if (!replacePattern) {
      return 'No replace pattern';
    }

    if (replaceType === 'standard') {
      const field = replacePattern.field || DEFAULTS.FIELD;

      if (replacePattern.withFn) {
        // Handle function formatting
        const fnName = replacePattern.fn || DEFAULTS.EMPTY_FUNCTION_DISPLAY;

        let formattedArg: string;
        if (replacePattern.fnArg !== undefined && replacePattern.fnArg !== null && replacePattern.fnArg !== '') {
          formattedArg = `"${replacePattern.fnArg}"`;
        } else {
          formattedArg = DEFAULTS.EMPTY_FUNCTION_ARG_DISPLAY;
        }

        return `${field} = ${fnName}(${formattedArg})`;
      } else {
        // Handle value formatting
        let formattedValue: string;
        if (replacePattern.value !== undefined && replacePattern.value !== null && replacePattern.value !== '') {
          formattedValue = `"${replacePattern.value}"`;
        } else {
          formattedValue = DEFAULTS.EMPTY_VALUE_DISPLAY;
        }
        return `${field} = ${formattedValue}`;
      }
    } else if (replaceType === 'parameters') {
      if (!replacePattern || replacePattern.length === 0) {
        return 'No parameters';
      }

      const paramPairs = replacePattern.map((param: any) => {
        const name = param.name || 'param';
        // Handle parameter value formatting
        let formattedValue: string;
        if (param.value !== undefined && param.value !== null && param.value !== '') {
          formattedValue = `"${param.value}"`;
        } else {
          formattedValue = DEFAULTS.EMPTY_VALUE_DISPLAY;
        }
        return `${name}=${formattedValue}`;
      });
      return `Set parameters: ${paramPairs.join(', ')}`;
    }

    return 'Unknown replace pattern type';
  }

  /**
   * Convert flow to complete rule JSON payload
   */
  function generateRulePayload(
    createPattern: any,
    replacePattern: any,
    replaceType: string,
    ruleName?: string
  ): any {
    const payload: any = {
      create_pattern: createPattern?.create_pattern || { conditions: [] }
    };

    // Add rule name if provided
    if (ruleName) {
      payload.name = ruleName;
    }

    // Add replace pattern based on type
    if (replaceType === 'standard') {
      payload.replace_pattern = replacePattern || {};
    } else if (replaceType === 'parameters') {
      payload.parameters = replacePattern || [];
    }

    return payload;
  }

  /**
   * Generate flow payload from provided nodes and edges (connected flow only)
   */
  function generateFlowPayload(nodes: any[], edges: any[], rootNodeId?: string, hasValidFlow?: boolean): any {
    console.log('=== Generating flow payload ===');
    console.log('Input:', { nodes: nodes?.length, edges: edges?.length, rootNodeId, hasValidFlow });

    // If no valid flow, return empty
    if (!hasValidFlow || !nodes || nodes.length === 0) {
      console.log('No valid flow or no nodes');
      return {
        create_pattern: { conditions: [] }
      };
    }

    // If less than 2 nodes, show connection message
    if (nodes.length < 2) {
      console.log('Less than 2 nodes');
      return {
        create_pattern: { conditions: [] }
      };
    }

    console.log('Nodes:', nodes.map(n => ({ id: n.id, type: n.type, data: n.data })));
    console.log('Edges:', edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })));

    // Store positions for re-importing later
    const positions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    // Start processing from the root node if specified
    let conditions: any[] = [];

    if (rootNodeId) {
      console.log('Processing from root node:', rootNodeId);
      const rootConditions = buildConditionsFromNode(rootNodeId, nodes, edges);
      conditions = rootConditions;
    } else {
      // Fallback: find root nodes (no incoming edges)
      const rootNodeIds = nodes
        .filter(node => !edges.some(edge => edge.target === node.id))
        .map(node => node.id);

      console.log('Fallback root nodes:', rootNodeIds);

      for (const rootId of rootNodeIds) {
        const rootConditions = buildConditionsFromNode(rootId, nodes, edges);
        conditions = conditions.concat(rootConditions);
      }
    }

    console.log('Final generated conditions:', JSON.stringify(conditions, null, 2));

    const result = {
      create_pattern: {
        conditions,
        positions
      }
    };

    console.log('=== Final payload ===', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Recursively build conditions from a node and its descendants
   */
  function buildConditionsFromNode(nodeId: string, nodes: any[], edges: any[], visited = new Set<string>()): any[] {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    console.log('Processing node:', nodeId, node.type, node.data);

    // Get outgoing edges from this node
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    console.log('Outgoing edges:', outgoingEdges);

    // Handle condition node
    if (node.type === NodeType.CONDITION) {
      const condition: any = {
        id: nodeId,
        field: node.data.field || DEFAULTS.FIELD,
        operator: node.data.operator || DEFAULTS.OPERATOR,
        value: node.data.value || DEFAULTS.VALUE,
        isGroup: false
      };

      console.log('Created condition:', condition);

      // Check for join edges (left/right connections to other conditions)
      const joinEdges = outgoingEdges.filter(edge =>
        edge.type === 'join' ||
        (edge.sourceHandle === 'right' || edge.sourceHandle === 'left')
      );

      // Check for flow edges (top/bottom connections)
      const flowEdges = outgoingEdges.filter(edge =>
        edge.type !== 'join' &&
        (edge.sourceHandle === 'bottom' || edge.sourceHandle === 'top' || !edge.sourceHandle)
      );

      console.log('Join edges:', joinEdges);
      console.log('Flow edges:', flowEdges);

      // If we have join edges, add join operator and continue with joined condition
      if (joinEdges.length > 0) {
        const joinEdge = joinEdges[0];
        if (joinEdge.data?.operator) {
          condition.joinOperator = joinEdge.data.operator;
        } else {
          condition.joinOperator = JoinOperatorType.AND; // Default
        }

        // Process the joined condition
        const joinedNodeId = joinEdge.target;
        const joinedConditions = buildConditionsFromNode(joinedNodeId, nodes, edges, visited);

        console.log('Joined conditions:', joinedConditions);
        return [condition, ...joinedConditions];
      }

      // If we have flow edges but no join edges, follow the flow
      if (flowEdges.length > 0) {
        const nextNodeId = flowEdges[0].target;
        const nextConditions = buildConditionsFromNode(nextNodeId, nodes, edges, visited);

        // Don't add join operator for flow connections
        return [condition, ...nextConditions];
      }

      // No outgoing edges, just return this condition
      return [condition];
    }

    // Handle opening bracket (group)
    if (node.type === NodeType.BRACKET_OPEN) {
      console.log('Processing opening bracket:', nodeId);

      const group: any = {
        id: nodeId,
        isGroup: true,
        conditions: [],
        joinOperator: JoinOperatorType.AND
      };

      // Find content within brackets
      const innerConditions = traverseBracketContent(nodeId, nodes, edges, visited);
      console.log('Inner conditions for bracket:', innerConditions);

      // Always show the bracket, even if empty
      group.conditions = innerConditions;

      // Find the matching closing bracket and check for outgoing edges
      const closingBracket = findMatchingCloseBracket(nodeId, nodes, edges);
      console.log('Found closing bracket:', closingBracket);

      if (closingBracket) {
        // Check for outgoing edges from the closing bracket
        const bracketOutEdges = edges.filter(edge => edge.source === closingBracket.id);
        console.log('Bracket outgoing edges:', bracketOutEdges);

        if (bracketOutEdges.length > 0) {
          const outEdge = bracketOutEdges[0];

          // If it's a join edge, add join operator
          if (outEdge.type === 'join' || outEdge.sourceHandle === 'right' || outEdge.sourceHandle === 'left') {
            if (outEdge.data?.operator) {
              group.joinOperator = outEdge.data.operator;
            }
          }

          // Process the next node after the bracket group
          const nextNodeId = outEdge.target;
          const nextConditions = buildConditionsFromNode(nextNodeId, nodes, edges, visited);

          return [group, ...nextConditions];
        }
      }

      return [group];
    }

    // Skip closing brackets and follow their outgoing edges
    if (node.type === NodeType.BRACKET_CLOSE) {
      console.log('Processing closing bracket:', nodeId);

      if (outgoingEdges.length > 0) {
        // If there's an outgoing edge, follow it
        const nextNodeId = outgoingEdges[0].target;
        return buildConditionsFromNode(nextNodeId, nodes, edges, visited);
      }
      return [];
    }

    return [];
  }

  /**
   * Find content between opening and closing brackets
   */
  function traverseBracketContent(openBracketId: string, nodes: any[], edges: any[], visited: Set<string>): any[] {
    const openNode = nodes.find(n => n.id === openBracketId);
    if (!openNode || openNode.type !== NodeType.BRACKET_OPEN) {
      return [];
    }

    console.log('Traversing bracket content for:', openBracketId);

    // Get the outgoing edges from the opening bracket (only flow edges, not join edges)
    const outgoingEdges = edges.filter(edge =>
      edge.source === openBracketId &&
      edge.type !== 'join' &&
      (edge.sourceHandle === 'source' || edge.sourceHandle === 'bottom' || !edge.sourceHandle)
    );

    console.log('Opening bracket outgoing flow edges:', outgoingEdges);

    if (outgoingEdges.length === 0) {
      console.log('No outgoing flow edges from opening bracket');
      return [];
    }

    // Find all condition nodes that are directly connected to the opening bracket
    const directlyConnectedNodes = outgoingEdges
      .map(edge => edge.target)
      .map(nodeId => nodes.find(n => n.id === nodeId))
      .filter(node => node && node.type === NodeType.CONDITION);

    console.log('Directly connected condition nodes:', directlyConnectedNodes.map(n => n.id));

    if (directlyConnectedNodes.length === 0) {
      return [];
    }

    // If there's only one directly connected condition, process it normally
    if (directlyConnectedNodes.length === 1) {
      const nodeId = directlyConnectedNodes[0].id;
      const newVisited = new Set(visited);
      return buildConditionsFromNode(nodeId, nodes, edges, newVisited);
    }

    // If there are multiple directly connected conditions, we need to handle them specially
    // Check if they are joined together with join edges
    const contentConditions: any[] = [];
    const processedNodes = new Set<string>();

    for (const node of directlyConnectedNodes) {
      if (processedNodes.has(node.id)) continue;

      // Process this condition and any conditions joined to it
      const newVisited = new Set(visited);
      const nodeConditions = buildConditionChain(node.id, nodes, edges, newVisited, processedNodes);
      contentConditions.push(...nodeConditions);
    }

    console.log('Bracket content conditions:', contentConditions);
    return contentConditions;
  }

  /**
   * Build a chain of conditions that are joined together
   */
  function buildConditionChain(startNodeId: string, nodes: any[], edges: any[], visited: Set<string>, processedNodes: Set<string>): any[] {
    if (visited.has(startNodeId) || processedNodes.has(startNodeId)) return [];

    visited.add(startNodeId);
    processedNodes.add(startNodeId);

    const node = nodes.find(n => n.id === startNodeId);
    if (!node || node.type !== NodeType.CONDITION) return [];

    console.log('Building condition chain from:', startNodeId);

    const condition: any = {
      id: startNodeId,
      field: node.data.field || DEFAULTS.FIELD,
      operator: node.data.operator || DEFAULTS.OPERATOR,
      value: node.data.value || DEFAULTS.VALUE,
      isGroup: false
    };

    // Look for join edges from this condition to other conditions
    const joinEdges = edges.filter(edge =>
      edge.source === startNodeId &&
      (edge.type === 'join' || edge.sourceHandle === 'right' || edge.sourceHandle === 'left')
    );

    console.log('Join edges from', startNodeId, ':', joinEdges);

    if (joinEdges.length > 0) {
      const joinEdge = joinEdges[0];
      const targetNode = nodes.find(n => n.id === joinEdge.target);

      // Only follow the join if the target is also a condition
      if (targetNode && targetNode.type === NodeType.CONDITION) {
        // Add join operator
        if (joinEdge.data?.operator) {
          condition.joinOperator = joinEdge.data.operator;
        } else {
          condition.joinOperator = JoinOperatorType.AND; // Default
        }

        // Mark the target as processed and continue the chain
        const nextConditions = buildConditionChain(joinEdge.target, nodes, edges, visited, processedNodes);
        return [condition, ...nextConditions];
      }
    }

    return [condition];
  }

  /**
   * Find the matching closing bracket for an opening bracket
   */
  function findMatchingCloseBracket(openBracketId: string, nodes: any[], edges: any[]): any {
    const openNode = nodes.find(n => n.id === openBracketId);
    if (!openNode || openNode.type !== NodeType.BRACKET_OPEN) {
      return null;
    }

    // BFS to find the closing bracket
    const visited = new Set<string>();
    const queue: string[] = [];

    // Start with the outgoing nodes from the opening bracket
    const outgoingEdges = edges.filter(edge => edge.source === openBracketId);
    outgoingEdges.forEach(edge => queue.push(edge.target));

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      const current = nodes.find(n => n.id === currentId);

      if (!current) {
        continue;
      }

      // Found a closing bracket
      if (current.type === NodeType.BRACKET_CLOSE) {
        return current;
      }

      // Add outgoing nodes to the queue
      const currentOutgoingEdges = edges.filter(edge => edge.source === currentId);
      currentOutgoingEdges.forEach(edge => queue.push(edge.target));
    }

    return null;
  }

  /**
   * Format operator for readable display
   */
  function formatOperatorReadable(operator: string): string {
    switch (operator) {
      case '~~': return 'contains';
      case 'starts_with': return 'starts with';
      case 'ends_with': return 'ends with';
      case '==': return '==';
      case '!=': return '!=';
      default: return operator;
    }
  }

  /**
   * Get preview status message based on flow state
   */
  function getPreviewStatus(nodes: any[], edges: any[], hasValidFlow: boolean): string {
    if (!nodes || nodes.length === 0) {
      return 'Add nodes to start building your rule';
    }

    if (nodes.length === 1) {
      return 'Add more nodes and connect them';
    }

    if (!hasValidFlow) {
      return 'Connect at least two nodes';
    }

    return `Preview for ${nodes.length} connected nodes`;
  }

  return {
    formatCreatePatternReadable,
    formatReplacePatternReadable,
    generateRulePayload,
    generateFlowPayload,
    formatOperatorReadable,
    getPreviewStatus
  };
}