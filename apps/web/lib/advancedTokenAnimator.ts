/**
 * Advanced Multi-Level Token Animation System
 * Supports swimlane-level, node-level, and connection-level animations with different colors
 */

import { Node, Edge } from 'reactflow';

export interface AnimationLevel {
  level: 'swimlane' | 'node' | 'connection';
  color: string;
  speed: number; // ms per step
  style: 'pulse' | 'flow' | 'glow' | 'bounce';
}

export interface FlowStep {
  id: string;
  type: 'swimlane' | 'node' | 'edge';
  elementId: string;
  level: AnimationLevel;
  duration: number;
  data?: any;
  description: string;
  cameraMovement?: CameraMovement;
}

export interface FlowPath {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  totalDuration: number;
}

export interface CameraMovement {
  type: 'pan' | 'zoom' | 'focus';
  target?: { x: number; y: number };
  zoom?: number;
  duration: number;
  easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

export interface AdvancedAnimationState {
  isRunning: boolean;
  currentPath?: FlowPath;
  currentStep: number;
  activeElements: {
    swimlanes: Set<string>;
    nodes: Set<string>;
    edges: Set<string>;
  };
  animationLevels: AnimationLevel[];
  progress: number; // 0-100
  cameraMovement?: CameraMovement;
}

export class AdvancedTokenAnimator {
  private state: AdvancedAnimationState;
  private intervalId?: NodeJS.Timeout;
  private onUpdate?: (state: AdvancedAnimationState) => void;

  // Predefined animation levels with colors
  private readonly ANIMATION_LEVELS: Record<string, AnimationLevel> = {
    swimlane: {
      level: 'swimlane',
      color: '#3b82f6', // Blue
      speed: 2000,
      style: 'glow'
    },
    node: {
      level: 'node', 
      color: '#10b981', // Green
      speed: 1500,
      style: 'pulse'
    },
    connection: {
      level: 'connection',
      color: '#f59e0b', // Amber
      speed: 1000,
      style: 'flow'
    },
    error: {
      level: 'node',
      color: '#ef4444', // Red
      speed: 800,
      style: 'bounce'
    },
    success: {
      level: 'node',
      color: '#22c55e', // Green
      speed: 1200,
      style: 'glow'
    }
  };

  constructor() {
    this.state = {
      isRunning: false,
      currentStep: 0,
      activeElements: {
        swimlanes: new Set(),
        nodes: new Set(),
        edges: new Set()
      },
      animationLevels: Object.values(this.ANIMATION_LEVELS),
      progress: 0
    };
  }

  /**
   * Generate sequential swimlane flow animation
   */
  public generateComplexFlowPath(nodes: Node[], edges: Edge[]): any[] {
    console.log('🎬 Generating sequential flow...');
    
    const swimlanes = nodes.filter(n => n.type === 'lane').sort((a, b) => a.position.y - b.position.y);
    const processNodes = nodes.filter(n => n.type !== 'lane');
    
    const levels: any[] = [];
    
    // Process each swimlane sequentially
    swimlanes.forEach((lane) => {
      const nodesInLane = processNodes.filter(n => 
        n.parentNode === lane.id || n.data?.laneId === lane.id
      ).sort((a, b) => a.position.x - b.position.x); // Sort left to right
      
      if (nodesInLane.length === 0) return;
      
      const sequentialSteps: any[] = [];
      
      // 1. Highlight swimlane first
      sequentialSteps.push({
        elementId: lane.id,
        elementType: 'swimlane',
        color: 'blue',
        duration: 1200,
        description: `Enter ${lane.data?.label || 'Lane'}`
      });
      
      // 2. For each node, highlight node then its outgoing edge
      nodesInLane.forEach((node, index) => {
        // Highlight node
        sequentialSteps.push({
          elementId: node.id,
          elementType: 'node',
          color: node.data?.events?.some((e: any) => e.type === 'onFailure' && e.enabled) ? 'red' : 'green',
          duration: 1500,
          description: `Process ${node.data?.label || node.id}`
        });
        
        // Highlight edge to next node
        const outgoingEdge = edges.find(e => e.source === node.id);
        if (outgoingEdge) {
          const targetNode = processNodes.find(n => n.id === outgoingEdge.target);
          const targetLane = targetNode?.parentNode || targetNode?.data?.laneId;
          const isSameLane = targetLane === lane.id;
          
          sequentialSteps.push({
            elementId: outgoingEdge.id,
            elementType: 'edge',
            color: isSameLane ? 'amber' : 'purple',
            duration: 1200,
            description: `Connect to ${targetNode?.data?.label || outgoingEdge.target}`,
            targetLaneId: isSameLane ? null : targetLane
          });
        }
      });
      
      // Add all steps as one level for this swimlane
      levels.push({
        type: 'swimlane-flow',
        steps: sequentialSteps,
        levelDuration: 1000
      });
    });
    
    console.log(`✅ Generated ${levels.length} swimlane flows`);
    return levels;
  }

