/**
 * Semantic Metadata Models
 * Comprehensive metadata schemas for nodes and edges
 */

import type { NodeKind } from '@hbmp/shared-types';

// ============================================================================
// EDGE METADATA
// ============================================================================

export interface EdgeMetadata {
  // Basic information
  label?: string;
  description?: string;
  
  // Data transformation
  mapping?: FieldMapping[];
  transform?: DataTransform;
  filter?: FilterCondition;
  
  // Control flow
  condition?: ConditionalRule;
  priority?: number;
  weight?: number;
  
  // Execution semantics
  async?: boolean;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  errorHandling?: ErrorHandling;
  
  // Branching and routing
  branchType?: 'conditional' | 'parallel' | 'exclusive' | 'inclusive';
  routingRule?: string; // Expression or rule name
  
  // Data flow properties
  dataType?: string;
  schema?: DataSchema;
  sampleData?: any;
  
  // Visual properties
  style?: EdgeStyle;
  animated?: boolean;
  color?: string;
  
  // Audit and metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  tags?: string[];
  
  // Custom properties
  [key: string]: any;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string; // e.g., "uppercase", "trim", "parseDate"
  defaultValue?: any;
  required?: boolean;
}

export interface DataTransform {
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'custom';
  operation: string;
  parameters?: Record<string, any>;
  script?: string; // For custom transforms
}

export interface FilterCondition {
  expression: string;
  type: 'javascript' | 'sql' | 'jsonpath' | 'rule';
  parameters?: Record<string, any>;
}

export interface ConditionalRule {
  expression: string;
  type: 'boolean' | 'comparison' | 'pattern' | 'custom';
  trueLabel?: string;
  falseLabel?: string;
  defaultBranch?: 'true' | 'false';
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay?: number;
  retryOn?: string[]; // Error types to retry on
}

export interface ErrorHandling {
  strategy: 'fail' | 'ignore' | 'default' | 'route';
  defaultValue?: any;
  errorRoute?: string; // Node ID to route errors to
  logErrors?: boolean;
}

export interface DataSchema {
  fields: SchemaField[];
  format?: 'json' | 'csv' | 'xml' | 'avro' | 'parquet';
  nullable?: boolean;
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  description?: string;
  constraints?: FieldConstraints;
}

export interface FieldConstraints {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  unique?: boolean;
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  markerEnd?: string;
  markerStart?: string;
  curve?: 'straight' | 'bezier' | 'step' | 'smooth';
}

// ============================================================================
// NODE METADATA BY TYPE
// ============================================================================

// Base node metadata
export interface BaseNodeMetadata {
  label: string;
  description?: string;
  notes?: string;
  tags?: string[];
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  
  // Execution properties
  enabled?: boolean;
  executeOn?: 'always' | 'condition' | 'manual';
  condition?: string;
  
  // Visual properties
  color?: string;
  icon?: string;
  collapsed?: boolean;
  
  // Custom properties
  [key: string]: any;
}

// Dataset Node Metadata
export interface DatasetNodeMetadata extends BaseNodeMetadata {
  // Data source configuration
  source: DataSource;
  
  // Schema definition
  schema: DataSchema;
  
  // Refresh and caching
  refreshRate?: number; // seconds
  cacheEnabled?: boolean;
  cacheTTL?: number;
  
  // Data properties
  rowCount?: number;
  sizeBytes?: number;
  lastRefreshed?: string;
  
  // Access control
  accessLevel?: 'public' | 'private' | 'restricted';
  permissions?: string[];
  
  // Partitioning
  partitionBy?: string[];
  partitionCount?: number;
}

export interface DataSource {
  type: 'database' | 'api' | 'file' | 'stream' | 'manual';
  connectionString?: string;
  endpoint?: string;
  filePath?: string;
  query?: string;
  headers?: Record<string, string>;
  authentication?: AuthenticationConfig;
}

export interface AuthenticationConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth' | 'api-key';
  credentials?: Record<string, string>;
  tokenUrl?: string;
}

// ProcessTask Node Metadata
export interface ProcessTaskNodeMetadata extends BaseNodeMetadata {
  // Transformation logic
  transforms: TransformOperation[];
  
  // Filtering
  filters?: FilterCondition[];
  
  // Aggregations
  aggregations?: AggregationOperation[];
  
  // Joins
  joins?: JoinOperation[];
  
  // Sorting
  sortBy?: SortOperation[];
  
  // Limits
  limit?: number;
  offset?: number;
  
  // Custom code
  customScript?: string;
  scriptLanguage?: 'javascript' | 'python' | 'sql';
  
  // Performance
  batchSize?: number;
  parallel?: boolean;
  maxWorkers?: number;
  
  // Events
  events?: EventTrigger[];
}

export interface TransformOperation {
  type: 'map' | 'flatMap' | 'reduce' | 'custom';
  field?: string;
  operation: string;
  parameters?: Record<string, any>;
  outputField?: string;
}

