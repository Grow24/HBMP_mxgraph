import type { RFGraph } from '@hbmp/shared-types';

/**
 * Generate Mermaid diagram DSL from React Flow graph
 * 
 * @param graph React Flow graph
 * @param options Generation options
 * @returns Mermaid DSL string
 */
export function generateMermaid(
  graph: RFGraph, 
  options: {
    direction?: 'TD' | 'LR' | 'RL' | 'BT';
    includeNodeStyles?: boolean;
    includeLinks?: boolean;
    baseUrl?: string;
  } = {}
): string {
  const { 
    direction = 'LR', 
    includeNodeStyles = true, 
    includeLinks = false,
    baseUrl = ''
  } = options;
  
  let mermaid = `graph ${direction}\n`;
  
  // Add nodes with labels and shapes
  for (const node of graph.nodes) {
    if (node.type === 'lane') continue; // Skip lanes in simple Mermaid
    
    const nodeId = sanitizeId(node.id);
    const label = node.data.label || node.id;
    const shape = getNodeShape(node.type);
    
    mermaid += `  ${nodeId}${shape.start}${label}${shape.end}\n`;
    
    // Add click handler if links enabled
    if (includeLinks && baseUrl) {
      mermaid += `  click ${nodeId} "${baseUrl}/nodes/${node.id}" "View ${label}"\n`;
    }
  }
  
  // Add edges with labels
  for (const edge of graph.edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const label = edge.label ? `|${edge.label}|` : '';
    
    mermaid += `  ${sourceId} -->${label} ${targetId}\n`;
  }
  
  // Add node styling if enabled
  if (includeNodeStyles) {
    mermaid += '\n';
    mermaid += addNodeStyling(graph.nodes);
  }
  
  return mermaid;
}

/**
 * Get Mermaid node shape syntax for node type
 */
function getNodeShape(nodeType: string): { start: string; end: string } {
  const shapes: Record<string, { start: string; end: string }> = {
    processTask: { start: '[', end: ']' },           // Rectangle
    gateway: { start: '{', end: '}' },               // Diamond
    event: { start: '((', end: '))' },               // Circle
    dataset: { start: '[/', end: '/]' },             // Parallelogram
    report: { start: '>', end: ']' },                // Flag
    service: { start: '{{', end: '}}' },             // Hexagon
    api: { start: '[(', end: ')]' },                 // Cylinder
    db: { start: '[(', end: ')]' },                  // Cylinder
    queue: { start: '[\\', end: '/]' },              // Trapezoid
    widget: { start: '[', end: ']' }                 // Rectangle (dashed via styling)
  };
  
  return shapes[nodeType] || { start: '[', end: ']' };
}

/**
 * Sanitize node ID for Mermaid (alphanumeric + underscore only)
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Add CSS styling for different node types
 */
function addNodeStyling(nodes: any[]): string {
  let styling = '';
  const usedTypes = new Set<string>();
  
  // Collect unique node types
  for (const node of nodes) {
    if (node.type !== 'lane') {
      usedTypes.add(node.type);
    }
  }
  
  // Define class styles for each type
  const typeClasses: Record<string, string> = {
    processTask: 'fill:#0ea5e9,stroke:#0369a1,stroke-width:2px,color:#fff',
    gateway: 'fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff',
    event: 'fill:#22c55e,stroke:#16a34a,stroke-width:2px,color:#fff',
    dataset: 'fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff',
    report: 'fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff',
    service: 'fill:#f97316,stroke:#ea580c,stroke-width:2px,color:#fff',
    api: 'fill:#84cc16,stroke:#65a30d,stroke-width:2px,color:#fff',
    db: 'fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff',
    queue: 'fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff',
    widget: 'fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff,stroke-dasharray: 5 5'
  };
  
  let classIndex = 0;
  
  // Add class definitions
  for (const nodeType of usedTypes) {
    const className = `c${classIndex}`;
    const style = typeClasses[nodeType] || 'fill:#e5e7eb,stroke:#9ca3af,stroke-width:2px';
    
    styling += `  classDef ${className} ${style}\n`;
    
    // Apply class to all nodes of this type
    const nodeIds = nodes
      .filter(node => node.type === nodeType)
      .map(node => sanitizeId(node.id))
      .join(',');
      
    if (nodeIds) {
      styling += `  class ${nodeIds} ${className}\n`;
    }
    
    classIndex++;
  }
  
  return styling;
}

/**
 * Generate simple flowchart for documentation
 */
export function generateSimpleFlowchart(
  graph: RFGraph, 
  title?: string
): string {
  let mermaid = 'flowchart LR\n';
  
  if (title) {
    mermaid = `---\ntitle: ${title}\n---\n${mermaid}`;
  }
  
  // Add only essential nodes and connections
  const essentialNodes = graph.nodes.filter(node => 
    node.type !== 'lane' && 
    (graph.edges.some(e => e.source === node.id) || graph.edges.some(e => e.target === node.id))
  );
  
  for (const node of essentialNodes) {
    const nodeId = sanitizeId(node.id);
    const label = node.data.label || node.id;
    mermaid += `  ${nodeId}["${label}"]\n`;
  }
  
  for (const edge of graph.edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    mermaid += `  ${sourceId} --> ${targetId}\n`;
  }
  
  return mermaid;
}

/**
 * Generate sequence diagram for process flows
 */
export function generateSequenceDiagram(
  graph: RFGraph,
  actors: string[] = []
): string {
  let mermaid = 'sequenceDiagram\n';
  
  // Define participants
  const participants = actors.length > 0 ? actors : 
    graph.nodes
      .filter(node => ['service', 'api', 'db'].includes(node.type))
      .map(node => node.data.label);
      
  for (const participant of participants) {
    mermaid += `  participant ${sanitizeId(participant)} as ${participant}\n`;
  }
  
  // Add interactions based on edges
  for (const edge of graph.edges) {
    const source = graph.nodes.find(n => n.id === edge.source);
    const target = graph.nodes.find(n => n.id === edge.target);
    
    if (source && target && 
        ['service', 'api', 'db'].includes(source.type) && 
        ['service', 'api', 'db'].includes(target.type)) {
      
      const sourceLabel = sanitizeId(source.data.label);
      const targetLabel = sanitizeId(target.data.label);
      const message = edge.label || 'request';
      
      mermaid += `  ${sourceLabel}->>+${targetLabel}: ${message}\n`;
      mermaid += `  ${targetLabel}-->>-${sourceLabel}: response\n`;
    }
  }
  
  return mermaid;
}