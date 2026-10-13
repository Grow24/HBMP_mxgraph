/**
 * Framer Motion Flow Animator
 * Advanced animation system that respects React Flow coordinate system and swimlane boundaries
 */

import { Node, Edge, ReactFlowInstance } from 'reactflow';
import { FlowToken } from '@/components/CSSFlowToken';
import { cameraAnimator, CameraAnimationState } from '@/lib/cameraAnimator';

export interface AnimationStep {
  nodeId: string;
  swimlaneId?: string;
  edgeId?: string;
  duration: number;
  type: 'node' | 'edge' | 'transition';
  tokenPosition: { x: number; y: number };
}

export interface FramerFlowState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  activeTokens: FlowToken[];
  currentNode?: string;
  currentSwimlane?: string;
  progress: number;
  cameraState?: CameraAnimationState;
}

export class FramerFlowAnimator {
  private reactFlowInstance: ReactFlowInstance | null = null;
  private animationSteps: AnimationStep[] = [];
  private currentStepIndex = 0;
  private onStateChange?: (state: FramerFlowState) => void;
  private animationTimeouts: NodeJS.Timeout[] = [];
  private activeTokens: FlowToken[] = [];

  setReactFlowInstance(instance: ReactFlowInstance) {
    this.reactFlowInstance = instance;
    cameraAnimator.setReactFlowInstance(instance);
  }

  setStateChangeCallback(callback: (state: FramerFlowState) => void) {
    this.onStateChange = callback;
  }

  /**
   * Generate animation path that respects swimlane boundaries
   */
  generateAnimationPath(nodes: Node[], edges: Edge[]): AnimationStep[] {
    const steps: AnimationStep[] = [];
    
    // Find start node (first event node or first node)
    let startNode = nodes.find(n => 
      n.type === 'event' && 
      (n.data?.label?.toLowerCase().includes('start') || 
       n.data?.label?.toLowerCase().includes('received'))
    );
    
    if (!startNode) {
      startNode = nodes.find(n => n.type !== 'lane');
    }
    
    if (!startNode) return steps;

    const visitedNodes = new Set<string>();
    const queue = [{ nodeId: startNode.id, path: [startNode.id] }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visitedNodes.has(current.nodeId)) continue;
      visitedNodes.add(current.nodeId);

      const node = nodes.find(n => n.id === current.nodeId);
      if (!node || node.type === 'lane') continue;

      // Calculate token position relative to the node center
      const tokenPosition = this.getNodeCenterPosition(node);

      // Add node step
      steps.push({
        nodeId: current.nodeId,
        swimlaneId: node.parentNode || node.data?.laneId,
        duration: 1500,
        type: 'node',
        tokenPosition
      });

      // Find outgoing edges
      const outgoingEdges = edges.filter(e => e.source === current.nodeId);
      
      for (const edge of outgoingEdges) {
        if (edge.target && !visitedNodes.has(edge.target)) {
          const targetNode = nodes.find(n => n.id === edge.target);
          if (targetNode && targetNode.type !== 'lane') {
            
            // Add edge transition step
            const targetPosition = this.getNodeCenterPosition(targetNode);
            steps.push({
              nodeId: current.nodeId,
              edgeId: edge.id,
              duration: 800,
              type: 'edge',
              tokenPosition: targetPosition
            });

            queue.push({
              nodeId: edge.target,
              path: [...current.path, edge.target]
            });
          }
        }
      }

      // Stop at end nodes
      if (node.type === 'event' && 
          (node.data?.label?.toLowerCase().includes('end') || 
           node.data?.label?.toLowerCase().includes('complete'))) {
        break;
      }
    }