  /**
   * Analyze swimlane-level flow
   */
  private analyzeSwimlaneFlow(swimlanes: Node[], processNodes: Node[], edges: Edge[]): FlowStep[] {
    const steps: FlowStep[] = [];
    
    // Sort swimlanes by Y position (top to bottom)
    const sortedSwimlanes = [...swimlanes].sort((a, b) => a.position.y - b.position.y);
    
    sortedSwimlanes.forEach((lane, index) => {
      const nodesInLane = processNodes.filter(n => 
        n.parentNode === lane.id || n.data?.laneId === lane.id
      );
      
      if (nodesInLane.length > 0) {
        steps.push({
          id: `swimlane-${lane.id}-${index}`,
          type: 'swimlane',
          elementId: lane.id,
          level: this.ANIMATION_LEVELS.swimlane,
          duration: this.ANIMATION_LEVELS.swimlane.speed,
          description: `Enter ${lane.data?.label || 'Lane'} (${nodesInLane.length} processes)`
        });
      }
    });

    return steps;
  }

  /**
   * Analyze node-level flow within a swimlane
   */
  private analyzeNodeFlow(swimlane: Node, processNodes: Node[], edges: Edge[]): FlowStep[] {
    const steps: FlowStep[] = [];
    
    const nodesInLane = processNodes.filter(n => 
      n.parentNode === swimlane.id || n.data?.laneId === swimlane.id
    );

    if (nodesInLane.length === 0) return steps;

    // Sort nodes by X position (left to right flow)
    const sortedNodes = [...nodesInLane].sort((a, b) => a.position.x - b.position.x);
    
    sortedNodes.forEach((node, index) => {
      // Determine node animation type based on node type and events
      let animLevel = this.ANIMATION_LEVELS.node;
      
      if (node.data?.events?.some((e: any) => e.type === 'onFailure' && e.enabled)) {
        animLevel = this.ANIMATION_LEVELS.error;
      } else if (node.data?.events?.some((e: any) => e.type === 'onSuccess' && e.enabled)) {
        animLevel = this.ANIMATION_LEVELS.success;
      }

      steps.push({
        id: `node-${node.id}-${index}`,
        type: 'node',
        elementId: node.id,
        level: animLevel,
        duration: animLevel.speed,
        data: {
          nodeType: node.type,
          laneId: swimlane.id,
          events: node.data?.events || []
        },
        description: `Process: ${node.data?.label || node.id} (${node.type})`
      });

      // Add connection step if there's an outgoing edge
      const outgoingEdges = edges.filter(e => e.source === node.id);
      outgoingEdges.forEach(edge => {
        steps.push({
          id: `edge-${edge.id}-${index}`,
          type: 'edge',
          elementId: edge.id,
          level: this.ANIMATION_LEVELS.connection,
          duration: this.ANIMATION_LEVELS.connection.speed,
          data: {
            sourceNode: edge.source,
            targetNode: edge.target,
            edgeType: edge.type
          },
          description: `Connect: ${node.data?.label} → ${edges.find(e => e.id === edge.target)?.data?.label || edge.target}`
        });
      });
    });

    return steps;
  }

  /**
   * Analyze connection-level flow with different colors for different paths
   */
  private analyzeConnectionFlow(edges: Edge[], nodes: Node[]): FlowStep[] {
    const steps: FlowStep[] = [];
    
    // Group edges by flow paths (success/error/normal)
    const edgeGroups = {
      success: edges.filter(e => e.data?.type === 'success' || e.style?.stroke === '#22c55e'),
      error: edges.filter(e => e.data?.type === 'error' || e.style?.stroke === '#ef4444'),
      normal: edges.filter(e => !e.data?.type || e.data.type === 'normal')
    };

    // Animate each group with different colors
    Object.entries(edgeGroups).forEach(([groupType, groupEdges]) => {
      groupEdges.forEach((edge, index) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        let animLevel = this.ANIMATION_LEVELS.connection;
        if (groupType === 'success') animLevel = this.ANIMATION_LEVELS.success;
        if (groupType === 'error') animLevel = this.ANIMATION_LEVELS.error;

        steps.push({
          id: `connection-${edge.id}-${groupType}-${index}`,
          type: 'edge',
          elementId: edge.id,
          level: animLevel,
          duration: animLevel.speed,
          data: {
            groupType,
            sourceLabel: sourceNode?.data?.label,
            targetLabel: targetNode?.data?.label
          },
          description: `${groupType.toUpperCase()} path: ${sourceNode?.data?.label || edge.source} → ${targetNode?.data?.label || edge.target}`
        });
      });
    });

    return steps;
  }

  /**
   * Start multi-level animation
   */
  public startComplexAnimation(
    nodes: Node[], 
    edges: Edge[], 
    onUpdate: (state: AdvancedAnimationState) => void
  ): void {
    if (this.state.isRunning) {
      this.stopAnimation();
    }

    console.log('🎬 Starting complex multi-level animation...');
    
    const animationLevels = this.generateComplexFlowPath(nodes, edges);
    
    this.state = {
      ...this.state,
      isRunning: true,
      animationLevels,
      currentStep: 0,
      progress: 0
    };

    this.onUpdate = onUpdate;
    onUpdate(this.state);

    this.runLevels(animationLevels);
  }

