<!-- src/components/rule-flow/RulePreview.vue -->
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

const props = defineProps<{
  elements: any[];
}>();

const { getNodes, getEdges } = useVueFlow();

const isValid = computed(() => {
  // Check if we have at least one condition
  const conditionNodes = getNodes.value.filter(node => node.type === NodeType.CONDITION);
  if (conditionNodes.length === 0) {
    return false;
  }

  // Check if any condition has validation errors
  const hasConditionErrors = conditionNodes.some(node => !!node.data.error);
  if (hasConditionErrors) {
    return false;
  }

  // Check bracket pairing
  const openBrackets = getNodes.value.filter(node => node.type === NodeType.BRACKET_OPEN).length;
  const closeBrackets = getNodes.value.filter(node => node.type === NodeType.BRACKET_CLOSE).length;
  if (openBrackets !== closeBrackets) {
    return false;
  }

  // Check connection validity
  const edges = getEdges.value;
  const nodes = getNodes.value;

  // Make sure all nodes (except possibly the last one) have outgoing connections
  const nodesWithoutOutgoing = nodes.filter(node =>
    !edges.some(edge => edge.source === node.id)
  );

  if (nodesWithoutOutgoing.length > 1) {
    return false;
  }

  // Make sure joins have both incoming and outgoing connections
  const joinNodes = nodes.filter(node => node.type === NodeType.JOIN);
  const invalidJoins = joinNodes.filter(node => {
    const incoming = edges.filter(edge => edge.target === node.id).length;
    const outgoing = edges.filter(edge => edge.source === node.id).length;
    return incoming === 0 || outgoing === 0;
  });

  if (invalidJoins.length > 0) {
    return false;
  }

  return true;
});

const validationMessage = computed(() => {
  // Return appropriate validation message based on what's wrong
  const conditionNodes = getNodes.value.filter(node => node.type === NodeType.CONDITION);

  if (conditionNodes.length === 0) {
    return 'At least one condition is required.';
  }

  const errorCondition = conditionNodes.find(node => !!node.data.error);
  if (errorCondition) {
    return `Condition has error: ${errorCondition.data.error}`;
  }

  const openBrackets = getNodes.value.filter(node => node.type === NodeType.BRACKET_OPEN).length;
  const closeBrackets = getNodes.value.filter(node => node.type === NodeType.BRACKET_CLOSE).length;
  if (openBrackets !== closeBrackets) {
    return 'Unbalanced brackets. Each opening bracket must have a matching closing bracket.';
  }

  const joinNodes = getNodes.value.filter(node => node.type === NodeType.JOIN);
  const invalidJoins = joinNodes.filter(node => {
    const incoming = getEdges.value.filter(edge => edge.target === node.id).length;
    const outgoing = getEdges.value.filter(edge => edge.source === node.id).length;
    return incoming === 0 || outgoing === 0;
  });

  if (invalidJoins.length > 0) {
    return 'Join operators must connect two nodes.';
  }

  return 'Invalid rule structure.';
});

const readableRule = computed(() => {
  if (!isValid.value) return '';

  // Generate a human-readable representation of the rule
  const rule = buildRuleStructure();
  if (!rule.create_pattern || !rule.create_pattern.conditions) {
    return '';
  }

  return formatReadableRule(rule.create_pattern.conditions);
});

const luaExpression = computed(() => {
  if (!isValid.value) return '';

  // Generate a Lua expression from the rule
  const rule = buildRuleStructure();
  if (!rule.create_pattern || !rule.create_pattern.conditions) {
    return '';
  }

  return formatLuaExpression(rule.create_pattern.conditions);
});

// Build a rule structure from the flow
function buildRuleStructure() {
  const nodes = getNodes.value;
  const edges = getEdges.value;

  // Find the starting node (node with no incoming edges)
  let startNodeId = nodes.find(node =>
    !edges.some(edge => edge.target === node.id)
  )?.id;

  // If no clear start node, just pick the first one
  if (!startNodeId && nodes.length > 0) {
    startNodeId = nodes[0].id;
  }

  // Build the rule structure by traversing the flow
  const conditions = buildConditionsArray(startNodeId);

  return {
    create_pattern: {
      conditions
    }
  };
}

// This function is similar to the one in the main component
function buildConditionsArray(nodeId: string, visitedNodes = new Set()) {
  // ... (Same implementation as in RuleFlowBuilder.vue)
  // This code duplicates the `buildConditionsArray` function from RuleFlowBuilder
  // You can extract this to a shared utility if needed
}

// Format human-readable rule text
function formatReadableRule(conditions: any[], depth = 0) {
  if (!conditions || conditions.length === 0) return '';

  let result = '';
  const indent = '  '.repeat(depth);

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];

    if (condition.isGroup) {
      result += `${indent}( \n`;
      result += formatReadableRule(condition.conditions, depth + 1);
      result += `${indent}) `;
    } else {
      // Format condition
      result += `${indent}${condition.field} ${formatOperator(condition.operator)} "${condition.value}" `;
    }

    // Add join operator if not the last condition
    if (i < conditions.length - 1) {
      result += `${condition.joinOperator || '&&'} \n`;
    }
  }

  return result;
}

// Format Lua expression
function formatLuaExpression(conditions: any[]) {
  if (!conditions || conditions.length === 0) return '';

  let result = '';

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];

    if (condition.isGroup) {
      result += '(';
      result += formatLuaExpression(condition.conditions);
      result += ')';
    } else {
      if (condition.operator === 'starts_with') {
        result += `string.sub(${condition.field}, 1, ${condition.value.length}) == "${condition.value}"`;
      } else if (condition.operator === 'ends_with') {
        result += `string.sub(${condition.field}, -${condition.value.length}) == "${condition.value}"`;
      } else if (condition.operator === '~~') {
        result += `string.find(${condition.field}, "${condition.value}") ~= nil`;
      } else {
        result += `${condition.field} ${condition.operator} "${condition.value}"`;
      }
    }

    // Add join operator if not the last condition
    if (i < conditions.length - 1) {
      result += ` ${condition.joinOperator || '&&'} `;
    }
  }

  return result;
}

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
