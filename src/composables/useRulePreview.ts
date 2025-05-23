// src/composables/useRulePreview.ts
import { NodeType, JoinOperatorType } from '@/types/rule-builder';

export function useRulePreview() {
  /**
   * Convert create pattern from flow to readable format
   */
  function formatCreatePatternReadable(createPattern: any): string {
    console.log('Formatting create pattern:', createPattern);
    
    if (!createPattern?.create_pattern?.conditions || createPattern.create_pattern.conditions.length === 0) {
      return 'No conditions defined';
    }

    const formatted = formatConditionsReadable(createPattern.create_pattern.conditions);
    console.log('Formatted readable:', formatted);
    
    // Always return the formatted string, even if it contains incomplete conditions
    return formatted || 'No conditions found';
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
        }
      } else {
        // Simple condition - use defaults if values are missing
        const field = condition.field || 'req.uri.path'; // Default field
        const operator = condition.operator ? formatOperatorReadable(condition.operator) : '=='; // Default operator
        
        // Handle value formatting - don't double-quote
        let formattedValue: string;
        if (condition.value !== undefined && condition.value !== null && condition.value !== '') {
          formattedValue = `"${condition.value}"`;
        } else {
          formattedValue = '""'; // Just empty quotes, don't add extra quotes
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
      return 'No replace pattern defined';
    }

    if (replaceType === 'standard') {
      const field = replacePattern.field || 'req.uri.path'; // Default field
      
      if (replacePattern.withFn && replacePattern.fn) {
        // Handle function argument formatting
        let formattedArg: string;
        if (replacePattern.fnArg !== undefined && replacePattern.fnArg !== null && replacePattern.fnArg !== '') {
          formattedArg = `"${replacePattern.fnArg}"`;
        } else {
          formattedArg = '""';
        }
        return `${field} = ${replacePattern.fn}(${formattedArg})`;
      } else {
        // Handle value formatting
        let formattedValue: string;
        if (replacePattern.value !== undefined && replacePattern.value !== null && replacePattern.value !== '') {
          formattedValue = `"${replacePattern.value}"`;
        } else {
          formattedValue = '""';
        }
        return `${field} = ${formattedValue}`;
      }
    } else if (replaceType === 'parameters') {
      if (!replacePattern || replacePattern.length === 0) {
        return 'No parameters defined';
      }
      
      const paramPairs = replacePattern.map((param: any) => {
        const name = param.name || 'param';
        // Handle parameter value formatting
        let formattedValue: string;
        if (param.value !== undefined && param.value !== null && param.value !== '') {
          formattedValue = `"${param.value}"`;
        } else {
          formattedValue = '""';
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
   * Generate flow payload from provided nodes and edges
   */
  function generateFlowPayload(nodes: any[], edges: any[]): any {
    console.log('Generating flow payload from:', { nodes, edges });

    if (!nodes || nodes.length === 0) {
      return {
        create_pattern: { conditions: [] }
      };
    }

    // Find root nodes (nodes with no incoming edges) OR if no edges exist, use all condition nodes
    let rootNodeIds: string[];
    
    if (!edges || edges.length === 0) {
      // No edges - treat all condition nodes as root nodes
      rootNodeIds = nodes
        .filter(node => node.type === NodeType.CONDITION)
        .map(node => node.id);
    } else {
      // Has edges - find actual root nodes
      rootNodeIds = nodes
        .filter(node => !edges.some(edge => edge.target === node.id))
        .map(node => node.id);
    }

    console.log('Root node IDs:', rootNodeIds);

    // Store positions for re-importing later
    const positions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    // Build conditions from root nodes
    let conditions: any[] = [];

    if (rootNodeIds.length === 0 && nodes.length > 0) {
      // Fallback: if no clear root nodes but we have nodes, try to process all condition nodes
      const conditionNodes = nodes.filter(node => node.type === NodeType.CONDITION);
      for (const node of conditionNodes) {
        conditions.push({
          id: node.id,
          field: node.data.field || 'req.uri.path', // Use default if missing
          operator: node.data.operator || '==',       // Use default if missing
          value: node.data.value || '',               // Use empty string if missing
          isGroup: false
        });
      }
    } else {
      // Normal case: build from root nodes
      for (const rootNodeId of rootNodeIds) {
        const rootConditions = buildConditionsFromNode(rootNodeId, nodes, edges);
        conditions = conditions.concat(rootConditions);
      }
    }

    console.log('Generated conditions:', conditions);

    return {
      create_pattern: {
        conditions,
        positions
      }
    };
  }

  /**
   * Recursively build conditions from a node and its descendants
   */
  function buildConditionsFromNode(nodeId: string, nodes: any[], edges: any[], visited = new Set<string>()): any[] {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    // Get outgoing edges from this node
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);

    // Handle condition node
    if (node.type === NodeType.CONDITION) {
      const condition: any = {
        id: nodeId,
        field: node.data.field || 'req.uri.path', // Use default if missing
        operator: node.data.operator || '==',     // Use default if missing  
        value: node.data.value || '',             // Use empty string if missing
        isGroup: false
      };

      // If no outgoing edges, return just this condition
      if (outgoingEdges.length === 0) {
        return [condition];
      }

      // Add join operator from JOIN edges
      const joinEdges = outgoingEdges.filter(edge => edge.type === 'join');
      if (joinEdges.length > 0 && joinEdges[0].data?.operator) {
        condition.joinOperator = joinEdges[0].data.operator;
      }

      // Process the next node
      const nextNodeId = outgoingEdges[0].target;
      const nextConditions = buildConditionsFromNode(nextNodeId, nodes, edges, visited);

      return [condition, ...nextConditions];
    }

    // Handle opening bracket (group)
    if (node.type === NodeType.BRACKET_OPEN) {
      const group: any = {
        id: nodeId,
        isGroup: true,
        conditions: [],
        joinOperator: JoinOperatorType.AND
      };

      // Find content within brackets
      const innerConditions = traverseBracketContent(nodeId, nodes, edges, visited);
      if (innerConditions.length > 0) {
        group.conditions = innerConditions;

        // Find the matching closing bracket and check for outgoing join edges
        const lastBracketNode = findMatchingCloseBracket(nodeId, nodes, edges);
        if (lastBracketNode) {
          const bracketOutEdges = edges.filter(edge => 
            edge.source === lastBracketNode.id && edge.type === 'join');

          if (bracketOutEdges.length > 0) {
            // Get the join operator from this edge
            if (bracketOutEdges[0].data?.operator) {
              group.joinOperator = bracketOutEdges[0].data.operator;
            }

            // Process the next node after the bracket group
            const nextNodeId = bracketOutEdges[0].target;
            const nextConditions = buildConditionsFromNode(nextNodeId, nodes, edges, visited);

            return [group, ...nextConditions];
          }
        }

        return [group];
      }
    }

    // Skip closing brackets and follow their outgoing edges
    if (node.type === NodeType.BRACKET_CLOSE) {
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
    if (!openNode || openNode.type !== NodeType.BRACKET_OPEN || visited.has(openBracketId)) {
      return [];
    }

    // Get the outgoing edge from the opening bracket
    const outgoingEdges = edges.filter(edge => edge.source === openBracketId);

    if (outgoingEdges.length === 0) {
      return [];
    }

    // Get the next node after the opening bracket
    const nextNodeId = outgoingEdges[0].target;
    const nextNode = nodes.find(n => n.id === nextNodeId);

    if (!nextNode) {
      return [];
    }

    // If next node is a closing bracket, there's no content
    if (nextNode.type === NodeType.BRACKET_CLOSE) {
      return [];
    }

    // Process content within brackets
    return buildConditionsFromNode(nextNodeId, nodes, edges, new Set([...visited, openBracketId]));
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
   * Validate if rule is complete and valid
   */
  function validateRule(createPattern: any, replacePattern: any, replaceType: string, nodes: any[] = []): { valid: boolean; message: string } {
    // Check if we have any nodes at all
    if (!nodes || nodes.length === 0) {
      return { valid: false, message: 'Add some conditions to start building your rule' };
    }

    // Check if we have condition nodes
    const conditionNodes = nodes.filter(node => node.type === NodeType.CONDITION);
    if (conditionNodes.length === 0) {
      return { valid: false, message: 'Add at least one condition node' };
    }

    // Check create pattern structure - be more flexible about the structure
    const hasConditions = createPattern?.create_pattern?.conditions && 
                         createPattern.create_pattern.conditions.length > 0;
    
    if (!hasConditions) {
      // If we have condition nodes but no flow structure, it's still preview-worthy
      return { valid: false, message: 'Connect your condition nodes to create a valid flow' };
    }

    // For preview purposes, we'll show the rule even if some fields are incomplete
    // The individual condition nodes will handle their own validation
    
    // Only validate replace pattern if it has some content
    if (replaceType === 'standard' && replacePattern && replacePattern.field) {
      if (!replacePattern.withFn && !replacePattern.value) {
        return { valid: false, message: 'Replace pattern value is required' };
      }
      if (replacePattern.withFn && (!replacePattern.fn || !replacePattern.fnArg)) {
        return { valid: false, message: 'Function and argument are required when using functions' };
      }
    } else if (replaceType === 'parameters' && replacePattern && replacePattern.length > 0) {
      const hasInvalidParams = replacePattern.some((param: any) => !param.name || !param.value);
      if (hasInvalidParams) {
        return { valid: false, message: 'All parameters must have name and value' };
      }
    }

    // If we reach here, show the preview (even if some condition values are empty)
    return { valid: true, message: 'Rule preview' };
  }

  /**
   * Check for empty conditions recursively
   */
  function checkForEmptyConditions(conditions: any[]): boolean {
    for (const condition of conditions) {
      if (condition.isGroup) {
        if (checkForEmptyConditions(condition.conditions)) {
          return true;
        }
      } else {
        // Check if any required field is missing or empty
        if (!condition.field || 
            !condition.operator || 
            condition.value === undefined || 
            condition.value === null || 
            condition.value === '') {
          return true;
        }
      }
    }
    return false;
  }

  return {
    formatCreatePatternReadable,
    formatReplacePatternReadable,
    generateRulePayload,
    generateFlowPayload,
    validateRule,
    formatOperatorReadable
  };
}