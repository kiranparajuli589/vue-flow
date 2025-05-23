// src/composables/useRootNodeManager.ts
import { ref, computed, watch } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { NodeType } from '@/types/rule-builder';

export function useRootNodeManager() {
  const { getNodes, updateNode, getEdges } = useVueFlow();

  const currentRootNodeId = ref<string | null>(null);

  // Get nodes with priority ordering
  const nodesByPriority = computed(() => {
    const nodes = getNodes.value;
    return [...nodes].sort((a, b) => {
      // Priority: Opening brackets > Closing brackets > Condition nodes
      const priorities = {
        [NodeType.BRACKET_OPEN]: 1,
        [NodeType.BRACKET_CLOSE]: 2,
        [NodeType.CONDITION]: 3
      };

      const aPriority = priorities[a.type] || 999;
      const bPriority = priorities[b.type] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // If same priority, sort by creation order (assuming id contains creation info)
      return a.id.localeCompare(b.id);
    });
  });

  // Auto-select root node when nodes change
  watch([nodesByPriority], () => {
    const nodes = nodesByPriority.value;
    const edges = getEdges.value;

    // If no current root or current root doesn't exist anymore
    if (!currentRootNodeId.value || !nodes.find(n => n.id === currentRootNodeId.value)) {
      autoSelectRootNode(nodes, edges);
    }
  }, { immediate: true });

  // Auto-select root node based on priority and connection status
  function autoSelectRootNode(nodes: any[], edges: any[]) {
    if (nodes.length === 0) {
      currentRootNodeId.value = null;
      return;
    }

    // If only one node, make it root
    if (nodes.length === 1) {
      currentRootNodeId.value = nodes[0].id;
      return;
    }

    // Find nodes that are part of connected flows
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    // If we have connected nodes, prefer them
    const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id));

    if (connectedNodes.length > 0) {
      // Among connected nodes, find root nodes (no incoming edges)
      const rootNodes = connectedNodes.filter(node =>
        !edges.some(edge => edge.target === node.id)
      );

      if (rootNodes.length > 0) {
        // Pick the highest priority root node
        currentRootNodeId.value = rootNodes[0].id;
        return;
      }

      // If no clear root among connected nodes, pick highest priority connected node
      currentRootNodeId.value = connectedNodes[0].id;
      return;
    }

    // If no connected nodes, pick the highest priority node
    currentRootNodeId.value = nodes[0].id;
  }

  // Check if a node is the root node
  function isRootNode(nodeId: string): boolean {
    return currentRootNodeId.value === nodeId;
  }

  // Set a specific node as root
  function setRootNode(nodeId: string) {
    currentRootNodeId.value = nodeId;
  }

  // Move node to top of canvas
  function moveNodeToTop(nodeId: string) {
    const nodes = getNodes.value;
    const targetNode = nodes.find(n => n.id === nodeId);

    if (!targetNode) return;

    // Find the topmost Y position among all nodes
    const topY = Math.min(...nodes.map(n => n.position.y));

    // Move the root node above all others
    const newY = topY - 150; // 150px above the current top node

    updateNode(nodeId, {
      position: {
        x: targetNode.position.x,
        y: newY
      }
    });
  }

  // Get the current root node
  function getRootNode() {
    const nodes = getNodes.value;
    return nodes.find(n => n.id === currentRootNodeId.value) || null;
  }

  // Get all nodes connected to root (for preview)
  function getConnectedFlow() {
    const nodes = getNodes.value;
    const edges = getEdges.value;
    const rootNode = getRootNode();

    if (!rootNode) {
      return { nodes: [], edges: [] };
    }

    // Find all nodes connected to the root node using BFS
    const visited = new Set<string>();
    const queue = [rootNode.id];
    const connectedNodes = new Set<string>();
    const connectedEdges = new Set<string>();

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;

      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);
      connectedNodes.add(currentNodeId);

      // Find all edges connected to this node
      const nodeEdges = edges.filter(edge =>
        edge.source === currentNodeId || edge.target === currentNodeId
      );

      nodeEdges.forEach(edge => {
        connectedEdges.add(edge.id);

        // Add the other node to queue if not visited
        const otherNodeId = edge.source === currentNodeId ? edge.target : edge.source;
        if (!visited.has(otherNodeId)) {
          queue.push(otherNodeId);
        }
      });
    }

    return {
      nodes: nodes.filter(n => connectedNodes.has(n.id)),
      edges: edges.filter(e => connectedEdges.has(e.id))
    };
  }

  // Check if there are enough connected nodes for preview
  function hasValidFlow(): boolean {
    const connectedFlow = getConnectedFlow();
    return connectedFlow.nodes.length >= 2 && connectedFlow.edges.length >= 1;
  }

  return {
    currentRootNodeId: computed(() => currentRootNodeId.value),
    isRootNode,
    setRootNode,
    moveNodeToTop,
    getRootNode,
    getConnectedFlow,
    hasValidFlow,
    autoSelectRootNode
  };
}