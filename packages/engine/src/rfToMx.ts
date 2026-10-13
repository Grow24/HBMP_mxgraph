import type { RFGraph, RFNode, RFEdge } from '@hbmp/shared-types';
import type { EdgeMetadata, NodeMetadataMap } from '@hbmp/shared-types';
import { NodeRegistry, EdgeRegistry } from './registry';

/**
 * Options for RF to mxGraph conversion
 */
export interface RfToMxOptions {
  /** Include model wrapper tags */
  includeModel?: boolean;
  /** Pretty print XML */
  prettyPrint?: boolean;
  /** Preserve metadata in XML */
  preserveMetadata?: boolean;
}

/**
 * Convert React Flow JSON to mxGraph XML
 * 
 * @param rfGraph React Flow graph structure
 * @param options Conversion options
 * @returns mxGraph XML string
 */
export function rfToMx(rfGraph: RFGraph, options: RfToMxOptions = {}): string {
  const { includeModel = true, prettyPrint = false, preserveMetadata = true } = options;
  
  let xml = '';
  const indent = prettyPrint ? '  ' : '';
  const newline = prettyPrint ? '\n' : '';
  
  // Start mxGraphModel wrapper
  if (includeModel) {
    xml += `<mxGraphModel>${newline}`;
    xml += `${indent}<root>${newline}`;
  }
  
  // Add required root cells
  xml += `${indent}${indent}<mxCell id="0"/>${newline}`;
  xml += `${indent}${indent}<mxCell id="1" parent="0"/>${newline}`;
  
  // Group nodes by lanes
  const laneNodes = rfGraph.nodes.filter(node => node.type === 'lane');
  const regularNodes = rfGraph.nodes.filter(node => node.type !== 'lane');
  
  // Add lane nodes first (they become parents)
  for (const node of laneNodes) {
    xml += nodeToMxCell(node, '1', indent + indent, newline);
  }
  
  // Add regular nodes
  for (const node of regularNodes) {
    const parentId = node.data.laneId || '1';
    xml += nodeToMxCell(node, parentId, indent + indent, newline, preserveMetadata);
  }
  
  // Add edges
  for (const edge of rfGraph.edges) {
    xml += edgeToMxCell(edge, '1', indent + indent, newline, preserveMetadata);
  }
  
  // Close mxGraphModel wrapper
  if (includeModel) {
    xml += `${indent}</root>${newline}`;
    xml += `</mxGraphModel>`;
  }
  
  return xml;
}

/**
 * Convert a React Flow node to an mxGraph cell XML string
 */
function nodeToMxCell(node: RFNode, parentId: string, indent: string, newline: string, preserveMetadata: boolean = true): string {
  const registry = NodeRegistry[node.type];
  if (!registry) {
    throw new Error(`Unknown node type: ${node.type}`);
  }
  
  // Build style string
  const styleEntries = Object.entries(registry.style).map(([key, value]) => `${key}=${value}`);
  const styleString = styleEntries.join(';');
  
  // Determine size (use registry default or custom)
  const width = registry.defaultSize.w;
  const height = registry.defaultSize.h;
  
  let xml = `${indent}<mxCell id="${node.id}" value="${escapeXml(node.data.label)}" `;
  xml += `vertex="1" parent="${parentId}" style="${styleString}"`;
  
  // Serialize metadata if present
  if (preserveMetadata && node.data.metadata) {
    const metadataJson = JSON.stringify(node.data.metadata);
    xml += ` metadata="${escapeXml(metadataJson)}"`;
  }
  
  // Serialize ports if present
  if (preserveMetadata && node.data.ports) {
    const portsJson = JSON.stringify(node.data.ports);
    xml += ` ports="${escapeXml(portsJson)}"`;
  }
  
  xml += `>${newline}`;
  xml += `${indent}  <mxGeometry x="${node.position.x}" y="${node.position.y}" `;
  xml += `width="${width}" height="${height}" as="geometry"/>${newline}`;
  xml += `${indent}</mxCell>${newline}`;
  
  return xml;
}

/**
 * Convert a React Flow edge to an mxGraph cell XML string
 */
function edgeToMxCell(edge: RFEdge, parentId: string, indent: string, newline: string, preserveMetadata: boolean = true): string {
  // Build style string
  const styleEntries = Object.entries(EdgeRegistry.style).map(([key, value]) => `${key}=${value}`);
  const styleString = styleEntries.join(';');
  
  let xml = `${indent}<mxCell id="${edge.id}" `;
  if (edge.label) {
    xml += `value="${escapeXml(edge.label)}" `;
  }
  xml += `edge="1" parent="${parentId}" source="${edge.source}" target="${edge.target}" `;
  xml += `style="${styleString}"`;
  
  // Serialize metadata if present
  if (preserveMetadata && edge.metadata) {
    const metadataJson = JSON.stringify(edge.metadata);
    xml += ` metadata="${escapeXml(metadataJson)}"`;
  }
  
  xml += `>${newline}`;
  
  // Add geometry with waypoints if provided
  xml += `${indent}  <mxGeometry relative="1" as="geometry"`;
  if (edge.points && edge.points.length > 0) {
    xml += `>${newline}`;
    xml += `${indent}    <Array as="points">${newline}`;
    for (const point of edge.points) {
      xml += `${indent}      <mxPoint x="${point.x}" y="${point.y}"/>${newline}`;
    }
    xml += `${indent}    </Array>${newline}`;
    xml += `${indent}  </mxGeometry>${newline}`;
  } else {
    xml += `/>${newline}`;
  }
  
  xml += `${indent}</mxCell>${newline}`;
  
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a unique ID for mxGraph cells
 */
export function generateMxId(): string {
  return `mx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}