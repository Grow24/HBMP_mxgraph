import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { FlowAdapter } from '@hbmp/engine';
import { FlowExecutionResponse } from '@hbmp/shared-types';

const router = Router();
const prisma = new PrismaClient();

/**
 * Execute a flow
 */
router.post('/api/flows/:diagramId/execute', async (req, res) => {
  try {
    const { diagramId } = req.params;
    const inputData = req.body?.inputData ?? {};

    // Get diagram
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId }
    });

    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found' });
    }

    // Convert HBMP format to Salesforce flow format
    const hbmpFlow = diagram.rfJson as any;
    const salesforceFlow = FlowAdapter.hbmpToSalesforce(hbmpFlow);

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution = await prisma.flowExecution.create({
      data: {
        diagramId,
        executionId,
        status: 'running',
        inputData,
        logs: []
      }
    });

    // Simulate flow execution (replace with actual execution engine)
    const startTime = Date.now();
    const logs: string[] = [
      'Flow execution started',
      `Processing ${salesforceFlow.nodes.length} nodes`,
      'Validating flow structure',
      'Executing nodes sequentially'
    ];

    // Simple execution simulation
    let outputData = { ...inputData };
    for (const node of salesforceFlow.nodes) {
      logs.push(`Executing node: ${node.data?.label || node.id}`);
      
      if (node.type === 'decision') {
        outputData.lastDecision = node.data.label;
      } else if (node.type === 'action') {
        outputData.lastAction = node.data.label;
      }
    }

    const duration = Date.now() - startTime;
    logs.push(`Flow completed in ${duration}ms`);

    // Update execution record
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        outputData,
        logs,
        duration
      }
    });

    const response: FlowExecutionResponse = {
      executionId,
      status: 'completed',
      logs,
      outputData,
      duration
    };

    res.json(response);
  } catch (error) {
    console.error('Flow execution failed:', error);
    res.status(500).json({ error: 'Flow execution failed' });
  }
});

/**
 * Get flow execution history
 */
router.get('/api/flows/:diagramId/executions', async (req, res) => {
  try {
    const { diagramId } = req.params;
    
    const executions = await prisma.flowExecution.findMany({
      where: { diagramId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(executions);
  } catch (error) {
    console.error('Failed to get executions:', error);
    res.status(500).json({ error: 'Failed to get executions' });
  }
});

export default router;