/**
 * Network Validation Service
 * Backend validation using the Network Type Registry
 */

import { HBMP_NETWORK_REGISTRY, createRegistryQuery } from '@hbmp/engine';
import type { RFGraph, RFNode, RFEdge, NodeKind, ValidationIssue } from '@hbmp/shared-types';
import type { NetworkTypeRegistry } from '@hbmp/engine';

// Create registry query engine
const registryQuery = createRegistryQuery(HBMP_NETWORK_REGISTRY);

export interface NetworkValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export class NetworkValidationService {
  private registry: NetworkTypeRegistry;

  constructor() {
    this.registry = HBMP_NETWORK_REGISTRY;
  }

  /**
   * Validate entire network graph
   */
  validateNetwork(graph: RFGraph): NetworkValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    // Validate all nodes
    graph.nodes.forEach(node => {
      const nodeIssues = this.validateNode(node, graph);
      errors.push(...nodeIssues.errors);
      warnings.push(...nodeIssues.warnings);
      info.push(...nodeIssues.info);
    });

    // Validate all edges
    graph.edges.forEach(edge => {
      const edgeIssues = this.validateEdge(edge, graph);
      errors.push(...edgeIssues.errors);
      warnings.push(...edgeIssues.warnings);
      info.push(...edgeIssues.info);
    });

