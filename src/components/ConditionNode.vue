<template>
  <div
    class="condition-node-container"
    :class="{ 'selected': selected }"
  >
    <div class="node-header">Condition</div>
    <div class="node-content">
      <div class="select-wrapper">
        <select v-model="nodeData.field" @change="updateNode">
          <option v-for="option in nodeData.fieldOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
      <div class="select-wrapper">
        <select v-model="nodeData.operator" @change="updateNode">
          <option v-for="option in nodeData.operatorOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
      <div class="input-wrapper">
        <input type="text" v-model="nodeData.value" @input="updateNode" placeholder="Value" />
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

<script setup lang="js">
import { reactive, onMounted, watch } from 'vue';
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
  field: props.data.field || 'path',
  operator: props.data.operator || '==',
  value: props.data.value || '',
  fieldOptions: props.data.fieldOptions || ['path', 'method', 'agent', 'referrer'],
  operatorOptions: props.data.operatorOptions || ['==', '!=', '~=']
});

const updateNode = () => {
  updateFlowNode(props.id, { data: { ...nodeData } });
};

onMounted(() => {
  console.log('Condition node mounted:', props.id);
});

watch(() => props.data, (newVal) => {
  Object.assign(nodeData, newVal);
}, { deep: true });
</script>

<style scoped>
.condition-node-container {
  padding: 10px;
  border-radius: 5px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  width: 250px;
  position: relative;
}

.condition-node-container.selected {
  box-shadow: 0 0 0 2px #1890ff;
}

.node-header {
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
  border-bottom: 1px solid #91d5ff;
  padding-bottom: 5px;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.select-wrapper, .input-wrapper {
  width: 100%;
}

select, input {
  width: 100%;
  padding: 5px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.handle {
  width: 10px;
  height: 10px;
  background-color: #1890ff;
  border-radius: 50%;
}

.handle-left {
  left: -5px;
}
.handle-right {
  right: -5px;
}
</style>
