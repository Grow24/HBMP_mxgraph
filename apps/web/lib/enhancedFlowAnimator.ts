import { Node, Edge, ReactFlowInstance } from 'reactflow';

export interface FlowAnimationStep {
  nodeId: string;
  swimlaneId?: string;
  action: 'highlight' | 'process' | 'complete';
  duration: number;
  cameraAction?: {
    type: 'zoom' | 'pan' | 'fit';
    target?: { x: number; y: number };
    zoom?: number;
    duration: number;
  };
}

export interface FlowAnimationState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  currentNode?: string;
  currentSwimlane?: string;
  progress: number;
}

export class EnhancedFlowAnimator {
  private reactFlowInstance: ReactFlowInstance | null = null;
  private animationSteps: FlowAnimationStep[] = [];
  private currentStepIndex = 0;
  private onStateChange?: (state: FlowAnimationState) => void;
  private animationTimeouts: NodeJS.Timeout[] = [];

  setReactFlowInstance(instance: ReactFlowInstance) {
    this.reactFlowInstance = instance;
  }

  setStateChangeCallback(callback: (state: FlowAnimationState) => void) {
    this.onStateChange = callback;
  }

  generateFlowAnimation(nodes: Node[], edges: Edge[]): FlowAnimationStep[] {
    const steps: FlowAnimationStep[] = [];
    
    // Get all swimlanes and their nodes
    const swimlanes = nodes.filter(n => n.type === 'lane');
    const processNodes = nodes.filter(n => n.type !== 'lane');

    // Group nodes by swimlane
    const nodesBySwimlane = new Map<string, Node[]>();
    
    swimlanes.forEach(lane => {
      const laneNodes = processNodes.filter(n => 
        n.parentNode === lane.id || (n.data && n.data.laneId === lane.id)
      );
      nodesBySwimlane.set(lane.id, laneNodes);
    });

    // Create animation sequence
    swimlanes.forEach((swimlane, swimlaneIndex) => {
      const laneNodes = nodesBySwimlane.get(swimlane.id) || [];
      
      // First, zoom and pan to the swimlane
      if (laneNodes.length > 0) {
        steps.push({
          nodeId: swimlane.id,
          swimlaneId: swimlane.id,
          action: 'highlight',
          duration: 1000,
          cameraAction: {
            type: 'pan',
            target: { x: swimlane.position.x + 400, y: swimlane.position.y + 100 },
            zoom: 0.8,
            duration: 1000
          }
        });

        // Then animate each node in the swimlane
        laneNodes.forEach((node, nodeIndex) => {
          // Pan to node
          steps.push({
            nodeId: node.id,
            swimlaneId: swimlane.id,
            action: 'highlight',
            duration: 800,
            cameraAction: {
              type: 'pan',
              target: { x: node.position.x + swimlane.position.x + 50, y: node.position.y + swimlane.position.y + 50 },
              zoom: 1.2,
              duration: 800
            }
          });

          // Process the node
          steps.push({
            nodeId: node.id,
            swimlaneId: swimlane.id,
            action: 'process',
            duration: 1200,
          });

          // Complete the node
          steps.push({
            nodeId: node.id,
            swimlaneId: swimlane.id,
            action: 'complete',
            duration: 600,
          });

          // If there are connected edges, show the flow
          const outgoingEdges = edges.filter(e => e.source === node.id);
          outgoingEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode) {
              const targetSwimlane = swimlanes.find(s => s.id === targetNode.parentNode || targetNode.data?.laneId === s.id);
              
              // If moving to a different swimlane, zoom out and then in
              if (targetSwimlane && targetSwimlane.id !== swimlane.id) {
                steps.push({
                  nodeId: edge.id,
                  action: 'highlight',
                  duration: 1500,
                  cameraAction: {
                    type: 'fit',
                    duration: 1000
                  }
                });
              }
            }
          });
        });

        // Zoom out after completing the swimlane
        steps.push({
          nodeId: swimlane.id,
          swimlaneId: swimlane.id,
          action: 'complete',
          duration: 800,
          cameraAction: {
            type: 'zoom',
            zoom: 0.6,
            duration: 800
          }
        });
      }
    });

    // Final fit view
    steps.push({
      nodeId: 'final',
      action: 'complete',
      duration: 1000,
      cameraAction: {
        type: 'fit',
        duration: 1000
      }
    });

    return steps;
  }

  async startAnimation(nodes: Node[], edges: Edge[]) {
    if (!this.reactFlowInstance) {
      console.error('ReactFlow instance not set');
      return;
    }

    this.stopAnimation(); // Clear any existing animation
    
    this.animationSteps = this.generateFlowAnimation(nodes, edges);
    this.currentStepIndex = 0;

    this.updateState({
      isRunning: true,
      currentStep: 0,
      totalSteps: this.animationSteps.length,
      progress: 0
    });

    await this.executeNextStep();
  }

  private async executeNextStep() {
    if (this.currentStepIndex >= this.animationSteps.length) {
      this.completeAnimation();
      return;
    }

    const step = this.animationSteps[this.currentStepIndex];
    
    this.updateState({
      isRunning: true,
      currentStep: this.currentStepIndex,
      totalSteps: this.animationSteps.length,
      currentNode: step.nodeId,
      currentSwimlane: step.swimlaneId,
      progress: (this.currentStepIndex / this.animationSteps.length) * 100
    });

    // Apply visual effects to the node
    await this.applyNodeEffect(step);

    // Apply camera action if specified
    if (step.cameraAction) {
      await this.applyCameraAction(step.cameraAction);
    }

    // Wait for step duration
    const timeout = setTimeout(() => {
      this.currentStepIndex++;
      this.executeNextStep();
    }, step.duration);

    this.animationTimeouts.push(timeout);
  }

  private async applyNodeEffect(step: FlowAnimationStep) {
    const element = document.querySelector(`[data-id="${step.nodeId}"]`) as HTMLElement;
    
    if (element) {
      // Remove any existing animation classes
      element.classList.remove('flow-highlight', 'flow-process', 'flow-complete', 'flow-active-swimlane');
      
      // Add new animation class
      switch (step.action) {
        case 'highlight':
          element.classList.add('flow-highlight');
          if (step.swimlaneId) {
            element.classList.add('flow-active-swimlane');
          }
          break;
        case 'process':
          element.classList.add('flow-process');
          break;
        case 'complete':
          element.classList.add('flow-complete');
          break;
      }

      // Remove the class after a delay
      setTimeout(() => {
        element.classList.remove('flow-highlight', 'flow-process', 'flow-complete');
      }, step.duration * 0.8);
    }
  }

  private async applyCameraAction(cameraAction: FlowAnimationStep['cameraAction']) {
    if (!this.reactFlowInstance || !cameraAction) return;

    const { type, target, zoom, duration } = cameraAction;

    try {
      switch (type) {
        case 'pan':
          if (target) {
            this.reactFlowInstance.setCenter(target.x, target.y, { 
              zoom: zoom || this.reactFlowInstance.getZoom(),
              duration: duration 
            });
          }
          break;
        case 'zoom':
          if (zoom) {
            this.reactFlowInstance.zoomTo(zoom, { duration });
          }
          break;
        case 'fit':
          this.reactFlowInstance.fitView({ 
            duration: duration,
            padding: 0.2
          });
          break;
      }
    } catch (error) {
      console.warn('Camera action failed:', error);
    }

    // Wait for camera animation to complete
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, duration);
      this.animationTimeouts.push(timeout);
    });
  }

  stopAnimation() {
    // Clear all timeouts
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.animationTimeouts = [];

    // Remove all animation classes
    document.querySelectorAll('.flow-highlight, .flow-process, .flow-complete, .flow-active-swimlane')
      .forEach(el => {
        el.classList.remove('flow-highlight', 'flow-process', 'flow-complete', 'flow-active-swimlane');
      });

    this.updateState({
      isRunning: false,
      currentStep: 0,
      totalSteps: 0,
      progress: 0
    });
  }

  private completeAnimation() {
    // Remove all animation classes
    document.querySelectorAll('.flow-highlight, .flow-process, .flow-complete, .flow-active-swimlane')
      .forEach(el => {
        el.classList.remove('flow-highlight', 'flow-process', 'flow-complete', 'flow-active-swimlane');
      });

    this.updateState({
      isRunning: false,
      currentStep: this.animationSteps.length,
      totalSteps: this.animationSteps.length,
      progress: 100
    });

    // Reset progress after a moment
    setTimeout(() => {
      this.updateState({
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
        progress: 0
      });
    }, 2000);
  }

  private updateState(partialState: Partial<FlowAnimationState>) {
    if (this.onStateChange) {
      const currentState: FlowAnimationState = {
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
        progress: 0,
        ...partialState
      };
      this.onStateChange(currentState);
    }
  }
}

// Export singleton instance
export const enhancedFlowAnimator = new EnhancedFlowAnimator();