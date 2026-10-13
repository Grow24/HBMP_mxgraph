import { RFGraph, RFNode, RFEdge } from '@hbmp/shared-types';

/**
 * Adapter between Salesforce Flow format and HBMP RFGraph format
 */
export class FlowAdapter {
  /**
   * Convert Salesforce Flow to HBMP RFGraph
   */
  static salesforceToHBMP(sfFlow: any): RFGraph {
    const nodes: RFNode[] = sfFlow.nodes.map((node: any) => ({
      id: node.id,
      type: this.mapSalesforceNodeType(node.type),
      position: node.position,
      data: {
        label: node.data.label,
        kind: this.mapSalesforceNodeType(node.type),
        props: {
          ...node.data,
          executionData: node.data.executionData
        }
      }
    }));

    const edges: RFEdge[] = sfFlow.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      data: {
        relation: edge.data?.relation || 'flow'
      }
    }));

    return { nodes, edges };
  }

  /**
   * Convert HBMP RFGraph to Salesforce Flow
   */
  static hbmpToSalesforce(rfGraph: RFGraph): any {
    const nodes = rfGraph.nodes.map(node => ({
      id: node.id,
      type: this.mapHBMPNodeType(node.type),
      position: node.position,
      data: {
        label: node.data.label,
        ...node.data.props,
        executionData: node.data.props?.executionData
      }
    }));

    const edges = rfGraph.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      data: edge.data
    }));

    return { nodes, edges };
  }

  private static mapSalesforceNodeType(sfType: string): any {
    const mapping: Record<string, string> = {
      'start': 'flowStart',
      'decision': 'flowDecision', 
      'action': 'flowAction',
      'process': 'flowProcess',
      'end': 'flowEnd',
      'table': 'flowTable'
    };
    return mapping[sfType] || sfType;
  }

  private static mapHBMPNodeType(hbmpType: any): string {
    const mapping: Record<string, string> = {
      'flowStart': 'start',
      'flowDecision': 'decision',
      'flowAction': 'action', 
      'flowProcess': 'process',
      'flowEnd': 'end',
      'flowTable': 'table'
    };
    return mapping[hbmpType] || hbmpType;
  }
}