import { markRaw } from 'vue';
import JoinEdge from './JoinEdge.vue';

// Define edge registration map
const edgeTypes = {
  'default': markRaw(JoinEdge)
};

export default edgeTypes;
