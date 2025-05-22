<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import DropzoneBackground from './DropzoneBackground.vue'
import Sidebar from './FlowSidebar.vue'
import useDragAndDrop from '@/composables/useDragAndDrop'

const { onConnect, addEdges } = useVueFlow()

const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop()

const nodes = ref([])
const edges = ref([])


onConnect(addEdges)
</script>

<template>
  <div class="dnd-flow" @drop="onDrop">
    <Sidebar />

    <VueFlow
      :nodes="nodes"
      :edges="edges"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      :edges-updatable="true"
    >
      <DropzoneBackground
        :style="{
          backgroundColor: isDragOver ? '#e7f3ff' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
      >
        <div class="drop-here" v-if="isDragOver">Drop here</div>
      </DropzoneBackground>
    </VueFlow>

  </div>
</template>

<style scoped>
.dnd-flow {
  height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: start;
  border: 1px solid rgb(153, 153, 153);
}

.drop-here {
  padding: 16px;
  background-color: #e7f3ff;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}
</style>
