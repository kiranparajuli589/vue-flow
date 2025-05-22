<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

console.log("CLOSE BRACKET NODE")
</script>

<template>
        <div class="bracket-node">
        <div class="node-header">
            <span class="node-title">Closing Bracket</span>
        </div>

        <div class="node-content">
            <span class="bracket-symbol">
                )
            </span>
        </div>

        <Handle
            type="source"
            :position="Position.Bottom"
            :isConnectable="true"
            class="vf-handle source-handle"
        />
        <Handle
            type="target"
            :position="Position.Top"
            :isConnectable="true"
            class="vf-handle target-handle"
        />

    </div>
</template>

<style scoped>
.bracket-node {
    background-color: white;
    border: 1px solid #d6bcfa;
    border-radius: 8px;
    width: 150px;
    padding: 12px;
}
</style>