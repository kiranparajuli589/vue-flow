import { defineComponent, markRaw } from 'vue';
import { NodeType } from '@/types/rule-builder';
import ConditionNode from './ConditionNode.vue';
import BracketNode from './BracketNode.vue';

const nodeTypes = {
  [NodeType.CONDITION]: markRaw(defineComponent({
    extends: ConditionNode
  })),
  [NodeType.BRACKET_OPEN]: markRaw(defineComponent({
    extends: BracketNode,
    props: {
      data: {
        type: Object,
        default: () => ({ isOpening: true })
      }
    }
  })),
  [NodeType.BRACKET_CLOSE]: markRaw(defineComponent({
    extends: BracketNode,
    props: {
      data: {
        type: Object,
        default: () => ({ isOpening: false })
      }
    }
  }))
};

export default nodeTypes;
