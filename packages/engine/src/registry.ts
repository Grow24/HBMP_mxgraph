import type { NodeKind } from '@hbmp/shared-types';
import { colors, nodeSizes } from '@hbmp/ui-tokens';

/**
 * Registry item defining how RF node types map to mxGraph shapes and styles
 */
export interface NodeRegistryItem {
  rfType: NodeKind;
  mxShape: string;
  defaultSize: { w: number; h: number };
  style: Record<string, string | number>;
  ports?: Array<{
    id: string;
    dir: "in" | "out";
    x: number;
    y: number;
  }>;
  allowConnect?: (from: NodeKind, to: NodeKind, via?: string) => boolean;
}

/**
 * Registry item for edge styling and behavior
 */
export interface EdgeRegistryItem {
  style: Record<string, string | number>;
  orthogonal: boolean;
  labelStyle?: Record<string, string | number>;
}

/**
 * Version identifier for the registry (for compatibility checks)
 */
export const RegistryVersion = "v1";

/**
 * Node type registry mapping RF types to mxGraph shapes and styles
 */
export const NodeRegistry: Record<NodeKind, NodeRegistryItem> = {
  processTask: {
    rfType: "processTask",
    mxShape: "rectangle",
    defaultSize: { w: nodeSizes.processTask.width, h: nodeSizes.processTask.height },
    style: {
      rounded: 1,
      fillColor: colors.nodeTypes.processTask,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  gateway: {
    rfType: "gateway",
    mxShape: "rhombus",
    defaultSize: { w: nodeSizes.gateway.width, h: nodeSizes.gateway.height },
    style: {
      fillColor: colors.nodeTypes.gateway,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out1', dir: 'out', x: 0.5, y: 1 },
      { id: 'out2', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  event: {
    rfType: "event",
    mxShape: "ellipse",
    defaultSize: { w: nodeSizes.event.width, h: nodeSizes.event.height },
    style: {
      fillColor: colors.nodeTypes.event,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif'
    }
  },
  dataset: {
    rfType: "dataset",
    mxShape: "parallelogram",
    defaultSize: { w: nodeSizes.dataset.width, h: nodeSizes.dataset.height },
    style: {
      fillColor: colors.nodeTypes.dataset,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  report: {
    rfType: "report",
    mxShape: "document", 
    defaultSize: { w: nodeSizes.report.width, h: nodeSizes.report.height },
    style: {
      fillColor: colors.nodeTypes.report,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 }
    ]
  },
  service: {
    rfType: "service",
    mxShape: "hexagon",
    defaultSize: { w: nodeSizes.service.width, h: nodeSizes.service.height },
    style: {
      fillColor: colors.nodeTypes.service,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  api: {
    rfType: "api",
    mxShape: "cylinder",
    defaultSize: { w: nodeSizes.api.width, h: nodeSizes.api.height },
    style: {
      fillColor: colors.nodeTypes.api,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  db: {
    rfType: "db",
    mxShape: "cylinder",
    defaultSize: { w: nodeSizes.db.width, h: nodeSizes.db.height },
    style: {
      fillColor: colors.nodeTypes.db,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  queue: {
    rfType: "queue",
    mxShape: "trapezoid",
    defaultSize: { w: nodeSizes.queue.width, h: nodeSizes.queue.height },
    style: {
      fillColor: colors.nodeTypes.queue,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  widget: {
    rfType: "widget",
    mxShape: "rectangle",
    defaultSize: { w: nodeSizes.widget.width, h: nodeSizes.widget.height },
    style: {
      dashed: 1,
      fillColor: colors.nodeTypes.widget,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 }
    ]
  },
  lane: {
    rfType: "lane",
    mxShape: "swimlane",
    defaultSize: { w: nodeSizes.lane.width, h: nodeSizes.lane.height },
    style: {
      horizontal: 1,
      fillColor: colors.gray[50],
      strokeColor: colors.gray[300],
      fontColor: colors.gray[700],
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      fontStyle: 1 // bold
    }
  },
  flowStart: {
    rfType: "flowStart",
    mxShape: "ellipse",
    defaultSize: { w: nodeSizes.flowStart.width, h: nodeSizes.flowStart.height },
    style: {
      fillColor: colors.nodeTypes.flowStart,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  flowDecision: {
    rfType: "flowDecision",
    mxShape: "rhombus",
    defaultSize: { w: nodeSizes.flowDecision.width, h: nodeSizes.flowDecision.height },
    style: {
      fillColor: colors.nodeTypes.flowDecision,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out1', dir: 'out', x: 0.5, y: 1 },
      { id: 'out2', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  flowAction: {
    rfType: "flowAction",
    mxShape: "rectangle",
    defaultSize: { w: nodeSizes.flowAction.width, h: nodeSizes.flowAction.height },
    style: {
      rounded: 1,
      fillColor: colors.nodeTypes.flowAction,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  flowProcess: {
    rfType: "flowProcess",
    mxShape: "hexagon",
    defaultSize: { w: nodeSizes.flowProcess.width, h: nodeSizes.flowProcess.height },
    style: {
      fillColor: colors.nodeTypes.flowProcess,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  },
  flowEnd: {
    rfType: "flowEnd",
    mxShape: "ellipse",
    defaultSize: { w: nodeSizes.flowEnd.width, h: nodeSizes.flowEnd.height },
    style: {
      fillColor: colors.nodeTypes.flowEnd,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 }
    ]
  },
  flowTable: {
    rfType: "flowTable",
    mxShape: "table",
    defaultSize: { w: nodeSizes.flowTable.width, h: nodeSizes.flowTable.height },
    style: {
      fillColor: colors.nodeTypes.flowTable,
      strokeColor: colors.gray[400],
      fontColor: '#ffffff',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif'
    },
    ports: [
      { id: 'in', dir: 'in', x: 0, y: 0.5 },
      { id: 'out', dir: 'out', x: 1, y: 0.5 }
    ]
  }
};

/**
 * Edge registry defining default edge styles
 */
export const EdgeRegistry: EdgeRegistryItem = {
  style: {
    edgeStyle: 'orthogonalEdgeStyle',
    rounded: 1,
    endArrow: 'block',
    strokeColor: colors.gray[400],
    strokeWidth: 2
  },
  orthogonal: true,
  labelStyle: {
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    fontColor: colors.gray[600],
    backgroundColor: colors.gray[50],
    labelBackgroundColor: colors.gray[50]
  }
};

/**
 * Connection validation rules
 */
export const ConnectionRules = {
  /**
   * Check if connection between two node types is allowed
   */
  isAllowed: (from: NodeKind, to: NodeKind): boolean => {
    const rules: Partial<Record<NodeKind, NodeKind[]>> = {
      processTask: ['gateway', 'event', 'processTask', 'dataset'],
      gateway: ['processTask', 'event'],
      event: ['processTask', 'gateway', 'event'],
      dataset: ['report', 'service', 'api', 'processTask'],
      service: ['api', 'db', 'queue'],
      api: ['service', 'db'],
      db: ['service'],
      queue: ['service']
    };
    
    return rules[from]?.includes(to) ?? false;
  },

  /**
   * Get maximum connections allowed for a node type and direction
   */
  maxConnections: (nodeType: NodeKind, direction: 'in' | 'out'): number => {
    const limits: Record<NodeKind, { in: number; out: number }> = {
      processTask: { in: -1, out: -1 },
      gateway: { in: 1, out: 2 },
      event: { in: -1, out: 1 },
      dataset: { in: 0, out: -1 }, // unlimited
      report: { in: -1, out: 0 },
      service: { in: -1, out: -1 },
      api: { in: -1, out: -1 },
      db: { in: -1, out: -1 },
      queue: { in: -1, out: -1 },
      widget: { in: -1, out: 0 },
      lane: { in: 0, out: 0 },
      flowStart: { in: 0, out: 1 },
      flowDecision: { in: 1, out: 2 },
      flowAction: { in: 1, out: 1 },
      flowProcess: { in: 1, out: 1 },
      flowEnd: { in: 1, out: 0 },
      flowTable: { in: 1, out: 1 }
    };

    return limits[nodeType]?.[direction] ?? -1;
  }
};