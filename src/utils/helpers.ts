// src/utils/helpers.ts

// Generate a unique ID for nodes and edges
export function generateUniqueId(): string {
  return `_${Math.random().toString(36).substr(2, 9)}`;
}

// Convert a flow-based rule to the standard format
export function convertFlowToRuleFormat(flowRule: any): any {
  if (!flowRule || !flowRule.create_pattern || !flowRule.create_pattern.conditions) {
    return {
      create_pattern: {
        conditions: []
      }
    };
  }

  // Extract positions for reimporting
  const positions = flowRule.create_pattern.positions || {};

  // Clean up conditions structure for API submission
  const cleanedConditions = cleanConditions(flowRule.create_pattern.conditions);

  return {
    create_pattern: {
      conditions: cleanedConditions,
      positions
    }
  };
}

// Clean conditions for API format
function cleanConditions(conditions: any[]): any[] {
  if (!conditions || !Array.isArray(conditions)) return [];

  return conditions.map(condition => {
    const cleaned: any = {
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
      isGroup: condition.isGroup || false
    };

    if (condition.joinOperator) {
      cleaned.joinOperator = condition.joinOperator;
    }

    if (cleaned.isGroup && condition.conditions) {
      cleaned.conditions = cleanConditions(condition.conditions);
    }

    // Remove any internal properties
    delete cleaned.error;

    return cleaned;
  });
}

// Convert a standard rule to a flow-based rule
export function convertRuleToFlowFormat(rule: any): any {
  if (!rule || !rule.create_pattern || !rule.create_pattern.conditions) {
    return null;
  }

  // This conversion is handled in the RuleFlowBuilder component
  // when importing rules, so we just pass through the original rule
  return rule;
}
