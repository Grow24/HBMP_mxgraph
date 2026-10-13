import * as d3 from 'd3-force';
import { NetworkGraph, NetworkNode, NetworkEdge } from '@hbmp/shared-types';
import { SimulationConfig } from './store';

export class D3ForceSimulation {
  private simulation: d3.Simulation<NetworkNode, NetworkEdge> | null = null;
  private onTick: ((nodes: NetworkNode[]) => void) | null = null;

  /**
   * Initialize and start the force simulation
   */
  start(
    graph: NetworkGraph,
    config: SimulationConfig,
    onTickCallback: (nodes: NetworkNode[]) => void
  ): void {
    this.onTick = onTickCallback;

    // Create simulation
    this.simulation = d3
      .forceSimulation<NetworkNode, NetworkEdge>(graph.nodes)
      .force(
        'link',
        d3
          .forceLink<NetworkNode, NetworkEdge>(graph.edges)
          .id((d: any) => d.id)
          .strength(config.linkStrength)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(config.repulsion))
      .force('center', d3.forceCenter(400, 300).strength(config.gravity))
      .force('collide', d3.forceCollide(config.collisionRadius))
      .on('tick', () => {
        if (this.onTick) {
          this.onTick(graph.nodes);
        }
      });

    // Warm up simulation
    this.simulation.alpha(1).restart();
  }

  /**
   * Update simulation configuration
   */
  updateConfig(config: SimulationConfig): void {
    if (!this.simulation) return;

    this.simulation
      .force('charge', d3.forceManyBody().strength(config.repulsion))
      .force('center', d3.forceCenter(400, 300).strength(config.gravity))
      .force('collide', d3.forceCollide(config.collisionRadius));

    const linkForce = this.simulation.force('link') as d3.ForceLink<NetworkNode, NetworkEdge>;
    if (linkForce) {
      linkForce.strength(config.linkStrength);
    }

    this.simulation.alpha(0.3).restart();
  }

  /**
   * Pin a node at its current position
   */
  pinNode(nodeId: string, nodes: NetworkNode[]): void {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      node.position.fx = node.position.x;
      node.position.fy = node.position.y;
    }
    this.simulation?.alpha(0.3).restart();
  }

  /**
   * Unpin a node
   */
  unpinNode(nodeId: string, nodes: NetworkNode[]): void {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      node.position.fx = null;
      node.position.fy = null;
    }
    this.simulation?.alpha(0.3).restart();
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.simulation?.stop();
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    this.simulation?.alpha(0.3).restart();
  }

  /**
   * Re-run the simulation from scratch
   */
  rerun(graph: NetworkGraph, config: SimulationConfig): void {
    this.stop();
    if (this.onTick) {
      this.start(graph, config, this.onTick);
    }
  }

  /**
   * Stop and cleanup the simulation
   */
  stop(): void {
    this.simulation?.stop();
    this.simulation = null;
  }

  /**
   * Check if simulation is running
   */
  isRunning(): boolean {
    return this.simulation !== null && this.simulation.alpha() > 0.01;
  }
}
