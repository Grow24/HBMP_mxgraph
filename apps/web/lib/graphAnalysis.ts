import { NetworkGraph, NetworkNode, NetworkEdge, TopologyAnalysis, GraphMetrics, ClusterInfo, PathInfo } from '@hbmp/shared-types';

/**
 * Graph analysis utilities for network modeling
 */

export class GraphAnalyzer {
  /**
   * Calculate basic graph metrics
   */
  static calculateMetrics(graph: NetworkGraph): GraphMetrics {
    const { nodes, edges } = graph;
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    // Calculate degree for each node
    const degrees = new Map<string, number>();
    nodes.forEach(n => degrees.set(n.id, 0));
    
    edges.forEach(edge => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    });

    const degreeValues = Array.from(degrees.values());
    const avgDegree = degreeValues.reduce((a, b) => a + b, 0) / nodeCount || 0;
    const maxDegree = Math.max(...degreeValues, 0);
    
    // Graph density
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

    // Connected components
    const connectedComponents = this.findConnectedComponents(graph).length;

    // Cycle detection
    const hasCycles = this.detectCycles(graph);

    return {
      nodeCount,
      edgeCount,
      avgDegree,
      maxDegree,
      density,
      connectedComponents,
      hasCycles,
    };
  }

  /**
   * Find connected components using DFS
   */
  static findConnectedComponents(graph: NetworkGraph): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];
    
    // Build adjacency list
    const adj = new Map<string, string[]>();
    graph.nodes.forEach(n => adj.set(n.id, []));
    graph.edges.forEach(e => {
      adj.get(e.source)?.push(e.target);
      adj.get(e.target)?.push(e.source);
    });

    const dfs = (nodeId: string, component: string[]) => {
      visited.add(nodeId);
      component.push(nodeId);
      
      adj.get(nodeId)?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, component);
        }
      });
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component: string[] = [];
        dfs(node.id, component);
        components.push(component);
      }
    });

    return components;
  }

  /**
   * Detect cycles using DFS
   */
  static detectCycles(graph: NetworkGraph): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    // Build adjacency list
    const adj = new Map<string, string[]>();
    graph.nodes.forEach(n => adj.set(n.id, []));
    graph.edges.forEach(e => adj.get(e.source)?.push(e.target));

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Find shortest path using BFS
   */
  static findShortestPath(graph: NetworkGraph, sourceId: string, targetId: string): PathInfo | null {
    const adj = new Map<string, string[]>();
    graph.nodes.forEach(n => adj.set(n.id, []));
    graph.edges.forEach(e => {
      adj.get(e.source)?.push(e.target);
      adj.get(e.target)?.push(e.source);
    });

    const queue: string[] = [sourceId];
    const visited = new Set<string>([sourceId]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === targetId) {
        // Reconstruct path
        const path: string[] = [];
        let node = targetId;
        while (node !== sourceId) {
          path.unshift(node);
          node = parent.get(node)!;
        }
        path.unshift(sourceId);

        // Find edges in path
        const pathEdges: string[] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const edge = graph.edges.find(
            e => (e.source === path[i] && e.target === path[i + 1]) ||
                 (e.target === path[i] && e.source === path[i + 1])
          );
          if (edge) pathEdges.push(edge.id);
        }

        return {
          nodes: path,
          edges: pathEdges,
          length: path.length - 1,
        };
      }

      adj.get(current)?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      });
    }

    return null;
  }

  /**
   * Find dead-end nodes (nodes with no outgoing edges)
   */
  static findDeadEnds(graph: NetworkGraph): string[] {
    const hasOutgoing = new Set<string>();
    graph.edges.forEach(e => hasOutgoing.add(e.source));
    
    return graph.nodes
      .filter(n => !hasOutgoing.has(n.id))
      .map(n => n.id);
  }

  /**
   * Find unreachable nodes (nodes not reachable from any start node)
   */
  static findUnreachableNodes(graph: NetworkGraph, startNodeIds: string[]): string[] {
    const reachable = new Set<string>();
    
    // Build adjacency list
    const adj = new Map<string, string[]>();
    graph.nodes.forEach(n => adj.set(n.id, []));
    graph.edges.forEach(e => {
      adj.get(e.source)?.push(e.target);
      adj.get(e.target)?.push(e.source);
    });

    const dfs = (nodeId: string) => {
      reachable.add(nodeId);
      adj.get(nodeId)?.forEach(neighbor => {
        if (!reachable.has(neighbor)) {
          dfs(neighbor);
        }
      });
    };

    startNodeIds.forEach(id => {
      if (!reachable.has(id)) {
        dfs(id);
      }
    });

    return graph.nodes
      .filter(n => !reachable.has(n.id))
      .map(n => n.id);
  }

  /**
   * Find critical nodes (nodes whose removal disconnects the graph)
   */
  static findCriticalNodes(graph: NetworkGraph): string[] {
    const critical: string[] = [];
    const originalComponents = this.findConnectedComponents(graph).length;

    for (const node of graph.nodes) {
      // Create graph without this node
      const testGraph: NetworkGraph = {
        nodes: graph.nodes.filter(n => n.id !== node.id),
        edges: graph.edges.filter(e => e.source !== node.id && e.target !== node.id),
      };

      const newComponents = this.findConnectedComponents(testGraph).length;
      if (newComponents > originalComponents) {
        critical.push(node.id);
      }
    }

    return critical;
  }

  /**
   * Simple community detection using Louvain-like algorithm
   */
  static detectClusters(graph: NetworkGraph): ClusterInfo[] {
    // Simplified clustering: group by connected components first
    const components = this.findConnectedComponents(graph);
    
    return components.map((nodeIds, index) => {
      const subgraph = {
        nodes: graph.nodes.filter(n => nodeIds.includes(n.id)),
        edges: graph.edges.filter(e => nodeIds.includes(e.source) && nodeIds.includes(e.target)),
      };

      const metrics = this.calculateMetrics(subgraph);

      return {
        id: `cluster-${index}`,
        nodeIds,
        size: nodeIds.length,
        density: metrics.density,
      };
    });
  }

  /**
   * Get 1-hop neighbors of a node
   */
  static getNeighbors(graph: NetworkGraph, nodeId: string): string[] {
    const neighbors = new Set<string>();
    
    graph.edges.forEach(edge => {
      if (edge.source === nodeId) neighbors.add(edge.target);
      if (edge.target === nodeId) neighbors.add(edge.source);
    });

    return Array.from(neighbors);
  }

  /**
   * Calculate influence score (based on degree centrality)
   */
  static calculateInfluenceScores(graph: NetworkGraph): Map<string, number> {
    const scores = new Map<string, number>();
    const degrees = new Map<string, number>();
    
    graph.nodes.forEach(n => degrees.set(n.id, 0));
    graph.edges.forEach(e => {
      degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
      degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
    });

    const maxDegree = Math.max(...Array.from(degrees.values()), 1);
    
    degrees.forEach((degree, nodeId) => {
      scores.set(nodeId, degree / maxDegree);
    });

    return scores;
  }

  /**
   * Perform complete topology analysis
   */
  static analyzeTopology(graph: NetworkGraph): TopologyAnalysis {
    const metrics = this.calculateMetrics(graph);
    const clusters = this.detectClusters(graph);
    const criticalNodes = this.findCriticalNodes(graph);
    const deadEnds = this.findDeadEnds(graph);
    
    // Find start nodes (nodes with no incoming edges)
    const hasIncoming = new Set<string>();
    graph.edges.forEach(e => hasIncoming.add(e.target));
    const startNodes = graph.nodes
      .filter(n => !hasIncoming.has(n.id))
      .map(n => n.id);
    
    const unreachableNodes = startNodes.length > 0 
      ? this.findUnreachableNodes(graph, startNodes)
      : [];

    return {
      metrics,
      clusters,
      criticalNodes,
      deadEnds,
      unreachableNodes,
    };
  }
}
