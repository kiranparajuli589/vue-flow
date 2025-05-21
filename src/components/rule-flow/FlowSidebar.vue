<template>
  <div class="sidebar">
    <div class="sidebar-title">Rule Elements</div>
    <div
      class="dnd-item condition-item"
      draggable="true"
      @dragstart="onDragStart($event, 'condition')"
    >
      Condition
    </div>
    <div
      class="dnd-item join-item"
      draggable="true"
      @dragstart="onDragStart($event, 'join')"
    >
      Join (AND/OR)
    </div>
    <div
      class="dnd-item bracket-item"
      draggable="true"
      @dragstart="onDragStart($event, 'bracket')"
    >
      Bracket
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  onDragStart: (event: DragEvent, type: string) => void;
}>();
</script>
