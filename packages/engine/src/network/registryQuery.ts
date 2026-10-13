/**
 * Network Registry Query Engine
 * Provides intelligent querying and validation using the network type registry
 */

import type { 
  NetworkTypeRegistry, 
  NetworkNodeType, 
  NetworkPort,
  NetworkRegistryQuery,
  NetworkValidationRule,
  NetworkPattern,
  PortType
} from './types';
import type { NodeKind } from '@hbmp/shared-types';

export class NetworkRegistryQueryEngine implements NetworkRegistryQuery {
  private registry: NetworkTypeRegistry;

  constructor(registry: NetworkTypeRegistry) {
    this.registry = registry;
  }

  // ============================================================================
  // NODE QUERIES
  // ============================================================================

  getNodeType(nodeKind: NodeKind): NetworkNodeType | undefined {
    return this.registry.nodeTypes[nodeKind];
  }

  getNodesByCategory(category: string): NetworkNodeType[] {
    return Object.values(this.registry.nodeTypes).filter(
      nodeType => nodeType.category === category
    );
  }

  getCompatibleTargets(sourceNodeKind: NodeKind, sourcePort?: string): NodeKind[] {
    const sourceNode = this.getNodeType(sourceNodeKind);
    if (!sourceNode) return [];

    // If port is specified, find compatible targets based on port type
    if (sourcePort) {
      const port = sourceNode.ports.find(p => p.id === sourcePort);
      if (!port) return sourceNode.allowedTargets;

      // Find all nodes with compatible input ports
      return Object.values(this.registry.nodeTypes)
        .filter(targetNode => 
          targetNode.ports.some(p => 
            p.direction === 'in' && 
            this.arePortsCompatible(port, p)
          )
        )
        .map(n => n.id);
    }

    return sourceNode.allowedTargets;
  }

  getCompatibleSources(targetNodeKind: NodeKind, targetPort?: string): NodeKind[] {
    const targetNode = this.getNodeType(targetNodeKind);
    if (!targetNode) return [];

    // If port is specified, find compatible sources based on port type
    if (targetPort) {
      const port = targetNode.ports.find(p => p.id === targetPort);
      if (!port) return targetNode.allowedSources;

      // Find all nodes with compatible output ports
      return Object.values(this.registry.nodeTypes)
        .filter(sourceNode => 
          sourceNode.ports.some(p => 
            p.direction === 'out' && 
            this.arePortsCompatible(p, port)
          )
        )
        .map(n => n.id);
    }

    return targetNode.allowedSources;
  }

  // ============================================================================
  // CONNECTION VALIDATION
  // ============================================================================

  isConnectionValid(
    sourceNodeKind: NodeKind,
    targetNodeKind: NodeKind,
    sourcePort?: string,
    targetPort?: string
  ): { valid: boolean; reason?: string } {
    const sourceNode = this.getNodeType(sourceNodeKind);
    const targetNode = this.getNodeType(targetNodeKind);

    if (!sourceNode || !targetNode) {
      return { valid: false, reason: 'Invalid node types' };
    }

    // Check if target is in allowed targets
    if (!sourceNode.allowedTargets.includes(targetNodeKind)) {
      return { 
        valid: false, 
        reason: `${sourceNode.name} cannot connect to ${targetNode.name}` 
      };
    }

    // Check if source is in allowed sources for target
    if (!targetNode.allowedSources.includes(sourceNodeKind)) {
      return { 
        valid: false, 
        reason: `${targetNode.name} cannot receive connections from ${sourceNode.name}` 
      };
    }

    // If ports are specified, validate port compatibility
    if (sourcePort && targetPort) {
      const srcPort = sourceNode.ports.find(p => p.id === sourcePort);
      const tgtPort = targetNode.ports.find(p => p.id === targetPort);

      if (!srcPort || !tgtPort) {
        return { valid: false, reason: 'Invalid ports' };
      }

      if (srcPort.direction !== 'out' && srcPort.direction !== 'bidirectional') {
        return { valid: false, reason: 'Source port must be output or bidirectional' };
      }

      if (tgtPort.direction !== 'in' && tgtPort.direction !== 'bidirectional') {
        return { valid: false, reason: 'Target port must be input or bidirectional' };
      }

      if (!this.arePortsCompatible(srcPort, tgtPort)) {
        return { 
          valid: false, 
          reason: `Port types incompatible: ${srcPort.type} → ${tgtPort.type}` 
        };
      }
    }

    // Check connection rules in registry
    const ruleMatch = this.registry.globalRules.connectionRules.find(rule =>
      rule.sourceNodeType === sourceNodeKind &&
      rule.targetNodeType === targetNodeKind
    );

    if (ruleMatch && ruleMatch.condition) {
      // Custom condition validation would go here
      // For now, we just check if a rule exists
    }

    return { valid: true };
  }

