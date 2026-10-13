/**
 * Network Type Registry - Core Types and Interfaces
 * Defines the semantic foundation for network modeling
 */

import type { NodeKind } from '@hbmp/shared-types';

// ============================================================================
// PORT SYSTEM
// ============================================================================

export type PortType = 'input' | 'output' | 'event' | 'api' | 'control' | 'data';
export type PortDirection = 'in' | 'out' | 'bidirectional';

export interface NetworkPort {
  id: string;
  label: string;
  type: PortType;
  direction: PortDirection;
  required: boolean;
  multiple: boolean; // Can accept multiple connections
  dataType?: string; // e.g., 'dataset', 'number', 'string', 'event'
  constraints?: string[]; // Additional validation rules
}

// ============================================================================
// CONNECTION RULES
// ============================================================================

export interface ConnectionRule {
  sourceNodeType: NodeKind;
  sourcePortType: PortType;
  targetNodeType: NodeKind;
  targetPortType: PortType;
  condition?: (sourceData: any, targetData: any) => boolean;
  metadata?: Record<string, any>;
}

export interface ConnectionConstraint {
  rule: 'required' | 'forbidden' | 'conditional' | 'exclusive';
  description: string;
  validator?: (graph: any, sourceNode: any, targetNode: any) => {
    valid: boolean;
    message?: string;
  };
}

// ============================================================================
// NODE TYPE DEFINITION
// ============================================================================

export interface NetworkNodeType {
  // Basic identification
  id: NodeKind;
  name: string;
  description: string;
  category: 'data' | 'process' | 'control' | 'output' | 'composite' | 'infrastructure';
  
  // Port configuration
  ports: NetworkPort[];
  
  // Connection rules
  allowedTargets: NodeKind[];
  allowedSources: NodeKind[];
  
  // Validation rules
  validation: {
    minInputs?: number;
    maxInputs?: number;
    minOutputs?: number;
    maxOutputs?: number;
    requiredPorts?: string[]; // Port IDs that must be connected
    forbiddenPorts?: string[]; // Port IDs that cannot be connected
    customRules?: NetworkValidationRule[];
  };
  
  // Lane and hierarchy rules
  laneRules: {
    canExistInLane: boolean;
    canCrossLanes: boolean;
    mustBeInLane?: string[]; // Specific lane types required
    cannotBeInLane?: string[]; // Specific lane types forbidden
  };
  
  // Composite behavior (for containers)
  composite?: {
    isComposite: boolean;
    allowsChildren: boolean;
    childTypes?: NodeKind[]; // What types can be children
    autoWiring?: CompositeAutoWiringRule[];
    internalLayout?: 'hierarchical' | 'free' | 'grid';
    portMapping?: CompositePortMapping[];
  };
  
  // Node-specific metadata schema
  metadataSchema: Record<string, NetworkPropertySchema>;
  
  // Behavioral properties
  behavior: {
    executable: boolean; // Can be "run" during simulation
    async: boolean; // Supports parallel execution
    stateful: boolean; // Maintains state between runs
    cacheable: boolean; // Results can be cached
    sideEffects: boolean; // Has external effects
    duration?: number; // Estimated execution time (ms)
  };
  
  // Visual properties (for React Flow)
  visual: {
    defaultSize: { width: number; height: number };
    minSize: { width: number; height: number };
    maxSize: { width: number; height: number };
    resizable: boolean;
    shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'cylinder';
    defaultStyle: Record<string, any>;
  };
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface NetworkValidationRule {
  id: string;
  name: string;
  description: string;
  level: 'error' | 'warning' | 'info';
  validator: (node: any, graph: any, registry: NetworkTypeRegistry) => {
    valid: boolean;
    message?: string;
    suggestions?: string[];
  };
}

// ============================================================================
// COMPOSITE RULES
// ============================================================================

export interface CompositeAutoWiringRule {
  condition: string; // Human-readable condition
  sourcePattern: string; // Pattern to match source nodes
  targetPattern: string; // Pattern to match target nodes
  edgeType?: string;
  metadata?: Record<string, any>;
}

export interface CompositePortMapping {
  compositePort: string; // Port on the composite node
  internalNodeId: string; // Internal node identifier pattern
  internalPort: string; // Port on internal node
  direction: 'input' | 'output';
}

// ============================================================================
// METADATA SCHEMAS
// ============================================================================

export interface NetworkPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    custom?: (value: any) => { valid: boolean; message?: string };
  };
  description: string;
  category?: string;
}

