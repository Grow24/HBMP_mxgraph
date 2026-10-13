/**
 * Network Type Registry Implementation
 * Concrete registry with all HBMP node types defined
 */

import type { 
  NetworkTypeRegistry, 
  NetworkNodeType, 
  NetworkLaneType,
  NetworkEdgeType,
  NetworkValidationRule,
  ConnectionRule 
} from './types';
import type { NodeKind } from '@hbmp/shared-types';

// ============================================================================
// HBMP NODE TYPE DEFINITIONS
// ============================================================================

const DATASET_NODE: NetworkNodeType = {
  id: 'dataset',
  name: 'Dataset',
  description: 'Data source containing structured information',
  category: 'data',
  
  ports: [
    {
      id: 'output',
      label: 'Data Output',
      type: 'data',
      direction: 'out',
      required: false,
      multiple: true,
      dataType: 'dataset'
    }
  ],
  
  allowedTargets: ['model', 'processTask', 'report', 'api', 'filter'],
  allowedSources: [],
  
  validation: {
    minOutputs: 1,
    maxInputs: 0,
    customRules: [
      {
        id: 'dataset-must-have-schema',
        name: 'Dataset Must Have Schema',
        description: 'Dataset must define at least one column',
        level: 'error',
        validator: (node) => ({
          valid: node.data?.schema && node.data.schema.length > 0,
          message: 'Dataset must define at least one column in schema'
        })
      }
    ]
  },
  
  laneRules: {
    canExistInLane: true,
    canCrossLanes: true,
    mustBeInLane: ['data', 'source']
  },
  
  metadataSchema: {
    schema: {
      type: 'array',
      required: true,
      description: 'Column definitions for the dataset',
      category: 'structure'
    },
    source: {
      type: 'string',
      required: true,
      description: 'Data source identifier or path',
      category: 'connection'
    },
    refreshRate: {
      type: 'number',
      required: false,
      default: 3600,
      description: 'Data refresh interval in seconds',
      category: 'behavior'
    },
    rowCount: {
      type: 'number',
      required: false,
      description: 'Estimated number of rows',
      category: 'metadata'
    }
  },
  
  behavior: {
    executable: false,
    async: false,
    stateful: true,
    cacheable: true,
    sideEffects: false
  },
  
  visual: {
    defaultSize: { width: 120, height: 60 },
    minSize: { width: 80, height: 40 },
    maxSize: { width: 300, height: 200 },
    resizable: true,
    shape: 'rectangle',
    defaultStyle: {
      backgroundColor: '#8b5cf6',
      borderColor: '#7c3aed',
      color: '#ffffff'
    }
  }
};

const MODEL_NODE: NetworkNodeType = {
  id: 'processTask',
  name: 'Data Model/Transform',
  description: 'Transforms or processes input data',
  category: 'process',
  
  ports: [
    {
      id: 'input',
      label: 'Data Input',
      type: 'data',
      direction: 'in',
      required: true,
      multiple: true,
      dataType: 'dataset'
    },
    {
      id: 'output',
      label: 'Processed Output',
      type: 'data',
      direction: 'out',
      required: false,
      multiple: true,
      dataType: 'dataset'
    }
  ],
  
  allowedTargets: ['report', 'processTask', 'api', 'gateway', 'event'],
  allowedSources: ['dataset', 'processTask', 'api', 'event', 'gateway'],
  
  validation: {
    minInputs: 1,
    maxOutputs: 5,
    requiredPorts: ['input']
  },
  
  laneRules: {
    canExistInLane: true,
    canCrossLanes: true,
    cannotBeInLane: ['output']
  },
  
  metadataSchema: {
    transforms: {
      type: 'array',
      required: true,
      description: 'List of data transformations to apply',
      category: 'logic'
    },
    filters: {
      type: 'array',
      required: false,
      description: 'Data filtering conditions',
      category: 'logic'
    },
    aggregations: {
      type: 'object',
      required: false,
      description: 'Aggregation operations (sum, count, avg, etc.)',
      category: 'logic'
    }
  },
  
  behavior: {
    executable: true,
    async: true,
    stateful: false,
    cacheable: true,
    sideEffects: false,
    duration: 2000
  },
  
  visual: {
    defaultSize: { width: 120, height: 60 },
    minSize: { width: 100, height: 50 },
    maxSize: { width: 250, height: 150 },
    resizable: true,
    shape: 'rectangle',
    defaultStyle: {
      backgroundColor: '#3b82f6',
      borderColor: '#1e40af',
      color: '#ffffff'
    }
  }
};

