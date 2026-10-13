import { NextRequest, NextResponse } from 'next/server'
import type { LayoutRequest, LayoutResponse, RFGraph, RFNode, RFEdge } from '@hbmp/shared-types'

// Enhanced auto-layout function for swimlanes with proper node positioning
function calculateOptimalSwimlaneLayout(graph: RFGraph): RFGraph {
  const { nodes, edges } = graph
  
  // Separate lanes and process nodes
  const laneNodes = nodes.filter(node => node.type === 'lane').sort((a, b) => a.position.y - b.position.y)
  const processNodes = nodes.filter(node => node.type !== 'lane')
  
  // Enhanced layout configuration
  const config = {
    laneSpacing: 220,
    nodeSpacing: 160,
    minLaneWidth: 900,
    minLaneHeight: 200,
    laneStartY: 50,
    laneStartX: 50,
    nodePaddingX: 80,
    nodePaddingY: 80,
    nodesPerRow: 1 // Single row within lanes for better visibility
  }
  
  const updatedNodes: RFNode[] = []
  const updatedEdges: RFEdge[] = [...(edges || [])]
  let currentY = config.laneStartY
  
  console.log('Processing swimlane layout for', laneNodes.length, 'lanes and', processNodes.length, 'process nodes')
  
  // Layout each lane with its nodes
  for (let laneIndex = 0; laneIndex < laneNodes.length; laneIndex++) {
    const lane = laneNodes[laneIndex]
    
    // Find nodes that belong to this lane
    const nodesInLane = processNodes.filter(node => {
      const belongsToLane = (
        (node as any).parentNode === lane.id || 
        (node.data && node.data.laneId === lane.id)
      )
      
      // If no explicit assignment, distribute based on original position or index
      if (!belongsToLane && !(node as any).parentNode && !node.data?.laneId) {
        // Assign based on Y position relative to lanes
        const nodeY = node.position.y
        const laneY = lane.position.y
        const nextLaneY = laneIndex < laneNodes.length - 1 ? laneNodes[laneIndex + 1].position.y : Infinity
        
        return nodeY >= laneY && nodeY < nextLaneY
      }
      
      return belongsToLane
    }).sort((a, b) => a.position.x - b.position.x) // Sort by X position for proper flow
    
    console.log(`Lane ${lane.id}: found ${nodesInLane.length} nodes`)
    
    // Calculate required lane width based on content
    const requiredWidth = Math.max(
      config.minLaneWidth,
      nodesInLane.length * config.nodeSpacing + config.nodePaddingX * 2
    )
    
    // Update lane node position and size
    const updatedLane: RFNode = {
      ...lane,
      position: { x: config.laneStartX, y: currentY },
      data: {
        ...lane.data,
        width: requiredWidth,
        height: config.minLaneHeight
      } as any
    }
    updatedNodes.push(updatedLane)
    
    // Position nodes within the lane horizontally with proper spacing
    const laneContentStartX = config.laneStartX + config.nodePaddingX
    const laneContentY = currentY + config.nodePaddingY
    
    nodesInLane.forEach((node, nodeIndex) => {
      const nodeX = laneContentStartX + (nodeIndex * config.nodeSpacing)
      
      const updatedNode: RFNode = {
        ...node,
        position: {
          x: nodeX,
          y: laneContentY
        },
        parentNode: lane.id,
        extent: 'parent' as const,
        data: {
          ...node.data,
          laneId: lane.id
        }
      } as any
      
      updatedNodes.push(updatedNode)
      console.log(`  Positioned node ${node.id} at (${nodeX}, ${laneContentY})`)
    })
    
    // Create connections between nodes in this lane if they don't exist
    for (let i = 0; i < nodesInLane.length - 1; i++) {
      const sourceNode = nodesInLane[i]
      const targetNode = nodesInLane[i + 1]
      const edgeId = `lane-${lane.id}-${i}-${i + 1}`
      
      // Check if connection already exists
      const existingEdge = updatedEdges.find(edge => 
        (edge.source === sourceNode.id && edge.target === targetNode.id) ||
        edge.id === edgeId
      )
      
      if (!existingEdge) {
        const newEdge: RFEdge = {
          id: edgeId,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'smoothstep' as any,
          animated: true,
          style: { 
            stroke: laneIndex === 0 ? '#0ea5e9' : '#9333ea', 
            strokeWidth: 2 
          }
        }
        updatedEdges.push(newEdge)
        console.log(`  Created connection: ${sourceNode.id} -> ${targetNode.id}`)
      }
    }
    
    currentY += config.minLaneHeight + config.laneSpacing
  }
  
  // Handle any unassigned nodes
  const unassignedNodes = processNodes.filter(node => 
    !updatedNodes.find(updatedNode => updatedNode.id === node.id)
  )
  
  unassignedNodes.forEach((node, index) => {
    updatedNodes.push({
      ...node,
      position: {
        x: config.laneStartX + 100 + (index * 150),
        y: currentY + 50
      }
    })
  })
  
  console.log('Layout complete:', updatedNodes.length, 'nodes,', updatedEdges.length, 'edges')
  
  return {
    ...graph,
    nodes: updatedNodes,
    edges: updatedEdges
  }
}

// Simple hierarchical layout
function calculateHierarchicalLayout(graph: RFGraph): RFGraph {
  const { nodes, edges } = graph
  const updatedNodes: RFNode[] = []
  
  const config = {
    startX: 100,
    startY: 100,
    nodeSpacingX: 200,
    nodeSpacingY: 150,
    nodesPerRow: 3
  }
  
  nodes.forEach((node, index) => {
    const row = Math.floor(index / config.nodesPerRow)
    const col = index % config.nodesPerRow
    
    updatedNodes.push({
      ...node,
      position: {
        x: config.startX + col * config.nodeSpacingX,
        y: config.startY + row * config.nodeSpacingY
      }
    })
  })
  
  return {
    ...graph,
    nodes: updatedNodes,
    edges: edges || []
  }
}

export async function POST(request: NextRequest) {
  try {
    const layoutRequest: LayoutRequest = await request.json()
    
    if (!layoutRequest.graph || !layoutRequest.graph.nodes) {
      return NextResponse.json(
        { error: 'Invalid graph data' },
        { status: 400 }
      )
    }

    const { graph, options = {} } = layoutRequest
    
    console.log('Layout request received:', {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges?.length || 0,
      laneAware: options.laneAware
    })
    
    let layoutedGraph: RFGraph
    
    if (options.laneAware) {
      // Use enhanced swimlane layout
      layoutedGraph = calculateOptimalSwimlaneLayout(graph)
      console.log('Swimlane layout applied')
    } else {
      // Use hierarchical layout
      layoutedGraph = calculateHierarchicalLayout(graph)
      console.log('Hierarchical layout applied')
    }
    
    const response: LayoutResponse = {
      graph: layoutedGraph
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Layout error:', error)
    return NextResponse.json(
      { error: 'Failed to process layout request' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'HBMP Layout Service',
    version: '1.0.0',
    features: [
      'Standard node layout',
      'Swimlane-aware layout',
      'mxGraph integration',
      'Constraint validation'
    ]
  })
}