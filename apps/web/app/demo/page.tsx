'use client'

import { useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { DiagramEditor } from '@/components/DiagramEditor'
import { NodePalette } from '@/components/NodePalette'
import { PropertiesPanel } from '@/components/PropertiesPanel'
import { Toolbar } from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { type RFGraph, type ValidationIssue } from '@hbmp/shared-types'

// Sample demo data
const demoGraph: RFGraph = {
  nodes: [
    {
      id: 'lane1',
      type: 'lane',
      position: { x: 50, y: 50 },
      data: { 
        label: 'Customer Service Lane',
        kind: 'lane' as any,
        width: 600,
        height: 180,
        department: 'Customer Service',
        owner: 'CS Team'
      }
    },
    {
      id: 'lane2',
      type: 'lane',
      position: { x: 50, y: 260 },
      data: { 
        label: 'Backend Processing Lane',
        kind: 'lane' as any,
        width: 600,
        height: 180,
        department: 'IT Operations',
        owner: 'Backend Team'
      }
    },
    {
      id: '1',
      type: 'processTask',
      position: { x: 100, y: 100 },
      data: { 
        label: 'Start Process',
        kind: 'processTask' as any,
        props: { description: 'Initial step in the process' },
        laneId: 'lane1'
      }
    },
    {
      id: '2',
      type: 'gateway',
      position: { x: 300, y: 100 },
      data: { 
        label: 'Decision Point',
        kind: 'gateway' as any,
        props: { description: 'Route based on conditions' },
        laneId: 'lane1'
      }
    },
    {
      id: '3',
      type: 'dataset',
      position: { x: 500, y: 100 },
      data: { 
        label: 'Customer Data',
        kind: 'dataset' as any,
        props: { description: 'Customer information dataset' },
        laneId: 'lane1'
      }
    },
    {
      id: '4',
      type: 'service',
      position: { x: 300, y: 310 },
      data: { 
        label: 'Notification Service',
        kind: 'service' as any,
        props: { description: 'Send notifications to users' },
        laneId: 'lane2'
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      label: 'Next',
      data: { relation: 'sequence' }
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      label: 'Yes',
      data: { relation: 'conditional' }
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      label: 'To Backend',
      data: { relation: 'conditional' }
    }
  ],
  meta: {
    orientation: 'LR'
  }
}

export default function DemoPage() {
  const [graph, setGraph] = useState<RFGraph>(demoGraph)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleGraphChange = (updatedGraph: RFGraph) => {
    setGraph(updatedGraph)
  }

  const handleValidate = () => {
    // Mock validation - in real app this would call the backend
    const mockIssues: ValidationIssue[] = [
      {
        id: '2',
        level: 'warn',
        code: 'GATEWAY_NO_DEFAULT',
        message: 'Gateway should have a default path',
        path: 'Gateway validation'
      }
    ]
    setValidationIssues(mockIssues)
  }

  const handleLayout = async (algorithm: string) => {
    console.log('Layout algorithm:', algorithm)
    
    try {
      const response = await fetch('/api/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph: graph,
          options: { 
            algorithm: algorithm,
            laneAware: algorithm === 'lane-aware'
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        const updatedGraph = {
          ...graph,
          nodes: result.graph.nodes,
          edges: result.graph.edges
        }
        setGraph(updatedGraph)
        console.log('Layout applied successfully:', algorithm)
      } else {
        console.error('Layout failed:', await response.text())
      }
    } catch (error) {
      console.error('Failed to apply layout:', error)
    }
  }

  const handleExport = (format: 'svg' | 'png' | 'pdf' | 'mermaid') => {
    console.log('Export format:', format)
    // Mock export - in real app this would call the backend
  }

  const resetDemo = () => {
    setGraph(demoGraph)
    setValidationIssues([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HBMP Modeling Platform Demo</h1>
            <p className="text-gray-600 mt-1">React Flow frontend with mxGraph engine integration</p>
          </div>
          <Button onClick={resetDemo} variant="outline">
            Reset Demo
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <ReactFlowProvider>
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar - Node Palette */}
          <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
            <NodePalette />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="h-14 bg-white border-b border-gray-200 flex-shrink-0">
              <Toolbar
                onValidate={handleValidate}
                onLayout={handleLayout}
                onExport={handleExport}
                validationIssues={validationIssues}
                isSaving={isSaving}
              />
            </div>

            {/* Canvas */}
            <div className="flex-1">
              <DiagramEditor
                graph={graph}
                validationIssues={validationIssues}
                onChange={handleGraphChange}
              />
            </div>
          </div>

          {/* Right Sidebar - Properties Panel */}
          <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
            <PropertiesPanel
              graph={graph}
              validationIssues={validationIssues}
              onChange={handleGraphChange}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  )
}