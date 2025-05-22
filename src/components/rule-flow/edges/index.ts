// src/components/rule-flow/edges/index.ts
import { defineComponent } from 'vue';
import JoinEdge from './JoinEdge.vue';

// Define edge registration map
const edgeTypes = {
  'default': defineComponent({
    extends: JoinEdge
  })
};

export default edgeTypes;
