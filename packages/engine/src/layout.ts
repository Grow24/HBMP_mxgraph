import type { RFGraph, LayoutRequest, LayoutResponse } from '@hbmp/shared-types';

/**
 * Layout algorithm types
 */
export type LayoutAlgorithm = 'hierarchical' | 'tree' | 'stack' | 'organic' | 'circle';

/**
 * Layout options
 */
export interface LayoutOptions {
  algorithm?: LayoutAlgorithm;
  orientation?: 'LR' | 'TB';
  laneAware?: boolean;
  spacing?: {
    node?: number;
    rank?: number;
    lane?: number;
  };
  edgeRouting?: boolean;
}

/**
 * Apply layout algorithm to a React Flow graph
 * 
 * @param graph Input graph
 * @param options Layout options
 * @returns Graph with updated positions
 */
export function layoutGraph(graph: RFGraph, options: LayoutOptions = {}): RFGraph {
  const {
    algorithm = 'hierarchical',
    orientation = 'LR',
    laneAware = true,
    spacing = { node: 80, rank: 120, lane: 250 },
    edgeRouting = true
  } = options;
  
  // Clone the graph to avoid mutations
  const layoutGraph: RFGraph = {
    nodes: [...graph.nodes],
    edges: [...graph.edges],
    meta: { ...graph.meta, orientation }
  };
  
  if (laneAware) {
    layoutGraph.nodes = applyLaneAwareLayout(layoutGraph.nodes, algorithm, orientation, spacing);
  } else {
    layoutGraph.nodes = applyGlobalLayout(layoutGraph.nodes, layoutGraph.edges, algorithm, orientation, spacing);
  }
  
  // Apply edge routing if requested
  if (edgeRouting) {
    layoutGraph.edges = routeEdges(layoutGraph.edges, layoutGraph.nodes);
  }
  
  return layoutGraph;
}

/**
 * Apply lane-aware layout (layout within each lane separately)
 */
function applyLaneAwareLayout(
  nodes: any[], 
  algorithm: LayoutAlgorithm, 
  orientation: string, 
  spacing: any
): any[] {
  const laneNodes = nodes.filter(node => node.type === 'lane');
  const regularNodes = nodes.filter(node => node.type !== 'lane');
  const updatedNodes = [...nodes];
  
  // First, position lanes
  laneNodes.forEach((lane, index) => {
    if (orientation === 'LR' || orientation === 'RL') {
      // Vertical stacking of lanes
      lane.position.y = index * spacing.lane;
      lane.position.x = 0;
    } else {
      // Horizontal stacking of lanes
      lane.position.x = index * spacing.lane;
      lane.position.y = 0;
    }
  });
  
  // Then layout nodes within each lane
  for (const lane of laneNodes) {
    const laneChildren = regularNodes.filter(node => node.data.laneId === lane.id);
    const laidOutChildren = applyAlgorithmToNodes(laneChildren, [], algorithm, orientation, spacing);
    
    // Offset positions relative to lane
    laidOutChildren.forEach(child => {
      const nodeIndex = updatedNodes.findIndex(n => n.id === child.id);
      if (nodeIndex >= 0) {
        updatedNodes[nodeIndex].position = {
          x: lane.position.x + child.position.x + 20, // 20px padding from lane edge
          y: lane.position.y + child.position.y + 60  // 60px padding for lane header
        };
      }
    });
  }
  
  // Layout orphaned nodes (not in any lane)
  const orphanedNodes = regularNodes.filter(node => !node.data.laneId);
  if (orphanedNodes.length > 0) {
    const laidOutOrphans = applyAlgorithmToNodes(orphanedNodes, [], algorithm, orientation, spacing);
    
    laidOutOrphans.forEach(orphan => {
      const nodeIndex = updatedNodes.findIndex(n => n.id === orphan.id);
      if (nodeIndex >= 0) {
        updatedNodes[nodeIndex].position = orphan.position;
      }
    });
  }
  
  return updatedNodes;
}

