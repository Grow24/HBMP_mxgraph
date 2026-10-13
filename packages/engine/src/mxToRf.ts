import type { RFGraph, RFNode, RFEdge, NodeKind } from '@hbmp/shared-types';
import type { EdgeMetadata } from '@hbmp/shared-types';
import { NodeRegistry } from './registry';
import { XMLParser } from 'fast-xml-parser';

/**
 * Options for mxGraph to RF conversion
 */
export interface MxToRfOptions {
  /** Validate against registry */
  validateTypes?: boolean;
  /** Restore metadata from XML */
  restoreMetadata?: boolean;
}

/**
 * Convert mxGraph XML to React Flow JSON
 * 
 * @param xmlString mxGraph XML string
 * @param options Conversion options  
 * @returns React Flow graph structure
 */
export function mxToRf(xmlString: string, options: MxToRfOptions = {}): RFGraph {
  const { validateTypes = true, restoreMetadata = true } = options;
  
  // Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true
  });
  
  const parsed = parser.parse(xmlString);
  
  // Navigate to cells
  const model = parsed.mxGraphModel || parsed;
  const root = model.root || model;
  const cells = Array.isArray(root.mxCell) ? root.mxCell : [root.mxCell].filter(Boolean);
  
  const nodes: RFNode[] = [];
  const edges: RFEdge[] = [];
  
  // Process each cell
  for (const cell of cells) {
    const id = cell['@_id'];
    const parent = cell['@_parent'];
    const vertex = cell['@_vertex'];
    const edge = cell['@_edge'];
    const value = cell['@_value'] || '';
    const style = cell['@_style'] || '';
    const source = cell['@_source'];
    const target = cell['@_target'];
    
    // Skip root cells (id 0 and 1)
    if (id === '0' || id === '1') continue;
    
    if (vertex === '1' || vertex === 1) {
      // This is a vertex/node
      const geometry = cell.mxGeometry;
      if (!geometry) continue;
      
      const x = parseFloat(geometry['@_x']) || 0;
      const y = parseFloat(geometry['@_y']) || 0;
      
      // Determine node type from style
      const nodeType = getNodeTypeFromStyle(style, validateTypes);
      
      const node: RFNode = {
        id,
        type: nodeType,
        position: { x, y },
        data: {
          label: value,
          kind: nodeType,
          laneId: parent !== '1' ? parent : undefined
        }
      };
      
      // Restore metadata if present
      if (restoreMetadata && cell['@_metadata']) {
        try {
          node.data.metadata = JSON.parse(cell['@_metadata']);
        } catch (e) {
          console.warn(`Failed to parse metadata for node ${id}:`, e);
        }
      }
      
      // Restore ports if present
      if (restoreMetadata && cell['@_ports']) {
        try {
          node.data.ports = JSON.parse(cell['@_ports']);
        } catch (e) {
          console.warn(`Failed to parse ports for node ${id}:`, e);
        }
      }
      
      nodes.push(node);
      
    } else if (edge === '1' || edge === 1) {
      // This is an edge
      const geometry = cell.mxGeometry;
      const points: Array<{ x: number; y: number }> = [];
      
      // Extract waypoints if present
      if (geometry && geometry.Array && geometry.Array.mxPoint) {
        const waypoints = Array.isArray(geometry.Array.mxPoint) 
          ? geometry.Array.mxPoint 
          : [geometry.Array.mxPoint];
          
        for (const point of waypoints) {
          points.push({
            x: parseFloat(point['@_x']) || 0,
            y: parseFloat(point['@_y']) || 0
          });
        }
      }
      
      const rfEdge: RFEdge = {
        id,
        source,
        target,
        label: value || undefined,
        points: points.length > 0 ? points : undefined
      };
      
      // Restore metadata if present
      if (restoreMetadata && cell['@_metadata']) {
        try {
          rfEdge.metadata = JSON.parse(cell['@_metadata']) as EdgeMetadata;
        } catch (e) {
          console.warn(`Failed to parse metadata for edge ${id}:`, e);
        }
      }
      
      edges.push(rfEdge);
    }
  }
  
  return {
    nodes,
    edges,
    meta: {
      orientation: 'LR' // Default orientation
    }
  };
}

/**
 * Determine node type from mxGraph style string
 */
function getNodeTypeFromStyle(styleString: string, validate: boolean): NodeKind {
  // Parse style string into key-value pairs
  const styleEntries = styleString.split(';')
    .map(entry => entry.split('='))
    .filter(pair => pair.length === 2);
    
  const styleMap = Object.fromEntries(styleEntries);
  
  // Try to match against registry shapes
  for (const [nodeType, registry] of Object.entries(NodeRegistry)) {
    if (styleMap.shape === registry.mxShape || 
        (!styleMap.shape && registry.mxShape === 'rectangle')) {
      
      // Additional checks for specific shapes
      if (registry.mxShape === 'swimlane' && styleMap.horizontal === '1') {
        return 'lane';
      }
      if (registry.mxShape === 'rhombus') {
        return 'gateway';
      }
      if (registry.mxShape === 'ellipse') {
        return 'event';
      }
      
      return nodeType as NodeKind;
    }
  }
  
  // Fallback to processTask for unknown shapes
  if (validate) {
    console.warn(`Unknown shape in style: ${styleString}. Defaulting to processTask.`);
  }
  
  return 'processTask';
}

/**
 * Extract geometry information from mxGraph cell
 */
export function extractGeometry(cell: any): { x: number; y: number; width: number; height: number } | null {
  const geometry = cell.mxGeometry;
  if (!geometry) return null;
  
  return {
    x: parseFloat(geometry['@_x']) || 0,
    y: parseFloat(geometry['@_y']) || 0,
    width: parseFloat(geometry['@_width']) || 0,
    height: parseFloat(geometry['@_height']) || 0
  };
}