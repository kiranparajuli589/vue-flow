<!-- src/components/rule-flow/RulePreview.vue (Updated for Edge Joins) -->
<template>
  <div class="rule-preview">
    <div v-if="isValid" class="preview-valid">
      <div class="preview-section">
        <h4>Human-Readable</h4>
        <div class="readable-rule">{{ readableRule }}</div>
      </div>

      <div class="preview-section">
        <h4>Lua Expression</h4>
        <pre class="lua-expression">{{ luaExpression }}</pre>
      </div>
    </div>

    <div v-else class="preview-invalid">
      <div class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ validationMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { NodeType, JoinOperatorType } from '@/types/rule-builder';
import { useRuleService } from '@/composables/useRuleService';

// Props
defineProps<{
  elements: any[];
}>();

// Get Vue Flow utilities
const { getNodes, getEdges } = useVueFlow();

// Get rule service for validation
const { validateFlow } = useRuleService();

// Determine if rule is valid
const isValid = computed(() => validateFlow.value.valid);

// Get validation message
const validationMessage = computed(() => validateFlow.value.message);

// Generate readable rule text
const readableRule = computed(() => {
  if (!isValid.value) return '';

  // Generate a human-readable representation based on the current nodes and edges
  return formatReadableRule();
});

// Generate Lua expression
const luaExpression = computed(() => {
  if (!isValid.value) return '';

  // Generate a Lua expression from the rule
  return formatLuaExpression();
});

// Find all root nodes (nodes with no incoming edges)
function findRootNodes() {
  const nodes = getNodes.value;
  const edges = getEdges.value;

  return nodes.filter(node =>
    !edges.some(edge => edge.target === node.id)
  );
}

// Format human-readable rule text
function formatReadableRule() {
  const rootNodes = findRootNodes();
  let result = '';

  for (const rootNode of rootNodes) {
    result += formatNodePath(rootNode.id);
  }

  return result || 'No valid rule constructed yet.';
}

// Format Lua expression
function formatLuaExpression() {
  const rootNodes = findRootNodes();
  let result = '';

  for (const rootNode of rootNodes) {
    result += formatNodePathAsLua(rootNode.id);
  }

  return result || '-- No valid rule constructed yet';
}

// Recursively follow node path to format readable rule
function formatNodePath(nodeId: string, depth = 0, visited = new Set<string>()) {
  if (visited.has(nodeId)) return '';
  visited.add(nodeId);

  const node = getNodes.value.find(n => n.id === nodeId);
  if (!node) return '';

  const indent = '  '.repeat(depth);
  let result = '';

  // Format based on node type
  if (node.type === NodeType.CONDITION) {
    result += `${indent}${node.data.field} ${formatOperator(node.data.operator)} "${node.data.value}"`;
  } else if (node.type === NodeType.BRACKET_OPEN) {
    result += `${indent}(`;
  } else if (node.type === NodeType.BRACKET_CLOSE) {
    result += `${indent})`;
  }

  // Find outgoing edges
  const outEdges = getEdges.value.filter(edge => edge.source === nodeId);

  if (outEdges.length > 0) {
    const nextNodeId = outEdges[0].target;
    const joinOperator = outEdges[0].data?.operator || JoinOperatorType.AND;

    // Add join operator if going to another node
    const nextNode = getNodes.value.find(n => n.id === nextNodeId);

    if (nextNode) {
      // Special case for brackets - don't add operators between opening and closing brackets
      if (
        (node.type === NodeType.BRACKET_OPEN && nextNode.type === NodeType.BRACKET_CLOSE) ||
        (node.type === NodeType.BRACKET_CLOSE && nextNode.type === NodeType.BRACKET_OPEN)
      ) {
        result += "\n" + formatNodePath(nextNodeId, depth, visited);
      } else if (node.type === NodeType.BRACKET_OPEN) {
        // After an opening bracket, increase indent but don't add operator
        result += "\n" + formatNodePath(nextNodeId, depth + 1, visited);
      } else if (nextNode.type === NodeType.BRACKET_CLOSE) {
        // Before a closing bracket, just add the bracket on a new line
        result += "\n" + formatNodePath(nextNodeId, depth - 1, visited);
      } else {
        // Normal case - add operator and continue
        result += ` ${joinOperator}\n` + formatNodePath(nextNodeId, depth, visited);
      }
    }
  }

  return result;
}

// Recursively follow node path to format Lua expression
function formatNodePathAsLua(nodeId: string, visited = new Set<string>()) {
  if (visited.has(nodeId)) return '';
  visited.add(nodeId);

  const node = getNodes.value.find(n => n.id === nodeId);
  if (!node) return '';

  let result = '';

  // Format based on node type
  if (node.type === NodeType.CONDITION) {
    if (node.data.operator === 'starts_with') {
      result += `string.sub(${node.data.field}, 1, ${node.data.value.length}) == "${node.data.value}"`;
    } else if (node.data.operator === 'ends_with') {
      result += `string.sub(${node.data.field}, -${node.data.value.length}) == "${node.data.value}"`;
    } else if (node.data.operator === '~~') {
      result += `string.find(${node.data.field}, "${node.data.value}") ~= nil`;
    } else {
      result += `${node.data.field} ${node.data.operator} "${node.data.value}"`;
    }
  } else if (node.type === NodeType.BRACKET_OPEN) {
    result += '(';
  } else if (node.type === NodeType.BRACKET_CLOSE) {
    result += ')';
  }

  // Find outgoing edges
  const outEdges = getEdges.value.filter(edge => edge.source === nodeId);

  if (outEdges.length > 0) {
    const nextNodeId = outEdges[0].target;
    const joinOperator = outEdges[0].data?.operator || JoinOperatorType.AND;

    // Add join operator if going to another node
    const nextNode = getNodes.value.find(n => n.id === nextNodeId);

    if (nextNode) {
      // Special case for brackets - don't add operators between opening and contents or closing brackets
      if (
        (node.type === NodeType.BRACKET_OPEN && nextNode.type === NodeType.BRACKET_CLOSE) ||
        (node.type === NodeType.BRACKET_CLOSE && nextNode.type === NodeType.BRACKET_OPEN)
      ) {
        result += formatNodePathAsLua(nextNodeId, visited);
      } else if (node.type === NodeType.BRACKET_OPEN) {
        // After an opening bracket, don't add operator
        result += formatNodePathAsLua(nextNodeId, visited);
      } else if (nextNode.type === NodeType.BRACKET_CLOSE) {
        // Before a closing bracket, don't add operator
        result += formatNodePathAsLua(nextNodeId, visited);
      } else {
        // Normal case - add operator and continue
        result += ` ${joinOperator} ` + formatNodePathAsLua(nextNodeId, visited);
      }
    }
  }

  return result;
}

// Helper function to format operator for display
function formatOperator(operator: string) {
  switch (operator) {
    case '~~': return 'contains';
    case 'starts_with': return 'starts with';
    case 'ends_with': return 'ends with';
    default: return operator;
  }
}
</script>

<style scoped>
.rule-preview {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 6px;
}

.preview-valid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
}

.readable-rule {
  font-family: monospace;
  white-space: pre-wrap;
  background-color: white;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  line-height: 1.5;
}

.lua-expression {
  font-family: monospace;
  background-color: #2d3748;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-size: 14px;
}

.preview-invalid {
  padding: 12px;
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 4px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e53e3e;
}

.error-message svg {
  width: 20px;
  height: 20px;
}
</style>
