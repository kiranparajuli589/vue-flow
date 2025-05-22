import { defineComponent, markRaw } from 'vue';
import { NodeType } from '@/types/rule-builder';
import ConditionNode from './ConditionNode.vue';
import OpenBracketNode from './OpenBracketNode.vue';
import CloseBracketNode from './CloseBracketNode.vue';

const nodeTypes = {
  [NodeType.CONDITION]: markRaw(ConditionNode),
  [NodeType.BRACKET_OPEN]: markRaw(OpenBracketNode),
  [NodeType.BRACKET_CLOSE]: markRaw(CloseBracketNode)
};

export default nodeTypes;
