import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Save network node positions
 */
router.post('/positions', async (req, res) => {
  try {
    const { diagramId, positions } = req.body;

    if (!diagramId || !Array.isArray(positions)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Upsert positions
    const operations = positions.map((pos: any) =>
      prisma.nodePositionNetwork.upsert({
        where: {
          diagramId_nodeId: {
            diagramId,
            nodeId: pos.nodeId,
          },
        },
        update: {
          x: pos.x,
          y: pos.y,
          fx: pos.fx,
          fy: pos.fy,
          isPinned: pos.isPinned || false,
          degree: pos.degree || 0,
          influenceScore: pos.influenceScore || 0,
        },
        create: {
          diagramId,
          nodeId: pos.nodeId,
          x: pos.x,
          y: pos.y,
          fx: pos.fx,
          fy: pos.fy,
          isPinned: pos.isPinned || false,
          degree: pos.degree || 0,
          influenceScore: pos.influenceScore || 0,
        },
      })
    );

    await prisma.$transaction(operations);

    res.json({ success: true, count: positions.length });
  } catch (error) {
    console.error('Error saving network positions:', error);
    res.status(500).json({ error: 'Failed to save positions' });
  }
});

/**
 * Get network node positions
 */
router.get('/positions/:diagramId', async (req, res) => {
  try {
    const { diagramId } = req.params;

    const positions = await prisma.nodePositionNetwork.findMany({
      where: { diagramId },
    });

    res.json({ positions });
  } catch (error) {
    console.error('Error fetching network positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

/**
 * Save cluster memberships
 */
router.post('/clusters', async (req, res) => {
  try {
    const { diagramId, clusters } = req.body;

    if (!diagramId || !Array.isArray(clusters)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Delete existing clusters for this diagram
    await prisma.clusterMembership.deleteMany({
      where: { diagramId },
    });

    // Insert new clusters
    const operations = clusters.flatMap((cluster: any) =>
      cluster.nodeIds.map((nodeId: string) =>
        prisma.clusterMembership.create({
          data: {
            diagramId,
            nodeId,
            clusterId: cluster.id,
            clusterSize: cluster.size,
            density: cluster.density,
          },
        })
      )
    );

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    res.json({ success: true, clusterCount: clusters.length });
  } catch (error) {
    console.error('Error saving clusters:', error);
    res.status(500).json({ error: 'Failed to save clusters' });
  }
});

/**
 * Get cluster memberships
 */
router.get('/clusters/:diagramId', async (req, res) => {
  try {
    const { diagramId } = req.params;

    const memberships = await prisma.clusterMembership.findMany({
      where: { diagramId },
    });

    // Group by cluster
    const clusters = memberships.reduce((acc: any, m) => {
      if (!acc[m.clusterId]) {
        acc[m.clusterId] = {
          id: m.clusterId,
          nodeIds: [],
          size: m.clusterSize,
          density: m.density,
        };
      }
      acc[m.clusterId].nodeIds.push(m.nodeId);
      return acc;
    }, {});

    res.json({ clusters: Object.values(clusters) });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

/**
 * Save analysis session
 */
router.post('/analysis', async (req, res) => {
  try {
    const { diagramId, analysisType, results, metrics, duration } = req.body;

    if (!diagramId || !analysisType || !results) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const session = await prisma.networkAnalysisSession.create({
      data: {
        diagramId,
        analysisType,
        results,
        metrics,
        duration: duration || 0,
      },
    });

    res.json({ sessionId: session.id, success: true });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
});

/**
 * Get analysis history
 */
router.get('/analysis/:diagramId', async (req, res) => {
  try {
    const { diagramId } = req.params;
    const { limit = 10 } = req.query;

    const sessions = await prisma.networkAnalysisSession.findMany({
      where: { diagramId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

/**
 * Save simulation config
 */
router.post('/simulation-config', async (req, res) => {
  try {
    const { diagramId, repulsion, gravity, linkStrength, collisionRadius } = req.body;

    if (!diagramId) {
      return res.status(400).json({ error: 'diagramId is required' });
    }

    const config = await prisma.simulationConfig.upsert({
      where: { diagramId },
      update: {
        repulsion: repulsion ?? -300,
        gravity: gravity ?? 0.1,
        linkStrength: linkStrength ?? 0.5,
        collisionRadius: collisionRadius ?? 50,
      },
      create: {
        diagramId,
        repulsion: repulsion ?? -300,
        gravity: gravity ?? 0.1,
        linkStrength: linkStrength ?? 0.5,
        collisionRadius: collisionRadius ?? 50,
      },
    });

    res.json({ config, success: true });
  } catch (error) {
    console.error('Error saving simulation config:', error);
    res.status(500).json({ error: 'Failed to save simulation config' });
  }
});

/**
 * Get simulation config
 */
router.get('/simulation-config/:diagramId', async (req, res) => {
  try {
    const { diagramId } = req.params;

    const config = await prisma.simulationConfig.findUnique({
      where: { diagramId },
    });

    if (!config) {
      // Return default config
      return res.json({
        config: {
          repulsion: -300,
          gravity: 0.1,
          linkStrength: 0.5,
          collisionRadius: 50,
        },
      });
    }

    res.json({ config });
  } catch (error) {
    console.error('Error fetching simulation config:', error);
    res.status(500).json({ error: 'Failed to fetch simulation config' });
  }
});

/**
 * Validate network graph
 */
router.post('/validate', async (req, res) => {
  try {
    const { graph } = req.body;

    if (!graph || !graph.nodes || !graph.edges) {
      return res.status(400).json({ error: 'Invalid graph structure' });
    }

    // Basic validation
    const issues: any[] = [];

    // Check for orphaned nodes
    const connectedNodes = new Set<string>();
    graph.edges.forEach((e: any) => {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    });

    const orphanedNodes = graph.nodes.filter(
      (n: any) => !connectedNodes.has(n.id)
    );

    if (orphanedNodes.length > 0) {
      issues.push({
        level: 'warn',
        code: 'ORPHANED_NODES',
        message: `${orphanedNodes.length} orphaned node(s) found`,
        nodeIds: orphanedNodes.map((n: any) => n.id),
      });
    }

    // Check for invalid edges
    const nodeIds = new Set(graph.nodes.map((n: any) => n.id));
    const invalidEdges = graph.edges.filter(
      (e: any) => !nodeIds.has(e.source) || !nodeIds.has(e.target)
    );

    if (invalidEdges.length > 0) {
      issues.push({
        level: 'error',
        code: 'INVALID_EDGES',
        message: `${invalidEdges.length} edge(s) reference non-existent nodes`,
        edgeIds: invalidEdges.map((e: any) => e.id),
      });
    }

    res.json({
      valid: issues.filter((i) => i.level === 'error').length === 0,
      issues,
    });
  } catch (error) {
    console.error('Error validating network:', error);
    res.status(500).json({ error: 'Failed to validate network' });
  }
});

export default router;
