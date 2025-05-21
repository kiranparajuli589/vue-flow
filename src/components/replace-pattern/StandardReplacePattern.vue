<!-- src/components/replace-pattern/StandardReplacePattern.vue -->
<template>
  <div class="standard-replace-pattern">
    <div class="form-group">
      <label>Field</label>
      <select v-model="localData.field" @change="updateValue">
        <option v-for="field in fields" :key="field.value" :value="field.value">
          {{ field.label }}
        </option>
      </select>
    </div>

    <div v-if="showFunctionToggle" class="use-function-toggle">
      <input
        type="checkbox"
        id="use-function"
        v-model="localData.withFn"
        @change="updateValue"
      />
      <label for="use-function">Use Function</label>
    </div>

    <div v-if="!localData.withFn" class="form-group">
      <label>Value</label>
      <input
        v-model="localData.value"
        @input="updateValue"
        @blur="validateValue"
        :placeholder="fieldMeta.placeholder || 'Enter value'"
      />
      <div v-if="valueError" class="error-message">{{ valueError }}</div>
    </div>

    <div v-else class="function-container">
      <div class="form-group">
        <label>Function</label>
        <select v-model="localData.fn" @change="updateValue">
          <option v-for="fn in functions" :key="fn.value" :value="fn.value">
            {{ fn.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Argument</label>
        <input
          v-model="localData.fnArg"
          @input="updateValue"
          @blur="validateFnArg"
          placeholder="Enter function argument"
        />
        <div v-if="fnArgError" class="error-message">{{ fnArgError }}</div>
      </div>

      <div v-if="functionDescription" class="function-description">
        {{ functionDescription }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useConditionService } from '@/composables/useConditionService';
import { FieldType } from '@/types/rule-builder';

const props = defineProps<{
  modelValue: any;
}>();

const emit = defineEmits(['update:modelValue', 'validate']);

const { fields } = useConditionService();

const functions = ref([
  { value: 'concat', label: 'Concat', description: 'Concatenate strings' },
  { value: 'substring', label: 'Substring', description: 'Get part of a string' },
  { value: 'replace', label: 'Replace', description: 'Replace part of a string' },
  { value: 'lowercase', label: 'Lowercase', description: 'Convert to lowercase' }
]);

const localData = ref({
  field: FieldType.URI_PATH,
  value: '',
  withFn: false,
  fn: '',
  fnArg: ''
});

const valueError = ref('');
const fnArgError = ref('');

const showFunctionToggle = computed(() => {
  return localData.value.field === FieldType.URI_PATH;
});

const fieldMeta = computed(() => {
  const field = fields.value.find(f => f.value === localData.value.field);
  return field?.meta || {};
});

const functionDescription = computed(() => {
  if (!localData.value.fn) return '';
  const fn = functions.value.find(f => f.value === localData.value.fn);
  return fn?.description || '';
});

function updateValue() {
  emit('update:modelValue', { ...localData.value });

  // Validate after update
  const isValid = validate();
  emit('validate', isValid);
}

function validateValue() {
  valueError.value = '';

  if (!localData.value.value) {
    valueError.value = 'Value is required';
    return false;
  }

  return true;
}

function validateFnArg() {
  fnArgError.value = '';

  if (!localData.value.fnArg) {
    fnArgError.value = 'Function argument is required';
    return false;
  }

  // Function-specific validation
  if (localData.value.fn === 'substring') {
    if (isNaN(parseInt(localData.value.fnArg))) {
      fnArgError.value = 'Substring argument must be a number';
      return false;
    }
  }

  return true;
}

function validate() {
  if (localData.value.withFn) {
    return validateFnArg() && !!localData.value.fn;
  } else {
    return validateValue();
  }
}

// Initialize and keep in sync with props
onMounted(() => {
  if (props.modelValue) {
    localData.value = { ...props.modelValue };
  }
});

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localData.value = { ...newValue };
  }
}, { deep: true });
</script>

<style scoped>
.standard-replace-pattern {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-weight: 500;
  font-size: 14px;
  color: #4a5568;
}

.form-group select, .form-group input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.use-function-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.function-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.function-description {
  font-size: 12px;
  color: #718096;
  font-style: italic;
  margin-top: 4px;
}

.error-message {
  color: #f56565;
  font-size: 12px;
  margin-top: 4px;
}
</style>
