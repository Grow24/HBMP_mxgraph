import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import type { ValidateRequest, LayoutRequest, SaveRequest, LoadResponse } from '@hbmp/shared-types';
import { 
  validateGraph, 
  layoutGraph, 
  rfToMx, 
  mxToRf, 
  generateMermaid,
  RegistryVersion 
} from '@hbmp/engine';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';
import { networkValidationService } from '../services/networkValidation';

const router = Router();
const prisma = new PrismaClient();
const logger = createLogger();

// Validation schemas
const validateRequestSchema = z.object({
  graph: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    meta: z.object({}).optional()
  }),
  registryVersion: z.string()
});

const layoutRequestSchema = z.object({
  graph: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    meta: z.object({}).optional()
  }),
  options: z.object({
    algorithm: z.enum(['hierarchical', 'tree', 'stack', 'organic', 'circle']).optional(),
    laneAware: z.boolean().optional(),
    orientation: z.enum(['LR', 'TB']).optional()
  }).optional()
});

const saveRequestSchema = z.object({
  projectId: z.string(),
  diagramId: z.string().optional(),
  name: z.string().min(1, 'Diagram name is required').max(100, 'Name too long'),
  kind: z.string().min(1),
  rf: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    meta: z.object({}).optional()
  }),
  status: z.enum(['draft', 'published'])
});

/**
 * POST /api/diagrams/validate
 * Validate a React Flow graph using Network Type Registry
 */
router.post('/validate', asyncHandler(async (req: any, res: any) => {
  const validation = validateRequestSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError('Invalid request data: ' + validation.error.issues.map((i: any) => i.message).join(', '), 400);
  }

  const { graph, registryVersion } = validation.data;

  // Check registry version compatibility
  if (registryVersion !== RegistryVersion) {
    logger.warn(`Registry version mismatch: client ${registryVersion}, server ${RegistryVersion}`);
  }

  // Use comprehensive network validation service
  const validationResult = networkValidationService.validateNetwork(graph);

  // Combine with basic validation for backward compatibility
  const basicIssues = validateGraph(graph);
  
  // Merge all issues
  const allIssues = [
    ...validationResult.errors,
    ...validationResult.warnings,
    ...validationResult.info,
    ...basicIssues
  ];

  // Remove duplicates based on message
  const uniqueIssues = allIssues.filter((issue, index, self) =>
    index === self.findIndex((i) => i.message === issue.message && i.nodeId === issue.nodeId)
  );

  const response = {
    ok: validationResult.valid,
    issues: uniqueIssues,
    summary: validationResult.summary,
    networkValidation: {
      hasCycles: validationResult.errors.some(e => e.id === 'global-cycles-detected'),
      hasOrphanedNodes: validationResult.warnings.some(w => w.id === 'global-orphaned-nodes'),
      connectionRulesEnforced: true
    }
  };

  res.json(response);
}));

/**
 * POST /api/diagrams/topology
 * Analyze network topology
 */
router.post('/topology', asyncHandler(async (req: any, res: any) => {
  const { topologyAnalyzer } = await import('../services/topologyAnalyzer');
  
  const validation = validateRequestSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError('Invalid request data', 400);
  }

  const { graph } = validation.data;

  // Perform topology analysis
  const analysis = topologyAnalyzer.analyzeTopology(graph);

  logger.info(`Topology analysis complete: ${analysis.issues.length} issues found, ` +
    `${analysis.unreachableNodes.length} unreachable nodes, ` +
    `${analysis.deadEnds.length} dead ends`);

  res.json(analysis);
}));

/**
 * POST /api/diagrams/layout
 * Apply layout algorithm to a graph
 */
router.post('/layout', asyncHandler(async (req: any, res: any) => {
  const validation = layoutRequestSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError('Invalid request data: ' + validation.error.issues.map((i: any) => i.message).join(', '), 400);
  }

  const { graph, options = {} } = validation.data;

  // Apply layout
  const layoutResult = layoutGraph(graph, {
    algorithm: options.algorithm ?? 'hierarchical',
    laneAware: options.laneAware ?? true,
    orientation: options.orientation ?? 'LR'
  });

  res.json({ graph: layoutResult });
}));

/**
 * POST /api/diagrams/save
 * Save or update a diagram
 */
