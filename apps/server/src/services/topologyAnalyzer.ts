/**
 * Network Topology Analyzer
 * Advanced topology validation including reachability, flow analysis, and semantic correctness
 */

import type { RFGraph, RFNode, RFEdge, NodeKind, ValidationIssue } from '@hbmp/shared-types';
import { HBMP_NETWORK_REGISTRY, createRegistryQuery } from '@hbmp/engine';

const registryQuery = createRegistryQuery(HBMP_NETWORK_REGISTRY);

export interface TopologyAnalysisResult {
  valid: boolean;
  issues: ValidationIssue[];
  metrics: TopologyMetrics;
  flowPaths: FlowPath[];
  unreachableNodes: string[];
  deadEnds: string[];
  criticalNodes: string[]; // Nodes that if removed would break the flow
}

export interface TopologyMetrics {
  totalNodes: number;
  totalEdges: number;
  startNodes: number;
  endNodes: number;
  maxDepth: number;
  averageConnectivity: number;
  cycleCount: number;
  componentCount: number; // Number of disconnected subgraphs
  longestPath: number;
}

export interface FlowPath {
  id: string;
  nodes: string[];
  edges: string[];
  length: number;
  isComplete: boolean; // Has both start and end
  hasGaps: boolean; // Has missing connections
}

export class TopologyAnalyzer {
  /**
   * Perform comprehensive topology analysis
   */
  analyzeTopology(graph: RFGraph): TopologyAnalysisResult {
    const issues: ValidationIssue[] = [];

    // Calculate metrics
    const metrics = this.calculateMetrics(graph);

    // Find flow paths
    const flowPaths = this.findFlowPaths(graph);

    // Find unreachable nodes
    const unreachableNodes = this.findUnreachableNodes(graph);
    if (unreachableNodes.length > 0) {
      issues.push({
        id: 'topology-unreachable-nodes',
        level: 'warn',
        message: `Found ${unreachableNodes.length} unreachable node(s) from start nodes`,
        type: 'graph',
        details: { unreachableNodes }
      });
    }

    // Find dead ends (nodes that don't lead to any output)
    const deadEnds = this.findDeadEnds(graph);
    if (deadEnds.length > 0) {
      issues.push({
        id: 'topology-dead-ends',
        level: 'warn',
        message: `Found ${deadEnds.length} dead-end node(s) that don't lead to outputs`,
        type: 'graph',
        details: { deadEnds }
      });
    }

    // Find critical nodes (single points of failure)
    const criticalNodes = this.findCriticalNodes(graph);
    if (criticalNodes.length > 0) {
      issues.push({
        id: 'topology-critical-nodes',
        level: 'info',
        message: `Found ${criticalNodes.length} critical node(s) that would break flow if removed`,
        type: 'graph',
        details: { criticalNodes }
      });
    }

    // Validate required port connections
    const portIssues = this.validateRequiredPorts(graph);
    issues.push(...portIssues);

    // Validate flow sequences (check if node order makes semantic sense)
    const sequenceIssues = this.validateFlowSequences(graph);
    issues.push(...sequenceIssues);

    // Validate data flow continuity
    const dataFlowIssues = this.validateDataFlowContinuity(graph);
    issues.push(...dataFlowIssues);

    return {
      valid: issues.filter(i => i.level === 'error').length === 0,
      issues,
      metrics,
      flowPaths,
      unreachableNodes,
      deadEnds,
      criticalNodes
    };
  }