export interface AggregationOperation {
  function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct' | 'custom';
  field: string;
  groupBy?: string[];
  outputField?: string;
  filter?: FilterCondition;
}

export interface JoinOperation {
  type: 'inner' | 'left' | 'right' | 'full' | 'cross';
  rightSource: string; // Node ID or data source
  leftKey: string;
  rightKey: string;
  select?: string[]; // Fields to include
}

export interface SortOperation {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

export interface EventTrigger {
  type: 'onSuccess' | 'onFailure' | 'onTimeout' | 'onRetry' | 'onStart' | 'onComplete';
  action: string;
  target?: string; // Node ID or webhook URL
  condition?: string;
  enabled: boolean;
}

// Report Node Metadata
export interface ReportNodeMetadata extends BaseNodeMetadata {
  // Report configuration
  reportType: 'table' | 'chart' | 'dashboard' | 'export' | 'email';
  
  // Visualization
  visualization?: VisualizationConfig;
  
  // Metrics
  measures: Measure[];
  dimensions?: Dimension[];
  
  // Filters
  filters?: ReportFilter[];
  
  // Format
  format: FormatConfig;
  
  // Scheduling
  schedule?: ScheduleConfig;
  
  // Distribution
  distribution?: DistributionConfig;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge';
  xAxis?: string;
  yAxis?: string[];
  colorScheme?: string;
  legend?: boolean;
  gridLines?: boolean;
  responsive?: boolean;
}

export interface Measure {
  field: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  label?: string;
  format?: string; // e.g., "$#,##0.00"
  color?: string;
}

export interface Dimension {
  field: string;
  label?: string;
  sortBy?: 'value' | 'label' | 'count';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'like';
  value: any;
  label?: string;
}

export interface FormatConfig {
  outputFormat: 'html' | 'pdf' | 'excel' | 'csv' | 'json';
  template?: string;
  styling?: Record<string, any>;
  pageSize?: 'A4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron';
  cronExpression?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
}

export interface DistributionConfig {
  method: 'email' | 'slack' | 'webhook' | 'storage';
  recipients?: string[];
  webhookUrl?: string;
  storagePath?: string;
  message?: string;
}

// Gateway Node Metadata
export interface GatewayNodeMetadata extends BaseNodeMetadata {
  // Decision logic
  condition: string;
  conditionType: 'expression' | 'rule' | 'manual' | 'ml-model';
  
  // Routing
  routingStrategy: 'exclusive' | 'parallel' | 'inclusive';
  
  // Branches
  branches: BranchDefinition[];
  
  // Default behavior
  defaultBranch?: string;
  
  // Evaluation
  evaluationTimeout?: number;
  cacheDecisions?: boolean;
}

export interface BranchDefinition {
  id: string;
  label: string;
  condition?: string;
  priority?: number;
  outputPortId?: string;
}

// API Node Metadata
export interface ApiNodeMetadata extends BaseNodeMetadata {
  // Endpoint configuration
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  // Headers
  headers?: Record<string, string>;
  
  // Authentication
  authentication?: AuthenticationConfig;
  
  // Request body
  bodyTemplate?: string;
  bodyFormat?: 'json' | 'xml' | 'form' | 'multipart';
  
  // Response handling
  responseMapping?: FieldMapping[];
  errorMapping?: Record<string, string>; // HTTP status to error type
  
  // Retry and timeout
  timeout?: number;
  retryPolicy?: RetryPolicy;
  
  // Rate limiting
  rateLimit?: RateLimitConfig;
  
  // Caching
  cacheEnabled?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  strategy: 'fixed' | 'sliding';
}

// Lane Node Metadata
export interface LaneNodeMetadata extends BaseNodeMetadata {
  // Organizational properties
  department?: string;
  team?: string;
  
  // Access control
  permissions?: Permission[];
  visibility?: 'public' | 'private' | 'team';
  
  // Constraints
  maxNodes?: number;
  allowedNodeTypes?: NodeKind[];
  forbiddenNodeTypes?: NodeKind[];
  
  // Layout
  layoutDirection?: 'horizontal' | 'vertical';
  autoResize?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface Permission {
  role: string;
  actions: ('view' | 'edit' | 'delete' | 'execute')[];
}

// ============================================================================
// METADATA TYPE MAP
// ============================================================================

export type NodeMetadataMap = {
  dataset: DatasetNodeMetadata;
  processTask: ProcessTaskNodeMetadata;
  report: ReportNodeMetadata;
  gateway: GatewayNodeMetadata;
  api: ApiNodeMetadata;
  lane: LaneNodeMetadata;
  event: BaseNodeMetadata;
  service: ApiNodeMetadata;
  db: DatasetNodeMetadata;
  queue: ApiNodeMetadata;
  widget: ReportNodeMetadata;
};

export type NodeMetadata<T extends NodeKind = NodeKind> = T extends keyof NodeMetadataMap
  ? NodeMetadataMap[T]
  : BaseNodeMetadata;
