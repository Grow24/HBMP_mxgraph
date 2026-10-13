import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';
import { renderDiagram } from '../services/diagramRender';

const router = Router();
const prisma = new PrismaClient();
const logger = createLogger();

/**
 * POST /api/exports/:diagramId
 * Create export artifact
 */
router.post('/:diagramId', asyncHandler(async (req: any, res: any) => {
  const { diagramId } = req.params;
  const { format } = req.body;

  if (!['svg', 'png', 'pdf'].includes(format)) {
    throw createError('Invalid format. Must be svg, png, or pdf', 400);
  }

  // Check if diagram exists
  const diagram = await prisma.diagram.findUnique({
    where: { id: diagramId }
  });

  if (!diagram) {
    throw createError('Diagram not found', 404);
  }

  const bytes = renderDiagram(format, diagram.rfJson as any, diagram.name);

  const exportArtifact = await prisma.exportArtifact.create({
    data: {
      diagramId,
      kind: format,
      contentType: getContentType(format),
      bytes
    }
  });

  // Log audit event
  await prisma.auditEvent.create({
    data: {
      diagramId,
      actor: req.headers['x-user-id'] || 'anonymous',
      action: 'export',
      payload: {
        format,
        size: bytes.length,
        artifactId: exportArtifact.id
      }
    }
  });

  logger.info(`Export created: ${exportArtifact.id} (${format}) for diagram ${diagramId}`);

  res.json({
    artifactId: exportArtifact.id,
    contentType: exportArtifact.contentType,
    size: exportArtifact.bytes.length
  });
}));

/**
 * GET /api/exports/:artifactId
 * Download export artifact
 */
router.get('/:artifactId', asyncHandler(async (req: any, res: any) => {
  const { artifactId } = req.params;

  const artifact = await prisma.exportArtifact.findUnique({
    where: { id: artifactId },
    include: {
      diagram: {
        select: { name: true }
      }
    }
  });

  if (!artifact) {
    throw createError('Export artifact not found', 404);
  }

  const filename = `${artifact.diagram.name}.${artifact.kind}`;
  const bytes = Buffer.from(artifact.bytes);

  res.set({
    'Content-Type': artifact.contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': bytes.length
  });

  res.end(bytes);
}));

/**
 * GET /api/exports/diagram/:diagramId
 * Get all exports for a diagram
 */
router.get('/diagram/:diagramId', asyncHandler(async (req: any, res: any) => {
  const { diagramId } = req.params;

  const exports = await prisma.exportArtifact.findMany({
    where: { diagramId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      kind: true,
      contentType: true,
      createdAt: true
    }
  });

  res.json({ exports });
}));

/**
 * DELETE /api/exports/:artifactId
 * Delete export artifact
 */
router.delete('/:artifactId', asyncHandler(async (req: any, res: any) => {
  const { artifactId } = req.params;

  const artifact = await prisma.exportArtifact.findUnique({
    where: { id: artifactId }
  });

  if (!artifact) {
    throw createError('Export artifact not found', 404);
  }

  await prisma.exportArtifact.delete({
    where: { id: artifactId }
  });

  logger.info(`Export artifact deleted: ${artifactId}`);

  res.json({ message: 'Export artifact deleted successfully' });
}));

/**
 * Get content type for export format
 */
function getContentType(format: string): string {
  switch (format) {
    case 'svg': return 'image/svg+xml';
    case 'png': return 'image/png';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

export { router as exportRoutes };