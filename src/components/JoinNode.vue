<template>
  <div
    class="join-node-container"
    :class="{ 'selected': selected }"
  >
    <div class="node-header">Join</div>
    <div class="node-content">
      <div class="select-wrapper">
        <select v-model="nodeData.joinType" @change="updateNode">
          <option v-for="option in nodeData.joinOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
      <div class="operator-display">
        {{ operatorSymbol }}
      </div>
    </div>
    <Handle
      type="source"
      :position="Position.Right"
      :id="id + '-source'"
      class="handle handle-right"
    />
    <Handle
      type="target"
      :position="Position.Left"
      :id="id + '-target'"
      class="handle handle-left"
    />
  </div>
</template>

<script lang="js" setup>
import { reactive, computed, onMounted, watch } from 'vue';
import { Handle, Position, useVueFlow } from '@vue-flow/core';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false
  }
});

const { updateNode: updateFlowNode } = useVueFlow();

const nodeData = reactive({
  joinType: props.data.joinType || 'AND',
  joinOptions: props.data.joinOptions || ['AND', 'OR', 'XOR']
});

const operatorSymbol = computed(() => {
  switch (nodeData.joinType) {
    case 'AND': return '&&';
    case 'OR': return '||';
    case 'XOR': return '^';
    default: return '&&';
  }
});

const updateNode = () => {
  updateFlowNode(props.id, { data: { ...nodeData } });
};

onMounted(() => {
  console.log('Join node mounted:', props.id);
});

watch(() => props.data, (newVal) => {
  Object.assign(nodeData, newVal);
}, { deep: true });
</script>

<style scoped>
.join-node-container {
  padding: 10px;
  border-radius: 5px;
  background-color: #ffe6e6;
  border: 1px solid #ffb3b3;
  width: 150px;
  position: relative;
}

.join-node-container.selected {
  box-shadow: 0 0 0 2px #f5222d;
}

.node-header {
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
  border-bottom: 1px solid #ffb3b3;
  padding-bottom: 5px;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

.select-wrapper {
  width: 100%;
}

select {
  width: 100%;
  padding: 5px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.operator-display {
  font-size: 18px;
  font-weight: bold;
  margin-top: 5px;
  color: #f5222d;
}

.handle {
  width: 10px;
  height: 10px;
  background-color: #f5222d;
  border-radius: 50%;
}

.handle-left {
  left: -5px;
}

.handle-right {
  right: -5px;
}
</style>