    // Validate global rules
    const globalIssues = this.validateGlobalRules(graph);
    errors.push(...globalIssues.errors);
    warnings.push(...globalIssues.warnings);
    info.push(...globalIssues.info);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalIssues: errors.length + warnings.length + info.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length
      }
    };
  }

  /**
   * Validate a single node
   */
  validateNode(node: RFNode, graph: RFGraph): NetworkValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const nodeKind = node.data?.kind as NodeKind;
    if (!nodeKind) {
      errors.push({
        id: `${node.id}-no-kind`,
        nodeId: node.id,
        level: 'error',
        message: 'Node has no type defined',
        type: 'node'
      });
      return { valid: false, errors, warnings, info, summary: { totalIssues: 1, errorCount: 1, warningCount: 0, infoCount: 0 } };
    }

    const nodeType = registryQuery.getNodeType(nodeKind);
    if (!nodeType) {
      errors.push({
        id: `${node.id}-invalid-type`,
        nodeId: node.id,
        level: 'error',
        message: `Unknown node type: ${nodeKind}`,
        type: 'node'
      });
      return { valid: false, errors, warnings, info, summary: { totalIssues: 1, errorCount: 1, warningCount: 0, infoCount: 0 } };
    }

    // Validate node metadata
    const metadataValidation = registryQuery.validateNode(nodeKind, node.data, graph);
    if (!metadataValidation.valid) {
      metadataValidation.errors.forEach(error => {
        errors.push({
          id: `${node.id}-metadata-${error}`,
          nodeId: node.id,
          level: 'error',
          message: error,
          type: 'node'
        });
      });
    }
    metadataValidation.warnings.forEach(warning => {
      warnings.push({
        id: `${node.id}-metadata-warning-${warning}`,
        nodeId: node.id,
        level: 'warn',
        message: warning,
        type: 'node'
      });
    });

    // Validate connection count
    const inputCount = graph.edges.filter(e => e.target === node.id).length;
    const outputCount = graph.edges.filter(e => e.source === node.id).length;
    
    const countValidation = registryQuery.validateConnectionCount(nodeKind, inputCount, outputCount);
    if (!countValidation.valid) {
      countValidation.errors.forEach(error => {
        warnings.push({
          id: `${node.id}-connection-count-${error}`,
          nodeId: node.id,
          level: 'warn',
          message: error,
          type: 'node'
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalIssues: errors.length + warnings.length + info.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length
      }
    };
  }

  /**
   * Validate a single edge/connection
   */
  validateEdge(edge: RFEdge, graph: RFGraph): NetworkValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      errors.push({
        id: `${edge.id}-missing-nodes`,
        edgeId: edge.id,
        level: 'error',
        message: 'Edge references non-existent nodes',
        type: 'edge'
      });
      return { valid: false, errors, warnings, info, summary: { totalIssues: 1, errorCount: 1, warningCount: 0, infoCount: 0 } };
    }

    const sourceKind = sourceNode.data?.kind as NodeKind;
    const targetKind = targetNode.data?.kind as NodeKind;

    if (!sourceKind || !targetKind) {
      errors.push({
        id: `${edge.id}-missing-type`,
        edgeId: edge.id,
        level: 'error',
        message: 'Edge connects nodes with missing types',
        type: 'edge'
      });
      return { valid: false, errors, warnings, info, summary: { totalIssues: 1, errorCount: 1, warningCount: 0, infoCount: 0 } };
    }

    // Validate connection using registry
    const connectionValidation = registryQuery.isConnectionValid(
      sourceKind,
      targetKind,
      edge.sourceHandle || undefined,
      edge.targetHandle || undefined
    );

    if (!connectionValidation.valid) {
      errors.push({
        id: `${edge.id}-invalid-connection`,
        edgeId: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        level: 'error',
        message: connectionValidation.reason || 'Invalid connection',
        type: 'edge'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalIssues: errors.length + warnings.length + info.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length
      }
    };
  }

  /**
   * Validate global network rules
   */
  validateGlobalRules(graph: RFGraph): NetworkValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const globalRules = this.registry.globalRules;

    // Check for cycles if not allowed
    if (!globalRules.allowCycles) {
      const cycles = this.detectCycles(graph);
      if (cycles.length > 0) {
        errors.push({
          id: 'global-cycles-detected',
          level: 'error',
          message: `Network contains ${cycles.length} cycle(s). Cycles are not allowed.`,
          type: 'graph',
          details: { cycles }
        });
      }
    }

    // Check for start nodes if required
    if (globalRules.requireStartNodes) {
      const startNodes = graph.nodes.filter(node => {
        const incoming = graph.edges.filter(e => e.target === node.id);
        return incoming.length === 0;
      });

      if (startNodes.length === 0) {
        errors.push({
          id: 'global-no-start-nodes',
          level: 'error',
          message: 'Network must have at least one start node (node with no inputs)',
          type: 'graph'
        });
      }
    }

    // Check for end nodes if required
    if (globalRules.requireEndNodes) {
      const endNodes = graph.nodes.filter(node => {
        const outgoing = graph.edges.filter(e => e.source === node.id);
        return outgoing.length === 0;
      });

      if (endNodes.length === 0) {
        errors.push({
          id: 'global-no-end-nodes',
          level: 'error',
          message: 'Network must have at least one end node (node with no outputs)',
          type: 'graph'
        });
      }
    }

    // Check max depth
    if (globalRules.maxDepth) {
      const maxDepth = this.calculateMaxDepth(graph);
      if (maxDepth > globalRules.maxDepth) {
        warnings.push({
          id: 'global-max-depth-exceeded',
          level: 'warn',
          message: `Network depth (${maxDepth}) exceeds recommended maximum (${globalRules.maxDepth})`,
          type: 'graph'
        });
      }
    }

    // Check for orphaned nodes
    const orphanedNodes = graph.nodes.filter(node => {
      const connected = graph.edges.some(e => e.source === node.id || e.target === node.id);
      return !connected && node.type !== 'lane'; // Lanes can be disconnected
    });

    if (orphanedNodes.length > 0) {
      warnings.push({
        id: 'global-orphaned-nodes',
        level: 'warn',
        message: `Found ${orphanedNodes.length} orphaned node(s) with no connections`,
        type: 'graph',
        details: { orphanedNodes: orphanedNodes.map(n => n.id) }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalIssues: errors.length + warnings.length + info.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length
      }
    };
  }

  /**
   * Detect cycles in the graph
   */
  private detectCycles(graph: RFGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      currentPath.push(nodeId);

      const outgoing = graph.edges.filter(e => e.source === nodeId);
      
      for (const edge of outgoing) {
        const targetId = edge.target;

        if (!visited.has(targetId)) {
          if (dfs(targetId)) return true;
        } else if (recursionStack.has(targetId)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(targetId);
          const cycle = currentPath.slice(cycleStart);
          cycles.push([...cycle, targetId]);
          return true;
        }
      }

      currentPath.pop();
      recursionStack.delete(nodeId);
      return false;
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });

    return cycles;
  }

  /**
   * Calculate maximum depth of the graph
   */
  private calculateMaxDepth(graph: RFGraph): number {
    const depths = new Map<string, number>();
    
    // Find start nodes (nodes with no incoming edges)
    const startNodes = graph.nodes.filter(node => {
      const incoming = graph.edges.filter(e => e.target === node.id);
      return incoming.length === 0;
    });

    // BFS to calculate depths
    const queue: Array<{ nodeId: string; depth: number }> = startNodes.map(n => ({ nodeId: n.id, depth: 0 }));
    let maxDepth = 0;

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      const currentDepth = depths.get(nodeId) || 0;
      if (depth > currentDepth) {
        depths.set(nodeId, depth);
        maxDepth = Math.max(maxDepth, depth);
      }

      // Add children to queue
      const outgoing = graph.edges.filter(e => e.source === nodeId);
      outgoing.forEach(edge => {
        queue.push({ nodeId: edge.target, depth: depth + 1 });
      });
    }

    return maxDepth;
  }

  /**
   * Check if a specific connection is valid
   */
  isConnectionValid(
    sourceNodeId: string,
    targetNodeId: string,
    graph: RFGraph,
    sourceHandle?: string,
    targetHandle?: string
  ): { valid: boolean; reason?: string } {
    const sourceNode = graph.nodes.find(n => n.id === sourceNodeId);
    const targetNode = graph.nodes.find(n => n.id === targetNodeId);

    if (!sourceNode || !targetNode) {
      return { valid: false, reason: 'Node not found' };
    }

    const sourceKind = sourceNode.data?.kind as NodeKind;
    const targetKind = targetNode.data?.kind as NodeKind;

    if (!sourceKind || !targetKind) {
      return { valid: false, reason: 'Node type missing' };
    }

    return registryQuery.isConnectionValid(sourceKind, targetKind, sourceHandle, targetHandle);
  }
}

// Singleton instance
export const networkValidationService = new NetworkValidationService();