  /**
   * Run animation levels sequentially
   */
  private async runLevels(levels: any[]): Promise<void> {
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      if (!this.state.isRunning) break;
      
      const level = levels[levelIndex];
      
      this.state.currentStep = levelIndex;
      this.state.progress = Math.round(((levelIndex + 1) / levels.length) * 100);
      
      console.log(`🎯 Level ${levelIndex + 1}/${levels.length}: ${level.type}`);
      
      if (this.onUpdate) {
        this.onUpdate(this.state);
      }
      
      if (level.type === 'node-sequence') {
        // Animate nodes one by one in sequence
        for (const step of level.steps) {
          if (!this.state.isRunning) break;
          
          this.setActiveElement(step);
          this.applyAnimationStyles(step);
          
          await new Promise(resolve => setTimeout(resolve, step.duration));
        }
      } else {
        // Animate all steps simultaneously for other types
        for (const step of level.steps) {
          if (!this.state.isRunning) break;
          
          this.setActiveElement(step);
          this.applyAnimationStyles(step);
        }
        
        await new Promise(resolve => setTimeout(resolve, level.levelDuration));
      }
    }
    
    this.completeAnimation();
  }

  /**
   * Set element as active based on step type
   */
  private setActiveElement(step: any): void {
    switch (step.elementType) {
      case 'swimlane':
        this.state.activeElements.swimlanes.add(step.elementId);
        break;
      case 'node':
        this.state.activeElements.nodes.add(step.elementId);
        break;
      case 'edge':
        this.state.activeElements.edges.add(step.elementId);
        break;
    }
  }

  /**
   * Clear all active elements
   */
  private clearActiveElements(): void {
    this.state.activeElements.swimlanes.clear();
    this.state.activeElements.nodes.clear();
    this.state.activeElements.edges.clear();
  }

  /**
   * Apply animation styles to DOM element - border highlight only
   */
  private applyAnimationStyles(step: any): void {
    const element = document.querySelector(`[data-id="${step.elementId}"]`) as HTMLElement;
    
    if (element) {
      const colorMap: Record<string, string> = {
        blue: '#3b82f6',
        green: '#10b981',
        amber: '#f59e0b',
        red: '#ef4444',
        purple: '#a855f7'
      };
      
      const color = colorMap[step.color] || '#3b82f6';
      const originalBorder = element.style.border;
      const originalBoxShadow = element.style.boxShadow;
      
      // Apply border highlight
      element.style.border = `3px solid ${color}`;
      element.style.boxShadow = `0 0 20px ${color}80`;
      element.style.transition = 'all 0.3s ease-in-out';
      
      setTimeout(() => {
        element.style.border = originalBorder;
        element.style.boxShadow = originalBoxShadow;
      }, step.duration);
    }
  }

  /**
   * Complete animation
   */
  private completeAnimation(): void {
    console.log('🎉 Complex animation completed!');
    this.state.isRunning = false;
    this.state.progress = 100;
    this.clearActiveElements();
    
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
    
    setTimeout(() => {
      this.state.progress = 0;
      if (this.onUpdate) {
        this.onUpdate(this.state);
      }
    }, 2000);
  }

  /**
   * Stop animation
   */
  public stopAnimation(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = undefined;
    }

    this.state.isRunning = false;
    this.clearActiveElements();
    console.log('⏹️ Complex animation stopped');
    
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
  }

  /**
   * Pause/resume animation
   */
  public togglePause(): void {
    if (this.state.isRunning && this.intervalId) {
      // Pause
      clearTimeout(this.intervalId);
      this.intervalId = undefined;
      this.state.isRunning = false;
    } else if (this.state.currentPath && this.state.currentStep < this.state.currentPath.steps.length) {
      // Resume
      this.state.isRunning = true;
      this.executeNextStep();
    }
  }

  /**
   * Get current animation state
   */
  public getState(): AdvancedAnimationState {
    return { ...this.state };
  }

  /**
   * Get animation CSS classes for elements
   */
  public getElementClasses(elementId: string, elementType: 'swimlane' | 'node' | 'edge'): string {
    const classes: string[] = [];
    
    switch (elementType) {
      case 'swimlane':
        if (this.state.activeElements.swimlanes.has(elementId)) {
          classes.push('anim-swimlane-active');
        }
        break;
      case 'node':
        if (this.state.activeElements.nodes.has(elementId)) {
          classes.push('anim-node-active');
        }
        break;
      case 'edge':
        if (this.state.activeElements.edges.has(elementId)) {
          classes.push('anim-edge-active');
        }
        break;
    }
    
    return classes.join(' ');
  }
}

// Singleton instance
export const advancedTokenAnimator = new AdvancedTokenAnimator();