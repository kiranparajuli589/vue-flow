// src/composables/useRuleTemplates.ts
import { useVueFlow } from '@vue-flow/core'
import { NodeType, FieldType, OperatorType, JoinOperatorType, EdgeType } from '@/types/rule-builder'
import { generateUniqueId } from '@/utils/helpers'
import { DEFAULTS } from '@/composables/useConditionService'

export interface RuleTemplate {
  id: string
  name: string
  description: string
  icon: string
  nodes: any[]
  edges: any[]
}

export function useRuleTemplates() {
  const { addNodes, addEdges, screenToFlowCoordinate } = useVueFlow()

  // Template definitions - single source of truth
  const templates: RuleTemplate[] = [
    {
      id: 'simple_and',
      name: 'Simple AND',
      description: 'conditionA && conditionB',
      icon: '🔗',
      nodes: [
        {
          id: 'template_condition_1',
          type: NodeType.CONDITION,
          position: { x: 0, y: 0 },
          data: {
            field: DEFAULTS.FIELD,
            operator: DEFAULTS.OPERATOR,
            value: DEFAULTS.VALUE,
          },
        },
        {
          id: 'template_condition_2',
          type: NodeType.CONDITION,
          position: { x: 350, y: 0 },
          data: {
            field: DEFAULTS.FIELD,
            operator: DEFAULTS.OPERATOR,
            value: DEFAULTS.VALUE,
          },
        },
      ],
      edges: [
        {
          id: 'template_edge_1',
          source: 'template_condition_1',
          target: 'template_condition_2',
          sourceHandle: 'right',
          targetHandle: 'left',
          type: EdgeType.JOIN,
          data: { operator: JoinOperatorType.AND },
          label: JoinOperatorType.AND,
          labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
          labelStyle: { fontWeight: 700, fill: '#4299e1' },
          style: { stroke: '#4299e1', strokeWidth: 2 },
        },
      ],
    },
    {
      id: 'and_or_group',
      name: 'AND with OR Group',
      description: 'conditionA && (conditionB || conditionC)',
      icon: '🔀',
      nodes: [
        {
          id: 'template_condition_1',
          type: NodeType.CONDITION,
          position: { x: 277, y: -285 }, // Top condition (conditionA)
          data: {
            field: DEFAULTS.FIELD,
            operator: DEFAULTS.OPERATOR,
            value: DEFAULTS.VALUE,
          },
        },
        {
          id: 'template_bracket_open',
          type: NodeType.BRACKET_OPEN,
          position: { x: 328, y: 122 }, // Opening bracket
          data: { isOpening: true, pairedNodeId: 'template_bracket_close' },
        },
        {
          id: 'template_condition_2',
          type: NodeType.CONDITION,
          position: { x: -12, y: 397 }, // Left condition inside brackets (conditionB)
          data: {
            field: DEFAULTS.FIELD,
            operator: DEFAULTS.OPERATOR,
            value: DEFAULTS.VALUE,
          },
        },
        {
          id: 'template_condition_3',
          type: NodeType.CONDITION,
          position: { x: 569, y: 403 }, // Right condition inside brackets (conditionC)
          data: {
            field: DEFAULTS.FIELD,
            operator: DEFAULTS.OPERATOR,
            value: DEFAULTS.VALUE,
          },
        },
        {
          id: 'template_bracket_close',
          type: NodeType.BRACKET_CLOSE,
          position: { x: 278, y: 900 }, // Closing bracket
          data: { isOpening: false, pairedNodeId: 'template_bracket_open' },
        },
      ],
      edges: [
        // condition1 FLOW to opening bracket (bottom -> top flow handles)
        {
          id: 'template_edge_1',
          source: 'template_condition_1',
          target: 'template_bracket_open',
          sourceHandle: 'bottom',
          targetHandle: 'target',
          type: EdgeType.SIMPLE,
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
        // opening bracket FLOW to condition2 (bottom -> top flow handles)
        {
          id: 'template_edge_2',
          source: 'template_bracket_open',
          target: 'template_condition_2',
          sourceHandle: 'source',
          targetHandle: 'top',
          type: EdgeType.SIMPLE,
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
        // opening bracket FLOW to condition3 (bottom -> top flow handles)
        {
          id: 'template_edge_3',
          source: 'template_bracket_open',
          target: 'template_condition_3',
          sourceHandle: 'source',
          targetHandle: 'top',
          type: EdgeType.SIMPLE,
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
        // condition2 JOIN condition3 (left/right join handles for OR)
        {
          id: 'template_edge_4',
          source: 'template_condition_2',
          target: 'template_condition_3',
          sourceHandle: 'right',
          targetHandle: 'left',
          type: EdgeType.JOIN,
          data: { operator: JoinOperatorType.OR },
          label: JoinOperatorType.OR,
          labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
          labelStyle: { fontWeight: 700, fill: '#4299e1' },
          style: { stroke: '#4299e1', strokeWidth: 2 },
        },
        // condition2 FLOW to closing bracket (bottom -> top flow handles)
        {
          id: 'template_edge_5',
          source: 'template_condition_2',
          target: 'template_bracket_close',
          sourceHandle: 'bottom',
          targetHandle: 'target',
          type: EdgeType.SIMPLE,
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
        // condition3 FLOW to closing bracket (bottom -> top flow handles)
        {
          id: 'template_edge_6',
          source: 'template_condition_3',
          target: 'template_bracket_close',
          sourceHandle: 'bottom',
          targetHandle: 'target',
          type: EdgeType.SIMPLE,
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
      ],
    },
  ]

  /**
   * Get all available templates
   */
  function getTemplates(): RuleTemplate[] {
    return templates
  }

  /**
   * Apply a template to the canvas
   */
  function applyTemplate(templateId: string, position: { x: number; y: number }) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) {
      console.error('Template not found:', templateId)
      return
    }

    console.log('Applying template:', template.name)

    // Convert screen position to flow coordinates
    const flowPosition = screenToFlowCoordinate(position)

    // Calculate offset to center the template at the drop position
    const templateBounds = calculateTemplateBounds(template.nodes)
    const offsetX = flowPosition.x - templateBounds.centerX
    const offsetY = flowPosition.y - templateBounds.centerY

    // Create nodes with unique IDs and adjusted positions
    const newNodes = template.nodes.map((node) => ({
      ...node,
      id: generateUniqueId(), // Generate unique ID
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
    }))

    // Create edges with updated node references
    const nodeIdMap = new Map<string, string>()
    template.nodes.forEach((originalNode, index) => {
      nodeIdMap.set(originalNode.id, newNodes[index].id)
    })

    const newEdges = template.edges.map((edge) => ({
      ...edge,
      id: generateUniqueId(), // Generate unique ID
      source: nodeIdMap.get(edge.source)!,
      target: nodeIdMap.get(edge.target)!,
    }))

    console.log('Adding template nodes:', newNodes.length)
    console.log('Adding template edges:', newEdges.length)

    // Add to canvas
    addNodes(newNodes)
    addEdges(newEdges)

    return { nodes: newNodes, edges: newEdges }
  }

  /**
   * Calculate template bounds for positioning
   */
  function calculateTemplateBounds(nodes: any[]) {
    if (nodes.length === 0) {
      return { centerX: 0, centerY: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    const minX = Math.min(...nodes.map((n) => n.position.x))
    const maxX = Math.max(...nodes.map((n) => n.position.x))
    const minY = Math.min(...nodes.map((n) => n.position.y))
    const maxY = Math.max(...nodes.map((n) => n.position.y))

    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      minX,
      maxX,
      minY,
      maxY,
    }
  }

  /**
   * Get template preview data (for future use in UI)
   */
  function getTemplatePreview(templateId: string) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return null

    return {
      name: template.name,
      description: template.description,
      icon: template.icon,
      nodeCount: template.nodes.length,
      edgeCount: template.edges.length,
    }
  }

  return {
    getTemplates,
    applyTemplate,
    getTemplatePreview,
    calculateTemplateBounds,
  }
}
