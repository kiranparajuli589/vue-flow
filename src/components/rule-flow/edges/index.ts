import { markRaw } from 'vue';
import JoinEdge from './JoinEdge.vue';
import { EdgeType } from '@/types/rule-builder';

// Define edge registration map
const edgeTypes = {
  [EdgeType.JOIN]: markRaw(JoinEdge)
};

export default edgeTypes;