/**
 * Apply global layout (treat all nodes as one graph)
 */
function applyGlobalLayout(
  nodes: any[], 
  edges: any[], 
  algorithm: LayoutAlgorithm, 
  orientation: string, 
  spacing: any
): any[] {
  return applyAlgorithmToNodes(nodes, edges, algorithm, orientation, spacing);
}

/**
 * Apply specific layout algorithm to a set of nodes
 */
function applyAlgorithmToNodes(
  nodes: any[], 
  edges: any[], 
  algorithm: LayoutAlgorithm, 
  orientation: string, 
  spacing: any
): any[] {
  switch (algorithm) {
    case 'hierarchical':
      return hierarchicalLayout(nodes, edges, orientation, spacing);
    case 'tree':
      return treeLayout(nodes, edges, orientation, spacing);
    case 'stack':
      return stackLayout(nodes, orientation, spacing);
    case 'organic':
      return organicLayout(nodes, edges, spacing);
    case 'circle':
      return circleLayout(nodes, spacing);
    default:
      return nodes;
  }
}

/**
 * Hierarchical layout (layered, dependency-aware)
 */
function hierarchicalLayout(nodes: any[], edges: any[], orientation: string, spacing: any): any[] {
  // Build dependency graph
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  
  for (const node of nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }
  
  for (const edge of edges) {
    incoming.get(edge.target)?.push(edge.source);
    outgoing.get(edge.source)?.push(edge.target);
  }
  
  // Topological sort to determine layers
  const layers: string[][] = [];
  const visited = new Set<string>();
  const queue = nodes.filter(node => incoming.get(node.id)?.length === 0).map(n => n.id);
  
  while (queue.length > 0) {
    const currentLayer = [...queue];
    layers.push(currentLayer);
    queue.length = 0;
    
    for (const nodeId of currentLayer) {
      visited.add(nodeId);
      const children = outgoing.get(nodeId) || [];
      
      for (const childId of children) {
        const childIncoming = incoming.get(childId) || [];
        if (childIncoming.every(parentId => visited.has(parentId))) {
          if (!queue.includes(childId)) {
            queue.push(childId);
          }
        }
      }
    }
  }
  
  // Position nodes based on layers
  const updatedNodes = [...nodes];
  
  layers.forEach((layer, layerIndex) => {
    layer.forEach((nodeId, nodeIndex) => {
      const node = updatedNodes.find(n => n.id === nodeId);
      if (node) {
        if (orientation === 'LR') {
          node.position.x = layerIndex * spacing.rank;
          node.position.y = nodeIndex * spacing.node;
        } else if (orientation === 'TB') {
          node.position.x = nodeIndex * spacing.node;
          node.position.y = layerIndex * spacing.rank;
        }
      }
    });
  });
  
  return updatedNodes;
}

/**
 * Simple tree layout
 */
function treeLayout(nodes: any[], edges: any[], orientation: string, spacing: any): any[] {
  // Find root nodes (no incoming edges)
  const hasIncoming = new Set(edges.map(e => e.target));
  const roots = nodes.filter(node => !hasIncoming.has(node.id));
  
  if (roots.length === 0) {
    // No clear hierarchy, fall back to stack layout
    return stackLayout(nodes, orientation, spacing);
  }
  
  // For simplicity, use first root as tree root
  const root = roots[0];
  const positioned = new Set<string>();
  const updatedNodes = [...nodes];
  
  function positionSubtree(nodeId: string, x: number, y: number, level: number): number {
    const node = updatedNodes.find(n => n.id === nodeId);
    if (!node || positioned.has(nodeId)) return y;
    
    node.position.x = x;
    node.position.y = y;
    positioned.add(nodeId);
    
    const children = edges.filter(e => e.source === nodeId).map(e => e.target);
    let nextY = y;
    
    for (const childId of children) {
      nextY = positionSubtree(childId, x + spacing.rank, nextY, level + 1);
      nextY += spacing.node;
    }
    
    return Math.max(y, nextY - spacing.node);
  }
  
  positionSubtree(root.id, 0, 0, 0);
  
  return updatedNodes;
}