router.post('/save', asyncHandler(async (req: any, res: any) => {
  const validation = saveRequestSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError('Invalid request data: ' + validation.error.issues.map((i: any) => i.message).join(', '), 400);
  }

  const { projectId, diagramId, name, kind, rf, status } = validation.data;
  const actor = req.headers['x-user-id'] || 'anonymous';

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  // Convert RF to mxGraph XML
  const mxXml = rfToMx(rf);
  
  // Generate Mermaid for documentation
  const mermaid = generateMermaid(rf, { 
    direction: rf.meta?.orientation === 'TB' ? 'TD' : 'LR',
    includeNodeStyles: true 
  });

  let diagram;
  let version = 1;

  if (diagramId) {
    // Update existing diagram
    const existing = await prisma.diagram.findUnique({
      where: { id: diagramId }
    });

    if (!existing) {
      throw createError('Diagram not found', 404);
    }

    version = existing.version + 1;

    diagram = await prisma.diagram.update({
      where: { id: diagramId },
      data: {
        name,
        kind,
        status,
        version,
        rfJson: rf,
        mxXml: Buffer.from(mxXml, 'utf-8'),
        mermaid
      }
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        diagramId: diagram.id,
        actor,
        action: 'update',
        payload: {
          name,
          status,
          version,
          nodes: rf.nodes.length,
          edges: rf.edges.length
        }
      }
    });

  } else {
    // Create new diagram
    diagram = await prisma.diagram.create({
      data: {
        projectId,
        name,
        kind,
        status,
        version: 1,
        rfJson: rf,
        mxXml: Buffer.from(mxXml, 'utf-8'),
        mermaid,
        createdBy: actor
      }
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        diagramId: diagram.id,
        actor,
        action: 'create',
        payload: {
          name,
          kind,
          status,
          nodes: rf.nodes.length,
          edges: rf.edges.length
        }
      }
    });
  }

  logger.info(`Diagram ${diagramId ? 'updated' : 'created'}: ${diagram.id} (${diagram.name})`);

  res.json({
    diagramId: diagram.id,
    version: diagram.version
  });
}));

/**
 * GET /api/diagrams/:id
 * Load a diagram
 */
router.get('/:id', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const diagram = await prisma.diagram.findUnique({
    where: { id }
  });

  if (!diagram) {
    throw createError('Diagram not found', 404);
  }

  const response: LoadResponse = {
    rf: diagram.rfJson as any,
    xml: Buffer.from(diagram.mxXml).toString('utf-8'),
    mermaid: diagram.mermaid || undefined,
    meta: {
      name: diagram.name,
      version: diagram.version,
      status: diagram.status,
      kind: diagram.kind
    }
  };

  res.json(response);
}));

/**
 * GET /api/diagrams/:id/audit
 * Get audit trail for a diagram
 */
router.get('/:id/audit', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const events = await prisma.auditEvent.findMany({
    where: { diagramId: id },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  res.json({ events });
}));

/**
 * DELETE /api/diagrams/:id
 * Delete a diagram
 */
router.delete('/:id', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const actor = req.headers['x-user-id'] || 'anonymous';

  const diagram = await prisma.diagram.findUnique({
    where: { id }
  });

  if (!diagram) {
    throw createError('Diagram not found', 404);
  }

  // Log audit event before deletion
  await prisma.auditEvent.create({
    data: {
      diagramId: id,
      actor,
      action: 'delete',
      payload: {
        name: diagram.name,
        kind: diagram.kind,
        version: diagram.version
      }
    }
  });

  // Delete diagram (cascades to audit events and exports)
  await prisma.diagram.delete({
    where: { id }
  });

  logger.info(`Diagram deleted: ${id} (${diagram.name})`);

  res.json({ message: 'Diagram deleted successfully' });
}));

function finiteNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * POST /api/diagrams/ensure-canvas
 * Create the prototype diagram once so layout, execution, and export have a real row.
 */
router.post('/ensure-canvas', asyncHandler(async (req: any, res: any) => {
  const name = 'Prototype Canvas';
  let project = await prisma.project.findFirst({
    where: { name: 'HBMP Prototype' }
  });

  if (!project) {
    project = await prisma.project.create({
      data: { name: 'HBMP Prototype' }
    });
  }

  let diagram = await prisma.diagram.findFirst({
    where: { projectId: project.id, name }
  });

  if (!diagram) {
    const rf = { nodes: [], edges: [] };
    diagram = await prisma.diagram.create({
      data: {
        projectId: project.id,
        name,
        kind: 'process',
        status: 'draft',
        version: 1,
        rfJson: rf,
        mxXml: Buffer.from(rfToMx(rf), 'utf-8'),
        createdBy: req.headers['x-user-id'] || 'prototype'
      }
    });
  }

  res.json({
    projectId: project.id,
    diagramId: diagram.id,
    rf: diagram.rfJson
  });
}));

