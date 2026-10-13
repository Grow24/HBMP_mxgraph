import { NetworkGraph } from '@hbmp/shared-types';

/**
 * Convert network graph to Mermaid graph syntax
 */
export function networkToMermaid(graph: NetworkGraph): string {
  const lines: string[] = ['graph LR'];

  // Add nodes with labels
  graph.nodes.forEach((node) => {
    const sanitizedLabel = node.label.replace(/"/g, '\\"');
    const nodeShape = getNodeShape(node.type);
    lines.push(`  ${node.id}${nodeShape[0]}"${sanitizedLabel}"${nodeShape[1]}`);
  });

  // Add edges
  graph.edges.forEach((edge) => {
    const edgeStyle = getEdgeStyle(edge.type);
    const label = edge.metadata?.label ? `|${edge.metadata.label}|` : '';
    lines.push(`  ${edge.source} ${edgeStyle}${label} ${edge.target}`);
  });

  // Add styling
  lines.push('');
  lines.push('  classDef default fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff');
  lines.push('  classDef gateway fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff');
  lines.push('  classDef event fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff');
  lines.push('  classDef data fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff');

  return lines.join('\n');
}

function getNodeShape(type: string): [string, string] {
  switch (type) {
    case 'gateway':
      return ['{', '}'];
    case 'event':
      return ['((', '))'];
    case 'dataset':
    case 'db':
      return ['[(', ')]'];
    default:
      return ['[', ']'];
  }
}

function getEdgeStyle(type?: string): string {
  switch (type) {
    case 'control':
      return '-->';
    case 'influence':
      return '-..->';
    case 'data':
      return '==>';
    case 'event':
      return '-.->';
    default:
      return '-->';
  }
}

/**
 * Convert network graph to mxGraph XML
 */
export function networkToMxGraph(graph: NetworkGraph): string {
  const cells: string[] = [];
  
  // Root cells
  cells.push('  <mxCell id="0"/>');
  cells.push('  <mxCell id="1" parent="0"/>');

  // Add nodes
  graph.nodes.forEach((node, index) => {
    const style = getNodeStyle(node.type);
    cells.push(
      `  <mxCell id="${node.id}" value="${escapeXml(node.label)}" ` +
      `style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${node.position.x}" y="${node.position.y}" width="80" height="80" as="geometry"/>` +
      `</mxCell>`
    );
  });

  // Add edges
  graph.edges.forEach((edge, index) => {
    const style = getEdgeStyleMx(edge.type);
    cells.push(
      `  <mxCell id="${edge.id}" value="${escapeXml(edge.metadata?.label || '')}" ` +
      `style="${style}" edge="1" parent="1" source="${edge.source}" target="${edge.target}">` +
      `<mxGeometry relative="1" as="geometry"/>` +
      `</mxCell>`
    );
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
${cells.join('\n')}
  </root>
</mxGraphModel>`;
}

function getNodeStyle(type: string): string {
  const baseStyle = 'rounded=1;whiteSpace=wrap;html=1;';
  
  switch (type) {
    case 'gateway':
      return baseStyle + 'shape=rhombus;fillColor=#f59e0b;strokeColor=#d97706;fontColor=#ffffff;';
    case 'event':
      return baseStyle + 'shape=ellipse;fillColor=#10b981;strokeColor=#059669;fontColor=#ffffff;';
    case 'dataset':
    case 'db':
      return baseStyle + 'shape=cylinder3;fillColor=#8b5cf6;strokeColor=#6d28d9;fontColor=#ffffff;';
    case 'api':
      return baseStyle + 'fillColor=#ec4899;strokeColor=#db2777;fontColor=#ffffff;';
    default:
      return baseStyle + 'fillColor=#3b82f6;strokeColor=#1e40af;fontColor=#ffffff;';
  }
}

function getEdgeStyleMx(type?: string): string {
  const baseStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;';
  
  switch (type) {
    case 'control':
      return baseStyle + 'strokeColor=#3b82f6;strokeWidth=2;';
    case 'influence':
      return baseStyle + 'strokeColor=#f59e0b;strokeWidth=2;dashed=1;';
    case 'data':
      return baseStyle + 'strokeColor=#8b5cf6;strokeWidth=3;';
    case 'event':
      return baseStyle + 'strokeColor=#10b981;strokeWidth=2;dashed=1;dashPattern=5 5;';
    default:
      return baseStyle + 'strokeColor=#64748b;strokeWidth=2;';
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