/**
 * Stack layout (simple grid)
 */
function stackLayout(nodes: any[], orientation: string, spacing: any): any[] {
  const updatedNodes = [...nodes];
  const cols = Math.ceil(Math.sqrt(nodes.length));
  
  updatedNodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    if (orientation === 'LR') {
      node.position.x = col * spacing.node;
      node.position.y = row * spacing.node;
    } else {
      node.position.x = row * spacing.node;
      node.position.y = col * spacing.node;
    }
  });
  
  return updatedNodes;
}

/**
 * Organic/force-directed layout (simplified)
 */
function organicLayout(nodes: any[], edges: any[], spacing: any): any[] {
  // Simplified force-directed layout
  const updatedNodes = [...nodes];
  const iterations = 50;
  const k = spacing.node;
  
  // Initialize random positions
  updatedNodes.forEach(node => {
    node.position.x = Math.random() * 400;
    node.position.y = Math.random() * 400;
  });
  
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { x: number; y: number }>();
    
    // Initialize forces
    updatedNodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 });
    });
    
    // Repulsive forces between all nodes
    for (let i = 0; i < updatedNodes.length; i++) {
      for (let j = i + 1; j < updatedNodes.length; j++) {
        const node1 = updatedNodes[i];
        const node2 = updatedNodes[j];
        
        const dx = node1.position.x - node2.position.x;
        const dy = node1.position.y - node2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = k * k / distance;
        const fx = force * dx / distance;
        const fy = force * dy / distance;
        
        const force1 = forces.get(node1.id)!;
        const force2 = forces.get(node2.id)!;
        
        force1.x += fx;
        force1.y += fy;
        force2.x -= fx;
        force2.y -= fy;
      }
    }
    
    // Attractive forces for connected nodes
    edges.forEach(edge => {
      const source = updatedNodes.find(n => n.id === edge.source);
      const target = updatedNodes.find(n => n.id === edge.target);
      
      if (source && target) {
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = distance * distance / k;
        const fx = force * dx / distance;
        const fy = force * dy / distance;
        
        const sourceForce = forces.get(source.id)!;
        const targetForce = forces.get(target.id)!;
        
        sourceForce.x += fx;
        sourceForce.y += fy;
        targetForce.x -= fx;
        targetForce.y -= fy;
      }
    });
    
    // Apply forces
    updatedNodes.forEach(node => {
      const force = forces.get(node.id)!;
      const temp = k / (iter + 1);
      
      node.position.x += force.x * temp * 0.1;
      node.position.y += force.y * temp * 0.1;
    });
  }
  
  return updatedNodes;
}

/**
 * Circle layout
 */
function circleLayout(nodes: any[], spacing: any): any[] {
  const updatedNodes = [...nodes];
  const radius = Math.max(100, nodes.length * spacing.node / (2 * Math.PI));
  const angleStep = (2 * Math.PI) / nodes.length;
  
  updatedNodes.forEach((node, index) => {
    const angle = index * angleStep;
    node.position.x = radius + radius * Math.cos(angle);
    node.position.y = radius + radius * Math.sin(angle);
  });
  
  return updatedNodes;
}

/**
 * Route edges with waypoints (simplified orthogonal routing)
 */
function routeEdges(edges: any[], nodes: any[]): any[] {
  return edges.map(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    
    if (!source || !target) return edge;
    
    // Simple orthogonal routing: add one waypoint
    const midX = (source.position.x + target.position.x) / 2;
    const midY = source.position.y;
    
    return {
      ...edge,
      points: [{ x: midX, y: midY }]
    };
  });
}