<template>
  <div
    class="shortcuts-overlay"
    @mouseenter="startHoverTimer"
    @mouseleave="hideShortcuts"
  >
    <!-- Icon button (always visible) -->
    <div class="shortcuts-icon">
      <i-solar-keyboard-bold />
    </div>

    <!-- Expanded shortcuts list (shows on hover delay) -->
    <Transition
      name="shortcuts"
      enter-active-class="shortcuts-enter-active"
      leave-active-class="shortcuts-leave-active"
      enter-from-class="shortcuts-enter-from"
      leave-to-class="shortcuts-leave-to"
    >
      <div v-if="showShortcuts" class="shortcuts-panel">
        <div class="shortcuts-header">
          <div class="shortcuts-title">⌨️ Keyboard Shortcuts</div>
        </div>

        <div class="shortcuts-list">
          <div class="shortcut-group">
            <div class="group-title">Create</div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>1</kbd>
              <span class="shortcut-desc">Add Condition</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>2</kbd>
              <span class="shortcut-desc">Add Bracket Pair</span>
            </div>
          </div>

          <div class="shortcut-group">
            <div class="group-title">Templates</div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>G</kbd>
              <span class="shortcut-desc">Insert AND Group</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>G</kbd>
              <span class="shortcut-desc">Insert OR Group</span>
            </div>
          </div>

          <div class="shortcut-group">
            <div class="group-title">Edit</div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>D</kbd>
              <span class="shortcut-desc">Duplicate</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>C</kbd>
              <span class="shortcut-desc">Copy</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
              <span class="shortcut-desc">Paste</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>B</kbd>
              <span class="shortcut-desc">Wrap in Brackets</span>
            </div>
          </div>

          <div class="shortcut-group">
            <div class="group-title">Layout</div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>A</kbd>
              <span class="shortcut-desc">Align Horizontal</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>A</kbd>
              <span class="shortcut-desc">Align Vertical</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>S</kbd>
              <span class="shortcut-desc">Space Evenly</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd><span>+</span><kbd>F</kbd>
              <span class="shortcut-desc">Fit to View</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showShortcuts = ref(false);
const hoverTimer = ref<number | null>(null);

function startHoverTimer() {
  // Clear any existing timer
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
  }

  // Start 1 second timer
  hoverTimer.value = setTimeout(() => {
    showShortcuts.value = true;
  }, 1000); // 1 second delay
}

function hideShortcuts() {
  // Clear timer if mouse leaves before 1 second
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
    hoverTimer.value = null;
  }

  // Hide shortcuts panel
  showShortcuts.value = false;
}
</script>

<style scoped>
.shortcuts-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 15;
}

.shortcuts-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #4a5568;
  position: relative;
}

.shortcuts-icon:hover {
  background-color: #4299e1;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.shortcuts-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  overflow: hidden;
  transform-origin: bottom right;
}

.shortcuts-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
}

.shortcuts-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}

.shortcuts-list {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.shortcut-group {
  margin-bottom: 16px;
}

.shortcut-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 11px;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  transition: background-color 0.2s;
}

.shortcut-item:hover {
  background-color: #f7fafc;
}

.shortcut-item kbd {
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 -2px 0 rgba(0,0,0,0.1);
  color: #495057;
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  min-width: 20px;
  padding: 4px 6px;
  text-align: center;
  text-transform: uppercase;
}

.shortcut-item span:not(.shortcut-desc) {
  color: #9ca3af;
  font-weight: 500;
  font-size: 12px;
}

.shortcut-desc {
  color: #4a5568;
  font-weight: 500;
  margin-left: auto;
}

/* Transition animations */
.shortcuts-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.shortcuts-leave-active {
  transition: all 0.2s ease-in;
}

.shortcuts-enter-from {
  transform: scale(0.7) translateY(20px);
  opacity: 0;
}

.shortcuts-leave-to {
  transform: scale(0.9) translateY(10px);
  opacity: 0;
}

/* Custom scrollbar for shortcuts list */
.shortcuts-list::-webkit-scrollbar {
  width: 6px;
}

.shortcuts-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.shortcuts-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.shortcuts-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>