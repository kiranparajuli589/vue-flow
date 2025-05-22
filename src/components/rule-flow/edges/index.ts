import { markRaw } from 'vue';
import JoinEdge from './JoinEdge.vue';
import SimpleEdge from './SimpleEdge.vue';
import { EdgeType } from '@/types/rule-builder';

// Define edge registration map
const edgeTypes = {
  [EdgeType.JOIN]: markRaw(JoinEdge),
  [EdgeType.SIMPLE]: markRaw(SimpleEdge)
};

export default edgeTypes;