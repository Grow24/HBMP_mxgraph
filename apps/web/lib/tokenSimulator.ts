/**
 * Token Animation System
 * Visualizes data/control flow along diagram paths (BPMN-style token simulation)
 */

import { Node, Edge } from 'reactflow';

export interface SimulationStep {
  nodeId: string;
  edgeId?: string;
  timestamp: number;
  data?: any;
  status: 'waiting' | 'processing' | 'completed' | 'error';
}

export interface TokenAnimationState {
  isRunning: boolean;
  currentStep: number;
  steps: SimulationStep[];
  activeNodeId?: string;
  activeEdgeId?: string;
  tokenPosition?: { x: number; y: number };
}

export class TokenSimulator {
  private state: TokenAnimationState;
  private intervalId?: NodeJS.Timeout;
  private onUpdate?: (state: TokenAnimationState) => void;

  constructor() {
    this.state = {
      isRunning: false,
      currentStep: 0,
      steps: []
    };
  }

  /**
   * Generate simulation path from diagram
   */
  public generateSimulationPath(nodes: Node[], edges: Edge[]): SimulationStep[] {
    console.log('🎬 Generating simulation path...');

    // Find start and end nodes
    const startNodes = nodes.filter(n => 
      n.type === 'event' && 
      n.data?.label?.toLowerCase().includes('start')
    );
    
    const endNodes = nodes.filter(n => 
      n.type === 'event' && 
      n.data?.label?.toLowerCase().includes('end')
    );

    if (startNodes.length === 0) {
      console.warn('No start node found, using first node');
      startNodes.push(nodes[0]);
    }

    const steps: SimulationStep[] = [];
    const visitedNodes = new Set<string>();
    
    // Breadth-first traversal from start node(s)
    const queue = startNodes.map(node => ({ nodeId: node.id, path: [node.id] }));
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visitedNodes.has(current.nodeId)) continue;
      visitedNodes.add(current.nodeId);

      // Add this node as a step
      steps.push({
        nodeId: current.nodeId,
        timestamp: Date.now() + (steps.length * 1000),
        status: 'waiting'
      });

      // Find outgoing edges
      const outgoingEdges = edges.filter(e => e.source === current.nodeId);
      
      for (const edge of outgoingEdges) {
        if (edge.target && !visitedNodes.has(edge.target)) {
          // Add edge step (for animation between nodes)
          steps.push({
            nodeId: current.nodeId,
            edgeId: edge.id,
            timestamp: Date.now() + (steps.length * 1000),
            status: 'waiting'
          });
          
          queue.push({
            nodeId: edge.target,
            path: [...current.path, edge.target]
          });
        }
      }

      // Stop if we reach an end node
      if (endNodes.some(n => n.id === current.nodeId)) {
        break;
      }
    }

    console.log(`✅ Generated ${steps.length} simulation steps`);
    return steps;
  }

  /**
   * Start token animation
   */
  public startSimulation(
    nodes: Node[], 
    edges: Edge[], 
    onUpdate: (state: TokenAnimationState) => void,
    speed: number = 1500 // ms per step
  ): void {
    if (this.state.isRunning) {
      this.stopSimulation();
    }

    console.log('▶️ Starting token simulation...');
    
    const steps = this.generateSimulationPath(nodes, edges);
    
    this.state = {
      isRunning: true,
      currentStep: 0,
      steps,
      activeNodeId: steps[0]?.nodeId,
      activeEdgeId: undefined
    };

    this.onUpdate = onUpdate;
    onUpdate(this.state);

    // Animate through steps
    this.intervalId = setInterval(() => {
      this.nextStep();
    }, speed);
  }

  /**
   * Advance to next simulation step
   */
  private nextStep(): void {
    if (!this.state.isRunning || this.state.currentStep >= this.state.steps.length - 1) {
      this.stopSimulation();
      return;
    }

    this.state.currentStep++;
    const currentStep = this.state.steps[this.state.currentStep];
    
    // Update current step status
    this.state.steps[this.state.currentStep - 1].status = 'completed';
    currentStep.status = 'processing';

    // Update active elements
    this.state.activeNodeId = currentStep.nodeId;
    this.state.activeEdgeId = currentStep.edgeId;

    console.log(`🎯 Step ${this.state.currentStep}: Node ${currentStep.nodeId}${currentStep.edgeId ? ` → Edge ${currentStep.edgeId}` : ''}`);
    
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
  }

  /**
   * Stop simulation
   */
  public stopSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.state.isRunning = false;
    this.state.activeNodeId = undefined;
    this.state.activeEdgeId = undefined;

    console.log('⏹️ Token simulation stopped');
    
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
  }

  /**
   * Pause/resume simulation
   */
  public togglePause(): void {
    if (this.intervalId) {
      this.stopSimulation();
    } else if (this.state.steps.length > 0) {
      // Resume from current step
      this.intervalId = setInterval(() => {
        this.nextStep();
      }, 1500);
      this.state.isRunning = true;
    }
  }

  /**
   * Reset simulation to beginning
   */
  public resetSimulation(): void {
    this.stopSimulation();
    this.state.currentStep = 0;
    this.state.steps.forEach(step => {
      step.status = 'waiting';
    });
    
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
  }

  /**
   * Get current simulation state
   */
  public getState(): TokenAnimationState {
    return { ...this.state };
  }

  /**
   * Manual step control
   */
  public stepForward(): void {
    if (!this.state.isRunning) {
      this.nextStep();
    }
  }

  public stepBackward(): void {
    if (this.state.currentStep > 0) {
      this.state.currentStep--;
      const currentStep = this.state.steps[this.state.currentStep];
      
      this.state.activeNodeId = currentStep.nodeId;
      this.state.activeEdgeId = currentStep.edgeId;
      
      if (this.onUpdate) {
        this.onUpdate(this.state);
      }
    }
  }
}

// Singleton instance
export const tokenSimulator = new TokenSimulator();