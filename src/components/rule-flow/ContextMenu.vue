<!-- src/components/rule-flow/ContextMenu.vue -->
<template>
    <div 
      class="context-menu"
      :style="{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -10px)'
      }"
      @click.stop
    >
      <!-- Canvas Context Menu -->
      <template v-if="type === 'canvas'">
        <div class="menu-section">
          <div class="menu-title">Insert</div>
          <button @click="$emit('action', 'addCondition')" class="menu-item">
            <span class="menu-icon">🔹</span>
            Add Condition
            <span class="menu-shortcut">Double-click</span>
          </button>
          <button @click="$emit('action', 'insertAndGroup')" class="menu-item">
            <span class="menu-icon">🔗</span>
            Insert AND Group
            <span class="menu-shortcut">Ctrl+G</span>
          </button>
          <button @click="$emit('action', 'insertOrGroup')" class="menu-item">
            <span class="menu-icon">🔀</span>
            Insert OR Group
            <span class="menu-shortcut">Ctrl+Shift+G</span>
          </button>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-section">
          <div class="menu-title">Clipboard</div>
          <button @click="$emit('action', 'paste')" class="menu-item">
            <span class="menu-icon">📋</span>
            Paste
            <span class="menu-shortcut">Ctrl+V</span>
          </button>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-section">
          <div class="menu-title">View</div>
          <button @click="$emit('action', 'autoFit')" class="menu-item">
            <span class="menu-icon">🎯</span>
            Fit to View
            <span class="menu-shortcut">Ctrl+F</span>
          </button>
        </div>
      </template>
  
      <!-- Node Context Menu -->
      <template v-if="type === 'node'">
        <div class="menu-section">
          <div class="menu-title">Node Actions</div>
          <button @click="$emit('action', 'duplicate')" class="menu-item">
            <span class="menu-icon">📄</span>
            Duplicate
            <span class="menu-shortcut">Ctrl+D</span>
          </button>
          <button @click="$emit('action', 'copy')" class="menu-item">
            <span class="menu-icon">📋</span>
            Copy
            <span class="menu-shortcut">Ctrl+C</span>
          </button>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-section">
          <div class="menu-title">Group Actions</div>
          <button @click="$emit('action', 'wrapInBrackets')" class="menu-item">
            <span class="menu-icon">🔗</span>
            Wrap in Brackets
            <span class="menu-shortcut">Ctrl+B</span>
          </button>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-section">
          <div class="menu-title">Layout</div>
          <button @click="$emit('action', 'alignHorizontal')" class="menu-item">
            <span class="menu-icon">↔️</span>
            Align Horizontal
            <span class="menu-shortcut">Ctrl+A</span>
          </button>
          <button @click="$emit('action', 'alignVertical')" class="menu-item">
            <span class="menu-icon">↕️</span>
            Align Vertical
            <span class="menu-shortcut">Ctrl+Shift+A</span>
          </button>
          <button @click="$emit('action', 'spaceEvenly')" class="menu-item">
            <span class="menu-icon">📏</span>
            Space Evenly
          </button>
        </div>
      </template>
  
      <!-- Edge Context Menu -->
      <template v-if="type === 'edge'">
        <div class="menu-section">
          <div class="menu-title">Edge Actions</div>
          <button 
            v-if="target?.type === 'join'" 
            @click="$emit('action', 'toggleOperator')" 
            class="menu-item"
          >
            <span class="menu-icon">🔄</span>
            Toggle AND/OR
          </button>
          <button @click="$emit('action', 'insertConditionOnEdge')" class="menu-item">
            <span class="menu-icon">➕</span>
            Insert Condition Here
          </button>
        </div>
      </template>
    </div>
    
    <!-- Background overlay to close menu -->
    <div class="context-menu-overlay" @click="$emit('close')"></div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    position: { x: number; y: number };
    type: 'canvas' | 'node' | 'edge';
    target?: any;
  }>();
  
  defineEmits<{
    action: [action: string];
    close: [];
  }>();
  </script>
  
  <style scoped>
  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 200px;
    max-width: 280px;
    padding: 8px 0;
    font-size: 14px;
  }
  
  .context-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: transparent;
  }
  
  .menu-section {
    padding: 4px 0;
  }
  
  .menu-title {
    font-weight: 600;
    color: #4a5568;
    font-size: 12px;
    padding: 8px 16px 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
  }
  
  .menu-item:hover {
    background-color: #f7fafc;
  }
  
  .menu-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }
  
  .menu-shortcut {
    margin-left: auto;
    font-size: 11px;
    color: #a0aec0;
    font-weight: 500;
  }
  
  .menu-divider {
    height: 1px;
    background-color: #e2e8f0;
    margin: 4px 0;
  }
  </style>