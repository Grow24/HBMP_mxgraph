'use client'

import { memo } from 'react'
import { 
  EdgeProps, 
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge 
} from 'reactflow'
import { type ValidationIssue } from '@hbmp/shared-types'

interface CustomEdgeData {
  label?: string
  validationIssues?: ValidationIssue[]
  [key: string]: any
}

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<CustomEdgeData>) => {
  const { label, validationIssues = [] } = data || {}

  const hasErrors = validationIssues.some(issue => issue.level === 'error')
  const hasWarnings = validationIssues.some(issue => issue.level === 'warn')

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const edgeStyle = {
    ...style,
    stroke: hasErrors ? '#ef4444' : hasWarnings ? '#f59e0b' : '#6b7280',
    strokeWidth: hasErrors || hasWarnings ? 3 : 2,
  }

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={edgeStyle}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div 
              className={`
                bg-white px-2 py-1 rounded border shadow-sm
                ${hasErrors ? 'border-red-500 text-red-700' : 
                  hasWarnings ? 'border-yellow-500 text-yellow-700' : 
                  'border-gray-300 text-gray-700'}
              `}
            >
              {label}
              {validationIssues.length > 0 && (
                <span className="ml-1 text-xs">
                  {hasErrors ? '⚠️' : '⚠'}
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

CustomEdge.displayName = 'CustomEdge'