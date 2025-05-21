<!-- src/components/replace-pattern/ParametersReplacePattern.vue -->
<template>
  <div class="parameters-replace-pattern">
    <div
      v-for="(param, index) in parameters"
      :key="index"
      class="parameter-row"
    >
      <div class="form-group">
        <label>Name</label>
        <input
          v-model="param.name"
          @input="updateValue"
          @blur="validateParam(param)"
          placeholder="param1"
        />
        <div v-if="param.nameError" class="error-message">{{ param.nameError }}</div>
      </div>

      <div class="form-group">
        <label>Value</label>
        <input
          v-model="param.value"
          @input="updateValue"
          @blur="validateParam(param)"
          placeholder="value1"
        />
        <div v-if="param.valueError" class="error-message">{{ param.valueError }}</div>
      </div>

      <button
        v-if="parameters.length > 1"
        @click="removeParameter(index)"
        class="remove-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <button @click="addParameter" class="add-btn">Add Parameter</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { generateUniqueId } from '@/utils/helpers';

const props = defineProps<{
  modelValue: any[];
}>();

const emit = defineEmits(['update:modelValue', 'validate']);

const parameters = ref([
  { id: generateUniqueId(), name: '', value: '', nameError: '', valueError: '' }
]);

function updateValue() {
  // Extract clean parameters without validation fields
  const cleanedParams = parameters.value.map(param => ({
    name: param.name,
    value: param.value
  }));

  emit('update:modelValue', cleanedParams);

  // Validate after update
  const isValid = validate();
  emit('validate', isValid);
}

function addParameter() {
  parameters.value.push({
    id: generateUniqueId(),
    name: '',
    value: '',
    nameError: '',
    valueError: ''
  });

  updateValue();
}

function removeParameter(index: number) {
  parameters.value.splice(index, 1);

  // Ensure we always have at least one parameter
  if (parameters.value.length === 0) {
    addParameter();
  } else {
    updateValue();
  }
}

function validateParam(param: any) {
  param.nameError = '';
  param.valueError = '';

  if (!param.name) {
    param.nameError = 'Name is required';
  }

  if (!param.value) {
    param.valueError = 'Value is required';
  }

  return !param.nameError && !param.valueError;
}

function validate() {
  let isValid = true;

  for (const param of parameters.value) {
    if (!validateParam(param)) {
      isValid = false;
    }
  }

  return isValid;
}

// Initialize and keep in sync with props
onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    parameters.value = props.modelValue.map(p => ({
      id: generateUniqueId(),
      name: p.name || '',
      value: p.value || '',
      nameError: '',
      valueError: ''
    }));
  }
});

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.length > 0) {
    parameters.value = newValue.map(p => ({
      id: generateUniqueId(),
      name: p.name || '',
      value: p.value || '',
      nameError: '',
      valueError: ''
    }));
  } else if (newValue && newValue.length === 0) {
    parameters.value = [{
      id: generateUniqueId(),
      name: '',
      value: '',
      nameError: '',
      valueError: ''
    }];
  }
}, { deep: true });
</script>

<style scoped>
.parameters-replace-pattern {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameter-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-weight: 500;
  font-size: 14px;
  color: #4a5568;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.error-message {
  color: #f56565;
  font-size: 12px;
  margin-top: 4px;
}

.remove-btn {
  margin-top: 30px;
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
}

.remove-btn:hover {
  color: #f56565;
}

.add-btn {
  align-self: flex-start;
  padding: 8px 16px;
  background-color: white;
  color: #4299e1;
  border: 1px solid #4299e1;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background-color: #ebf8ff;
}
</style>
