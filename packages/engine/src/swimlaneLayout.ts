// import mxGraph from 'mxgraph'  // TODO: Fix mxgraph types
import type { RFGraph, RFNode, RFEdge } from '@hbmp/shared-types'

interface LaneConfiguration {
  id: string
  title: string
  width: number
  height: number
  x: number
  y: number
  nodeIds: string[]
}

interface SwimlaneBounds {
  lanes: LaneConfiguration[]
  totalWidth: number
  totalHeight: number
}

/**
 * Swimlane layout engine (simplified version without mxGraph dependency)
 * Provides intelligent positioning and constraint management for lane-based diagrams
 */
export class SwimlaneLayoutEngine {
  constructor() {
    // Simplified constructor without mxGraph initialization
  }

  /**
   * Analyzes React Flow graph and calculates optimal swimlane layout
   * Returns updated graph with repositioned nodes
   */
  public calculateSwimlaneLayout(rfGraph: RFGraph): RFGraph {
    // Extract lanes from nodes
    const lanes = this.extractLanes(rfGraph.nodes)
    const laneNodes = this.groupNodesByLane(rfGraph.nodes)
    
    // Calculate lane dimensions and positions
    const laneConfigs: LaneConfiguration[] = []
    let currentY = 50
    const laneSpacing = 50
    const minLaneWidth = 800
    const minLaneHeight = 200
    
    // Update lane positions and calculate bounds
    const updatedNodes = [...rfGraph.nodes]
    
    for (const lane of lanes) {
      const nodesInLane = laneNodes[lane.id] || []
      
      // Calculate required dimensions
      const contentBounds = this.calculateContentBounds(nodesInLane)
      const width = Math.max(minLaneWidth, contentBounds.width + 100)
      const height = Math.max(minLaneHeight, contentBounds.height + 100)
      
      // Update lane node position and size
      const laneNode = updatedNodes.find(n => n.id === lane.id)
      if (laneNode) {
        laneNode.position = { x: 50, y: currentY }
        laneNode.data = {
          ...laneNode.data,
          width,
          height
        }
      }
      
      laneConfigs.push({
        id: lane.id,
        title: lane.title,
        width,
        height,
        x: 50,
        y: currentY,
        nodeIds: nodesInLane.map(n => n.id)
      })
      
      currentY += height + laneSpacing
    }
    
    // Layout nodes within each lane
    for (const laneConfig of laneConfigs) {
      const nodesInLane = updatedNodes.filter(n => 
        laneConfig.nodeIds.includes(n.id) && n.type !== 'lane'
      )
      
      // Arrange nodes horizontally within the lane
      let x = laneConfig.x + 100 // Padding from lane edge
      const y = laneConfig.y + 80 // Below lane header
      const nodeSpacing = 180
      
      nodesInLane.forEach((node, index) => {
        node.position = {
          x: x + (index * nodeSpacing),
          y: y + (index % 2 === 0 ? 0 : 60) // Alternate rows slightly
        }
        
        // Ensure node has parent relationship
        if (node.type !== 'lane') {
          node.parentNode = laneConfig.id
          node.extent = 'parent'
          node.data = { ...node.data, laneId: laneConfig.id }
        }
      })
    }
    
    return {
      ...rfGraph,
      nodes: updatedNodes
    }
  }

  /**
   * Validates swimlane constraints for node placement
   */
  public validateNodePlacement(nodeId: string, laneId: string, rfGraph: RFGraph): boolean {
    const node = rfGraph.nodes.find(n => n.id === nodeId)
    if (!node) return false
    
    // Check if node type is allowed in lanes
    const restrictedTypes = ['lane'] // Lanes can't be nested
    if (restrictedTypes.includes(node.type)) {
      return false
    }
    
    // Check lane capacity constraints
    const laneNodes = rfGraph.nodes.filter(n => n.data.laneId === laneId)
    const maxNodesPerLane = 20 // Configurable limit
    
    return laneNodes.length < maxNodesPerLane
  }

  /**
   * Generates optimal node positions within lanes (simplified version)
   */
  public layoutNodesInLanes(rfGraph: RFGraph, swimlaneBounds: SwimlaneBounds): RFGraph {
    const updatedNodes = [...rfGraph.nodes]
    
    for (const lane of swimlaneBounds.lanes) {
      const laneNodes = updatedNodes.filter(n => 
        lane.nodeIds.includes(n.id) && n.type !== 'lane'
      )
      
      // Simple grid layout within lanes
      let x = lane.x + 20 // Padding from lane edge
      let y = lane.y + 40 // Below lane title
      const nodeSpacing = 120
      const rowHeight = 80
      const nodesPerRow = Math.floor((lane.width - 40) / nodeSpacing)
      
      laneNodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow)
        const col = index % nodesPerRow
        
        node.position.x = x + (col * nodeSpacing)
        node.position.y = y + (row * rowHeight)
      })
    }
    
    return {
      ...rfGraph,
      nodes: updatedNodes
    }
  }

  /**
   * Extracts lane definitions from React Flow nodes
   */
  private extractLanes(nodes: RFNode[]): Array<{ id: string; title: string }> {
    return nodes
      .filter(node => node.type === 'lane')
      .map(node => ({
        id: node.id,
        title: node.data.label
      }))
  }

  /**
   * Groups nodes by their assigned lane
   */
  private groupNodesByLane(nodes: RFNode[]): Record<string, RFNode[]> {
    const groups: Record<string, RFNode[]> = {}
    
    for (const node of nodes) {
      const laneId = node.data.laneId || 'default'
      if (!groups[laneId]) {
        groups[laneId] = []
      }
      groups[laneId].push(node)
    }
    
    return groups
  }

  /**
   * Calculates bounding box for a set of nodes
   */
  private calculateContentBounds(nodes: RFNode[]): { width: number; height: number } {
    if (nodes.length === 0) {
      return { width: 0, height: 0 }
    }
    
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    for (const node of nodes) {
      const nodeWidth = 100 // Standard node width
      const nodeHeight = 40 // Standard node height
      
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + nodeWidth)
      maxY = Math.max(maxY, node.position.y + nodeHeight)
    }
    
    return {
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * Cleanup resources (no-op in simplified version)
   */
  public dispose() {
    // No cleanup needed in simplified version
  }
}

// Singleton instance for the application
export const swimlaneEngine = new SwimlaneLayoutEngine()