const REPORT_NODE: NetworkNodeType = {
  id: 'report',
  name: 'Report',
  description: 'Generates formatted output from processed data',
  category: 'output',
  
  ports: [
    {
      id: 'input',
      label: 'Data Input',
      type: 'data',
      direction: 'in',
      required: true,
      multiple: true,
      dataType: 'dataset'
    }
  ],
  
  allowedTargets: ['widget'],
  allowedSources: ['processTask', 'dataset'],
  
  validation: {
    minInputs: 1,
    maxOutputs: 1,
    requiredPorts: ['input']
  },
  
  laneRules: {
    canExistInLane: true,
    canCrossLanes: false,
    mustBeInLane: ['output', 'reporting']
  },
  
  metadataSchema: {
    reportType: {
      type: 'enum',
      required: true,
      validation: { enum: ['table', 'chart', 'dashboard', 'export'] },
      description: 'Type of report to generate',
      category: 'format'
    },
    measures: {
      type: 'array',
      required: true,
      description: 'Metrics to include in the report',
      category: 'content'
    },
    dimensions: {
      type: 'array',
      required: false,
      description: 'Grouping dimensions for the report',
      category: 'content'
    },
    formatOptions: {
      type: 'object',
      required: false,
      description: 'Report formatting configuration',
      category: 'format'
    }
  },
  
  behavior: {
    executable: true,
    async: false,
    stateful: false,
    cacheable: true,
    sideEffects: false,
    duration: 1000
  },
  
  visual: {
    defaultSize: { width: 100, height: 60 },
    minSize: { width: 80, height: 50 },
    maxSize: { width: 200, height: 120 },
    resizable: true,
    shape: 'rectangle',
    defaultStyle: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      color: '#ffffff'
    }
  }
};

const GATEWAY_NODE: NetworkNodeType = {
  id: 'gateway',
  name: 'Gateway/Decision',
  description: 'Routes flow based on conditions',
  category: 'control',
  
  ports: [
    {
      id: 'input',
      label: 'Input',
      type: 'control',
      direction: 'in',
      required: true,
      multiple: false,
      dataType: 'any'
    },
    {
      id: 'true-output',
      label: 'True Path',
      type: 'control',
      direction: 'out',
      required: false,
      multiple: false,
      dataType: 'any'
    },
    {
      id: 'false-output',
      label: 'False Path',
      type: 'control',
      direction: 'out',
      required: false,
      multiple: false,
      dataType: 'any'
    }
  ],
  
  allowedTargets: ['processTask', 'report', 'gateway', 'event'],
  allowedSources: ['processTask', 'event', 'gateway'],
  
  validation: {
    minInputs: 1,
    maxInputs: 1,
    minOutputs: 2,
    maxOutputs: 5
  },
  
  laneRules: {
    canExistInLane: true,
    canCrossLanes: true
  },
  
  metadataSchema: {
    condition: {
      type: 'string',
      required: true,
      description: 'Boolean condition for routing decision',
      category: 'logic'
    },
    conditionType: {
      type: 'enum',
      required: true,
      validation: { enum: ['expression', 'rule', 'manual'] },
      description: 'Type of condition evaluation',
      category: 'logic'
    }
  },
  
  behavior: {
    executable: true,
    async: false,
    stateful: false,
    cacheable: false,
    sideEffects: false,
    duration: 100
  },
  
  visual: {
    defaultSize: { width: 80, height: 80 },
    minSize: { width: 60, height: 60 },
    maxSize: { width: 120, height: 120 },
    resizable: true,
    shape: 'diamond',
    defaultStyle: {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      color: '#ffffff'
    }
  }
};