// ============================================================================
// LANE TYPES
// ============================================================================

export interface NetworkLaneType {
  id: string;
  name: string;
  description: string;
  allowedNodeTypes: NodeKind[];
  forbiddenNodeTypes?: NodeKind[];
  constraints: {
    maxNodes?: number;
    minNodes?: number;
    requiresInput?: boolean;
    requiresOutput?: boolean;
  };
  style: Record<string, any>;
}

// ============================================================================
// EDGE TYPES
// ============================================================================

export interface NetworkEdgeType {
  id: string;
  name: string;
  description: string;
  sourcePortTypes: PortType[];
  targetPortTypes: PortType[];
  metadataSchema: Record<string, NetworkPropertySchema>;
  style: Record<string, any>;
  routing: 'straight' | 'orthogonal' | 'bezier' | 'step';
}

// ============================================================================
// MAIN REGISTRY INTERFACE
// ============================================================================

export interface NetworkTypeRegistry {
  // Version and metadata
  version: string;
  name: string;
  description: string;
  
  // Core type definitions
  nodeTypes: Record<NodeKind, NetworkNodeType>;
  laneTypes: Record<string, NetworkLaneType>;
  edgeTypes: Record<string, NetworkEdgeType>;
  
  // Global rules
  globalRules: {
    allowCycles: boolean;
    requireStartNodes: boolean;
    requireEndNodes: boolean;
    maxDepth?: number;
    connectionRules: ConnectionRule[];
    validationRules: NetworkValidationRule[];
  };
  
  // Simulation settings
  simulation: {
    tokenTypes: string[];
    defaultTokenBehavior: 'sequential' | 'parallel' | 'broadcast';
    supportsConcurrency: boolean;
    supportsConditionalFlow: boolean;
  };
  
  // Network patterns (common subgraphs)
  patterns?: Record<string, NetworkPattern>;
}

// ============================================================================
// NETWORK PATTERNS
// ============================================================================

export interface NetworkPattern {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: NodeKind;
    metadata?: Record<string, any>;
    position?: { x: number; y: number };
  }>;
  edges: Array<{
    source: string;
    target: string;
    sourcePort?: string;
    targetPort?: string;
    metadata?: Record<string, any>;
  }>;
  constraints?: NetworkValidationRule[];
}

// ============================================================================
// REGISTRY QUERY INTERFACE
// ============================================================================

export interface NetworkRegistryQuery {
  // Node queries
  getNodeType(nodeKind: NodeKind): NetworkNodeType | undefined;
  getNodesByCategory(category: string): NetworkNodeType[];
  getCompatibleTargets(sourceNodeKind: NodeKind, sourcePort?: string): NodeKind[];
  getCompatibleSources(targetNodeKind: NodeKind, targetPort?: string): NodeKind[];
  
  // Connection validation
  isConnectionValid(
    sourceNodeKind: NodeKind, 
    targetNodeKind: NodeKind, 
    sourcePort?: string, 
    targetPort?: string
  ): { valid: boolean; reason?: string };
  
  // Port queries
  getNodePorts(nodeKind: NodeKind): NetworkPort[];
  getPortsByType(nodeKind: NodeKind, portType: PortType): NetworkPort[];
  
  // Validation
  validateNode(nodeKind: NodeKind, metadata: any, context: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Pattern matching
  findPatterns(subgraph: any): NetworkPattern[];
  suggestCompletions(partialGraph: any): NetworkPattern[];
}

// ============================================================================
// NETWORK CONTEXT
// ============================================================================

export interface NetworkContext {
  // Current graph state
  nodes: any[];
  edges: any[];
  
  // Registry being used
  registry: NetworkTypeRegistry;
  
  // Execution context
  executionMode: 'design' | 'validation' | 'simulation' | 'execution';
  
  // User context
  userRole?: string;
  permissions?: string[];
  
  // Environment context
  environment: 'development' | 'staging' | 'production';
  
  // Feature flags
  features: Record<string, boolean>;
}