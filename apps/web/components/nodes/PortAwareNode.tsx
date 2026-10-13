'use client'

import React, { memo, useCallback, useMemo } from 'react'
import { Handle, NodeResizer, Position, NodeProps } from 'reactflow'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { HBMP_NETWORK_REGISTRY } from '@hbmp/engine'
import type { NetworkPort, NetworkNodeType } from '@hbmp/engine'
import type { NodeKind, ValidationIssue } from '@hbmp/shared-types'

// Port type to color mapping for visual distinction
const PORT_COLORS = {
  data: { primary: '#3b82f6', secondary: '#dbeafe' },      // Blue
  control: { primary: '#6b7280', secondary: '#f3f4f6' },   // Gray  
  event: { primary: '#f59e0b', secondary: '#fef3c7' },     // Amber
  api: { primary: '#84cc16', secondary: '#ecfccb' },       // Lime
  error: { primary: '#ef4444', secondary: '#fee2e2' },     // Red
} as const

// Port type icons (using simple shapes for now)
const PORT_ICONS = {
  data: '●',
  control: '◆', 
  event: '▲',
  api: '■',
  error: '✕'
} as const

interface PortAwareNodeData {
  label: string
  kind: NodeKind
  validationIssues?: ValidationIssue[]
  [key: string]: any
}

