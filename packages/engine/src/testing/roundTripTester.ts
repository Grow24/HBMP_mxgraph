/**
 * Round-Trip Testing Framework
 * Validates complete preservation of functionality and appearance
 * through RF → mxGraph → RF conversions
 */

import type { ExtendedRFGraph, ConversionContext, PreservationMetrics, RoundTripValidationRule } from '../types/preservation';
import { EnhancedRfToMxConverter } from '../converters/enhancedRfToMx';
import { EnhancedMxToRfConverter } from '../converters/enhancedMxToRf';
import { createDefaultStyleRegistry } from '../converters/styleMappingRegistry';

export interface RoundTripTestOptions {
  preservationMode?: 'strict' | 'relaxed' | 'minimal';
  toleranceThreshold?: number; // Position tolerance in pixels
  validateStyles?: boolean;
  validateMetadata?: boolean;
  validateHierarchy?: boolean;
  generateReport?: boolean;
}

export interface RoundTripTestResult {
  success: boolean;
  metrics: PreservationMetrics;
  errors: string[];
  warnings: string[];
  report?: RoundTripTestReport;
  contexts: {
    rfToMx: ConversionContext;
    mxToRf: ConversionContext;
  };
}

export interface RoundTripTestReport {
  summary: {
    totalElements: number;
    preservedElements: number;
    preservationRate: number;
    criticalIssues: number;
    minorIssues: number;
  };
  
  nodeAnalysis: {
    total: number;
    preserved: number;
    positionDeviations: Array<{
      nodeId: string;
      expected: { x: number; y: number };
      actual: { x: number; y: number };
      deviation: number;
    }>;
    styleChanges: Array<{
      nodeId: string;
      property: string;
      expected: any;
      actual: any;
    }>;
    metadataLosses: Array<{
      nodeId: string;
      lostProperties: string[];
    }>;
  };
  
  edgeAnalysis: {
    total: number;
    preserved: number;
    routingChanges: Array<{
      edgeId: string;
      expectedWaypoints: Array<{ x: number; y: number }>;
      actualWaypoints: Array<{ x: number; y: number }>;
      deviationScore: number;
    }>;
    styleChanges: Array<{
      edgeId: string;
      property: string;
      expected: any;
      actual: any;
    }>;
  };
  
  hierarchyAnalysis: {
    laneCount: { expected: number; actual: number };
    parentChildRelationships: {
      preserved: number;
      total: number;
      broken: Array<{
        childId: string;
        expectedParent: string;
        actualParent: string;
      }>;
    };
  };
}

export class RoundTripTester {
  private rfToMxConverter: EnhancedRfToMxConverter;
  private mxToRfConverter: EnhancedMxToRfConverter;
  private validationRules: RoundTripValidationRule[];

  constructor() {
    const styleRegistry = createDefaultStyleRegistry();
    this.rfToMxConverter = new EnhancedRfToMxConverter(styleRegistry);
    this.mxToRfConverter = new EnhancedMxToRfConverter(styleRegistry);
    this.validationRules = this.createValidationRules();
  }

  /**
   * Perform complete round-trip test
   */
  public testRoundTrip(originalGraph: ExtendedRFGraph, options: RoundTripTestOptions = {}): RoundTripTestResult {
    const {
      preservationMode = 'strict',
      toleranceThreshold = 1.0,
      validateStyles = true,
      validateMetadata = true,
      validateHierarchy = true,
      generateReport = true
    } = options;

    try {
      // Step 1: Convert RF → mxGraph
      const { xml, context: rfToMxContext } = this.rfToMxConverter.convert(originalGraph, {
        preservationMode,
        validateConstraints: true
      });

      // Step 2: Convert mxGraph → RF
      const { graph: convertedGraph, context: mxToRfContext } = this.mxToRfConverter.convert(xml, {
        preservationMode,
        validateTypes: true,
        includeValidationState: true
      });

      // Step 3: Validate round-trip integrity
      const validationResult = this.validateRoundTrip(
        originalGraph,
        convertedGraph,
        { rfToMxContext, mxToRfContext },
        options
      );

      // Step 4: Calculate metrics
      const metrics = this.calculatePreservationMetrics(originalGraph, convertedGraph, toleranceThreshold);

      // Step 5: Generate detailed report if requested
      const report = generateReport ? this.generateDetailedReport(
        originalGraph,
        convertedGraph,
        metrics,
        validationResult
      ) : undefined;

      return {
        success: validationResult.isValid && metrics.nodeCount.preserved === metrics.nodeCount.total,
        metrics,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        report,
        contexts: {
          rfToMx: rfToMxContext,
          mxToRf: mxToRfContext
        }
      };

    } catch (error) {
      return {
        success: false,
        metrics: this.createEmptyMetrics(),
        errors: [`Round-trip test failed: ${(error as Error).message}`],
        warnings: [],
        contexts: {
          rfToMx: {} as ConversionContext,
          mxToRf: {} as ConversionContext
        }
      };
    }
  }

