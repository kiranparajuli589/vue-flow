<!-- src/components/rule-flow/nodes/OpenBracketNode.vue -->
<script setup lang="ts">
import BracketNode from './BracketNode.vue';

defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => null },
  selected: { type: Boolean, default: false }
});
</script>

<template>
  <BracketNode 
    :id="id" 
    :data="data" 
    :selected="selected" 
    :is-opening="true" 
  />
</template>