  // ============================================================================
  // PORT QUERIES
  // ============================================================================

  getNodePorts(nodeKind: NodeKind): NetworkPort[] {
    const node = this.getNodeType(nodeKind);
    return node ? node.ports : [];
  }

  getPortsByType(nodeKind: NodeKind, portType: PortType): NetworkPort[] {
    const ports = this.getNodePorts(nodeKind);
    return ports.filter(port => port.type === portType);
  }

  getInputPorts(nodeKind: NodeKind): NetworkPort[] {
    const ports = this.getNodePorts(nodeKind);
    return ports.filter(port => 
      port.direction === 'in' || port.direction === 'bidirectional'
    );
  }

  getOutputPorts(nodeKind: NodeKind): NetworkPort[] {
    const ports = this.getNodePorts(nodeKind);
    return ports.filter(port => 
      port.direction === 'out' || port.direction === 'bidirectional'
    );
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  validateNode(
    nodeKind: NodeKind,
    metadata: any,
    context: any
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const node = this.getNodeType(nodeKind);
    if (!node) {
      return { 
        valid: false, 
        errors: ['Unknown node type'], 
        warnings: [] 
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata schema
    Object.entries(node.metadataSchema).forEach(([key, schema]) => {
      const value = metadata?.[key];

      if (schema.required && (value === undefined || value === null)) {
        errors.push(`Required field '${key}' is missing`);
      }

      if (value !== undefined && schema.validation) {
        const validation = schema.validation;

        // Type validation
        if (schema.type === 'number') {
          if (typeof value !== 'number') {
            errors.push(`Field '${key}' must be a number`);
          } else {
            if (validation.min !== undefined && value < validation.min) {
              errors.push(`Field '${key}' must be >= ${validation.min}`);
            }
            if (validation.max !== undefined && value > validation.max) {
              errors.push(`Field '${key}' must be <= ${validation.max}`);
            }
          }
        }

        if (schema.type === 'string' && validation.pattern) {
          if (!new RegExp(validation.pattern).test(value)) {
            errors.push(`Field '${key}' does not match required pattern`);
          }
        }

        if (schema.type === 'enum' && validation.enum) {
          if (!validation.enum.includes(value)) {
            errors.push(`Field '${key}' must be one of: ${validation.enum.join(', ')}`);
          }
        }

        // Custom validation
        if (validation.custom) {
          const result = validation.custom(value);
          if (!result.valid) {
            errors.push(result.message || `Field '${key}' validation failed`);
          }
        }
      }
    });

    // Run custom validation rules
    if (node.validation.customRules) {
      node.validation.customRules.forEach(rule => {
        const result = rule.validator({ id: 'temp', type: nodeKind, data: metadata }, context, this.registry);
        if (!result.valid) {
          if (rule.level === 'error') {
            errors.push(result.message || rule.description);
          } else {
            warnings.push(result.message || rule.description);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // PATTERN MATCHING
  // ============================================================================

  findPatterns(subgraph: any): NetworkPattern[] {
    // Implementation for pattern matching
    // This would analyze the subgraph structure and find matching patterns
    const patterns: NetworkPattern[] = [];
    
    if (this.registry.patterns) {
      Object.values(this.registry.patterns).forEach(pattern => {
        if (this.matchesPattern(subgraph, pattern)) {
          patterns.push(pattern);
        }
      });
    }

    return patterns;
  }

  suggestCompletions(partialGraph: any): NetworkPattern[] {
    // Implementation for suggesting patterns to complete partial graphs
    const suggestions: NetworkPattern[] = [];
    
    // Analyze partial graph and suggest relevant patterns
    // This is a placeholder for more sophisticated logic

    return suggestions;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private arePortsCompatible(sourcePort: NetworkPort, targetPort: NetworkPort): boolean {
    // Data type compatibility
    if (sourcePort.dataType && targetPort.dataType) {
      // Exact match
      if (sourcePort.dataType === targetPort.dataType) return true;
      
      // Check if 'any' type
      if (sourcePort.dataType === 'any' || targetPort.dataType === 'any') return true;
      
      // Could add more sophisticated type compatibility logic here
      return false;
    }

    // Port type compatibility
    const compatibleTypes: Record<PortType, PortType[]> = {
      'data': ['data'],
      'control': ['control'],
      'event': ['event'],
      'api': ['api', 'data'],
      'input': ['input', 'data'],
      'output': ['output', 'data']
    };

    const compatibles = compatibleTypes[sourcePort.type] || [sourcePort.type];
    return compatibles.includes(targetPort.type);
  }

  private matchesPattern(subgraph: any, pattern: NetworkPattern): boolean {
    // Simplified pattern matching
    // Real implementation would do graph isomorphism checking
    
    if (!subgraph.nodes || !pattern.nodes) return false;
    if (subgraph.nodes.length < pattern.nodes.length) return false;

    // Basic structural matching
    // This is a placeholder for more sophisticated graph matching
    return false;
  }

  // ============================================================================
  // LANE VALIDATION
  // ============================================================================

  canNodeExistInLane(nodeKind: NodeKind, laneType: string): boolean {
    const node = this.getNodeType(nodeKind);
    if (!node) return false;

    const lane = this.registry.laneTypes[laneType];
    if (!lane) return true; // If lane type not defined, allow it

    // Check if node type is explicitly allowed
    if (lane.allowedNodeTypes && !lane.allowedNodeTypes.includes(nodeKind)) {
      return false;
    }

    // Check if node type is explicitly forbidden
    if (lane.forbiddenNodeTypes && lane.forbiddenNodeTypes.includes(nodeKind)) {
      return false;
    }

    // Check node's lane rules
    if (!node.laneRules.canExistInLane) {
      return false;
    }

    if (node.laneRules.mustBeInLane && !node.laneRules.mustBeInLane.includes(laneType)) {
      return false;
    }

    if (node.laneRules.cannotBeInLane && node.laneRules.cannotBeInLane.includes(laneType)) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // CONNECTION COUNTING
  // ============================================================================

  validateConnectionCount(
    nodeKind: NodeKind,
    currentInputs: number,
    currentOutputs: number
  ): { valid: boolean; errors: string[] } {
    const node = this.getNodeType(nodeKind);
    if (!node) return { valid: false, errors: ['Unknown node type'] };

    const errors: string[] = [];
    const validation = node.validation;

    if (validation.minInputs !== undefined && currentInputs < validation.minInputs) {
      errors.push(`Node requires at least ${validation.minInputs} input(s)`);
    }

    if (validation.maxInputs !== undefined && currentInputs > validation.maxInputs) {
      errors.push(`Node accepts at most ${validation.maxInputs} input(s)`);
    }

    if (validation.minOutputs !== undefined && currentOutputs < validation.minOutputs) {
      errors.push(`Node requires at least ${validation.minOutputs} output(s)`);
    }

    if (validation.maxOutputs !== undefined && currentOutputs > validation.maxOutputs) {
      errors.push(`Node accepts at most ${validation.maxOutputs} output(s)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============================================================================
  // EXPORT REGISTRY INFO
  // ============================================================================

  getRegistry(): NetworkTypeRegistry {
    return this.registry;
  }

  getRegistryVersion(): string {
    return this.registry.version;
  }

  getAllNodeTypes(): NetworkNodeType[] {
    return Object.values(this.registry.nodeTypes);
  }

  getAllLaneTypes(): string[] {
    return Object.keys(this.registry.laneTypes);
  }

  getAllEdgeTypes(): string[] {
    return Object.keys(this.registry.edgeTypes);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createRegistryQuery(registry: NetworkTypeRegistry): NetworkRegistryQuery {
  return new NetworkRegistryQueryEngine(registry);
}