  /**
   * Calculate topology metrics
   */
  private calculateMetrics(graph: RFGraph): TopologyMetrics {
    const startNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.target === node.id).length === 0;
    });

    const endNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.source === node.id).length === 0;
    });

    const maxDepth = this.calculateMaxDepth(graph);
    const cycles = this.detectCycles(graph);
    const components = this.findConnectedComponents(graph);
    const longestPath = this.findLongestPath(graph);

    // Calculate average connectivity
    const totalConnections = graph.edges.length;
    const avgConnectivity = graph.nodes.length > 0 
      ? totalConnections / graph.nodes.length 
      : 0;

    return {
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      startNodes: startNodes.length,
      endNodes: endNodes.length,
      maxDepth,
      averageConnectivity: Math.round(avgConnectivity * 100) / 100,
      cycleCount: cycles.length,
      componentCount: components.length,
      longestPath
    };
  }

  /**
   * Find all flow paths through the network
   */
  private findFlowPaths(graph: RFGraph): FlowPath[] {
    const paths: FlowPath[] = [];
    
    // Find all start nodes
    const startNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.target === node.id).length === 0;
    });

    // DFS from each start node to find all paths
    startNodes.forEach(startNode => {
      this.dfsFlowPaths(graph, startNode.id, [], [], paths);
    });

    return paths;
  }

  private dfsFlowPaths(
    graph: RFGraph,
    currentNodeId: string,
    visitedNodes: string[],
    visitedEdges: string[],
    paths: FlowPath[]
  ): void {
    visitedNodes.push(currentNodeId);

    const outgoing = graph.edges.filter(e => e.source === currentNodeId);

    if (outgoing.length === 0) {
      // Reached an end node - save the path
      paths.push({
        id: `path-${paths.length}`,
        nodes: [...visitedNodes],
        edges: [...visitedEdges],
        length: visitedNodes.length,
        isComplete: true,
        hasGaps: false
      });
      return;
    }

    outgoing.forEach(edge => {
      if (!visitedNodes.includes(edge.target)) {
        this.dfsFlowPaths(
          graph,
          edge.target,
          [...visitedNodes],
          [...visitedEdges, edge.id],
          paths
        );
      }
    });
  }

  /**
   * Find unreachable nodes (can't be reached from any start node)
   */
  private findUnreachableNodes(graph: RFGraph): string[] {
    const reachable = new Set<string>();
    
    // Find all start nodes
    const startNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.target === node.id).length === 0;
    });

    // BFS from each start node
    const queue: string[] = startNodes.map(n => n.id);
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      reachable.add(nodeId);

      const outgoing = graph.edges.filter(e => e.source === nodeId);
      outgoing.forEach(edge => {
        if (!reachable.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    // Find nodes that aren't reachable
    return graph.nodes
      .filter(node => !reachable.has(node.id) && node.type !== 'lane')
      .map(node => node.id);
  }

  /**
   * Find dead-end nodes (don't lead to any output nodes)
   */
  private findDeadEnds(graph: RFGraph): string[] {
    const leadsToOutput = new Set<string>();
    
    // Find all end nodes (outputs)
    const endNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.source === node.id).length === 0;
    });

    // Mark all end nodes
    endNodes.forEach(node => leadsToOutput.add(node.id));

    // Reverse BFS from end nodes
    const queue: string[] = [...leadsToOutput];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;

      const incoming = graph.edges.filter(e => e.target === nodeId);
      incoming.forEach(edge => {
        if (!leadsToOutput.has(edge.source)) {
          leadsToOutput.add(edge.source);
          queue.push(edge.source);
        }
      });
    }

    // Find nodes that don't lead to outputs
    return graph.nodes
      .filter(node => !leadsToOutput.has(node.id) && node.type !== 'lane')
      .filter(node => {
        // Exclude end nodes themselves
        const outgoing = graph.edges.filter(e => e.source === node.id);
        return outgoing.length > 0;
      })
      .map(node => node.id);
  }

  /**
   * Find critical nodes (single points of failure)
   */
  private findCriticalNodes(graph: RFGraph): string[] {
    const critical: string[] = [];

    graph.nodes.forEach(node => {
      // Skip start and end nodes
      const incoming = graph.edges.filter(e => e.target === node.id);
      const outgoing = graph.edges.filter(e => e.source === node.id);

      if (incoming.length === 0 || outgoing.length === 0) return;

      // Check if removing this node would disconnect the graph
      const tempGraph = {
        nodes: graph.nodes.filter(n => n.id !== node.id),
        edges: graph.edges.filter(e => e.source !== node.id && e.target !== node.id)
      };

      const components = this.findConnectedComponents(tempGraph as RFGraph);
      if (components.length > 1) {
        critical.push(node.id);
      }
    });

    return critical;
  }

  /**
   * Validate required port connections
   */
  private validateRequiredPorts(graph: RFGraph): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    graph.nodes.forEach(node => {
      const nodeKind = node.data?.kind as NodeKind;
      if (!nodeKind) return;

      const nodeType = registryQuery.getNodeType(nodeKind);
      if (!nodeType) return;

      const requiredPorts = nodeType.validation.requiredPorts || [];
      
      requiredPorts.forEach(portId => {
        const port = nodeType.ports.find(p => p.id === portId);
        if (!port) return;

        const connections = port.direction === 'in'
          ? graph.edges.filter(e => e.target === node.id && e.targetHandle === portId)
          : graph.edges.filter(e => e.source === node.id && e.sourceHandle === portId);

        if (connections.length === 0) {
          issues.push({
            id: `${node.id}-missing-required-port-${portId}`,
            nodeId: node.id,
            level: 'error',
            message: `Required port '${port.label}' has no connection`,
            type: 'node'
          });
        }
      });
    });

    return issues;
  }

  /**
   * Validate flow sequences make semantic sense
   */
  private validateFlowSequences(graph: RFGraph): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for common anti-patterns
    graph.edges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      const sourceKind = sourceNode.data?.kind as NodeKind;
      const targetKind = targetNode.data?.kind as NodeKind;

      // Example: Report nodes shouldn't feed into dataset nodes (backwards flow)
      if (sourceKind === 'report' && targetKind === 'dataset') {
        issues.push({
          id: `${edge.id}-backwards-flow`,
          edgeId: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          level: 'warn',
          message: 'Suspicious flow: Report feeding back to Dataset',
          type: 'edge'
        });
      }

      // Example: Gateway should have multiple outputs
      if (sourceKind === 'gateway') {
        const gatewayOutputs = graph.edges.filter(e => e.source === edge.source);
        if (gatewayOutputs.length < 2) {
          issues.push({
            id: `${sourceNode.id}-gateway-single-output`,
            nodeId: sourceNode.id,
            level: 'warn',
            message: 'Gateway has only one output path (should branch)',
            type: 'node'
          });
        }
      }
    });

    return issues;
  }

  /**
   * Validate data flow continuity (data types match through the flow)
   */
  private validateDataFlowContinuity(graph: RFGraph): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    graph.edges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      const sourceKind = sourceNode.data?.kind as NodeKind;
      const targetKind = targetNode.data?.kind as NodeKind;

      const sourceType = registryQuery.getNodeType(sourceKind);
      const targetType = registryQuery.getNodeType(targetKind);

      if (!sourceType || !targetType) return;

      // Check if ports are specified
      if (edge.sourceHandle && edge.targetHandle) {
        const sourcePort = sourceType.ports.find(p => p.id === edge.sourceHandle);
        const targetPort = targetType.ports.find(p => p.id === edge.targetHandle);

        if (sourcePort && targetPort) {
          // Check data type compatibility
          if (sourcePort.dataType && targetPort.dataType) {
            if (sourcePort.dataType !== targetPort.dataType && 
                sourcePort.dataType !== 'any' && 
                targetPort.dataType !== 'any') {
              issues.push({
                id: `${edge.id}-data-type-mismatch`,
                edgeId: edge.id,
                sourceNodeId: edge.source,
                targetNodeId: edge.target,
                level: 'warn',
                message: `Data type mismatch: ${sourcePort.dataType} → ${targetPort.dataType}`,
                type: 'edge'
              });
            }
          }
        }
      }
    });

    return issues;
  }

  // Helper methods

  private calculateMaxDepth(graph: RFGraph): number {
    const depths = new Map<string, number>();
    const startNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.target === node.id).length === 0;
    });

    const queue: Array<{ nodeId: string; depth: number }> = startNodes.map(n => ({ nodeId: n.id, depth: 0 }));
    let maxDepth = 0;

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      const currentDepth = depths.get(nodeId) || 0;
      
      if (depth > currentDepth) {
        depths.set(nodeId, depth);
        maxDepth = Math.max(maxDepth, depth);
      }

      const outgoing = graph.edges.filter(e => e.source === nodeId);
      outgoing.forEach(edge => {
        queue.push({ nodeId: edge.target, depth: depth + 1 });
      });
    }

    return maxDepth;
  }

  private detectCycles(graph: RFGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      currentPath.push(nodeId);

      const outgoing = graph.edges.filter(e => e.source === nodeId);
      
      for (const edge of outgoing) {
        const targetId = edge.target;

        if (!visited.has(targetId)) {
          dfs(targetId);
        } else if (recursionStack.has(targetId)) {
          const cycleStart = currentPath.indexOf(targetId);
          const cycle = currentPath.slice(cycleStart);
          cycles.push([...cycle, targetId]);
        }
      }

      currentPath.pop();
      recursionStack.delete(nodeId);
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });

    return cycles;
  }

  private findConnectedComponents(graph: RFGraph): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    const dfs = (nodeId: string, component: string[]): void => {
      visited.add(nodeId);
      component.push(nodeId);

      // Check both outgoing and incoming edges (treat as undirected)
      const connected = graph.edges.filter(
        e => e.source === nodeId || e.target === nodeId
      );

      connected.forEach(edge => {
        const nextNode = edge.source === nodeId ? edge.target : edge.source;
        if (!visited.has(nextNode)) {
          dfs(nextNode, component);
        }
      });
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id) && node.type !== 'lane') {
        const component: string[] = [];
        dfs(node.id, component);
        if (component.length > 0) {
          components.push(component);
        }
      }
    });

    return components;
  }

  private findLongestPath(graph: RFGraph): number {
    let longest = 0;
    const visited = new Set<string>();

    const dfs = (nodeId: string, depth: number): void => {
      visited.add(nodeId);
      longest = Math.max(longest, depth);

      const outgoing = graph.edges.filter(e => e.source === nodeId);
      outgoing.forEach(edge => {
        if (!visited.has(edge.target)) {
          dfs(edge.target, depth + 1);
        }
      });

      visited.delete(nodeId);
    };

    const startNodes = graph.nodes.filter(node => {
      return graph.edges.filter(e => e.target === node.id).length === 0;
    });

    startNodes.forEach(node => {
      dfs(node.id, 0);
    });

    return longest;
  }
}

// Singleton instance
export const topologyAnalyzer = new TopologyAnalyzer();
