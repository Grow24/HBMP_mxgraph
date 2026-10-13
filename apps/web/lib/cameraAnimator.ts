/**
 * Framer Motion Camera Animator
 * Handles zooming and focusing on elements during flow animation using Framer Motion
 */

import { Node, Edge, ReactFlowInstance } from 'reactflow';

// Professional animation engine (no dependencies)
const animate = (
  from: Record<string, number>,
  to: Record<string, number>,
  options: {
    duration: number;
    ease: string;
    onUpdate: (values: Record<string, number>) => void;
    onComplete: () => void;
  }
) => {
  const startTime = performance.now();
  const keys = Object.keys(from);
  
  const animationFrame = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / (options.duration * 1000), 1);
    
    // Professional easing function (easeInOut)
    const easedProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    const currentValues: Record<string, number> = {};
    keys.forEach(key => {
      currentValues[key] = from[key] + (to[key] - from[key]) * easedProgress;
    });
    
    options.onUpdate(currentValues);
    
    if (progress < 1) {
      const id = requestAnimationFrame(animationFrame);
      return { stop: () => cancelAnimationFrame(id) };
    } else {
      options.onComplete();
      return { stop: () => {} };
    }
  };
  
  const id = requestAnimationFrame(animationFrame);
  return { stop: () => cancelAnimationFrame(id) };
};

export interface CameraAnimationStep {
  nodeId: string;
  swimlaneId?: string;
  zoom: number;
  duration: number;
  focusPosition: { x: number; y: number };
}

export interface CameraAnimationState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  currentFocus?: string;
  currentZoom: number;
}

export class CameraAnimator {
  private reactFlowInstance: ReactFlowInstance | null = null;
  private animationSteps: CameraAnimationStep[] = [];
  private onStateChange?: (state: CameraAnimationState) => void;
  private currentAnimation?: () => void;

  setReactFlowInstance(instance: ReactFlowInstance) {
    this.reactFlowInstance = instance;
  }

  setStateChangeCallback(callback: (state: CameraAnimationState) => void) {
    this.onStateChange = callback;
  }

