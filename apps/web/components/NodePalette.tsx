'use client'

import { useState } from 'react'
import type { NodeKind } from '@hbmp/shared-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Square, 
  Diamond, 
  Circle, 
  Hexagon, 
  Database,
  Layers,
  GitBranch 
} from 'lucide-react'

interface NodePaletteItem {
  id: string
  kind: NodeKind
  label: string
  icon: React.ReactNode
  description: string
}

const nodePaletteItems: NodePaletteItem[] = [
  {
    id: 'start-event',
    kind: 'event' as NodeKind,
    label: 'Start Event',
    icon: <Circle className="h-4 w-4" />,
    description: 'Process start point'
  },
  {
    id: 'end-event',
    kind: 'event' as NodeKind,
    label: 'End Event',
    icon: <Circle className="h-4 w-4 fill-current" />,
    description: 'Process end point'
  },
  {
    id: 'process-task',
    kind: 'processTask' as NodeKind,
    label: 'Task',
    icon: <Square className="h-4 w-4" />,
    description: 'Activity or work item'
  },
  {
    id: 'decision-gateway',
    kind: 'gateway' as NodeKind,
    label: 'Decision',
    icon: <Diamond className="h-4 w-4" />,
    description: 'Decision point with conditions'
  },
  {
    id: 'flow-gateway',
    kind: 'gateway' as NodeKind,
    label: 'Gateway',
    icon: <Hexagon className="h-4 w-4" />,
    description: 'Flow control gateway'
  },
  {
    id: 'service-node',
    kind: 'service' as NodeKind,
    label: 'Service',
    icon: <GitBranch className="h-4 w-4" />,
    description: 'Service component'
  },
  {
    id: 'dataset-node',
    kind: 'dataset' as NodeKind,
    label: 'Data Object',
    icon: <Database className="h-4 w-4" />,
    description: 'Data input/output'
  },
  {
    id: 'swimlane',
    kind: 'lane' as NodeKind,
    label: 'Swimlane',
    icon: <Layers className="h-4 w-4" />,
    description: 'Process lane'
  }
]

export function NodePalette() {
  const [draggedItem, setDraggedItem] = useState<NodePaletteItem | null>(null)

  const onDragStart = (event: React.DragEvent, item: NodePaletteItem) => {
    setDraggedItem(item)
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'customNode',
      nodeKind: item.kind,
      label: item.label
    }))
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragEnd = () => {
    setDraggedItem(null)
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Node Palette</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nodePaletteItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`
                w-full justify-start text-left h-auto p-3 hover:bg-gray-100
                ${draggedItem === item ? 'opacity-50' : ''}
              `}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onDragEnd={onDragEnd}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="mt-0.5 text-gray-600">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-2">
            <p>Drag nodes from this palette onto the canvas to create elements.</p>
            <p>Each node type has specific connection rules and validation.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}