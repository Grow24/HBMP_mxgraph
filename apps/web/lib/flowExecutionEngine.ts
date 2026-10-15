import { Node, Edge } from 'reactflow';

export type FlowExecutionStep = {
  nodeId: string;
  nodeType: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  timestamp: number;
};

export type FlowExecutionState = {
  isRunning: boolean;
  currentStep: number;
  steps: FlowExecutionStep[];
  variables: Record<string, any>;
  logs: string[];
};

export class FlowExecutionEngine {
  private state: FlowExecutionState = {
    isRunning: false,
    currentStep: 0,
    steps: [],
    variables: {},
    logs: []
  };

  private stateCallback?: (state: FlowExecutionState) => void;
  private visited = new Set<string>();

  setStateCallback(callback: (state: FlowExecutionState) => void) {
    this.stateCallback = callback;
  }

  private updateState(updates: Partial<FlowExecutionState>) {
    this.state = { ...this.state, ...updates };
    this.stateCallback?.(this.state);
  }

  async executeFlow(nodes: Node[], edges: Edge[], inputData: Record<string, any> = {}) {
    const startNodes = this.findStartNodes(nodes, edges);
    if (startNodes.length === 0) {
      this.updateState({
        isRunning: false,
        currentStep: 0,
        steps: [{
          nodeId: 'none',
          nodeType: 'none',
          label: 'No shape to run',
          status: 'error',
          error: 'Add a shape on the canvas, then click Execute Flow again.',
          timestamp: Date.now()
        }],
        variables: { ...inputData },
        logs: ['Execute Flow found no shape to run']
      });
      return;
    }

    this.visited = new Set();
    this.updateState({
      isRunning: true,
      currentStep: 0,
      steps: [],
      variables: { ...inputData },
      logs: ['Flow execution started']
    });

    try {
      for (const startNode of startNodes) {
        await this.executeNode(startNode, nodes, edges);
      }
      this.updateState({ isRunning: false, logs: [...this.state.logs, 'Flow execution completed'] });
    } catch (error) {
      this.updateState({ 
        isRunning: false, 
        logs: [...this.state.logs, `Flow execution failed: ${error}`] 
      });
      throw error;
    }
  }

  private findStartNodes(nodes: Node[], edges: Edge[]): Node[] {
    const runnable = nodes.filter((node) => node.type !== 'lane');
    const flowStarts = runnable.filter((node) => node.type === 'flowStart');
    if (flowStarts.length > 0) return flowStarts;

    const namedStarts = runnable.filter((node) => {
      const label = String(node.data?.label || '').toLowerCase();
      return node.type === 'event' && label.includes('start');
    });
    if (namedStarts.length > 0) return namedStarts;

    const incoming = new Set(edges.map((edge) => edge.target));
    const roots = runnable.filter((node) => !incoming.has(node.id));
    const connectedRoots = roots.filter((node) => edges.some((edge) => edge.source === node.id));
    if (connectedRoots.length > 0) return connectedRoots;
    if (roots.length > 0) return roots;
    return runnable.slice(0, 1);
  }

  private async executeNode(node: Node, nodes: Node[], edges: Edge[]) {
    if (this.visited.has(node.id)) return;
    this.visited.add(node.id);

    const step: FlowExecutionStep = {
      nodeId: node.id,
      nodeType: node.type || 'unknown',
      label: node.data.label || 'Unnamed',
      status: 'running',
      timestamp: Date.now()
    };

    this.updateState({ 
      steps: [...this.state.steps, step],
      currentStep: this.state.steps.length,
      logs: [...this.state.logs, `Executing: ${step.label}`]
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const result = await this.executeNodeLogic(node);
      step.status = 'success';
      step.result = result;
      
      this.updateState({ 
        steps: this.state.steps.map(s => s.nodeId === node.id ? step : s),
        logs: [...this.state.logs, `✓ ${step.label} completed`]
      });

      const nextNodes = this.getNextNodes(node, edges, nodes, result);
      for (const nextNode of nextNodes) {
        await this.executeNode(nextNode, nodes, edges);
      }
    } catch (error) {
      step.status = 'error';
      step.error = String(error);
      this.updateState({ 
        steps: this.state.steps.map(s => s.nodeId === node.id ? step : s),
        logs: [...this.state.logs, `✗ ${step.label} failed: ${error}`]
      });
      throw error;
    }
  }

  private async executeNodeLogic(node: Node): Promise<any> {
    switch (node.type) {
      case 'flowStart':
        return { started: true };
      
      case 'flowAction':
        const { actionType, targetObject } = node.data;
        return { 
          action: actionType, 
          object: targetObject,
          recordId: `${targetObject}-${Date.now()}`
        };
      
      case 'flowDecision':
        const { condition, operator } = node.data;
        const result = this.evaluateCondition(condition, operator);
        return { decision: result };
      
      case 'flowEnd':
        return { completed: true };
      
      default:
        return {};
    }
  }

  private evaluateCondition(condition: string, operator: string): boolean {
    return Math.random() > 0.5;
  }

  private getNextNodes(currentNode: Node, edges: Edge[], nodes: Node[], result: any): Node[] {
    const outgoingEdges = edges.filter(e => e.source === currentNode.id);
    
    if (currentNode.type === 'flowDecision' && result.decision !== undefined) {
      const targetEdge = outgoingEdges.find(e => 
        result.decision ? e.sourceHandle === 'yes' : e.sourceHandle === 'no'
      );
      if (targetEdge) {
        const nextNode = nodes.find(n => n.id === targetEdge.target);
        return nextNode ? [nextNode] : [];
      }
    }

    return outgoingEdges
      .map(e => nodes.find(n => n.id === e.target))
      .filter((n): n is Node => n !== undefined);
  }

  stopExecution() {
    this.updateState({ 
      isRunning: false,
      logs: [...this.state.logs, 'Flow execution stopped by user']
    });
  }

  getState(): FlowExecutionState {
    return this.state;
  }
}

export const flowExecutionEngine = new FlowExecutionEngine();