  /**
   * Generate camera animation path following the flow
   */
  generateCameraPath(nodes: Node[], edges: Edge[]): CameraAnimationStep[] {
    const steps: CameraAnimationStep[] = [];
    
    // Find start node
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
    const queue = [startNode.id];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      if (visitedNodes.has(currentNodeId)) continue;
      visitedNodes.add(currentNodeId);

      const node = nodes.find(n => n.id === currentNodeId);
      if (!node || node.type === 'lane') continue;

      // Calculate focus position and zoom level
      const focusPosition = this.calculateFocusPosition(node);
      const zoom = this.calculateOptimalZoom(node, nodes);

      steps.push({
        nodeId: currentNodeId,
        swimlaneId: node.parentNode || node.data?.laneId,
        zoom,
        duration: 1200,
        focusPosition
      });

      // Find next nodes
      const outgoingEdges = edges.filter(e => e.source === currentNodeId);
      for (const edge of outgoingEdges) {
        if (edge.target && !visitedNodes.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    console.log(`🎥 Generated ${steps.length} camera animation steps`);
    return steps;
  }

  /**
   * Calculate optimal focus position for a node
   */
  private calculateFocusPosition(node: Node): { x: number; y: number } {
    // Get absolute position (including parent offset)
    let x = node.position.x + 60; // Node center
    let y = node.position.y + 30;

    // If node has a parent (swimlane), add parent position
    if (node.parentNode) {
      // Position is already relative to parent in React Flow
      // Just use the node's position as-is
    }

    return { x, y };
  }

  /**
   * Calculate optimal zoom level based on context
   */
  private calculateOptimalZoom(node: Node, allNodes: Node[]): number {
    // Base zoom levels
    const swimlaneZoom = 0.8;  // Show full swimlane context
    const nodeZoom = 1.2;      // Focus on individual node
    const detailZoom = 1.5;    // Close-up for important nodes

    // Zoom based on node type and context
    if (node.type === 'event') {
      return detailZoom; // Events are important
    } else if (node.type === 'gateway') {
      return nodeZoom; // Gateways need clear visibility
    } else {
      return swimlaneZoom; // Show context for process tasks
    }
  }

  /**
   * Start camera animation sequence
   */
  async startCameraAnimation(nodes: Node[], edges: Edge[]) {
    if (!this.reactFlowInstance) {
      console.warn('ReactFlow instance not set');
      return;
    }

    this.stopAnimation();
    this.animationSteps = this.generateCameraPath(nodes, edges);

    if (this.animationSteps.length === 0) {
      console.warn('No camera animation steps generated');
      return;
    }

    console.log('🎬 Starting camera animation with', this.animationSteps.length, 'steps');

    this.updateState({
      isRunning: true,
      currentStep: 0,
      totalSteps: this.animationSteps.length,
      currentZoom: 1
    });

    await this.executeCameraSequence();
  }

  /**
   * Execute camera animation sequence
   */
  private async executeCameraSequence() {
    for (let i = 0; i < this.animationSteps.length; i++) {
      const step = this.animationSteps[i];
      
      this.updateState({
        isRunning: true,
        currentStep: i,
        totalSteps: this.animationSteps.length,
        currentFocus: step.nodeId,
        currentZoom: step.zoom
      });

      // Highlight current swimlane during camera focus
      this.highlightCurrentSwimlane(step);

      // Animate camera to focus position
      await this.animateToPosition(step);

      // Wait for step completion
      await new Promise(resolve => setTimeout(resolve, step.duration * 0.3));
    }

    this.completeAnimation();
  }

  /**
   * Animate camera to specific position and zoom using Framer Motion
   */
  private async animateToPosition(step: CameraAnimationStep): Promise<void> {
    if (!this.reactFlowInstance) return;

    const { focusPosition, zoom, duration } = step;

    return new Promise((resolve) => {
      // Get current viewport
      const viewport = this.reactFlowInstance!.getViewport();
      
      // Calculate target viewport
      const targetX = -focusPosition.x * zoom + window.innerWidth / 2;
      const targetY = -focusPosition.y * zoom + window.innerHeight / 2;

      // Animate viewport transformation with Framer Motion (or fallback)
      const controls = animate(
        {
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom
        },
        {
          x: targetX,
          y: targetY,
          zoom: zoom
        },
        {
          duration: duration / 1000,
          ease: "easeInOut",
          onUpdate: (values) => {
            this.reactFlowInstance!.setViewport({
              x: values.x,
              y: values.y,
              zoom: values.zoom
            });
          },
          onComplete: () => {
            resolve();
          }
        }
      );

      this.currentAnimation = controls.stop;
    });
  }

  /**
   * Stop camera animation
   */
  stopAnimation() {
    if (this.currentAnimation) {
      this.currentAnimation();
      this.currentAnimation = undefined;
    }

    this.updateState({
      isRunning: false,
      currentStep: 0,
      totalSteps: 0,
      currentZoom: 1
    });
  }

  /**
   * Complete animation sequence
   */
  private completeAnimation() {
    console.log('🎊 Camera animation complete');
    
    this.updateState({
      isRunning: false,
      currentStep: this.animationSteps.length,
      totalSteps: this.animationSteps.length,
      currentZoom: 1
    });

    // Reset to fit view after delay
    setTimeout(() => {
      if (this.reactFlowInstance) {
        this.reactFlowInstance.fitView({ duration: 800 });
      }
      
      this.updateState({
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
        currentZoom: 1
      });
    }, 2000);
  }

  /**
   * Highlight the current swimlane during camera focus
   */
  private highlightCurrentSwimlane(step: CameraAnimationStep) {
    if (step.swimlaneId) {
      const swimlane = document.querySelector(`[data-id="${step.swimlaneId}"]`) as HTMLElement;
      if (swimlane) {
        swimlane.classList.add('camera-focus-swimlane');
        setTimeout(() => {
          swimlane.classList.remove('camera-focus-swimlane');
        }, step.duration);
      }
    }
  }

  /**
   * Update state and notify callback
   */
  private updateState(partialState: Partial<CameraAnimationState>) {
    if (this.onStateChange) {
      const currentState: CameraAnimationState = {
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
        currentZoom: 1,
        ...partialState
      };
      this.onStateChange(currentState);
    }
  }
}

// Export singleton instance
export const cameraAnimator = new CameraAnimator();