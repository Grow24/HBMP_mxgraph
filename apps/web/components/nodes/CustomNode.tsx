'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import { type ValidationIssue, type NodeKind } from '@hbmp/shared-types'

interface CustomNodeData {
  label: string
  kind: NodeKind
  validationIssues?: ValidationIssue[]
  [key: string]: any
}

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const { label, kind, validationIssues = [] } = data

  const hasErrors = validationIssues.some(issue => issue.level === 'error')
  const hasWarnings = validationIssues.some(issue => issue.level === 'warn')

  const getNodeStyle = () => {
    switch (kind) {
      case 'processTask':
        return {
          backgroundColor: 'var(--task-bg, #e0f2fe)',
          borderColor: 'var(--task-border, #0277bd)',
          color: 'var(--task-text, #01579b)',
        }
      case 'gateway':
        return {
          backgroundColor: 'var(--gateway-bg, #f3e5f5)',
          borderColor: 'var(--gateway-border, #7b1fa2)',
          color: 'var(--gateway-text, #4a148c)',
        }
      case 'event':
        return {
          backgroundColor: 'var(--event-bg, #e8f5e8)',
          borderColor: 'var(--event-border, #2e7d32)',
          color: 'var(--event-text, #1b5e20)',
        }
      case 'dataset':
        return {
          backgroundColor: 'var(--data-bg, #e1f5fe)',
          borderColor: 'var(--data-border, #0288d1)',
          color: 'var(--data-text, #01579b)',
        }
      case 'service':
        return {
          backgroundColor: 'var(--service-bg, #fce4ec)',
          borderColor: 'var(--service-border, #c2185b)',
          color: 'var(--service-text, #880e4f)',
        }
      case 'lane':
        return {
          backgroundColor: 'var(--lane-bg, #f5f5f5)',
          borderColor: 'var(--lane-border, #9e9e9e)',
          color: 'var(--lane-text, #424242)',
        }
      default:
        return {
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          color: '#374151',
        }
    }
  }

  const nodeStyle = getNodeStyle()

  return (
    <div
      className={cn(
        'px-4 py-2 shadow-md rounded-md border-2 min-w-[120px] text-center relative',
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        hasErrors && 'border-red-500',
        hasWarnings && !hasErrors && 'border-yellow-500'
      )}
      style={nodeStyle}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />

      {/* Node label */}
      <div className="font-medium text-sm">{label}</div>

      {/* Validation indicator */}
      {validationIssues.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {hasErrors ? (
            <div className="bg-red-500 w-full h-full rounded-full flex items-center justify-center">
              !
            </div>
          ) : (
            <div className="bg-yellow-500 w-full h-full rounded-full flex items-center justify-center">
              ⚠
            </div>
          )}
        </div>
      )}

      {/* Node kind indicator */}
      <div className="absolute -bottom-1 -left-1 text-xs bg-white border rounded px-1 py-0.5 text-gray-600">
        {kind}
      </div>
    </div>
  )
})

CustomNode.displayName = 'CustomNode'