const API_NODE: NetworkNodeType = {
  id: 'api',
  name: 'API Service',
  description: 'External API integration point',
  category: 'infrastructure',
  
  ports: [
    {
      id: 'request-input',
      label: 'Request',
      type: 'api',
      direction: 'in',
      required: true,
      multiple: false,
      dataType: 'object'
    },
    {
      id: 'response-output',
      label: 'Response',
      type: 'api',
      direction: 'out',
      required: false,
      multiple: false,
      dataType: 'object'
    },
    {
      id: 'error-output',
      label: 'Error',
      type: 'event',
      direction: 'out',
      required: false,
      multiple: false,
      dataType: 'error'
    }
  ],
  
  allowedTargets: ['processTask', 'report', 'api'],
  allowedSources: ['processTask', 'dataset'],
  
  validation: {
    minInputs: 1,
    maxInputs: 1,
    minOutputs: 1,
    maxOutputs: 2
  },
  
  laneRules: {
    canExistInLane: true,
    canCrossLanes: true,
    mustBeInLane: ['integration', 'api']
  },
  
  metadataSchema: {
    endpoint: {
      type: 'string',
      required: true,
      description: 'API endpoint URL',
      category: 'connection'
    },
    method: {
      type: 'enum',
      required: true,
      validation: { enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      description: 'HTTP method',
      category: 'connection'
    },
    headers: {
      type: 'object',
      required: false,
      description: 'HTTP headers to include',
      category: 'connection'
    },
    timeout: {
      type: 'number',
      required: false,
      default: 30000,
      description: 'Request timeout in milliseconds',
      category: 'behavior'
    }
  },
  
  behavior: {
    executable: true,
    async: true,
    stateful: false,
    cacheable: true,
    sideEffects: true,
    duration: 5000
  },
  
  visual: {
    defaultSize: { width: 100, height: 80 },
    minSize: { width: 80, height: 60 },
    maxSize: { width: 200, height: 120 },
    resizable: true,
    shape: 'cylinder',
    defaultStyle: {
      backgroundColor: '#84cc16',
      borderColor: '#65a30d',
      color: '#ffffff'
    }
  }
};

const LANE_NODE: NetworkNodeType = {
  id: 'lane',
  name: 'Swimlane',
  description: 'Container for organizing related nodes',
  category: 'composite',
  
  ports: [],
  
  allowedTargets: [],
  allowedSources: [],
  
  validation: {
    minInputs: 0,
    maxInputs: 0,
    minOutputs: 0,
    maxOutputs: 0
  },
  
  laneRules: {
    canExistInLane: false,
    canCrossLanes: false
  },
  
  composite: {
    isComposite: true,
    allowsChildren: true,
    childTypes: ['dataset', 'processTask', 'report', 'api', 'gateway', 'event'],
    internalLayout: 'hierarchical'
  },
  
  metadataSchema: {
    department: {
      type: 'string',
      required: false,
      description: 'Department or team owning this lane',
      category: 'organization'
    },
    permissions: {
      type: 'array',
      required: false,
      description: 'Access permissions for this lane',
      category: 'security'
    }
  },
  
  behavior: {
    executable: false,
    async: false,
    stateful: false,
    cacheable: false,
    sideEffects: false
  },
  
  visual: {
    defaultSize: { width: 800, height: 200 },
    minSize: { width: 300, height: 100 },
    maxSize: { width: 2000, height: 800 },
    resizable: true,
    shape: 'rectangle',
    defaultStyle: {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
      color: '#374151'
    }
  }
};

// ============================================================================
// LANE TYPE DEFINITIONS
// ============================================================================

const DATA_LANE: NetworkLaneType = {
  id: 'data',
  name: 'Data Sources',
  description: 'Lane for data inputs and sources',
  allowedNodeTypes: ['dataset', 'api'],
  constraints: {
    minNodes: 1,
    requiresOutput: true
  },
  style: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6'
  }
};

const PROCESS_LANE: NetworkLaneType = {
  id: 'process',
  name: 'Processing',
  description: 'Lane for data transformation and business logic',
  allowedNodeTypes: ['processTask', 'gateway'],
  constraints: {
    requiresInput: true,
    requiresOutput: true
  },
  style: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6'
  }
};

const OUTPUT_LANE: NetworkLaneType = {
  id: 'output',
  name: 'Output & Reports',
  description: 'Lane for reports and final outputs',
  allowedNodeTypes: ['report', 'widget'],
  constraints: {
    requiresInput: true
  },
  style: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444'
  }
};

// ============================================================================
// EDGE TYPE DEFINITIONS
// ============================================================================

const DATA_EDGE: NetworkEdgeType = {
  id: 'data-flow',
  name: 'Data Flow',
  description: 'Transfers data between nodes',
  sourcePortTypes: ['data'],
  targetPortTypes: ['data'],
  metadataSchema: {
    mapping: {
      type: 'object',
      required: false,
      description: 'Field mapping configuration',
      category: 'transformation'
    },
    filter: {
      type: 'string',
      required: false,
      description: 'Filter condition for data flow',
      category: 'logic'
    }
  },
  style: {
    strokeColor: '#3b82f6',
    strokeWidth: 2,
    animated: true
  },
  routing: 'orthogonal'
};

