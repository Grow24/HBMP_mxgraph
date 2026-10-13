'use client'

import { useEffect, useState } from 'react'
import { type RFGraph, type ValidationIssue, type RFNode } from '@hbmp/shared-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

interface PropertiesPanelProps {
  graph: RFGraph
  validationIssues: ValidationIssue[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  onChange: (graph: RFGraph) => void
}

export function PropertiesPanel({
  graph,
  validationIssues,
  selectedNodeId,
  selectedEdgeId,
  onChange,
}: PropertiesPanelProps) {

  const selectedNode = selectedNodeId ? graph.nodes.find(n => n.id === selectedNodeId) : null
  const selectedEdge = selectedEdgeId ? graph.edges.find(e => e.id === selectedEdgeId) : null

  const nodeIssues = validationIssues.filter(issue => 
    issue.id === selectedNodeId
  )
  const edgeIssues = validationIssues.filter(issue => 
    issue.id === selectedEdgeId
  )
  const globalIssues = validationIssues.filter(issue => !issue.id || issue.id === 'graph')

  const updateNodeFields = (nodeId: string, patch: Record<string, any>) => {
    const updatedNodes = graph.nodes.map(node => {
      if (node.id !== nodeId) return node
      const width = patch.width ?? node.data?.width ?? (node as any).style?.width
      const height = patch.height ?? node.data?.height ?? (node as any).style?.height
      return {
        ...node,
        style: {
          ...(node as any).style,
          ...(width ? { width: Number(width) } : {}),
          ...(height ? { height: Number(height) } : {}),
        },
        data: {
          ...node.data,
          ...patch,
        }
      }
    })

    onChange({
      ...graph,
      nodes: updatedNodes
    })
  }

  const updateEdgeProperty = (edgeId: string, property: string, value: any) => {
    const updatedEdges = graph.edges.map(edge => {
      if (edge.id === edgeId) {
        return property === 'label'
          ? { ...edge, label: value, data: { ...edge.data, label: value } }
          : {
              ...edge,
              data: {
                ...edge.data,
                [property]: value
              }
            }
      }
      return edge
    })

    onChange({
      ...graph,
      edges: updatedEdges
    })
  }

  const IssuesList = ({ issues }: { issues: ValidationIssue[] }) => (
    <div className="space-y-2">
      {issues.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          No issues found
        </div>
      ) : (
        issues.map((issue, index) => (
          <div
            key={index}
            className={`
              flex items-start gap-2 p-2 rounded text-sm
              ${issue.level === 'error' ? 'bg-red-50 text-red-700' :
                issue.level === 'warn' ? 'bg-yellow-50 text-yellow-700' :
                'bg-blue-50 text-blue-700'}
            `}
          >
            {issue.level === 'error' ? (
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : issue.level === 'warn' ? (
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-medium">{issue.message}</div>
              {issue.path && (
                <div className="text-xs mt-1 opacity-80">{issue.path}</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )

  const [tab, setTab] = useState('selection')

  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setTab('selection')
    }
  }, [selectedNodeId, selectedEdgeId])

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Properties</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={tab} onValueChange={setTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="selection">Selection</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="p-4 space-y-4">
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Node Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="node-label">Label</Label>
                    <Input
                      id="node-label"
                      value={selectedNode.data?.label || ''}
                      onChange={(e) => updateNodeFields(selectedNode.id, { label: e.target.value })}
                      placeholder="Complaint received"
                    />
                    <p className="mt-1 text-xs text-gray-500">This name is written on the shape.</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="node-description">Description</Label>
                    <Textarea
                      id="node-description"
                      value={selectedNode.data?.description || selectedNode.data?.props?.description || ''}
                      onChange={(e) => updateNodeFields(selectedNode.id, { description: e.target.value })}
                      placeholder="What happens in this step"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="node-width">Width</Label>
                      <Input
                        id="node-width"
                        type="number"
                        min={80}
                        value={Number(selectedNode.data?.width || (selectedNode as any).style?.width || 160)}
                        onChange={(e) => updateNodeFields(selectedNode.id, { width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="node-height">Height</Label>
                      <Input
                        id="node-height"
                        type="number"
                        min={60}
                        value={Number(selectedNode.data?.height || (selectedNode as any).style?.height || 80)}
                        onChange={(e) => updateNodeFields(selectedNode.id, { height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">You can also drag the corner of a selected shape.</p>

                  <div>
                    <Label>Node Type</Label>
                    <Badge variant="secondary">
                      {selectedNode.data?.kind || 'Unknown'}
                    </Badge>
                  </div>

                  {nodeIssues.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <Label>Issues</Label>
                        <IssuesList issues={nodeIssues} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedEdge && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Edge Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="edge-label">Label</Label>
                    <Input
                      id="edge-label"
                      value={selectedEdge.label || ''}
                      onChange={(e) => updateEdgeProperty(selectedEdge.id, 'label', e.target.value)}
                      placeholder="Enter edge label"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edge-condition">Condition</Label>
                    <Input
                      id="edge-condition"
                      value={selectedEdge.data?.relation || ''}
                      onChange={(e) => updateEdgeProperty(selectedEdge.id, 'relation', e.target.value)}
                      placeholder="Enter condition (for decision flows)"
                    />
                  </div>

                  {edgeIssues.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <Label>Issues</Label>
                        <IssuesList issues={edgeIssues} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedNode && !selectedEdge && (
              <div className="text-center py-8 text-gray-500">
                <p>Select a node or edge to view its properties</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <IssuesList issues={validationIssues} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Diagram Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nodes:</span>
                  <Badge variant="secondary">{graph.nodes.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Edges:</span>
                  <Badge variant="secondary">{graph.edges.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Issues:</span>
                  <Badge 
                    variant={validationIssues.length > 0 ? "destructive" : "secondary"}
                  >
                    {validationIssues.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Global Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <IssuesList issues={globalIssues} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}