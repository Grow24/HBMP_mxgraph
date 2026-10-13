import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { rfToMx } from '@hbmp/engine';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long')
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional()
});

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', asyncHandler(async (req: any, res: any) => {
  const projects = await prisma.project.findMany({
    include: {
      diagrams: {
        select: {
          id: true,
          name: true,
          kind: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  res.json({ projects });
}));

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get('/:id', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      diagrams: {
        select: {
          id: true,
          name: true,
          kind: true,
          status: true,
          version: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  res.json({ project });
}));

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', asyncHandler(async (req: any, res: any) => {
  const validation = createProjectSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError('Invalid request data: ' + validation.error.issues.map(i => i.message).join(', '), 400);
  }

  const { name } = validation.data;

  const project = await prisma.project.create({
    data: { name }
  });

  res.status(201).json({ project });
}));

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const validation = updateProjectSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError('Invalid request data: ' + validation.error.issues.map(i => i.message).join(', '), 400);
  }

  const updateData = validation.data;

  // Check if project exists
  const existingProject = await prisma.project.findUnique({
    where: { id }
  });

  if (!existingProject) {
    throw createError('Project not found', 404);
  }

  const project = await prisma.project.update({
    where: { id },
    data: updateData
  });

  res.json({ project });
}));

/**
 * DELETE /api/projects/:id
 * Delete project (and all diagrams)
 */
router.delete('/:id', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  // Check if project exists
  const existingProject = await prisma.project.findUnique({
    where: { id },
    include: {
      diagrams: { select: { id: true } }
    }
  });

  if (!existingProject) {
    throw createError('Project not found', 404);
  }

  // Delete project (cascades to diagrams, audit events, exports)
  await prisma.project.delete({
    where: { id }
  });

  res.json({ 
    message: 'Project deleted successfully',
    deletedDiagrams: existingProject.diagrams.length
  });
}));

const SAMPLE_DIAGRAMS = [
  {
    projectId: 'sample-project-dashboard',
    diagramId: 'sample-diagram-dashboard',
    projectName: 'Dashboard Design',
    diagramName: 'Operations Dashboard',
    kind: 'dashboard',
    rf: {
      nodes: [
        { id: 'kpi', type: 'widget', position: { x: 40, y: 80 }, data: { label: 'Open Requests', kind: 'widget' } },
        { id: 'chart', type: 'widget', position: { x: 280, y: 80 }, data: { label: 'Throughput Chart', kind: 'widget' } },
        { id: 'table', type: 'report', position: { x: 540, y: 80 }, data: { label: 'Team Queue', kind: 'report' } },
      ],
      edges: [
        { id: 'd1', source: 'kpi', target: 'chart', label: 'trend' },
        { id: 'd2', source: 'chart', target: 'table', label: 'detail' },
      ],
    },
  },
  {
    projectId: 'sample-project-architecture',
    diagramId: 'sample-diagram-architecture',
    projectName: 'Architecture Maps',
    diagramName: 'Service Map',
    kind: 'app-arch',
    rf: {
      nodes: [
        { id: 'web', type: 'service', position: { x: 40, y: 80 }, data: { label: 'Web App', kind: 'service' } },
        { id: 'api', type: 'api', position: { x: 280, y: 80 }, data: { label: 'Orders API', kind: 'api' } },
        { id: 'db', type: 'db', position: { x: 540, y: 80 }, data: { label: 'Orders DB', kind: 'db' } },
      ],
      edges: [
        { id: 'a1', source: 'web', target: 'api', label: 'https' },
        { id: 'a2', source: 'api', target: 'db', label: 'sql' },
      ],
    },
  },
];

/**
 * POST /api/projects/ensure-samples
 * Create dashboard and architecture diagrams when those kinds are missing.
 */
router.post('/ensure-samples', asyncHandler(async (_req: any, res: any) => {
  const created: string[] = [];

  for (const sample of SAMPLE_DIAGRAMS) {
    const existing = await prisma.diagram.findUnique({ where: { id: sample.diagramId } });
    if (existing) continue;

    await prisma.project.upsert({
      where: { id: sample.projectId },
      update: {},
      create: { id: sample.projectId, name: sample.projectName },
    });
    await prisma.diagram.create({
      data: {
        id: sample.diagramId,
        projectId: sample.projectId,
        name: sample.diagramName,
        kind: sample.kind,
        status: 'draft',
        rfJson: sample.rf,
        mxXml: Buffer.from(rfToMx(sample.rf as any), 'utf-8'),
        createdBy: 'ensure-samples',
      },
    });
    created.push(sample.kind);
  }

  res.json({ created });
}));

export { router as projectRoutes };