const CONTROL_EDGE: NetworkEdgeType = {
  id: 'control-flow',
  name: 'Control Flow',
  description: 'Controls execution order and conditions',
  sourcePortTypes: ['control'],
  targetPortTypes: ['control'],
  metadataSchema: {
    condition: {
      type: 'string',
      required: false,
      description: 'Condition for this flow path',
      category: 'logic'
    }
  },
  style: {
    strokeColor: '#6b7280',
    strokeWidth: 1,
    strokeDasharray: '5,5'
  },
  routing: 'straight'
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

const GLOBAL_VALIDATION_RULES: NetworkValidationRule[] = [
  {
    id: 'no-orphaned-nodes',
    name: 'No Orphaned Nodes',
    description: 'All nodes must be connected to the main flow',
    level: 'warning',
    validator: (node, graph) => {
      const hasConnections = graph.edges.some((edge: any) => 
        edge.source === node.id || edge.target === node.id
      );
      return {
        valid: hasConnections || node.type === 'event',
        message: 'Node is not connected to any other nodes'
      };
    }
  },
  {
    id: 'data-flow-direction',
    name: 'Data Flow Direction',
    description: 'Data must flow from sources to outputs',
    level: 'error',
    validator: (node, graph, registry) => {
      // Implementation would check for proper data flow direction
      return { valid: true };
    }
  }
];

// ============================================================================
// CONNECTION RULES
// ============================================================================

const EVENT_NODE: NetworkNodeType = {
  id: 'event',
  name: 'Event',
  description: 'Start or end of a process',
  category: 'control',
  ports: [
    {
      id: 'input',
      label: 'Input',
      type: 'control',
      direction: 'in',
      required: false,
      multiple: true,
      dataType: 'any'
    },
    {
      id: 'output',
      label: 'Output',
      type: 'control',
      direction: 'out',
      required: false,
      multiple: false,
      dataType: 'any'
    }
  ],
  allowedTargets: ['processTask', 'gateway', 'event'],
  allowedSources: ['processTask', 'gateway', 'event'],
  validation: {
    minInputs: 0,
    minOutputs: 0,
    maxOutputs: 1
  },
  laneRules: {
    canExistInLane: true,
    canCrossLanes: true
  },
  metadataSchema: {},
  behavior: {
    executable: false,
    async: false,
    stateful: false,
    cacheable: false,
    sideEffects: false
  },
  visual: {
    defaultSize: { width: 140, height: 90 },
    minSize: { width: 110, height: 72 },
    maxSize: { width: 220, height: 140 },
    resizable: true,
    shape: 'ellipse',
    defaultStyle: {
      backgroundColor: '#ffedd5',
      borderColor: '#fb923c',
      color: '#9a3412'
    }
  }
};

const CONNECTION_RULES: ConnectionRule[] = [
  {
    sourceNodeType: 'dataset',
    sourcePortType: 'data',
    targetNodeType: 'processTask',
    targetPortType: 'data'
  },
  {
    sourceNodeType: 'processTask',
    sourcePortType: 'data',
    targetNodeType: 'report',
    targetPortType: 'data'
  }
  // Add more connection rules as needed
];

// ============================================================================
// MAIN REGISTRY EXPORT
// ============================================================================

export const HBMP_NETWORK_REGISTRY: NetworkTypeRegistry = {
  version: '1.0.0',
  name: 'HBMP Network Registry',
  description: 'Complete network modeling registry for HBMP platform',
  
  nodeTypes: {
    dataset: DATASET_NODE,
    processTask: MODEL_NODE,
    report: REPORT_NODE,
    gateway: GATEWAY_NODE,
    api: API_NODE,
    lane: LANE_NODE,
    // Add other types as needed
    event: EVENT_NODE,
    service: {
      ...API_NODE,
      id: 'service',
      name: 'Service'
    } as NetworkNodeType,
    db: {
      ...API_NODE,
      id: 'db',
      name: 'Database'
    } as NetworkNodeType,
    queue: {
      ...API_NODE,
      id: 'queue',
      name: 'Message Queue'
    } as NetworkNodeType,
    widget: {
      ...REPORT_NODE,
      id: 'widget',
      name: 'UI Widget'
    } as NetworkNodeType
  },
  
  laneTypes: {
    data: DATA_LANE,
    process: PROCESS_LANE,
    output: OUTPUT_LANE
  },
  
  edgeTypes: {
    'data-flow': DATA_EDGE,
    'control-flow': CONTROL_EDGE
  },
  
  globalRules: {
    allowCycles: false,
    requireStartNodes: true,
    requireEndNodes: true,
    maxDepth: 10,
    connectionRules: CONNECTION_RULES,
    validationRules: GLOBAL_VALIDATION_RULES
  },
  
  simulation: {
    tokenTypes: ['data', 'control', 'event'],
    defaultTokenBehavior: 'sequential',
    supportsConcurrency: true,
    supportsConditionalFlow: true
  }
};