/**
 * PUT /api/diagrams/:id/layout-state
 * Replace node positions and swimlane rows, and store the current graph on the diagram.
 */
router.put('/:id/layout-state', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const positions = Array.isArray(req.body?.positions) ? req.body.positions : [];
  const lanes = Array.isArray(req.body?.lanes) ? req.body.lanes : [];
  const rf = req.body?.rf;

  const diagram = await prisma.diagram.findUnique({ where: { id } });
  if (!diagram) {
    throw createError('Diagram not found', 404);
  }

  const positionRows = positions
    .filter((pos: any) => pos?.nodeId && finiteNumber(pos.x) !== undefined && finiteNumber(pos.y) !== undefined)
    .map((pos: any) => ({
      diagramId: id,
      nodeId: String(pos.nodeId),
      x: finiteNumber(pos.x)!,
      y: finiteNumber(pos.y)!,
      ...(finiteNumber(pos.width) !== undefined ? { width: finiteNumber(pos.width) } : {}),
      ...(finiteNumber(pos.height) !== undefined ? { height: finiteNumber(pos.height) } : {}),
      parentNodeId: pos.parentNodeId ? String(pos.parentNodeId) : null,
      layoutType: ['auto', 'manual', 'swimlane'].includes(pos.layoutType) ? pos.layoutType : 'manual'
    }));

  const laneRows = lanes
    .filter((lane: any) => lane?.laneId)
    .map((lane: any, index: number) => ({
      diagramId: id,
      laneId: String(lane.laneId),
      title: String(lane.title || lane.laneId),
      x: finiteNumber(lane.x) ?? 0,
      y: finiteNumber(lane.y) ?? 0,
      width: finiteNumber(lane.width) ?? 900,
      height: finiteNumber(lane.height) ?? 180,
      order: finiteNumber(lane.order) ?? index,
      nodeSpacing: finiteNumber(lane.nodeSpacing) ?? 120,
      paddingX: finiteNumber(lane.paddingX) ?? 20,
      paddingY: finiteNumber(lane.paddingY) ?? 40
    }));

  await prisma.$transaction([
    prisma.nodePosition.deleteMany({ where: { diagramId: id } }),
    prisma.swimlaneLayout.deleteMany({ where: { diagramId: id } }),
    ...(positionRows.length ? [prisma.nodePosition.createMany({ data: positionRows })] : []),
    ...(laneRows.length ? [prisma.swimlaneLayout.createMany({ data: laneRows })] : [])
  ]);

  if (rf && Array.isArray(rf.nodes) && Array.isArray(rf.edges)) {
    let mxXml = diagram.mxXml;
    let mermaid = diagram.mermaid;
    try {
      mxXml = Buffer.from(rfToMx(rf), 'utf-8');
    } catch (error) {
      logger.warn(`Layout graph could not be converted to mxGraph XML: ${error}`);
    }
    try {
      mermaid = generateMermaid(rf, { direction: 'LR', includeNodeStyles: true });
    } catch (error) {
      logger.warn(`Layout graph could not be converted to Mermaid: ${error}`);
    }
    await prisma.diagram.update({
      where: { id },
      data: {
        rfJson: rf,
        mxXml,
        mermaid
      }
    });
  }

  res.json({
    positions: positionRows.length,
    lanes: laneRows.length
  });
}));

/**
 * GET /api/diagrams/:id/layout-state
 * Load saved node positions and swimlane geometry.
 */
router.get('/:id/layout-state', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const diagram = await prisma.diagram.findUnique({ where: { id } });
  if (!diagram) {
    throw createError('Diagram not found', 404);
  }

  const [positions, lanes] = await Promise.all([
    prisma.nodePosition.findMany({ where: { diagramId: id } }),
    prisma.swimlaneLayout.findMany({ where: { diagramId: id }, orderBy: { order: 'asc' } })
  ]);

  res.json({ positions, lanes, rf: diagram.rfJson });
}));

export { router as diagramRoutes };