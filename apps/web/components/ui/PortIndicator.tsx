'use client'

import React, { memo } from 'react'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type { NetworkPort } from '@hbmp/engine'

// Port type to color and icon mapping
const PORT_STYLES = {
  data: {
    color: 'bg-blue-500 border-blue-600',
    textColor: 'text-blue-50',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: '📊'
  },
  control: {
    color: 'bg-gray-500 border-gray-600', 
    textColor: 'text-gray-50',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '⚙️'
  },
  event: {
    color: 'bg-amber-500 border-amber-600',
    textColor: 'text-amber-50', 
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: '⚡'
  },
  api: {
    color: 'bg-lime-500 border-lime-600',
    textColor: 'text-lime-50',
    bgColor: 'bg-lime-50', 
    badgeColor: 'bg-lime-100 text-lime-700 border-lime-300',
    icon: '🔗'
  },
  error: {
    color: 'bg-red-500 border-red-600',
    textColor: 'text-red-50',
    bgColor: 'bg-red-50',
    badgeColor: 'bg-red-100 text-red-700 border-red-300', 
    icon: '❌'
  }
} as const

interface PortIndicatorProps {
  port: NetworkPort
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  showIcon?: boolean
  variant?: 'default' | 'minimal' | 'detailed'
  className?: string
}

export const PortIndicator = memo(({
  port,
  size = 'medium',
  showLabel = false,
  showIcon = true,
  variant = 'default',
  className
}: PortIndicatorProps) => {
  const styles = PORT_STYLES[port.type as keyof typeof PORT_STYLES] || PORT_STYLES.data
  
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-2 h-2 text-xs'
      case 'large': 
        return 'w-4 h-4 text-sm'
      default:
        return 'w-3 h-3 text-xs'
    }
  }
  
  const getDirectionIndicator = () => {
    switch (port.direction) {
      case 'in':
        return '◀'
      case 'out':
        return '▶'
      case 'bidirectional':
        return '⟷'
      default:
        return '●'
    }
  }
  
  if (variant === 'minimal') {
    return (
      <div 
        className={cn(
          "rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 hover:scale-110",
          styles.color,
          getSizeClasses(),
          className
        )}
        title={`${port.label} (${port.type}${port.dataType ? `: ${port.dataType}` : ''})`}
      >
        <span className={cn("font-bold", styles.textColor, size === 'small' ? 'text-xs' : '')}>
          {showIcon ? (showIcon === true ? getDirectionIndicator() : styles.icon) : getDirectionIndicator()}
        </span>
      </div>
    )
  }
  
  if (variant === 'detailed') {
    return (
      <div className={cn("flex items-center space-x-2 p-2 rounded-lg", styles.bgColor, className)}>
        <div 
          className={cn(
            "rounded-full border-2 border-white flex items-center justify-center flex-shrink-0",
            styles.color,
            getSizeClasses()
          )}
        >
          <span className={cn("font-bold", styles.textColor)}>
            {showIcon ? styles.icon : getDirectionIndicator()}
          </span>
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="font-medium text-sm truncate">{port.label}</div>
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <span>{port.type}</span>
            {port.dataType && (
              <>
                <span>•</span>
                <span>{port.dataType}</span>
              </>
            )}
            <span>•</span>
            <span className="capitalize">{port.direction}</span>
            {port.required && (
              <>
                <span>•</span>
                <span className="text-red-600 font-medium">Required</span>
              </>
            )}
          </div>
        </div>
        
        {port.multiple && (
          <Badge variant="secondary" className="text-xs">
            Multi
          </Badge>
        )}
      </div>
    )
  }
  
  // Default variant
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div 
        className={cn(
          "rounded-full border-2 border-white flex items-center justify-center transition-all duration-200 hover:scale-110",
          styles.color,
          getSizeClasses()
        )}
        title={`${port.label} (${port.type}${port.dataType ? `: ${port.dataType}` : ''})`}
      >
        <span className={cn("font-bold", styles.textColor)}>
          {showIcon ? styles.icon : getDirectionIndicator()}
        </span>
      </div>
      
      {showLabel && (
        <Badge className={cn("text-xs px-2 py-1", styles.badgeColor)}>
          {port.label}
        </Badge>
      )}
    </div>
  )
})

PortIndicator.displayName = 'PortIndicator'

// Utility component for port lists
interface PortListProps {
  ports: NetworkPort[]
  direction?: 'in' | 'out' | 'all'
  variant?: 'default' | 'minimal' | 'detailed'
  className?: string
}

export const PortList = memo(({
  ports,
  direction = 'all',
  variant = 'default',
  className
}: PortListProps) => {
  const filteredPorts = ports.filter(port => 
    direction === 'all' || port.direction === direction
  )
  
  if (filteredPorts.length === 0) {
    return (
      <div className={cn("text-xs text-gray-400 italic", className)}>
        No {direction === 'all' ? '' : direction} ports
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-1", className)}>
      {filteredPorts.map((port) => (
        <PortIndicator
          key={port.id}
          port={port}
          variant={variant}
          showLabel={variant !== 'minimal'}
          showIcon={true}
        />
      ))}
    </div>
  )
})

PortList.displayName = 'PortList'