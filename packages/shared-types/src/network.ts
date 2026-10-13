/**
 * Network modeling specific types
 */

export interface NetworkNodePosition {
  x: number;
  y: number;
  fx?: number | null; // Fixed x position (pinned)
  fy?: number | null; // Fixed y position (pinned)
  vx?: number; // Velocity x
  vy?: number; // Velocity y
}

export interface NetworkNode {
  id: string;
  type: string;
  label: string;
  position: NetworkNodePosition;
  degree?: number;
  clusterId?: string;
  influenceScore?: number;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  strength?: number;
  type?: 'control' | 'influence' | 'data' | 'event';
  metadata?: Record<string, any>;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface ClusterInfo {
  id: string;
  nodeIds: string[];
  size: number;
  density: number;
}

export interface PathInfo {
  nodes: string[];
  edges: string[];
  length: number;
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  density: number;
  connectedComponents: number;
  hasCycles: boolean;
}

export interface TopologyAnalysis {
  metrics: GraphMetrics;
  clusters: ClusterInfo[];
  criticalNodes: string[];
  deadEnds: string[];
  unreachableNodes: string[];
  shortestPaths?: Map<string, Map<string, PathInfo>>;
}

export interface NetworkAnalysisRequest {
  graph: NetworkGraph;
  options?: {
    findClusters?: boolean;
    findCriticalNodes?: boolean;
    findShortestPaths?: boolean;
  };
}

export interface NetworkAnalysisResponse {
  analysis: TopologyAnalysis;
  timestamp: number;
}