interface PortAwareNodeProps extends NodeProps<PortAwareNodeData> {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

interface PortHandleProps {
  port: NetworkPort
  nodeType: string
  position: Position
  index: number
  total: number
  isConnectable?: boolean
}

// Individual port handle component with type-specific styling
const PortHandle = memo(({ port, nodeType, position, index, total, isConnectable = true }: PortHandleProps) => {
  const colors = PORT_COLORS[port.type as keyof typeof PORT_COLORS] || PORT_COLORS.data
  const icon = PORT_ICONS[port.type as keyof typeof PORT_ICONS] || PORT_ICONS.data
  
  // Calculate position offset for multiple ports
  const getPositionStyle = () => {
    if (total === 1) return {}
    
    const spacing = Math.min(80 / total, 30) // Max 30px spacing between ports
    const totalWidth = (total - 1) * spacing
    const startOffset = -totalWidth / 2
    const offset = startOffset + (index * spacing)
    
    if (position === Position.Left || position === Position.Right) {
      return { top: `calc(50% + ${offset}px)` }
    } else {
      return { left: `calc(50% + ${offset}px)` }
    }
  }
  
  return (
    <Handle
      type={port.direction === 'in' ? 'target' : 'source'}
      position={position}
      id={port.id}
      className={cn(
        "w-3 h-3 border-2 border-white transition-all duration-200",
        "hover:scale-125 hover:border-gray-300",
        isConnectable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      )}
      style={{
        backgroundColor: colors.primary,
        borderColor: 'white',
        width: 14,
        height: 14,
        zIndex: 5,
        ...getPositionStyle()
      }}
      isConnectable={isConnectable}
      data-port-type={port.type}
      data-port-direction={port.direction}
      data-data-type={port.dataType}
      title={`${port.label} (${port.type}${port.dataType ? `: ${port.dataType}` : ''})`}
    >
      <div 
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white font-bold"
        style={{ fontSize: '8px' }}
      >
        {icon}
      </div>
    </Handle>
  )
})

PortHandle.displayName = 'PortHandle'

// Port label component for detailed view
const PortLabel = memo(({ port, position }: { port: NetworkPort; position: Position }) => {
  const colors = PORT_COLORS[port.type as keyof typeof PORT_COLORS] || PORT_COLORS.data
  
  const getLabelPosition = () => {
    switch (position) {
      case Position.Left:
        return 'absolute left-4 top-1/2 transform -translate-y-1/2 text-xs'
      case Position.Right:
        return 'absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-right'
      case Position.Top:
        return 'absolute top-2 left-1/2 transform -translate-x-1/2 text-xs'
      case Position.Bottom:
        return 'absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs'
      default:
        return 'text-xs'
    }
  }
  
  return (
    <div className={cn(getLabelPosition(), "pointer-events-none")}>
      <Badge 
        variant="secondary" 
        className="text-xs px-1 py-0"
        style={{ 
          backgroundColor: colors.secondary, 
          color: colors.primary,
          borderColor: colors.primary 
        }}
      >
        {port.label}
      </Badge>
    </div>
  )
})

PortLabel.displayName = 'PortLabel'

// Main port-aware node component
export const PortAwareNode = memo(({ 
  data, 
  selected, 
  children, 
  className,
  variant = 'default'
}: PortAwareNodeProps) => {
  const { label, kind, validationIssues = [] } = data
  
  // Get node type definition from registry
  const nodeTypeDef = useMemo(() => {
    return HBMP_NETWORK_REGISTRY.nodeTypes[kind] || null
  }, [kind])
  
  // Validation status
  const hasErrors = validationIssues.some(issue => issue.level === 'error')
  const hasWarnings = validationIssues.some(issue => issue.level === 'warn')
  
  // Group ports by direction and position
  const { inputPorts, outputPorts, eventPorts, controlPorts } = useMemo(() => {
    if (!nodeTypeDef) return { inputPorts: [], outputPorts: [], eventPorts: [], controlPorts: [] }
    
    const inputs = nodeTypeDef.ports.filter(p => p.direction === 'in')
    const outputs = nodeTypeDef.ports.filter(p => p.direction === 'out')
    const events = nodeTypeDef.ports.filter(p => p.type === 'event')
    const controls = nodeTypeDef.ports.filter(p => p.type === 'control')
    
    return {
      inputPorts: inputs,
      outputPorts: outputs, 
      eventPorts: events,
      controlPorts: controls
    }
  }, [nodeTypeDef])
  
  // Get node styling from registry
  const nodeStyle = useMemo(() => {
    if (!nodeTypeDef?.visual) return {}
    
    const visual = nodeTypeDef.visual
    return {
      minWidth: visual.minSize?.width || 100,
      minHeight: visual.minSize?.height || 60,
      backgroundColor: visual.defaultStyle?.backgroundColor,
      borderColor: visual.defaultStyle?.borderColor,
      color: visual.defaultStyle?.color
    }
  }, [nodeTypeDef])
  
  // Render port handles based on registry definition
  const renderPorts = useCallback(() => {
    if (!nodeTypeDef) return null
    
    const handles = []
    
    // Input ports (left side)
    inputPorts.forEach((port, index) => {
      handles.push(
        <PortHandle
          key={`input-${port.id}`}
          port={port}
          nodeType={kind}
          position={Position.Left}
          index={index}
          total={inputPorts.length}
        />
      )
      
      if (variant === 'detailed') {
        handles.push(
          <PortLabel
            key={`input-label-${port.id}`}
            port={port}
            position={Position.Left}
          />
        )
      }
    })
    
    // Output ports (right side)  
    outputPorts.forEach((port, index) => {
      handles.push(
        <PortHandle
          key={`output-${port.id}`}
          port={port}
          nodeType={kind}
          position={Position.Right}
          index={index}
          total={outputPorts.length}
        />
      )
      
      if (variant === 'detailed') {
        handles.push(
          <PortLabel
            key={`output-label-${port.id}`}
            port={port}
            position={Position.Right}
          />
        )
      }
    })
    
    return handles
  }, [nodeTypeDef, kind, inputPorts, outputPorts, variant])
  
  if (!nodeTypeDef) {
    // Fallback for unregistered node types
    return (
      <Card className={cn("min-w-[100px] bg-gray-100 border-gray-300", className)}>
        <div className="p-3">
          <div className="font-medium text-sm text-gray-600">{label}</div>
          <div className="text-xs text-gray-400 mt-1">Unknown type: {kind}</div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card 
      className={cn(
        "relative h-full w-full transition-all duration-200 border-2",
        selected ? "ring-2 ring-blue-500 ring-opacity-50" : "",
        hasErrors ? "border-red-500 bg-red-50" : "",
        hasWarnings ? "border-yellow-500 bg-yellow-50" : "",
        !hasErrors && !hasWarnings ? "border-gray-200 hover:border-gray-300" : "",
        className
      )}
      style={{ ...nodeStyle, width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={72}
        lineClassName="border-blue-400"
        handleClassName="h-2 w-2 bg-blue-500"
      />
      {/* Main content area */}
      <div className={cn(
        "p-3 relative",
        variant === 'detailed' ? "px-8" : "px-3" // Extra padding for port labels
      )}>
        <div className="font-medium text-sm">{label}</div>
        
        {variant !== 'compact' && (
          <>
            <div className="text-xs text-gray-500 mt-1 capitalize">{nodeTypeDef.category}</div>
            
            {nodeTypeDef.description && variant === 'detailed' && (
              <div className="text-xs text-gray-400 mt-2">{nodeTypeDef.description}</div>
            )}
          </>
        )}
        
        {/* Validation indicators */}
        {validationIssues.length > 0 && (
          <div className="flex gap-1 mt-2">
            {hasErrors && <Badge variant="destructive" className="text-xs">Errors</Badge>}
            {hasWarnings && <Badge variant="secondary" className="text-xs">Warnings</Badge>}
          </div>
        )}
        
        {/* Custom content */}
        {children}
      </div>
      
      {/* Render all port handles */}
      {renderPorts()}
      
      {/* Port count indicator for compact view */}
      {variant === 'compact' && (inputPorts.length > 0 || outputPorts.length > 0) && (
        <div className="absolute -top-2 -right-2">
          <Badge className="text-xs px-1 py-0 bg-blue-500 text-white">
            {inputPorts.length + outputPorts.length}
          </Badge>
        </div>
      )}
    </Card>
  )
})

PortAwareNode.displayName = 'PortAwareNode'