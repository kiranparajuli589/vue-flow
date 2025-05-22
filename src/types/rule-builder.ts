import type { Node, Edge } from '@vue-flow/core'

export enum NodeType {
  CONDITION = 'condition',
  JOIN = 'join',
  BRACKET_OPEN = 'bracketOpen',
  BRACKET_CLOSE = 'bracketClose'
}

export enum EdgeType {
  JOIN = 'default'
}

export enum FieldType {
  URI_PATH = 'req.uri.path',
  METHOD = 'req.method',
  HOST = 'req.headers.host',
  USER_AGENT = 'req.headers.UserAgent',
  COUNTRY = 'req.geo.country',
  STATUS_CODE = 'res.status'
}

export enum OperatorType {
  EQUALS = '==',
  NOT_EQUALS = '!=',
  CONTAINS = '~~',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with'
}

export enum JoinOperatorType {
  AND = '&&',
  OR = '||'
}

export interface ConditionData {
  field: FieldType;
  operator: OperatorType;
  value: string;
  error?: string;
}

export interface JoinData {
  operator: JoinOperatorType;
}

export interface BracketData {
  isOpening: boolean;
  pairedNodeId?: string; // ID of the corresponding bracket node
}

export type FlowNodeData = ConditionData | JoinData | BracketData;

export interface FlowNode extends Node {
  type: NodeType;
  data: FlowNodeData;
  position: { x: number; y: number };
}

export interface FlowEdge extends Edge {
  data?: {
    isValid: boolean;
  };
}

export interface RuleOutput {
  create_pattern: {
    conditions: any[]; // The final structure to match the original format
    positions?: Record<string, { x: number; y: number }>; // To store node positions
  };
  replace_pattern?: any;
  parameters?: any[];
}
