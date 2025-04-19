<template>
  <div class="app">
    <header class="app-header">
      <h1>Rule Builder</h1>
      <div class="app-actions">
        <button @click="exportRule" class="action-button">Export Rule</button>
        <button @click="importRule" class="action-button">Import Rule</button>
      </div>
    </header>
    <RuleBuilder ref="ruleBuilder" />

    <!-- Import/Export Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <template v-if="modalMode === 'export'">
            <p>Copy the rule JSON below:</p>
            <textarea v-model="exportData" readonly class="export-textarea"></textarea>
            <button @click="copyToClipboard" class="copy-button">Copy to Clipboard</button>
          </template>
          <template v-else-if="modalMode === 'import'">
            <p>Paste the rule JSON below:</p>
            <textarea v-model="importData" class="import-textarea"></textarea>
            <div class="error-message" v-if="importError">{{ importError }}</div>
            <button @click="processImport" class="import-button" :disabled="!importData">Import</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import RuleBuilder from '@/components/RuleBuilder.vue';

const ruleBuilder = ref(null);
const showModal = ref(false);
const modalMode = ref('export');
const modalTitle = ref('Export Rule');
const exportData = ref('');
const importData = ref('');
const importError = ref('');

const exportRule = () => {
  // Get the current rule configuration from the rule builder
  const nodes = ruleBuilder.value.getNodes();
  const edges = ruleBuilder.value.getEdges();

  const ruleConfig = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    }))
  };

  exportData.value = JSON.stringify(ruleConfig, null, 2);

  // Show the modal
  modalMode.value = 'export';
  modalTitle.value = 'Export Rule';
  showModal.value = true;
};

const importRule = () => {
  // Show the import modal
  importData.value = '';
  importError.value = '';
  modalMode.value = 'import';
  modalTitle.value = 'Import Rule';
  showModal.value = true;
};

const processImport = () => {
  try {
    const ruleConfig = JSON.parse(importData.value);

    // Validate the input
    if (!ruleConfig.nodes || !ruleConfig.edges ||
      !Array.isArray(ruleConfig.nodes) || !Array.isArray(ruleConfig.edges)) {
      importError.value = 'Invalid rule configuration format';
      return;
    }

    // Clear the canvas
    ruleBuilder.value.clearCanvas();

    // Import the nodes and edges
    ruleBuilder.value.importRuleConfig(ruleConfig);

    // Close the modal
    closeModal();
  } catch (error) {
    importError.value = 'Error parsing JSON: ' + error.message;
  }
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(exportData.value)
    .then(() => {
      alert('Copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};

const closeModal = () => {
  showModal.value = false;
};

onMounted(() => {
  console.log('App mounted');
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #001529;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-actions {
  display: flex;
  gap: 10px;
}

.action-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-button:hover {
  background-color: #40a9ff;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.export-textarea, .import-textarea {
  width: 100%;
  height: 200px;
  margin-bottom: 10px;
  padding: 10px;
  font-family: monospace;
  resize: none;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.copy-button, .import-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-button:hover, .import-button:hover {
  background-color: #40a9ff;
}

.error-message {
  color: #f5222d;
  margin-bottom: 10px;
}
</style>
