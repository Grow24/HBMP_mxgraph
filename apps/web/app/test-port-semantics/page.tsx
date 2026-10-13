'use client'

import { useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ConnectionLineType,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { DatasetNode } from '../../components/nodes/DatasetNode'
import { ProcessTaskNode } from '../../components/nodes/ProcessTaskNode'
import { ReportNode } from '../../components/nodes/ReportNode'
import { useConnectionValidation } from '../../hooks/useConnectionValidation'
import { PortList } from '../../components/ui/PortIndicator'
import { HBMP_NETWORK_REGISTRY } from '@hbmp/engine'

const nodeTypes = {
  dataset: DatasetNode,
  processTask: ProcessTaskNode,
  report: ReportNode,
}

// Initial nodes showcasing different types with ports
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'dataset',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Customer Data', 
      kind: 'dataset',
      description: 'Customer records from CRM'
    }
  },
  {
    id: '2',
    type: 'processTask',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Data Transform', 
      kind: 'processTask',
      description: 'Clean and normalize data'
    }
  },
  {
    id: '3',
    type: 'report',
    position: { x: 700, y: 100 },
    data: { 
      label: 'Summary Report', 
      kind: 'report',
      description: 'Customer insights dashboard'
    }
  },
  // Invalid connection example
  {
    id: '4',
    type: 'dataset',
    position: { x: 100, y: 300 },
    data: { 
      label: 'Product Data', 
      kind: 'dataset',
      description: 'Product catalog'
    }
  },
  {
    id: '5',
    type: 'dataset',
    position: { x: 400, y: 300 },
    data: { 
      label: 'Inventory Data', 
      kind: 'dataset',
      description: 'Stock levels'
    }
  }
]

const initialEdges: Edge[] = []

function PortSemanticsDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('1')
  
  const { validateConnection, getConnectionSuggestions, getNodeTypeDef } = useConnectionValidation()

  const onConnect = useCallback((params: Connection) => {
    const validationResult = validateConnection(params)
    
    if (!validationResult.isValid) {
      setConnectionFeedback(`❌ ${validationResult.reason}`)
      setTimeout(() => setConnectionFeedback(null), 4000)
      return
    }
    
    if (validationResult.level === 'warning') {
      setConnectionFeedback(`⚠️ ${validationResult.reason}`)
      setTimeout(() => setConnectionFeedback(null), 4000)
    } else {
      setConnectionFeedback(`✅ Valid connection created`)
      setTimeout(() => setConnectionFeedback(null), 2000)
    }
    
    setEdges((eds) => addEdge({
      ...params,
      id: `edge-${Date.now()}`,
      data: { validationLevel: validationResult.level }
    }, eds))
  }, [validateConnection, setEdges])

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const selectedNodeType = selectedNode ? getNodeTypeDef(selectedNode.data.kind) : null
  const suggestions = selectedNodeId ? getConnectionSuggestions(selectedNodeId) : []

  // Helper to create connection examples
  const createValidConnection = () => {
    const newEdge = {
      id: `edge-valid-${Date.now()}`,
      source: '1',
      target: '2',
      sourceHandle: 'output',
      targetHandle: 'input'
    }
    setEdges((eds) => [...eds, newEdge])
    setConnectionFeedback('✅ Valid dataset → process connection created')
    setTimeout(() => setConnectionFeedback(null), 2000)
  }

  const tryInvalidConnection = () => {
    // Try to connect two datasets (which should be invalid)
    const invalidConnection = {
      source: '4',
      target: '5',
      sourceHandle: 'output',
      targetHandle: 'input'
    }
    onConnect(invalidConnection as Connection)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Port-Level Semantics Demo</h1>
        <p className="text-gray-600 mt-1">
          Intelligent connection validation using Network Type Registry
        </p>
      </div>

      <div className="flex-1 flex">
        {/* Main diagram area */}
        <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
            >
              <Background color="#f1f1f1" gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>

          {/* Connection feedback */}
          {connectionFeedback && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
              <Card className="bg-white shadow-lg border px-4 py-2 max-w-md">
                <div className="text-sm font-medium">{connectionFeedback}</div>
              </Card>
            </div>
          )}

          {/* Demo controls */}
          <div className="absolute top-4 right-4 z-10 space-y-2">
            <Button onClick={createValidConnection} className="block w-full text-sm">
              ✅ Create Valid Connection
            </Button>
            <Button onClick={tryInvalidConnection} variant="destructive" className="block w-full text-sm">
              ❌ Try Invalid Connection
            </Button>
          </div>
        </div>

        {/* Sidebar with port information */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Selected Node Info */}
            {selectedNode && selectedNodeType && (
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-2">Selected Node</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{selectedNode.data.label}</span>
                    <Badge className="ml-2 text-xs">{selectedNodeType.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedNodeType.description}</p>
                  
                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-sm mb-2">Input Ports</h4>
                    <PortList 
                      ports={selectedNodeType.ports} 
                      direction="in"
                      variant="detailed"
                    />
                  </div>
                  
                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-sm mb-2">Output Ports</h4>
                    <PortList 
                      ports={selectedNodeType.ports} 
                      direction="out"
                      variant="detailed"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Connection Rules */}
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-2">Connection Rules</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-green-700">✅ Valid Connections:</span>
                  <ul className="mt-1 space-y-1 ml-4 text-gray-600">
                    <li>• Dataset → Process Task</li>
                    <li>• Process Task → Report</li>
                    <li>• Process Task → Process Task</li>
                  </ul>
                </div>
                
                <div>
                  <span className="font-medium text-red-700">❌ Invalid Connections:</span>
                  <ul className="mt-1 space-y-1 ml-4 text-gray-600">
                    <li>• Dataset → Dataset</li>
                    <li>• Report → Dataset</li>
                    <li>• Process → Dataset (wrong direction)</li>
                  </ul>
                </div>
                
                <div>
                  <span className="font-medium text-amber-700">⚠️ Port Type Rules:</span>
                  <ul className="mt-1 space-y-1 ml-4 text-gray-600">
                    <li>• Data ports can only connect to data ports</li>
                    <li>• Control ports connect to control/event ports</li>
                    <li>• API ports connect to API/data ports</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Connection Suggestions */}
            {suggestions.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-2">Connection Suggestions</h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <div 
                      key={suggestion.nodeId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <span>{suggestion.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.nodeType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Registry Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-2">Registry Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Node Types:</span>
                  <span>{Object.keys(HBMP_NETWORK_REGISTRY.nodeTypes).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lane Types:</span>
                  <span>{Object.keys(HBMP_NETWORK_REGISTRY.laneTypes).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Edge Types:</span>
                  <span>{Object.keys(HBMP_NETWORK_REGISTRY.edgeTypes).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Global Rules:</span>
                  <span>{HBMP_NETWORK_REGISTRY.globalRules?.validationRules?.length || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PortSemanticsDemoPage() {
  return (
    <ReactFlowProvider>
      <PortSemanticsDemo />
    </ReactFlowProvider>
  )
}
