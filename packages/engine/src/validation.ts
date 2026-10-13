import type { RFGraph, ValidationIssue, NodeKind } from '@hbmp/shared-types';
import { NodeRegistry, ConnectionRules } from './registry';

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Check connection rules */
  checkConnections?: boolean;
  /** Check required properties */
  checkProperties?: boolean;
  /** Check multiplicity constraints */
  checkMultiplicity?: boolean;
}

/**
 * Validate a React Flow graph against registry rules
 * 
 * @param graph React Flow graph to validate
 * @param options Validation options
 * @returns Array of validation issues
 */
export function validateGraph(graph: RFGraph, options: ValidationOptions = {}): ValidationIssue[] {
  const {
    checkConnections = true,
    checkProperties = true,
    checkMultiplicity = true
  } = options;
  
  const issues: ValidationIssue[] = [];
  
  // Validate nodes
  for (const node of graph.nodes) {
    issues.push(...validateNode(node, checkProperties));
  }
  
  // Validate edges and connections
  if (checkConnections || checkMultiplicity) {
    for (const edge of graph.edges) {
      issues.push(...validateEdge(edge, graph, checkConnections, checkMultiplicity));
    }
  }
  
  // Check for orphaned nodes (no connections)
  if (checkConnections) {
    issues.push(...findOrphanedNodes(graph));
  }
  
  return issues;
}

/**
 * Validate a single node
 */
function validateNode(node: any, checkProperties: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check if node type is registered
  const registry = NodeRegistry[node.type as NodeKind];
  if (!registry) {
    issues.push({
      id: node.id,
      level: 'error',
      code: 'UNKNOWN_NODE_TYPE',
      message: `Unknown node type: ${node.type}`
    });
    return issues;
  }
  
  // Check required properties
  if (checkProperties) {
    if (!node.data?.label || node.data.label.trim() === '') {
      issues.push({
        id: node.id,
        level: 'error',
        code: 'MISSING_LABEL',
        message: 'Node must have a label'
      });
    }
    
    if (!node.position) {
      issues.push({
        id: node.id,
        level: 'error',
        code: 'MISSING_POSITION',
        message: 'Node must have a position'
      });
    }
  }
  
  return issues;
}

/**
 * Validate a single edge
 */
function validateEdge(
  edge: any, 
  graph: RFGraph, 
  checkConnections: boolean, 
  checkMultiplicity: boolean
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check that source and target nodes exist
  const sourceNode = graph.nodes.find(n => n.id === edge.source);
  const targetNode = graph.nodes.find(n => n.id === edge.target);
  
  if (!sourceNode) {
    issues.push({
      id: edge.id,
      level: 'error',
      code: 'MISSING_SOURCE',
      message: `Edge source node '${edge.source}' not found`
    });
    return issues;
  }
  
  if (!targetNode) {
    issues.push({
      id: edge.id,
      level: 'error',
      code: 'MISSING_TARGET',
      message: `Edge target node '${edge.target}' not found`
    });
    return issues;
  }
  
  // Check connection rules
  if (checkConnections) {
    const isAllowed = ConnectionRules.isAllowed(sourceNode.type, targetNode.type);
    if (!isAllowed) {
      issues.push({
        id: edge.id,
        level: 'error',
        code: 'INVALID_CONNECTION',
        message: `Connection from ${sourceNode.type} to ${targetNode.type} is not allowed`
      });
    }
  }
  
  // Check multiplicity constraints
  if (checkMultiplicity) {
    issues.push(...checkMultiplicityConstraints(edge, graph, sourceNode, targetNode));
  }
  
  return issues;
}

/**
 * Check multiplicity constraints for connections
 */
function checkMultiplicityConstraints(edge: any, graph: RFGraph, sourceNode: any, targetNode: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Count outgoing connections from source
  const outgoingCount = graph.edges.filter(e => e.source === sourceNode.id).length;
  const maxOutgoing = ConnectionRules.maxConnections(sourceNode.type, 'out');
  
  if (maxOutgoing > 0 && outgoingCount > maxOutgoing) {
    issues.push({
      id: edge.id,
      level: 'error',
      code: 'TOO_MANY_OUTGOING',
      message: `Node ${sourceNode.type} can have at most ${maxOutgoing} outgoing connections`
    });
  }
  
  // Count incoming connections to target
  const incomingCount = graph.edges.filter(e => e.target === targetNode.id).length;
  const maxIncoming = ConnectionRules.maxConnections(targetNode.type, 'in');
  
  if (maxIncoming > 0 && incomingCount > maxIncoming) {
    issues.push({
      id: edge.id,
      level: 'error',
      code: 'TOO_MANY_INCOMING',
      message: `Node ${targetNode.type} can have at most ${maxIncoming} incoming connections`
    });
  }
  
  return issues;
}

/**
 * Find nodes with no connections (might be intentional, so warning level)
 */
function findOrphanedNodes(graph: RFGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const connectedNodeIds = new Set<string>();
  
  // Collect all connected node IDs
  for (const edge of graph.edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }
  
  // Find nodes without connections (excluding lanes)
  for (const node of graph.nodes) {
    if (node.type !== 'lane' && !connectedNodeIds.has(node.id)) {
      issues.push({
        id: node.id,
        level: 'warn',
        code: 'ORPHANED_NODE',
        message: `Node '${node.data.label}' has no connections`
      });
    }
  }
  
  return issues;
}

/**
 * Check if a graph is valid (no errors, warnings are OK)
 */
export function isGraphValid(graph: RFGraph, options?: ValidationOptions): boolean {
  const issues = validateGraph(graph, options);
  return !issues.some(issue => issue.level === 'error');
}

/**
 * Get validation summary
 */
export function getValidationSummary(issues: ValidationIssue[]): { errors: number; warnings: number; total: number } {
  const errors = issues.filter(i => i.level === 'error').length;
  const warnings = issues.filter(i => i.level === 'warn').length;
  
  return {
    errors,
    warnings,
    total: issues.length
  };
}