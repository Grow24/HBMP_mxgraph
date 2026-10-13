'use client'

import { useCallback, useMemo } from 'react'
import { Connection, Edge, Node, useReactFlow } from 'reactflow'
import { HBMP_NETWORK_REGISTRY } from '@hbmp/engine'
import type { NetworkNodeType, NetworkPort, ConnectionRule } from '@hbmp/engine'
import type { NodeKind } from '@hbmp/shared-types'

export interface ConnectionValidationResult {
  isValid: boolean
  reason?: string
  level: 'error' | 'warning' | 'info'
  suggestions?: string[]
}

export interface ConnectionAttempt {
  sourceNodeId: string
  sourcePortId?: string
  targetNodeId: string
  targetPortId?: string
  sourceNodeType: NodeKind
  targetNodeType: NodeKind
}

/**
 * Hook for validating connections using the Network Type Registry
 */
export function useConnectionValidation() {
  const { getNodes, getEdges } = useReactFlow()
  
  // Get node type definition from registry
  const getNodeTypeDef = useCallback((nodeType: NodeKind): NetworkNodeType | null => {
    return HBMP_NETWORK_REGISTRY.nodeTypes[nodeType] || null
  }, [])
  
  // Get port definition from node type
  const getPortDef = useCallback((nodeType: NodeKind, portId: string): NetworkPort | null => {
    const nodeTypeDef = getNodeTypeDef(nodeType)
    if (!nodeTypeDef) return null
    
    return nodeTypeDef.ports.find(port => port.id === portId) || null
  }, [getNodeTypeDef])
  
  // Check if connection is allowed by registry rules
  const checkRegistryRules = useCallback((attempt: ConnectionAttempt): ConnectionValidationResult => {
    const sourceNodeDef = getNodeTypeDef(attempt.sourceNodeType)
    const targetNodeDef = getNodeTypeDef(attempt.targetNodeType)
    
    if (!sourceNodeDef || !targetNodeDef) {
      return {
        isValid: false,
        reason: 'Unknown node type in connection',
        level: 'error'
      }
    }
    
    // Check allowed targets
    if (sourceNodeDef.allowedTargets && !sourceNodeDef.allowedTargets.includes(attempt.targetNodeType)) {
      return {
        isValid: false,
        reason: `${sourceNodeDef.name} cannot connect to ${targetNodeDef.name}`,
        level: 'error',
        suggestions: [`Try connecting to: ${sourceNodeDef.allowedTargets.join(', ')}`]
      }
    }
    
    // Check allowed sources  
    if (targetNodeDef.allowedSources && !targetNodeDef.allowedSources.includes(attempt.sourceNodeType)) {
      return {
        isValid: false,
        reason: `${targetNodeDef.name} cannot receive connections from ${sourceNodeDef.name}`,
        level: 'error',
        suggestions: [`${targetNodeDef.name} accepts connections from: ${targetNodeDef.allowedSources.join(', ')}`]
      }
    }
    
    return { isValid: true, level: 'info' }
  }, [getNodeTypeDef])
  
  // Check port type compatibility
  const checkPortCompatibility = useCallback((attempt: ConnectionAttempt): ConnectionValidationResult => {
    if (!attempt.sourcePortId || !attempt.targetPortId) {
      return { isValid: true, level: 'info' } // Skip if no specific ports
    }
    
    const sourcePort = getPortDef(attempt.sourceNodeType, attempt.sourcePortId)
    const targetPort = getPortDef(attempt.targetNodeType, attempt.targetPortId)
    const sourceNodeDef = getNodeTypeDef(attempt.sourceNodeType)

    // Visual handles such as "target" or "source-right" are not registry port ids.
    // The node-type rule already decided this pair is allowed.
    if (!sourcePort || !targetPort) {
      return { isValid: true, level: 'info' }
    }

    const nodePairAllowed = sourceNodeDef?.allowedTargets?.includes(attempt.targetNodeType)

    // Task → Decision is a process line. Landing on the Yes/No dot still counts
    // as a connection into the decision; onConnect moves it to the input port.
    if (nodePairAllowed && (sourcePort.direction !== 'out' || targetPort.direction !== 'in')) {
      return { isValid: true, level: 'info' }
    }
    
    // Check port directions
    if (sourcePort.direction !== 'out') {
      return {
        isValid: false,
        reason: `Source port '${sourcePort.label}' is not an output port`,
        level: 'error'
      }
    }
    
    if (targetPort.direction !== 'in') {
      return {
        isValid: false,
        reason: `Target port '${targetPort.label}' is not an input port`,
        level: 'error'
      }
    }
    
    // Check port type compatibility
    if (sourcePort.type !== targetPort.type) {
      // Some types are compatible (e.g., data can flow to API)
      const compatibleTypes: Record<string, string[]> = {
        'data': ['data', 'api'],
        'api': ['data', 'api'],
        'control': ['control', 'event'],
        'event': ['control', 'event']
      }
      
      const allowedTargets = compatibleTypes[sourcePort.type] || [sourcePort.type]
      
      if (!allowedTargets.includes(targetPort.type) && !nodePairAllowed) {
        return {
          isValid: false,
          reason: `Cannot connect ${sourcePort.type} port to ${targetPort.type} port`,
          level: 'error',
          suggestions: [`${sourcePort.type} ports can connect to: ${allowedTargets.join(', ')}`]
        }
      }
    }
    
    // Check data type compatibility. "any" matches every type, and a pair the
    // registry already allows (Task → Decision, Decision → Task) is a process line.
    if (sourcePort.dataType && targetPort.dataType && sourcePort.dataType !== targetPort.dataType) {
      const eitherIsAny = sourcePort.dataType === 'any' || targetPort.dataType === 'any'
      const compatibleDataTypes: Record<string, string[]> = {
        'dataset': ['dataset', 'object', 'any'],
        'object': ['object', 'any', 'dataset'],
        'any': ['any', 'dataset', 'object']
      }
      const allowedDataTypes = compatibleDataTypes[sourcePort.dataType] || [sourcePort.dataType]

      if (!eitherIsAny && !nodePairAllowed && !allowedDataTypes.includes(targetPort.dataType)) {
        return {
          isValid: true,
          reason: `Data type mismatch: ${sourcePort.dataType} → ${targetPort.dataType}`,
          level: 'warning',
          suggestions: [`Consider adding a data transform node between these ports`]
        }
      }
    }
    
    return { isValid: true, level: 'info' }
  }, [getPortDef, getNodeTypeDef])
  
  // Check connection multiplicity constraints
  const checkMultiplicityRules = useCallback((attempt: ConnectionAttempt): ConnectionValidationResult => {
    const nodes = getNodes()
    const edges = getEdges()
    
    const sourceNode = nodes.find(n => n.id === attempt.sourceNodeId)
    const targetNode = nodes.find(n => n.id === attempt.targetNodeId)
    
    if (!sourceNode || !targetNode) {
      return { isValid: false, reason: 'Node not found', level: 'error' }
    }
    
    // Check source port multiplicity
    if (attempt.sourcePortId) {
      const sourcePort = getPortDef(attempt.sourceNodeType, attempt.sourcePortId)
      if (sourcePort && !sourcePort.multiple) {
        const existingConnections = edges.filter(edge => 
          edge.source === attempt.sourceNodeId && edge.sourceHandle === attempt.sourcePortId
        )
        
        if (existingConnections.length > 0) {
          return {
            isValid: false,
            reason: `Port '${sourcePort.label}' already has a connection`,
            level: 'error',
            suggestions: ['Remove existing connection first', 'Use a different output port']
          }
        }
      }
    }
    
    // Check target port multiplicity
    if (attempt.targetPortId) {
      const targetPort = getPortDef(attempt.targetNodeType, attempt.targetPortId)
      if (targetPort && !targetPort.multiple) {
        const existingConnections = edges.filter(edge => 
          edge.target === attempt.targetNodeId && edge.targetHandle === attempt.targetPortId
        )
        
        if (existingConnections.length > 0) {
          return {
            isValid: false,
            reason: `Port '${targetPort.label}' already has a connection`,
            level: 'error',
            suggestions: ['Remove existing connection first', 'Use a different input port']
          }
        }
      }
    }
    
    return { isValid: true, level: 'info' }
  }, [getNodes, getEdges, getPortDef])
  
  // Check for cycles (if not allowed by registry)
  const checkCycleRules = useCallback((attempt: ConnectionAttempt): ConnectionValidationResult => {
    if (HBMP_NETWORK_REGISTRY.globalRules?.allowCycles) {
      return { isValid: true, level: 'info' }
    }
    
    const edges = getEdges()
    
    // Simple cycle detection - check if target can reach source
    const canReach = (from: string, to: string, visited = new Set<string>()): boolean => {
      if (from === to) return true
      if (visited.has(from)) return false
      
      visited.add(from)
      
      const outgoingEdges = edges.filter(edge => edge.source === from)
      return outgoingEdges.some(edge => canReach(edge.target, to, visited))
    }
    
    if (canReach(attempt.targetNodeId, attempt.sourceNodeId)) {
      return {
        isValid: false,
        reason: 'Connection would create a cycle',
        level: 'error',
        suggestions: ['Cycles are not allowed in this network type']
      }
    }
    
    return { isValid: true, level: 'info' }
  }, [getEdges])
  
  // If the line is dropped on an output dot, attach it to that node's input instead.
  const prepareConnection = useCallback((connection: Connection): Connection => {
    const nodes = getNodes()
    const sourceNode = nodes.find(n => n.id === connection.source)
    const targetNode = nodes.find(n => n.id === connection.target)
    if (!sourceNode || !targetNode) return connection

    const sourceDef = getNodeTypeDef(sourceNode.data?.kind as NodeKind)
    const targetDef = getNodeTypeDef(targetNode.data?.kind as NodeKind)
    if (!sourceDef?.ports || !targetDef?.ports) return connection

    let sourceHandle = connection.sourceHandle
    let targetHandle = connection.targetHandle
    const sourcePort = sourceHandle ? sourceDef.ports.find(port => port.id === sourceHandle) : undefined
    const targetPort = targetHandle ? targetDef.ports.find(port => port.id === targetHandle) : undefined

    if (sourcePort && sourcePort.direction !== 'out') {
      sourceHandle = sourceDef.ports.find(port => port.direction === 'out')?.id ?? sourceHandle
    }
    if (targetPort && targetPort.direction !== 'in') {
      targetHandle = targetDef.ports.find(port => port.direction === 'in')?.id ?? targetHandle
    }

    return { ...connection, sourceHandle, targetHandle }
  }, [getNodes, getNodeTypeDef])

  // Main validation function
  const validateConnection = useCallback((connection: Connection): ConnectionValidationResult => {
    if (connection.source && connection.source === connection.target) {
      return { isValid: false, reason: 'A node cannot connect to itself', level: 'error' }
    }

    const nodes = getNodes()
    
    const sourceNode = nodes.find(n => n.id === connection.source)
    const targetNode = nodes.find(n => n.id === connection.target)
    
    if (!sourceNode || !targetNode) {
      return {
        isValid: false,
        reason: 'Source or target node not found',
        level: 'error'
      }
    }
    
    const attempt: ConnectionAttempt = {
      sourceNodeId: connection.source!,
      sourcePortId: connection.sourceHandle || undefined,
      targetNodeId: connection.target!,
      targetPortId: connection.targetHandle || undefined,
      sourceNodeType: sourceNode.data?.kind as NodeKind,
      targetNodeType: targetNode.data?.kind as NodeKind
    }
    
    // Run all validation checks
    const checks = [
      checkRegistryRules(attempt),
      checkPortCompatibility(attempt),
      checkMultiplicityRules(attempt),
      checkCycleRules(attempt)
    ]
    
    // Find first failing check
    const failedCheck = checks.find(check => !check.isValid)
    if (failedCheck) {
      return failedCheck
    }
    
    // Find warnings
    const warningCheck = checks.find(check => check.level === 'warning')
    if (warningCheck) {
      return warningCheck
    }
    
    return { isValid: true, level: 'info' }
  }, [getNodes, checkRegistryRules, checkPortCompatibility, checkMultiplicityRules, checkCycleRules])
  
  // Check if connection is valid (for onConnect)
  const isValidConnection = useCallback((connection: Connection): boolean => {
    return validateConnection(connection).isValid
  }, [validateConnection])
  
  // Get connection suggestions for a node
  const getConnectionSuggestions = useCallback((nodeId: string) => {
    const nodes = getNodes()
    const sourceNode = nodes.find(n => n.id === nodeId)
    
    if (!sourceNode) return []
    
    const sourceNodeDef = getNodeTypeDef(sourceNode.data?.kind as NodeKind)
    if (!sourceNodeDef) return []
    
    return nodes
      .filter(n => n.id !== nodeId)
      .filter(n => {
        const targetType = n.data?.kind as NodeKind
        return sourceNodeDef.allowedTargets?.includes(targetType)
      })
      .map(n => ({
        nodeId: n.id,
        nodeType: n.data?.kind as NodeKind,
        label: n.data?.label || n.id
      }))
  }, [getNodes, getNodeTypeDef])
  
  return {
    validateConnection,
    prepareConnection,
    isValidConnection,
    getConnectionSuggestions,
    getNodeTypeDef,
    getPortDef
  }
}