<!-- src/components/rule-flow/RulePreview.vue (Enhanced) -->
<template>
  <div class="rule-preview">
    <!-- Validation Status -->
    <div class="validation-status" :class="{ 'valid': validation.valid, 'invalid': !validation.valid }">
      <div class="status-indicator">
        <svg v-if="validation.valid" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="status-text">{{ validation.valid ? 'Valid Rule' : validation.message }}</span>
      </div>
    </div>

    <!-- Preview Content -->
    <div v-if="validation.valid" class="preview-content">
      <!-- Format Toggle -->
      <div class="format-toggle">
        <button 
          @click="currentFormat = 'readable'" 
          :class="{ 'active': currentFormat === 'readable' }"
          class="toggle-btn"
        >
          📖 Readable
        </button>
        <button 
          @click="currentFormat = 'json'" 
          :class="{ 'active': currentFormat === 'json' }"
          class="toggle-btn"
        >
          📄 JSON Payload
        </button>
      </div>

      <!-- Readable Format -->
      <div v-if="currentFormat === 'readable'" class="readable-format">
        <!-- Create Pattern -->
        <div class="pattern-section">
          <h4 class="section-title">Create Pattern</h4>
          <div class="pattern-content create-pattern">
            {{ readableCreatePattern }}
          </div>
        </div>

        <!-- Replace Pattern -->
        <div class="pattern-section">
          <h4 class="section-title">Replace Pattern</h4>
          <div class="pattern-content replace-pattern">
            {{ readableReplacePattern }}
          </div>
        </div>
      </div>

      <!-- JSON Format -->
      <div v-if="currentFormat === 'json'" class="json-format">
        <div class="json-header">
          <h4 class="section-title">Complete Rule Payload</h4>
          <button @click="copyToClipboard" class="copy-btn" title="Copy to clipboard">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            Copy
          </button>
        </div>
        <pre class="json-payload">{{ formattedJsonPayload }}</pre>
      </div>
    </div>

    <!-- Invalid State -->
    <div v-else class="invalid-content">
      <div class="invalid-message">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div class="message-content">
          <h4>Rule Incomplete</h4>
          <p>{{ validation.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRulePreview } from '@/composables/useRulePreview';

// Props
const props = defineProps<{
  createPattern?: any;
  replacePattern?: any;
  replaceType?: string;
  ruleName?: string;
  nodes?: any[];
  edges?: any[];
}>();

// Composable
const { 
  formatCreatePatternReadable, 
  formatReplacePatternReadable, 
  generateRulePayload,
  generateFlowPayload,
  validateRule 
} = useRulePreview();

// State
const currentFormat = ref<'readable' | 'json'>('readable');

// Computed properties
const currentCreatePattern = computed(() => {
  // If createPattern is provided as prop, use it
  if (props.createPattern && props.createPattern.create_pattern?.conditions?.length > 0) {
    return props.createPattern;
  }
  
  // Otherwise, generate from provided nodes and edges
  if (props.nodes && props.edges) {
    const flowPayload = generateFlowPayload(props.nodes, props.edges);
    console.log('Generated flow payload:', flowPayload);
    return flowPayload;
  }
  
  // Fallback
  return { create_pattern: { conditions: [] } };
});

const currentReplacePattern = computed(() => {
  return props.replacePattern || {};
});

const currentReplaceType = computed(() => {
  return props.replaceType || 'standard';
});

// Validation
const validation = computed(() => {
  return validateRule(
    currentCreatePattern.value, 
    currentReplacePattern.value, 
    currentReplaceType.value,
    props.nodes || []
  );
});

// Readable formats
const readableCreatePattern = computed(() => {
  return formatCreatePatternReadable(currentCreatePattern.value);
});

const readableReplacePattern = computed(() => {
  return formatReplacePatternReadable(
    currentReplacePattern.value, 
    currentReplaceType.value
  );
});

// JSON payload
const jsonPayload = computed(() => {
  return generateRulePayload(
    currentCreatePattern.value,
    currentReplacePattern.value,
    currentReplaceType.value,
    props.ruleName
  );
});

const formattedJsonPayload = computed(() => {
  return JSON.stringify(jsonPayload.value, null, 2);
});

// Copy to clipboard functionality
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedJsonPayload.value);
    // You could add a toast notification here
    console.log('JSON payload copied to clipboard');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = formattedJsonPayload.value;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      console.log('JSON payload copied to clipboard (fallback)');
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
    }
    document.body.removeChild(textArea);
  }
}

// Watch for changes and switch to readable format when data changes
watch([currentCreatePattern, currentReplacePattern], () => {
  if (currentFormat.value === 'json') {
    currentFormat.value = 'readable';
  }
}, { deep: true });
</script>

<style scoped>
.rule-preview {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

/* Validation Status */
.validation-status {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.validation-status.valid {
  background-color: #f0fff4;
  border-bottom-color: #9ae6b4;
}

.validation-status.invalid {
  background-color: #fff5f5;
  border-bottom-color: #fed7d7;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.validation-status.valid .status-indicator {
  color: #38a169;
}

.validation-status.invalid .status-indicator {
  color: #e53e3e;
}

.status-indicator svg {
  width: 20px;
  height: 20px;
}

.status-text {
  font-weight: 600;
  font-size: 14px;
}

/* Preview Content */
.preview-content {
  padding: 16px;
}

/* Format Toggle */
.format-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.toggle-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.toggle-btn.active {
  background-color: #4299e1;
  border-color: #4299e1;
  color: white;
}

/* Readable Format */
.readable-format {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pattern-section {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  padding: 12px 16px;
  margin: 0;
  background-color: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.pattern-content {
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.create-pattern {
  color: #2b6cb0;
  background-color: #ebf8ff;
}

.replace-pattern {
  color: #2c7a7b;
  background-color: #e6fffa;
}

/* JSON Format */
.json-format {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.json-header .section-title {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background-color: #3182ce;
}

.copy-btn svg {
  width: 16px;
  height: 16px;
}

.json-payload {
  margin: 0;
  padding: 16px;
  background-color: #2d3748;
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
}

/* Invalid Content */
.invalid-content {
  padding: 24px 16px;
}

.invalid-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #e53e3e;
}

.invalid-message svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.message-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.message-content p {
  margin: 0;
  font-size: 14px;
  color: #718096;
}

/* Responsive */
@media (max-width: 768px) {
  .format-toggle {
    flex-direction: column;
  }
  
  .toggle-btn {
    text-align: center;
  }
  
  .json-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .copy-btn {
    align-self: flex-end;
  }
}
</style>