  /**
   * Test specific aspects of preservation
   */
  public testPositionPreservation(originalGraph: ExtendedRFGraph, toleranceThreshold = 1.0): {
    success: boolean;
    deviations: Array<{ nodeId: string; deviation: number; expected: any; actual: any }>;
  } {
    const { graph: convertedGraph } = this.performRoundTrip(originalGraph);
    const deviations: Array<{ nodeId: string; deviation: number; expected: any; actual: any }> = [];

    for (const originalNode of originalGraph.nodes) {
      const convertedNode = convertedGraph.nodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );

      if (convertedNode) {
        const deviation = this.calculatePositionDeviation(
          originalNode.position,
          convertedNode.position
        );

        if (deviation > toleranceThreshold) {
          deviations.push({
            nodeId: originalNode.id,
            deviation,
            expected: originalNode.position,
            actual: convertedNode.position
          });
        }
      }
    }

    return {
      success: deviations.length === 0,
      deviations
    };
  }

  public testStylePreservation(originalGraph: ExtendedRFGraph): {
    success: boolean;
    differences: Array<{ elementId: string; property: string; expected: any; actual: any }>;
  } {
    const { graph: convertedGraph } = this.performRoundTrip(originalGraph);
    const differences: Array<{ elementId: string; property: string; expected: any; actual: any }> = [];

    // Test node styles
    for (const originalNode of originalGraph.nodes) {
      const convertedNode = convertedGraph.nodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );

      if (convertedNode && originalNode.data.style) {
        const styleDiffs = this.compareStyles(originalNode.data.style, convertedNode.data.style);
        differences.push(...styleDiffs.map(diff => ({
          elementId: originalNode.id,
          ...diff
        })));
      }
    }

    // Test edge styles
    for (const originalEdge of originalGraph.edges) {
      const convertedEdge = convertedGraph.edges.find(e => 
        e.id === originalEdge.id || 
        e.data?.mxPreservation?.originalMxId === originalEdge.id
      );

      if (convertedEdge && originalEdge.data?.style) {
        const styleDiffs = this.compareStyles(originalEdge.data.style, convertedEdge.data?.style);
        differences.push(...styleDiffs.map(diff => ({
          elementId: originalEdge.id,
          ...diff
        })));
      }
    }

    return {
      success: differences.length === 0,
      differences
    };
  }

  public testLaneHierarchyPreservation(originalGraph: ExtendedRFGraph): {
    success: boolean;
    issues: Array<{ type: string; description: string; elementId?: string }>;
  } {
    const { graph: convertedGraph } = this.performRoundTrip(originalGraph);
    const issues: Array<{ type: string; description: string; elementId?: string }> = [];

    // Check lane count
    const originalLanes = originalGraph.nodes.filter(n => n.data.isLane);
    const convertedLanes = convertedGraph.nodes.filter(n => n.data.isLane);

    if (originalLanes.length !== convertedLanes.length) {
      issues.push({
        type: 'lane_count_mismatch',
        description: `Expected ${originalLanes.length} lanes, got ${convertedLanes.length}`
      });
    }

    // Check parent-child relationships
    for (const originalNode of originalGraph.nodes.filter(n => n.data.laneId)) {
      const convertedNode = convertedGraph.nodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );

      if (convertedNode) {
        if (originalNode.data.laneId !== convertedNode.data.laneId) {
          issues.push({
            type: 'parent_relationship_broken',
            description: `Node ${originalNode.id} parent changed from ${originalNode.data.laneId} to ${convertedNode.data.laneId}`,
            elementId: originalNode.id
          });
        }
      }
    }

    return {
      success: issues.length === 0,
      issues
    };
  }

  /**
   * Validate complete round-trip integrity using validation rules
   */
  private validateRoundTrip(
    originalGraph: ExtendedRFGraph,
    convertedGraph: ExtendedRFGraph,
    contexts: { rfToMxContext: ConversionContext; mxToRfContext: ConversionContext },
    options: RoundTripTestOptions
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Apply validation rules
    for (const rule of this.validationRules) {
      try {
        const result = rule.validate(originalGraph, convertedGraph, contexts.mxToRfContext);
        
        if (!result.isValid) {
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      } catch (error) {
        errors.push(`Validation rule '${rule.name}' failed: ${(error as Error).message}`);
      }
    }

    // Add context errors
    errors.push(...contexts.rfToMxContext.errors.filter(e => e.type === 'error').map(e => e.message));
    errors.push(...contexts.mxToRfContext.errors.filter(e => e.type === 'error').map(e => e.message));
    warnings.push(...contexts.rfToMxContext.errors.filter(e => e.type === 'warning').map(e => e.message));
    warnings.push(...contexts.mxToRfContext.errors.filter(e => e.type === 'warning').map(e => e.message));

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate comprehensive preservation metrics
   */
  private calculatePreservationMetrics(
    originalGraph: ExtendedRFGraph,
    convertedGraph: ExtendedRFGraph,
    toleranceThreshold: number
  ): PreservationMetrics {
    // Node metrics
    const originalNodeCount = originalGraph.nodes.length;
    const convertedNodeCount = convertedGraph.nodes.length;
    const preservedNodes = this.countPreservedNodes(originalGraph.nodes, convertedGraph.nodes, toleranceThreshold);

    // Edge metrics
    const originalEdgeCount = originalGraph.edges.length;
    const convertedEdgeCount = convertedGraph.edges.length;
    const preservedEdges = this.countPreservedEdges(originalGraph.edges, convertedGraph.edges);

    // Style metrics
    const { total: totalStyles, preserved: preservedStyles } = this.countPreservedStyles(originalGraph, convertedGraph);

    // Position accuracy
    const positionAccuracy = this.calculatePositionAccuracy(originalGraph.nodes, convertedGraph.nodes);

    // Metadata preservation
    const { total: totalMetadata, preserved: preservedMetadata } = this.countPreservedMetadata(originalGraph, convertedGraph);

    // Lane hierarchy preservation
    const { total: totalLaneRelations, preserved: preservedLaneRelations } = this.countPreservedLaneHierarchy(originalGraph, convertedGraph);

    return {
      nodeCount: {
        original: originalNodeCount,
        converted: convertedNodeCount,
        preserved: preservedNodes
      },
      edgeCount: {
        original: originalEdgeCount,
        converted: convertedEdgeCount,
        preserved: preservedEdges
      },
      stylePreservation: {
        total: totalStyles,
        preserved: preservedStyles,
        percentage: totalStyles > 0 ? (preservedStyles / totalStyles) * 100 : 100
      },
      positionAccuracy,
      metadataPreservation: {
        total: totalMetadata,
        preserved: preservedMetadata,
        percentage: totalMetadata > 0 ? (preservedMetadata / totalMetadata) * 100 : 100
      },
      laneHierarchyPreservation: {
        total: totalLaneRelations,
        preserved: preservedLaneRelations,
        percentage: totalLaneRelations > 0 ? (preservedLaneRelations / totalLaneRelations) * 100 : 100
      }
    };
  }

  /**
   * Generate comprehensive test report
   */
  private generateDetailedReport(
    originalGraph: ExtendedRFGraph,
    convertedGraph: ExtendedRFGraph,
    metrics: PreservationMetrics,
    validationResult: { isValid: boolean; errors: string[]; warnings: string[] }
  ): RoundTripTestReport {
    return {
      summary: {
        totalElements: originalGraph.nodes.length + originalGraph.edges.length,
        preservedElements: metrics.nodeCount.preserved + metrics.edgeCount.preserved,
        preservationRate: this.calculateOverallPreservationRate(metrics),
        criticalIssues: validationResult.errors.length,
        minorIssues: validationResult.warnings.length
      },
      
      nodeAnalysis: {
        total: originalGraph.nodes.length,
        preserved: metrics.nodeCount.preserved,
        positionDeviations: this.analyzePositionDeviations(originalGraph.nodes, convertedGraph.nodes),
        styleChanges: this.analyzeStyleChanges(originalGraph.nodes, convertedGraph.nodes, 'node'),
        metadataLosses: this.analyzeMetadataLosses(originalGraph.nodes, convertedGraph.nodes, 'node')
      },
      
      edgeAnalysis: {
        total: originalGraph.edges.length,
        preserved: metrics.edgeCount.preserved,
        routingChanges: this.analyzeRoutingChanges(originalGraph.edges, convertedGraph.edges),
        styleChanges: this.analyzeStyleChanges(originalGraph.edges, convertedGraph.edges, 'edge')
      },
      
      hierarchyAnalysis: {
        laneCount: {
          expected: originalGraph.nodes.filter(n => n.data.isLane).length,
          actual: convertedGraph.nodes.filter(n => n.data.isLane).length
        },
        parentChildRelationships: this.analyzeParentChildRelationships(originalGraph, convertedGraph)
      }
    };
  }

  /**
   * Create validation rules for round-trip testing
   */
  private createValidationRules(): RoundTripValidationRule[] {
    return [
      {
        name: 'node_count_preservation',
        description: 'Validates that all nodes are preserved',
        validate: (original, converted) => {
          const originalCount = original.nodes.length;
          const convertedCount = converted.nodes.length;
          
          return {
            isValid: originalCount === convertedCount,
            errors: originalCount !== convertedCount 
              ? [`Node count mismatch: expected ${originalCount}, got ${convertedCount}`]
              : [],
            warnings: []
          };
        }
      },
      
      {
        name: 'edge_count_preservation',
        description: 'Validates that all edges are preserved',
        validate: (original, converted) => {
          const originalCount = original.edges.length;
          const convertedCount = converted.edges.length;
          
          return {
            isValid: originalCount === convertedCount,
            errors: originalCount !== convertedCount
              ? [`Edge count mismatch: expected ${originalCount}, got ${convertedCount}`]
              : [],
            warnings: []
          };
        }
      },
      
      {
        name: 'node_type_preservation',
        description: 'Validates that node types are preserved',
        validate: (original, converted) => {
          const errors: string[] = [];
          
          for (const originalNode of original.nodes) {
            const convertedNode = converted.nodes.find(n => 
              n.id === originalNode.id || 
              n.data.mxPreservation?.originalMxId === originalNode.id
            );
            
            if (!convertedNode) {
              errors.push(`Node ${originalNode.id} not found in converted graph`);
            } else if (originalNode.data.kind !== convertedNode.data.kind) {
              errors.push(`Node ${originalNode.id} type changed from ${originalNode.data.kind} to ${convertedNode.data.kind}`);
            }
          }
          
          return {
            isValid: errors.length === 0,
            errors,
            warnings: []
          };
        }
      },
      
      {
        name: 'lane_hierarchy_preservation',
        description: 'Validates that lane parent-child relationships are preserved',
        validate: (original, converted) => {
          const errors: string[] = [];
          
          for (const originalNode of original.nodes.filter(n => n.data.laneId)) {
            const convertedNode = converted.nodes.find(n => 
              n.id === originalNode.id || 
              n.data.mxPreservation?.originalMxId === originalNode.id
            );
            
            if (convertedNode && originalNode.data.laneId !== convertedNode.data.laneId) {
              errors.push(`Node ${originalNode.id} parent changed from ${originalNode.data.laneId} to ${convertedNode.data.laneId}`);
            }
          }
          
          return {
            isValid: errors.length === 0,
            errors,
            warnings: []
          };
        }
      }
    ];
  }

  /**
   * Helper methods for analysis
   */
  private performRoundTrip(originalGraph: ExtendedRFGraph): { graph: ExtendedRFGraph; xml: string } {
    const { xml } = this.rfToMxConverter.convert(originalGraph);
    const { graph } = this.mxToRfConverter.convert(xml);
    return { graph, xml };
  }

  private calculatePositionDeviation(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  }

  private compareStyles(style1: any, style2: any): Array<{ property: string; expected: any; actual: any }> {
    const differences: Array<{ property: string; expected: any; actual: any }> = [];
    
    if (!style1 || !style2) return differences;
    
    const allProperties = new Set([...Object.keys(style1), ...Object.keys(style2)]);
    
    for (const property of allProperties) {
      if (style1[property] !== style2[property]) {
        differences.push({
          property,
          expected: style1[property],
          actual: style2[property]
        });
      }
    }
    
    return differences;
  }

  private countPreservedNodes(originalNodes: any[], convertedNodes: any[], toleranceThreshold: number): number {
    let preserved = 0;
    
    for (const originalNode of originalNodes) {
      const convertedNode = convertedNodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );
      
      if (convertedNode) {
        const deviation = this.calculatePositionDeviation(originalNode.position, convertedNode.position);
        if (deviation <= toleranceThreshold && originalNode.data.kind === convertedNode.data.kind) {
          preserved++;
        }
      }
    }
    
    return preserved;
  }

  private countPreservedEdges(originalEdges: any[], convertedEdges: any[]): number {
    let preserved = 0;
    
    for (const originalEdge of originalEdges) {
      const convertedEdge = convertedEdges.find(e => 
        e.id === originalEdge.id || 
        e.data?.mxPreservation?.originalMxId === originalEdge.id
      );
      
      if (convertedEdge && originalEdge.source === convertedEdge.source && originalEdge.target === convertedEdge.target) {
        preserved++;
      }
    }
    
    return preserved;
  }

  private countPreservedStyles(originalGraph: ExtendedRFGraph, convertedGraph: ExtendedRFGraph): { total: number; preserved: number } {
    let total = 0;
    let preserved = 0;
    
    // Count node styles
    for (const originalNode of originalGraph.nodes) {
      if (originalNode.data.style) {
        const convertedNode = convertedGraph.nodes.find(n => 
          n.id === originalNode.id || 
          n.data.mxPreservation?.originalMxId === originalNode.id
        );
        
        if (convertedNode?.data.style) {
          const styleProps = Object.keys(originalNode.data.style);
          total += styleProps.length;
          
          for (const prop of styleProps) {
            if (originalNode.data.style[prop] === convertedNode.data.style[prop]) {
              preserved++;
            }
          }
        }
      }
    }
    
    // Count edge styles
    for (const originalEdge of originalGraph.edges) {
      if (originalEdge.data?.style) {
        const convertedEdge = convertedGraph.edges.find(e => 
          e.id === originalEdge.id || 
          e.data?.mxPreservation?.originalMxId === originalEdge.id
        );
        
        if (convertedEdge?.data?.style) {
          const styleProps = Object.keys(originalEdge.data.style);
          total += styleProps.length;
          
          for (const prop of styleProps) {
            if (originalEdge.data.style[prop] === convertedEdge.data.style[prop]) {
              preserved++;
            }
          }
        }
      }
    }
    
    return { total, preserved };
  }

  private calculatePositionAccuracy(originalNodes: any[], convertedNodes: any[]): { maxDeviation: number; avgDeviation: number } {
    const deviations: number[] = [];
    
    for (const originalNode of originalNodes) {
      const convertedNode = convertedNodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );
      
      if (convertedNode) {
        const deviation = this.calculatePositionDeviation(originalNode.position, convertedNode.position);
        deviations.push(deviation);
      }
    }
    
    return {
      maxDeviation: deviations.length > 0 ? Math.max(...deviations) : 0,
      avgDeviation: deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0
    };
  }

  private countPreservedMetadata(originalGraph: ExtendedRFGraph, convertedGraph: ExtendedRFGraph): { total: number; preserved: number } {
    let total = 0;
    let preserved = 0;
    
    for (const originalNode of originalGraph.nodes) {
      if (originalNode.data.metadata) {
        const convertedNode = convertedGraph.nodes.find(n => 
          n.id === originalNode.id || 
          n.data.mxPreservation?.originalMxId === originalNode.id
        );
        
        if (convertedNode?.data.metadata) {
          const metadataKeys = Object.keys(originalNode.data.metadata);
          total += metadataKeys.length;
          
          for (const key of metadataKeys) {
            if (JSON.stringify(originalNode.data.metadata[key]) === JSON.stringify(convertedNode.data.metadata[key])) {
              preserved++;
            }
          }
        }
      }
    }
    
    return { total, preserved };
  }

  private countPreservedLaneHierarchy(originalGraph: ExtendedRFGraph, convertedGraph: ExtendedRFGraph): { total: number; preserved: number } {
    const originalRelations = originalGraph.nodes.filter(n => n.data.laneId);
    let preserved = 0;
    
    for (const originalNode of originalRelations) {
      const convertedNode = convertedGraph.nodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );
      
      if (convertedNode && originalNode.data.laneId === convertedNode.data.laneId) {
        preserved++;
      }
    }
    
    return { total: originalRelations.length, preserved };
  }

  private calculateOverallPreservationRate(metrics: PreservationMetrics): number {
    const totalElements = metrics.nodeCount.original + metrics.edgeCount.original;
    const preservedElements = metrics.nodeCount.preserved + metrics.edgeCount.preserved;
    
    return totalElements > 0 ? (preservedElements / totalElements) * 100 : 100;
  }

  private analyzePositionDeviations(originalNodes: any[], convertedNodes: any[]): Array<{
    nodeId: string;
    expected: { x: number; y: number };
    actual: { x: number; y: number };
    deviation: number;
  }> {
    const deviations: Array<{
      nodeId: string;
      expected: { x: number; y: number };
      actual: { x: number; y: number };
      deviation: number;
    }> = [];
    
    for (const originalNode of originalNodes) {
      const convertedNode = convertedNodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );
      
      if (convertedNode) {
        const deviation = this.calculatePositionDeviation(originalNode.position, convertedNode.position);
        
        if (deviation > 0) {
          deviations.push({
            nodeId: originalNode.id,
            expected: originalNode.position,
            actual: convertedNode.position,
            deviation
          });
        }
      }
    }
    
    return deviations.sort((a, b) => b.deviation - a.deviation);
  }

  private analyzeStyleChanges(originalElements: any[], convertedElements: any[], type: 'node' | 'edge'): Array<{
    nodeId: string;
    property: string;
    expected: any;
    actual: any;
  }> {
    const changes: Array<{
      nodeId: string;
      property: string;
      expected: any;
      actual: any;
    }> = [];
    
    for (const originalElement of originalElements) {
      const convertedElement = convertedElements.find((e: any) => 
        e.id === originalElement.id || 
        e.data?.mxPreservation?.originalMxId === originalElement.id
      );
      
      if (convertedElement) {
        const originalStyle = type === 'node' ? originalElement.data?.style : originalElement.data?.style;
        const convertedStyle = type === 'node' ? convertedElement.data?.style : convertedElement.data?.style;
        
        if (originalStyle && convertedStyle) {
          const styleDiffs = this.compareStyles(originalStyle, convertedStyle);
          changes.push(...styleDiffs.map(diff => ({
            nodeId: originalElement.id,
            ...diff
          })));
        }
      }
    }
    
    return changes;
  }

  private analyzeMetadataLosses(originalNodes: any[], convertedNodes: any[], type: 'node'): Array<{
    nodeId: string;
    lostProperties: string[];
  }> {
    const losses: Array<{
      nodeId: string;
      lostProperties: string[];
    }> = [];
    
    for (const originalNode of originalNodes) {
      const convertedNode = convertedNodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );
      
      if (convertedNode && originalNode.data.metadata) {
        const originalKeys = Object.keys(originalNode.data.metadata);
        const convertedKeys = Object.keys(convertedNode.data.metadata || {});
        const lostProperties = originalKeys.filter(key => !convertedKeys.includes(key));
        
        if (lostProperties.length > 0) {
          losses.push({
            nodeId: originalNode.id,
            lostProperties
          });
        }
      }
    }
    
    return losses;
  }

  private analyzeRoutingChanges(originalEdges: any[], convertedEdges: any[]): Array<{
    edgeId: string;
    expectedWaypoints: Array<{ x: number; y: number }>;
    actualWaypoints: Array<{ x: number; y: number }>;
    deviationScore: number;
  }> {
    const changes: Array<{
      edgeId: string;
      expectedWaypoints: Array<{ x: number; y: number }>;
      actualWaypoints: Array<{ x: number; y: number }>;
      deviationScore: number;
    }> = [];
    
    for (const originalEdge of originalEdges) {
      const convertedEdge = convertedEdges.find(e => 
        e.id === originalEdge.id || 
        e.data?.mxPreservation?.originalMxId === originalEdge.id
      );
      
      if (convertedEdge) {
        const originalWaypoints = originalEdge.points || [];
        const convertedWaypoints = convertedEdge.points || [];
        
        // Calculate deviation score
        let deviationScore = 0;
        const maxLength = Math.max(originalWaypoints.length, convertedWaypoints.length);
        
        for (let i = 0; i < maxLength; i++) {
          const originalPoint = originalWaypoints[i] || { x: 0, y: 0 };
          const convertedPoint = convertedWaypoints[i] || { x: 0, y: 0 };
          deviationScore += this.calculatePositionDeviation(originalPoint, convertedPoint);
        }
        
        if (deviationScore > 0) {
          changes.push({
            edgeId: originalEdge.id,
            expectedWaypoints: originalWaypoints,
            actualWaypoints: convertedWaypoints,
            deviationScore
          });
        }
      }
    }
    
    return changes.sort((a, b) => b.deviationScore - a.deviationScore);
  }

  private analyzeParentChildRelationships(originalGraph: ExtendedRFGraph, convertedGraph: ExtendedRFGraph): {
    preserved: number;
    total: number;
    broken: Array<{
      childId: string;
      expectedParent: string;
      actualParent: string;
    }>;
  } {
    const originalRelations = originalGraph.nodes.filter(n => n.data.laneId);
    const broken: Array<{
      childId: string;
      expectedParent: string;
      actualParent: string;
    }> = [];
    
    let preserved = 0;
    
    for (const originalNode of originalRelations) {
      const convertedNode = convertedGraph.nodes.find(n => 
        n.id === originalNode.id || 
        n.data.mxPreservation?.originalMxId === originalNode.id
      );
      
      if (convertedNode) {
        if (originalNode.data.laneId === convertedNode.data.laneId) {
          preserved++;
        } else {
          broken.push({
            childId: originalNode.id,
            expectedParent: originalNode.data.laneId!,
            actualParent: convertedNode.data.laneId || 'none'
          });
        }
      }
    }
    
    return {
      preserved,
      total: originalRelations.length,
      broken
    };
  }

  private createEmptyMetrics(): PreservationMetrics {
    return {
      nodeCount: { original: 0, converted: 0, preserved: 0 },
      edgeCount: { original: 0, converted: 0, preserved: 0 },
      stylePreservation: { total: 0, preserved: 0, percentage: 0 },
      positionAccuracy: { maxDeviation: 0, avgDeviation: 0 },
      metadataPreservation: { total: 0, preserved: 0, percentage: 0 },
      laneHierarchyPreservation: { total: 0, preserved: 0, percentage: 0 }
    };
  }
}

/**
 * Convenience function for snapshot testing
 */
export function expectRoundTripMatch(originalGraph: ExtendedRFGraph, toleranceThreshold = 1.0): void {
  const tester = new RoundTripTester();
  const result = tester.testRoundTrip(originalGraph, { toleranceThreshold });
  
  if (!result.success) {
    throw new Error(`Round-trip test failed:\nErrors: ${result.errors.join('\n')}\nWarnings: ${result.warnings.join('\n')}`);
  }
}