    console.log(`🎬 Generated ${steps.length} animation steps`);
    return steps;
  }

  /**
   * Get node center position in React Flow coordinates
   */
  private getNodeCenterPosition(node: Node): { x: number; y: number } {
    // Get the parent swimlane if exists
    const parentOffset = node.parentNode ? { x: 0, y: 0 } : { x: 0, y: 0 };
    
    return {
      x: node.position.x + parentOffset.x + 50, // Node width/2
      y: node.position.y + parentOffset.y + 25  // Node height/2
    };
  }

  /**
   * Start the Framer Motion animation with camera focus
   */
  async startAnimation(nodes: Node[], edges: Edge[]) {
    console.log('🚀 Starting Enhanced Flow Animation with Camera Focus');
    this.stopAnimation();
    
    this.animationSteps = this.generateAnimationPath(nodes, edges);
    this.currentStepIndex = 0;
    this.activeTokens = [];

    if (this.animationSteps.length === 0) {
      console.warn('❌ No animation steps generated');
      return;
    }

    console.log('✅ Generated', this.animationSteps.length, 'animation steps');

    // Create initial token
    const firstStep = this.animationSteps[0];
    const initialToken: FlowToken = {
      id: 'flow-token-1',
      position: firstStep.tokenPosition,
      targetPosition: firstStep.tokenPosition,
      nodeId: firstStep.nodeId,
      swimlaneId: firstStep.swimlaneId,
      isActive: true
    };

    this.activeTokens = [initialToken];
    console.log('🎯 Created initial token at position:', firstStep.tokenPosition);

    // Start camera animation in parallel
    cameraAnimator.setStateChangeCallback((cameraState) => {
      this.updateState({
        isRunning: this.isRunning(),
        currentStep: this.currentStepIndex,
        totalSteps: this.animationSteps.length,
        activeTokens: this.activeTokens,
        currentNode: this.animationSteps[this.currentStepIndex]?.nodeId,
        currentSwimlane: this.animationSteps[this.currentStepIndex]?.swimlaneId,
        progress: ((this.currentStepIndex + 1) / this.animationSteps.length) * 100,
        cameraState
      });
    });

    this.updateState({
      isRunning: true,
      currentStep: 0,
      totalSteps: this.animationSteps.length,
      activeTokens: this.activeTokens,
      currentNode: firstStep.nodeId,
      currentSwimlane: firstStep.swimlaneId,
      progress: 0
    });

    // Start both animations
    await Promise.all([
      this.executeAnimationSequence(),
      cameraAnimator.startCameraAnimation(nodes, edges)
    ]);
  }

  /**
   * Execute the animation sequence
   */
  private async executeAnimationSequence() {
    for (let i = 0; i < this.animationSteps.length; i++) {
      if (!this.isRunning()) break;

      const step = this.animationSteps[i];
      this.currentStepIndex = i;

      // Update token position
      if (this.activeTokens.length > 0) {
        this.activeTokens[0].targetPosition = step.tokenPosition;
        this.activeTokens[0].nodeId = step.nodeId;
        this.activeTokens[0].swimlaneId = step.swimlaneId;
      }

      this.updateState({
        isRunning: true,
        currentStep: i,
        totalSteps: this.animationSteps.length,
        activeTokens: [...this.activeTokens],
        currentNode: step.nodeId,
        currentSwimlane: step.swimlaneId,
        progress: ((i + 1) / this.animationSteps.length) * 100
      });

      // Highlight current node
      this.highlightNode(step.nodeId, step.type);

      // Wait for step duration
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, step.duration);
        this.animationTimeouts.push(timeout);
      });

      // Remove highlight
      this.removeHighlight(step.nodeId);
    }

    this.completeAnimation();
  }

  /**
   * Highlight node, swimlane, and connectors with CSS classes
   */
  private highlightNode(nodeId: string, type: 'node' | 'edge' | 'transition') {
    const element = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement;
    
    if (element) {
      element.classList.remove('flow-highlight', 'flow-processing', 'flow-complete');
      
      switch (type) {
        case 'node':
          element.classList.add('flow-processing');
          this.highlightSwimlane(nodeId);
          this.highlightConnectors(nodeId);
          break;
        case 'edge':
          element.classList.add('flow-highlight');
          break;
        case 'transition':
          element.classList.add('flow-complete');
          break;
      }
    }
  }

  /**
   * Highlight the swimlane containing the active node
   */
  private highlightSwimlane(nodeId: string) {
    const step = this.animationSteps[this.currentStepIndex];
    if (step?.swimlaneId) {
      const swimlane = document.querySelector(`[data-id="${step.swimlaneId}"]`) as HTMLElement;
      if (swimlane) {
        swimlane.classList.add('swimlane-active');
        setTimeout(() => {
          swimlane.classList.remove('swimlane-active');
        }, 1500);
      }
    }
  }

  /**
   * Highlight connectors (edges) related to the active node
   */
  private highlightConnectors(nodeId: string) {
    // Find all edges connected to this node
    const connectedEdges = document.querySelectorAll(
      `[data-testid="rf__edge"][data-source="${nodeId}"], [data-testid="rf__edge"][data-target="${nodeId}"]`
    );
    
    connectedEdges.forEach(edge => {
      const edgeElement = edge as HTMLElement;
      edgeElement.classList.add('connector-highlight');
      
      // Remove highlight after animation
      setTimeout(() => {
        edgeElement.classList.remove('connector-highlight');
      }, 1200);
    });
  }

  /**
   * Remove highlight from node and related elements
   */
  private removeHighlight(nodeId: string) {
    const element = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement;
    
    if (element) {
      setTimeout(() => {
        element.classList.remove('flow-highlight', 'flow-processing', 'flow-complete');
      }, 300);
    }
    
    // Clean up any remaining highlights
    setTimeout(() => {
      document.querySelectorAll('.swimlane-active, .connector-highlight')
        .forEach(el => {
          el.classList.remove('swimlane-active', 'connector-highlight');
        });
    }, 1500);
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    // Clear all timeouts
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.animationTimeouts = [];

    // Stop camera animation
    cameraAnimator.stopAnimation();

    // Remove all highlights
    document.querySelectorAll('.flow-highlight, .flow-processing, .flow-complete')
      .forEach(el => {
        el.classList.remove('flow-highlight', 'flow-processing', 'flow-complete');
      });

    this.activeTokens = [];

    this.updateState({
      isRunning: false,
      currentStep: 0,
      totalSteps: 0,
      activeTokens: [],
      progress: 0
    });
  }

  /**
   * Complete animation
   */
  private completeAnimation() {
    // Remove all highlights
    document.querySelectorAll('.flow-highlight, .flow-processing, .flow-complete')
      .forEach(el => {
        el.classList.remove('flow-highlight', 'flow-processing', 'flow-complete');
      });

    this.updateState({
      isRunning: false,
      currentStep: this.animationSteps.length,
      totalSteps: this.animationSteps.length,
      activeTokens: [],
      progress: 100
    });

    // Reset after delay
    setTimeout(() => {
      this.updateState({
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
        activeTokens: [],
        progress: 0
      });
    }, 2000);
  }

  /**
   * Check if animation is running
   */
  private isRunning(): boolean {
    return this.animationTimeouts.length > 0;
  }

  /**
   * Update state and notify callback
   */
  private updateState(partialState: Partial<FramerFlowState>) {
    if (this.onStateChange) {
      const currentState: FramerFlowState = {
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
        activeTokens: [],
        progress: 0,
        ...partialState
      };
      this.onStateChange(currentState);
    }
  }

  /**
   * Get current active tokens for rendering
   */
  getActiveTokens(): FlowToken[] {
    return [...this.activeTokens];
  }
}

// Export singleton instance
export const framerFlowAnimator = new FramerFlowAnimator();