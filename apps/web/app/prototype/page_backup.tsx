'use client'

import React, { useState, useCallback, useRef, useEffect, DragEvent } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { dbService } from '@/lib/dbService';
import { enhancedSwimlaneEngine, SwimlaneLayoutOptions } from '@/lib/enhancedSwimlaneEngine';
import { tokenSimulator, TokenAnimationState, EventTrigger } from '@/lib/tokenSimulator';
import { AdvancedTokenAnimator, AdvancedAnimationState, MultiLevelAnimation } from '@/lib/advancedTokenAnimator';
import { enhancedFlowAnimator, FlowAnimationState } from '@/lib/enhancedFlowAnimator';

// Import our custom node components
import { ProcessTaskNode } from '@/components/nodes/ProcessTaskNode';
import { GatewayNode } from '@/components/nodes/GatewayNode';
import { EventNode } from '@/components/nodes/EventNode';
import { DatasetNode } from '@/components/nodes/DatasetNode';
import { ServiceNode } from '@/components/nodes/ServiceNode';
import { ReportNode } from '@/components/nodes/ReportNode';
import { ApiNode } from '@/components/nodes/ApiNode';
import { DbNode } from '@/components/nodes/DbNode';
import { LaneNode } from '@/components/nodes/LaneNode';
import { FlowStartNode } from '@/components/nodes/FlowStartNode';
import { FlowDecisionNode } from '@/components/nodes/FlowDecisionNode';
import { FlowActionNode } from '@/components/nodes/FlowActionNode';
import { FlowEndNode } from '@/components/nodes/FlowEndNode';
import { FlowProcessNode } from '@/components/nodes/FlowProcessNode';
import { FlowTableNode } from '@/components/nodes/FlowTableNode';
import { FlowConfigDrawer } from '@/components/flow/FlowConfigDrawer';
import { FlowExecutionPanel } from '@/components/flow/FlowExecutionPanel';
import { flowExecutionEngine, FlowExecutionState } from '@/lib/flowExecutionEngine';
import { transformToN8n, downloadN8nWorkflow, getWorkflowSummary } from '@/lib/n8nTransformer';
import { ViewToggle } from '@/components/ViewToggle';
import { useAppStore } from '@/lib/store';
import { NetworkGraphView } from '@/components/NetworkGraphView';

// Register node types for the prototype (memoized to prevent recreating)
const nodeTypes = {
  processTask: ProcessTaskNode,
  gateway: GatewayNode,
  event: EventNode,
  dataset: DatasetNode,
  service: ServiceNode,
  report: ReportNode,
  api: ApiNode,
  db: DbNode,
  lane: LaneNode,
  flowStart: FlowStartNode,
  flowDecision: FlowDecisionNode,
  flowAction: FlowActionNode,
  flowEnd: FlowEndNode,
  flowProcess: FlowProcessNode,
  flowTable: FlowTableNode,
  // Legacy aliases for backward compatibility
  task: ProcessTaskNode,
  database: DatasetNode,
};

// Sample initial nodes with swimlanes
const initialNodes: Node[] = [
  // Swimlane 1: Customer Service
  {
    id: 'lane-1',
    type: 'lane',
    position: { x: 50, y: 50 },
    data: { 
      label: 'Customer Service', 
      description: 'Customer interaction processes',
      department: 'Support',
      owner: 'John Doe',
      width: 900,
      height: 180,
      backgroundColor: '#e0f2fe',
      borderColor: '#0288d1'
    },
    dragHandle: '.lane-header',
  },
  // Swimlane 2: Back Office
  {
    id: 'lane-2',
    type: 'lane',
    position: { x: 50, y: 280 },
    data: { 
      label: 'Back Office', 
      description: 'Internal processing and validation',
      department: 'Operations',
      owner: 'Jane Smith',
      width: 900,
      height: 180,
      backgroundColor: '#f3e5f5',
      borderColor: '#7b1fa2'
    },
    dragHandle: '.lane-header',
  },
  
  // Process nodes in Customer Service lane
  {
    id: '1',
    type: 'event',
    position: { x: 100, y: 120 },
    data: { label: 'Request Received', description: 'Customer request initiation', laneId: 'lane-1' },
    parentNode: 'lane-1',
    extent: 'parent',
  },
  {
    id: '2',
    type: 'processTask',
    position: { x: 250, y: 120 },
    data: { 
      label: 'Validate Request', 
      description: 'Initial request validation', 
      laneId: 'lane-1',
      events: [
        { type: 'onSuccess', action: 'Route to Gateway', description: 'Validation passed, continue flow', enabled: true },
        { type: 'onFailure', action: 'Send Error Response', description: 'Validation failed, notify customer', enabled: true },
        { type: 'onTimeout', action: 'Escalate to Manager', description: 'Processing took too long', enabled: false }
      ] as EventTrigger[],
      status: 'idle'
    },
    parentNode: 'lane-1',
    extent: 'parent',
  },
  {
    id: '3',
    type: 'gateway',
    position: { x: 450, y: 120 },
    data: { label: 'Valid?', description: 'Request validation check', laneId: 'lane-1' },
    parentNode: 'lane-1',
    extent: 'parent',
  },
  
  // Process nodes in Back Office lane
  {
    id: '4',
    type: 'processTask',
    position: { x: 250, y: 350 },
    data: { 
      label: 'Process Application', 
      description: 'Detailed processing', 
      laneId: 'lane-2',
      events: [
        { type: 'onSuccess', action: 'Update Database', description: 'Processing completed successfully', enabled: true },
        { type: 'onFailure', action: 'Rollback Transaction', description: 'Processing failed, undo changes', enabled: true },
        { type: 'onRetry', action: 'Retry with Backoff', description: 'Automatic retry with delay', enabled: true }
      ] as EventTrigger[],
      status: 'idle'
    },
    parentNode: 'lane-2',
    extent: 'parent',
  },
  {
    id: '5',
    type: 'db',
    position: { x: 450, y: 350 },
    data: { label: 'Update Records', description: 'Database update', laneId: 'lane-2' },
    parentNode: 'lane-2',
    extent: 'parent',
  },
  {
    id: '6',
    type: 'api',
    position: { x: 650, y: 350 },
    data: { label: 'Send Notification', description: 'API call to notification service', laneId: 'lane-2' },
    parentNode: 'lane-2',
    extent: 'parent',
  },
  {
    id: '7',
    type: 'event',
    position: { x: 800, y: 350 },
    data: { label: 'Process Complete', description: 'End of process', laneId: 'lane-2' },
    parentNode: 'lane-2',
    extent: 'parent',
  },
];

// Sample initial edges connecting the swimlane process
const initialEdges: Edge[] = [
  // Within Customer Service lane - proper sequential flow
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#0ea5e9', strokeWidth: 2 }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#0ea5e9', strokeWidth: 2 }
  },
  
  // Cross-lane connection (Customer Service to Back Office)
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4', 
    label: 'Approved', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#7b1fa2', strokeWidth: 2 }
  },
  
  // Within Back Office lane - proper sequential flow
  { 
    id: 'e4-5', 
    source: '4', 
    target: '5', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#9333ea', strokeWidth: 2 }
  },
  { 
    id: 'e5-6', 
    source: '5', 
    target: '6', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#9333ea', strokeWidth: 2 }
  },
  { 
    id: 'e6-7', 
    source: '6', 
    target: '7', 
    animated: true, 
    type: 'smoothstep',
    style: { stroke: '#9333ea', strokeWidth: 2 }
  },
];

// Node palette items including swimlanes
const paletteItems = [
  { type: 'lane', label: 'Swimlane', icon: '🏊', color: 'bg-cyan-100', category: 'Structure' },
  { type: 'processTask', label: 'Task', icon: '📝', color: 'bg-blue-100', category: 'Process' },
  { type: 'gateway', label: 'Gateway', icon: '◊', color: 'bg-yellow-100', category: 'Process' },
  { type: 'event', label: 'Event', icon: '●', color: 'bg-green-100', category: 'Process' },
  { type: 'dataset', label: 'Dataset', icon: '🗄️', color: 'bg-purple-100', category: 'Data' },
  { type: 'db', label: 'Database', icon: '🗃️', color: 'bg-gray-100', category: 'Data' },
  { type: 'api', label: 'API', icon: '🔌', color: 'bg-teal-100', category: 'Data' },
  { type: 'service', label: 'Service', icon: '⚙️', color: 'bg-indigo-100', category: 'Data' },
  { type: 'report', label: 'Report', icon: '📊', color: 'bg-red-100', category: 'Data' },
  { type: 'flowStart', label: 'Flow Start', icon: '▶️', color: 'bg-green-200', category: 'Flow Builder' },
  { type: 'flowAction', label: 'Flow Action', icon: '⚡', color: 'bg-blue-200', category: 'Flow Builder' },
  { type: 'flowDecision', label: 'Flow Decision', icon: '◆', color: 'bg-yellow-200', category: 'Flow Builder' },
  { type: 'flowProcess', label: 'Flow Process', icon: '⚙️', color: 'bg-purple-200', category: 'Flow Builder' },
  { type: 'flowTable', label: 'Flow Table', icon: '📊', color: 'bg-indigo-200', category: 'Flow Builder' },
  { type: 'flowEnd', label: 'Flow End', icon: '⏹️', color: 'bg-red-200', category: 'Flow Builder' },
];

function PrototypePageContent() {
  const { canvasMode } = useAppStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [newNodeData, setNewNodeData] = useState({ label: '', description: '', type: 'processTask' });
  
  // Enhanced Features State
  const [tokenAnimation, setTokenAnimation] = useState<TokenAnimationState>({
    isRunning: false,
    currentStep: 0,
    steps: []
  });

  const [advancedAnimation, setAdvancedAnimation] = useState<AdvancedAnimationState>({
    isRunning: false,
    currentStep: 0,
    activeElements: { swimlanes: new Set(), nodes: new Set(), edges: new Set() },
    animationLevels: [],
    progress: 0
  });

  const [flowAnimation, setFlowAnimation] = useState<FlowAnimationState>({
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    progress: 0
  });
  const [layoutOptions, setLayoutOptions] = useState<SwimlaneLayoutOptions>({
    paddingX: 40,
    paddingY: 60,
    headerHeight: 40,
    nodeSpacing: 30,
    direction: 'LR',
    autoConnect: false
  });
  const [showLayoutResults, setShowLayoutResults] = useState(false);
  const [layoutMetadata, setLayoutMetadata] = useState<any>(null);
  const [showFlowConfig, setShowFlowConfig] = useState(false);
  const [configNodeType, setConfigNodeType] = useState<'flowStart' | 'flowAction' | 'flowDecision' | 'flowEnd'>('flowAction');
  const [configNodeData, setConfigNodeData] = useState<any>({});
  const [flowExecution, setFlowExecution] = useState<FlowExecutionState>({
    isRunning: false,
    currentStep: 0,
    steps: [],
    variables: {},
    logs: []
  });

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const reactFlowInstance = useReactFlow();

  // Initialize enhanced flow animator
  useEffect(() => {
    if (reactFlowInstance) {
      enhancedFlowAnimator.setReactFlowInstance(reactFlowInstance);
      enhancedFlowAnimator.setStateChangeCallback(setFlowAnimation);
    }
  }, [reactFlowInstance]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes((nds) => 
      nds.map(node => 
        node.id === nodeId 
          ? { ...node, ...updates, data: { ...node.data, ...updates.data } }
          : node
      )
    );
    console.log('Updated node:', nodeId);
  }, [setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (node.type?.startsWith('flow') && node.type !== 'flowStart' && node.type !== 'flowEnd') {
      setConfigNodeType(node.type as any);
      setConfigNodeData(node.data);
      setShowFlowConfig(true);
    }
  }, []);

  const handleFlowConfigSave = useCallback((data: any) => {
    if (selectedNode) {
      updateNode(selectedNode.id, { data });
    }
  }, [selectedNode, updateNode]);

  const executeFlow = useCallback(async () => {
    flowExecutionEngine.setStateCallback(setFlowExecution);
    try {
      await flowExecutionEngine.executeFlow(nodes, edges, { startTime: Date.now() });
    } catch (error) {
      console.error('Flow execution error:', error);
    }
  }, [nodes, edges]);

  const stopFlowExecution = useCallback(() => {
    flowExecutionEngine.stopExecution();
  }, []);

  // Drag and Drop handlers
  const onDragStart = useCallback((event: DragEvent, nodeType: string) => {
    setDraggedType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!draggedType || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const parentLaneId = findParentLane(position);
      
      const newNode: Node = {
        id: `${draggedType}-${Date.now()}`,
        type: draggedType,
        position,
        data: {
          label: `New ${draggedType.charAt(0).toUpperCase() + draggedType.slice(1).replace(/([A-Z])/g, ' $1')}`,
          description: `Dragged ${draggedType} node`,
          ...(parentLaneId && { laneId: parentLaneId }), // Add lane ID to data
          ...(draggedType === 'lane' ? {
            width: 800,
            height: 180,
            backgroundColor: '#f0f9ff',
            borderColor: '#0ea5e9'
          } : {})
        },
        ...(draggedType === 'lane' ? {} : {
          parentNode: parentLaneId,
          extent: parentLaneId ? 'parent' as const : undefined,
        })
      };

      setNodes((nds) => nds.concat(newNode));
      setDraggedType(null);
    },
    [draggedType, project, setNodes]
  );

  // Find which lane a position falls into
  const findParentLane = useCallback((position: { x: number; y: number }) => {
    const lane = nodes.find(node => 
      node.type === 'lane' && 
      position.x >= node.position.x && 
      position.x <= node.position.x + (node.data.width || 800) &&
      position.y >= node.position.y && 
      position.y <= node.position.y + (node.data.height || 180)
    );
    return lane?.id;
  }, [nodes]);

  // Add new node from palette
  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      data: { 
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}`,
        description: `Auto-generated ${type} node`
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  // Validate diagram
  const validateDiagram = useCallback(() => {
    const issues: string[] = [];
    
    // Check for isolated nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id));
    if (isolatedNodes.length > 0) {
      issues.push(`${isolatedNodes.length} isolated node(s) found`);
    }

    // Check for start/end events
    const startEvents = nodes.filter(node => node.type === 'event' && node.data.label?.toLowerCase().includes('start'));
    const endEvents = nodes.filter(node => node.type === 'event' && node.data.label?.toLowerCase().includes('end'));
    
    if (startEvents.length === 0) issues.push('No start event found');
    if (endEvents.length === 0) issues.push('No end event found');
    
    setValidationIssues(issues);
  }, [nodes, edges]);

  // Auto-layout function using mxGraph engine
  const autoLayout = useCallback(async (algorithm: 'hierarchical' | 'swimlane' = 'hierarchical') => {
    console.log(`Starting ${algorithm} layout with ${nodes.length} nodes and ${edges.length} edges`);
    setIsLayouting(true);
    
    try {
      const graphData = { nodes, edges };
      
      const response = await fetch('/api/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph: graphData,
          options: {
            laneAware: algorithm === 'swimlane',
            orientation: 'LR'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Layout API response:', result);
        
        if (result.graph && result.graph.nodes) {
          console.log('Applying layout with', result.graph.nodes.length, 'nodes');
          setNodes(result.graph.nodes);
          if (result.graph.edges) {
            setEdges(result.graph.edges);
          }
        } else {
          console.warn('Invalid response format from layout API');
          simpleAutoLayout();
        }
      } else {
        const errorText = await response.text();
        console.warn('Layout API failed with status:', response.status, errorText);
        simpleAutoLayout();
      }
    } catch (error) {
      console.error('Layout error:', error);
      simpleAutoLayout();
    } finally {
      setIsLayouting(false);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Simple fallback layout with relaxed constraints
  const simpleAutoLayout = useCallback(() => {
    const laneNodes = nodes.filter(n => n.type === 'lane');
    const processNodes = nodes.filter(n => n.type !== 'lane');
    
    // Layout lanes vertically
    let currentY = 50;
    const laneSpacing = 220;
    
    const layoutNodes = [...nodes];
    
    laneNodes.forEach((lane, index) => {
      const laneNode = layoutNodes.find(n => n.id === lane.id);
      if (laneNode) {
        laneNode.position.y = currentY;
        laneNode.position.x = 50;
        // Ensure lanes remain draggable
        laneNode.draggable = true;
        laneNode.selectable = true;
      }
      
      // Layout nodes within this lane
      const nodesInLane = processNodes.filter(n => 
        n.parentNode === lane.id || (n.data && n.data.laneId === lane.id)
      );
      let x = 130; // More padding from lane edge
      const nodeSpacing = 160;
      
      nodesInLane.forEach((node, nodeIndex) => {
        const processNode = layoutNodes.find(n => n.id === node.id);
        if (processNode) {
          processNode.position.x = x + (nodeIndex * nodeSpacing);
          processNode.position.y = currentY + 80;
          processNode.parentNode = lane.id;
          processNode.extent = 'parent';
          processNode.draggable = true;
          processNode.selectable = true;
          if (processNode.data) {
            processNode.data.laneId = lane.id;
          }
        }
      });
      
      currentY += laneSpacing;
    });
    
    setNodes(layoutNodes);
    console.log('Simple layout applied with relaxed constraints');
  }, [nodes, setNodes]);

  // ✨ ENHANCED LAYOUT - Feature 1: Complete Autofit in Swimlane
  const enhancedAutofit = useCallback(() => {
    console.log('🚀 Starting Enhanced Swimlane Autofit...');
    setIsLayouting(true);
    
    try {
      const result = enhancedSwimlaneEngine.layoutSwimlanes(nodes, edges);
      
      // Update nodes and edges
      setNodes(result.nodes);
      setEdges(result.edges);
      
      // Store metadata for display
      setLayoutMetadata(result.metadata);
      setShowLayoutResults(true);
      
      console.log('✅ Enhanced autofit complete:', result.metadata);
      
      // Auto-hide results after 5 seconds
      setTimeout(() => {
        setShowLayoutResults(false);
      }, 5000);
      
    } catch (error) {
      console.error('Enhanced layout error:', error);
    } finally {
      setIsLayouting(false);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // 🎬 TOKEN ANIMATION - Feature 6: Token Simulation
  const startTokenAnimation = useCallback(() => {
    console.log('🎬 Starting token animation...');
    
    tokenSimulator.startSimulation(
      nodes,
      edges,
      (state) => {
        setTokenAnimation(state);
        console.log('Token animation state:', state);
      },
      1500 // 1.5 seconds per step
    );
  }, [nodes, edges]);

  const stopTokenAnimation = useCallback(() => {
    tokenSimulator.stopSimulation();
    setTokenAnimation({
      isRunning: false,
      currentStep: 0,
      steps: []
    });
  }, []);

  const runAdvancedAnimation = useCallback(async (levels: MultiLevelAnimation[]) => {
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];
      
      setAdvancedAnimation(prev => ({ 
        ...prev, 
        currentStep: levelIndex,
        progress: ((levelIndex + 1) / levels.length) * 100 
      }));

      console.log(`🎯 Level ${levelIndex + 1}: ${level.type} (${level.steps.length} steps)`);

      // Process steps ONE BY ONE in sequence
      for (let stepIndex = 0; stepIndex < level.steps.length; stepIndex++) {
        const step = level.steps[stepIndex];
        
        // Subtle zoom to current element (nodes only, not swimlanes)
        if (reactFlowInstance && step.elementType === 'node') {
          const node = nodes.find(n => n.id === step.elementId);
          if (node) {
            reactFlowInstance.setCenter(
              node.position.x + 50, 
              node.position.y + 25, 
              { zoom: 1.1, duration: 500 }
            );
          }
        }
        
        // If cross-lane edge, focus on target swimlane
        if (reactFlowInstance && step.elementType === 'edge' && step.targetLaneId) {
          const targetLane = nodes.find(n => n.id === step.targetLaneId);
          if (targetLane) {
            reactFlowInstance.setCenter(
              targetLane.position.x + 400,
              targetLane.position.y + 90,
              { zoom: 0.9, duration: 600 }
            );
          }
        }
        
        // Update active elements
        setAdvancedAnimation(prev => {
          const newActiveElements = { ...prev.activeElements };
          if (step.elementType === 'swimlane') {
            newActiveElements.swimlanes.add(step.elementId);
          } else if (step.elementType === 'node') {
            newActiveElements.nodes.add(step.elementId);
          } else if (step.elementType === 'edge') {
            newActiveElements.edges.add(step.elementId);
          }
          return { ...prev, activeElements: newActiveElements };
        });

        // Apply border highlight
        const element = document.querySelector(`[data-id="${step.elementId}"]`) as HTMLElement;
        
        if (element) {
          const colors: Record<string, string> = {
            blue: '#3b82f6',
            green: '#10b981',
            amber: '#f59e0b',
            red: '#ef4444',
            purple: '#a855f7'
          };
          
          const color = colors[step.color] || colors.green;
          const originalBorder = element.style.border;
          const originalBoxShadow = element.style.boxShadow;
          
          element.style.border = `3px solid ${color}`;
          element.style.boxShadow = `0 0 20px ${color}80`;
          element.style.transition = 'all 0.5s ease-in-out';
          
          console.log(`✨ [${stepIndex + 1}/${level.steps.length}] ${step.elementType} ${step.elementId}`);
          
          setTimeout(() => {
            element.style.border = originalBorder;
            element.style.boxShadow = originalBoxShadow;
          }, step.duration);
        }

        // Wait for full duration before next step (slower)
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // Pause between levels
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Reset zoom
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ duration: 600, padding: 0.1 });
    }

    console.log('🎊 Animation Complete!');
    setAdvancedAnimation({
      isRunning: false,
      currentStep: 0,
      activeElements: { swimlanes: new Set(), nodes: new Set(), edges: new Set() },
      animationLevels: [],
      progress: 100
    });
    
    setTimeout(() => {
      setAdvancedAnimation(prev => ({ ...prev, progress: 0 }));
    }, 2000);
  }, [nodes, reactFlowInstance]);

  // 🌟 ADVANCED MULTI-LEVEL ANIMATION - Feature 7: Complex Flow Visualization
  const startAdvancedAnimation = useCallback(async () => {
    console.log('🌟 Starting Advanced Multi-Level Animation...');
    
    if (nodes.length === 0) {
      alert('Please add some nodes first');
      return;
    }

    try {
      const animator = new AdvancedTokenAnimator();
      const animationLevels = animator.generateComplexFlowPath(nodes, edges);
      
      setAdvancedAnimation({
        isRunning: true,
        currentStep: 0,
        activeElements: { swimlanes: new Set(), nodes: new Set(), edges: new Set() },
        animationLevels,
        progress: 0
      });

      await runAdvancedAnimation(animationLevels);
    } catch (error) {
      console.error('Advanced animation error:', error);
      alert('Error starting advanced animation');
    }
  }, [nodes, edges, runAdvancedAnimation]);

  const stopAdvancedAnimation = useCallback(() => {
    console.log('🛑 Stopping Advanced Animation...');
    setAdvancedAnimation({
      isRunning: false,
      currentStep: 0,
      activeElements: { swimlanes: new Set(), nodes: new Set(), edges: new Set() },
      animationLevels: [],
      progress: 0
    });
  }, []);

  // 🎬 ENHANCED FLOW SIMULATION - With Camera Movement
  const startEnhancedFlowSimulation = useCallback(async () => {
    console.log('🎬 Starting Enhanced Flow Simulation with Camera Movement...');
    
    if (nodes.length === 0) {
      alert('Please add some nodes and swimlanes first');
      return;
    }

    await enhancedFlowAnimator.startAnimation(nodes, edges);
  }, [nodes, edges]);

  const stopEnhancedFlowSimulation = useCallback(() => {
    console.log('🛑 Stopping Enhanced Flow Simulation...');
    enhancedFlowAnimator.stopAnimation();
  }, []);

  const toggleAutoConnect = useCallback(() => {
    const newOptions = {
      ...layoutOptions,
      autoConnect: !layoutOptions.autoConnect
    };
    setLayoutOptions(newOptions);
    enhancedSwimlaneEngine.updateOptions(newOptions);
  }, [layoutOptions]);

  // 🔧 FIX EDGE VISIBILITY - Toggle between strict parenting and loose positioning
  const [useStrictParenting, setUseStrictParenting] = useState(true);
  
  const toggleEdgeVisibility = useCallback(() => {
    const updatedNodes = nodes.map(node => {
      if (node.type === 'lane') return node; // Keep lanes as is
      
      if (useStrictParenting) {
        // Remove parent constraints for better edge visibility
        const { parentNode, extent, ...nodeWithoutParent } = node;
        return {
          ...nodeWithoutParent,
          data: {
            ...node.data,
            laneId: node.parentNode // Keep lane reference in data
          }
        };
      } else {
        // Restore parent constraints
        const laneId = node.data?.laneId;
        if (laneId) {
          return {
            ...node,
            parentNode: laneId,
            extent: 'parent' as const
          };
        }
        return node;
      }
    });
    
    setNodes(updatedNodes);
    setUseStrictParenting(!useStrictParenting);
    console.log(`Edge visibility mode: ${!useStrictParenting ? 'Strict Parenting' : 'Loose Positioning'}`);
  }, [nodes, setNodes, useStrictParenting]);

  // Save positions to database
  const savePositions = useCallback(async () => {
    try {
      const diagramId = 'prototype-diagram';
      await dbService.saveDiagramLayout({
        diagramId,
        nodes: nodes,
        edges: edges,
        layoutType: 'manual'
      });
      
      // Also save individual node positions
      const nodePositions = nodes.map(node => ({
        nodeId: node.id,
        x: node.position.x,
        y: node.position.y,
        width: (node.data as any)?.width,
        height: (node.data as any)?.height,
        parentNodeId: (node as any).parentNode,
        laneId: node.data?.laneId,
        layoutType: 'manual' as const
      }));
      
      await dbService.saveNodePositions(diagramId, nodePositions);
      console.log('Positions saved to database');
    } catch (error) {
      console.error('Error saving positions:', error);
    }
  }, [nodes, edges]);

  // Load positions from database
  const loadPositions = useCallback(async () => {
    try {
      const diagramId = 'prototype-diagram';
      const layout = await dbService.getDiagramLayout(diagramId);
      
      if (layout && layout.nodes && layout.edges) {
        setNodes(layout.nodes);
        setEdges(layout.edges);
        console.log('Positions loaded from database');
      } else {
        console.log('No saved layout found');
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  }, [setNodes, setEdges]);

  // Load saved positions on component mount
  useEffect(() => {
    const loadSavedLayout = async () => {
      try {
        await dbService.init();
        const layout = await dbService.getDiagramLayout('prototype-diagram');
        
        if (layout && layout.nodes && layout.nodes.length > 0) {
          console.log('Loading saved diagram from database');
          setNodes(layout.nodes);
          setEdges(layout.edges || []);
          return; // Don't use initial data if we have saved data
        }
        console.log('No saved layout found, using initial data');
      } catch (error) {
        console.error('Error loading saved positions:', error);
      }
    };
    
    loadSavedLayout();
  }, []); // Run only once on mount

  // Auto-save positions when nodes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0) {
        savePositions();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, savePositions]);

  // Auto-connect nodes in sequence within each lane and between lanes
  const autoConnectNodes = useCallback(() => {
    const laneNodes = nodes.filter(n => n.type === 'lane').sort((a, b) => a.position.y - b.position.y);
    const newEdges: Edge[] = [...edges];
    let connectionsCreated = 0;
    
    // Connect nodes within each lane
    laneNodes.forEach((lane, laneIndex) => {
      const nodesInLane = nodes
        .filter(n => (n.parentNode === lane.id || n.data?.laneId === lane.id) && n.type !== 'lane')
        .sort((a, b) => a.position.x - b.position.x); // Sort by x position for proper flow
      
      console.log(`Lane ${lane.id}: processing ${nodesInLane.length} nodes`);
      
      // Create sequential connections within the lane
      for (let i = 0; i < nodesInLane.length - 1; i++) {
        const sourceNode = nodesInLane[i];
        const targetNode = nodesInLane[i + 1];
        const edgeId = `auto-lane-${lane.id}-${i}-${i+1}`;
        
        // Check if connection already exists
        const existingEdge = newEdges.find(e => 
          (e.source === sourceNode.id && e.target === targetNode.id) ||
          e.id === edgeId
        );
        
        if (!existingEdge) {
          const laneColor = laneIndex === 0 ? '#0ea5e9' : '#9333ea';
          newEdges.push({
            id: edgeId,
            source: sourceNode.id,
            target: targetNode.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: laneColor, strokeWidth: 2 }
          });
          connectionsCreated++;
          console.log(`  Connected: ${sourceNode.id} -> ${targetNode.id}`);
        }
      }
      
      // Connect last node of this lane to first node of next lane
      if (laneIndex < laneNodes.length - 1 && nodesInLane.length > 0) {
        const currentLaneLastNode = nodesInLane[nodesInLane.length - 1];
        const nextLane = laneNodes[laneIndex + 1];
        const nextLaneNodes = nodes
          .filter(n => (n.parentNode === nextLane.id || n.data?.laneId === nextLane.id) && n.type !== 'lane')
          .sort((a, b) => a.position.x - b.position.x);
        
        if (nextLaneNodes.length > 0) {
          const nextLaneFirstNode = nextLaneNodes[0];
          const crossLaneEdgeId = `cross-lane-${laneIndex}-${laneIndex + 1}`;
          
          const existingCrossEdge = newEdges.find(e => 
            (e.source === currentLaneLastNode.id && e.target === nextLaneFirstNode.id) ||
            e.id === crossLaneEdgeId
          );
          
          if (!existingCrossEdge) {
            newEdges.push({
              id: crossLaneEdgeId,
              source: currentLaneLastNode.id,
              target: nextLaneFirstNode.id,
              type: 'smoothstep',
              animated: true,
              label: 'Cross-lane',
              style: { stroke: '#7b1fa2', strokeWidth: 2, strokeDasharray: '5,5' }
            });
            connectionsCreated++;
            console.log(`  Cross-lane connection: ${currentLaneLastNode.id} -> ${nextLaneFirstNode.id}`);
          }
        }
      }
    });
    
    setEdges(newEdges);
    console.log(`Auto-connected nodes: ${connectionsCreated} connections created`);
  }, [nodes, edges, setEdges]);

  // CRUD Operations for Nodes
  const createNode = useCallback((nodeData: { label: string; description: string; type: string; laneId?: string }) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeData.type,
      position: { 
        x: Math.random() * 400 + 200, 
        y: Math.random() * 300 + 200 
      },
      data: { 
        label: nodeData.label,
        description: nodeData.description,
        laneId: nodeData.laneId
      },
      ...(nodeData.laneId ? {
        parentNode: nodeData.laneId,
        extent: 'parent' as const,
      } : {})
    };
    
    setNodes((nds) => [...nds, newNode]);
    console.log('Created new node:', newNode);
    return newNode;
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    console.log('Deleted node:', nodeId);
  }, [setNodes, setEdges]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (nodeToDuplicate) {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: `${nodeToDuplicate.id}-copy-${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 150,
          y: nodeToDuplicate.position.y + 50
        },
        data: {
          ...nodeToDuplicate.data,
          label: `${nodeToDuplicate.data.label} (Copy)`
        }
      };
      setNodes((nds) => [...nds, newNode]);
      console.log('Duplicated node:', newNode);
    }
  }, [nodes, setNodes]);

  // CRUD Operations for Swimlanes
  const createSwimlane = useCallback((laneData: { label: string; description: string; department?: string; owner?: string }) => {
    const existingLanes = nodes.filter(n => n.type === 'lane');
    const newLaneY = existingLanes.length > 0 
      ? Math.max(...existingLanes.map(l => l.position.y + (l.data?.height || 200))) + 50
      : 50;

    const newLane: Node = {
      id: `lane-${Date.now()}`,
      type: 'lane',
      position: { x: 50, y: newLaneY },
      data: { 
        label: laneData.label,
        description: laneData.description,
        department: laneData.department || 'New Department',
        owner: laneData.owner || 'Unassigned',
        width: 900,
        height: 200,
        backgroundColor: '#f0f9ff',
        borderColor: '#0ea5e9'
      },
      dragHandle: '.lane-header',
    };
    
    setNodes((nds) => [...nds, newLane]);
    console.log('Created new swimlane:', newLane);
    return newLane;
  }, [nodes, setNodes]);

  const deleteSwimlane = useCallback((laneId: string) => {
    // Move nodes from deleted lane to unassigned
    setNodes((nds) => 
      nds.map(node => 
        node.parentNode === laneId 
          ? { ...node, parentNode: undefined, extent: undefined }
          : node
      ).filter(node => node.id !== laneId)
    );
    console.log('Deleted swimlane and moved nodes:', laneId);
  }, [setNodes]);

  // Fix swimlane dragging by ensuring proper constraints
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // Allow free movement for swimlanes and unconstrained nodes
    if (node.type === 'lane' || !node.parentNode) {
      return;
    }
    
    // For nodes with parents, ensure they stay within bounds
    const parentNode = nodes.find(n => n.id === node.parentNode);
    if (parentNode) {
      const parentBounds = {
        x: parentNode.position.x,
        y: parentNode.position.y,
        width: parentNode.data?.width || 900,
        height: parentNode.data?.height || 200
      };
      
      // Update constraints dynamically
      node.extent = [
        [parentBounds.x + 10, parentBounds.y + 50],
        [parentBounds.x + parentBounds.width - 100, parentBounds.y + parentBounds.height - 50]
      ] as any;
    }
  }, [nodes]);

  // Handle modal operations
  const openCreateModal = useCallback(() => {
    setNewNodeData({ label: '', description: '', type: 'processTask' });
    setShowCreateModal(true);
  }, []);

  const openEditModal = useCallback((node: Node) => {
    setEditingNode(node);
    setNewNodeData({
      label: node.data.label || '',
      description: node.data.description || '',
      type: node.type || 'processTask'
    });
    setShowEditModal(true);
  }, []);

  const handleCreateSubmit = useCallback(() => {
    if (newNodeData.label.trim()) {
      createNode(newNodeData);
      setShowCreateModal(false);
      setNewNodeData({ label: '', description: '', type: 'processTask' });
    }
  }, [newNodeData, createNode]);

  const handleEditSubmit = useCallback(() => {
    if (editingNode && newNodeData.label.trim()) {
      updateNode(editingNode.id, {
        type: newNodeData.type,
        data: {
          label: newNodeData.label,
          description: newNodeData.description
        }
      });
      setShowEditModal(false);
      setEditingNode(null);
    }
  }, [editingNode, newNodeData, updateNode]);

  // Export diagram (mock function)
  const exportDiagram = useCallback((format: string) => {
    savePositions(); // Save before export
    alert(`Exporting diagram as ${format.toUpperCase()}... (This is a prototype feature)`);
  }, [savePositions]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Node Palette */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Node Palette</h3>
        <div className="space-y-3">
          {/* Group palette items by category */}
          {['Structure', 'Process', 'Data', 'Flow Builder'].map(category => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
              <div className="space-y-1">
                {paletteItems.filter(item => item.category === category).map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type)}
                    onClick={() => addNode(item.type)}
                    className={`w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-grab active:cursor-grabbing ${item.color}`}
                    title={`Drag to canvas or click to add ${item.label}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{item.label}</span>
                        <div className="text-xs text-gray-500">
                          {item.type === 'lane' ? 'Drag to create swimlane' : 'Drag to canvas'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Validation Panel */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Validation</h4>
          <button
            onClick={validateDiagram}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-3"
          >
            Validate Diagram
          </button>
          
          {validationIssues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="text-red-700 text-sm font-medium mb-1">Issues Found:</div>
              {validationIssues.map((issue, index) => (
                <div key={index} className="text-red-600 text-xs">• {issue}</div>
              ))}
            </div>
          )}
          
          {validationIssues.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <div className="text-green-700 text-sm">✓ Diagram is valid</div>
            </div>
          )}
        </div>

        {/* ✨ ENHANCED FEATURES */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2 text-purple-800">🚀 Enhanced Features</h4>
          
          {/* Feature 1: Complete Autofit */}
          <div className="space-y-2 mb-4">
            <button
              onClick={enhancedAutofit}
              disabled={isLayouting}
              className="w-full p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {isLayouting ? '⏳ Processing...' : '🏊‍♂️ Complete Autofit'}
            </button>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  id="autoConnect"
                  checked={layoutOptions.autoConnect}
                  onChange={toggleAutoConnect}
                  className="rounded"
                />
                <label htmlFor="autoConnect" className="text-gray-700">Auto-connect shapes in lanes</label>
              </div>
              
              <button
                onClick={toggleEdgeVisibility}
                className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
                title="Toggle between strict parenting (nodes constrained to lanes) and loose positioning (better edge visibility)"
              >
                🔗 {useStrictParenting ? 'Fix Edge Visibility' : 'Restore Lane Constraints'}
              </button>
              
              <div className="text-xs text-gray-600 italic">
                {useStrictParenting 
                  ? "Strict mode: Nodes constrained to lanes (edges may be hidden)"
                  : "Loose mode: Better edge visibility (nodes can move freely)"
                }
              </div>
            </div>
          </div>

          {/* Feature 6: Token Animation */}
          <div className="space-y-2 mb-4">
            <div className="flex space-x-1">
              <button
                onClick={startEnhancedFlowSimulation}
                disabled={flowAnimation.isRunning}
                className="flex-1 p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded hover:from-blue-600 hover:to-purple-600 transition-all text-sm"
              >
                {flowAnimation.isRunning ? '🎬 Animating Flow' : '🚀 Enhanced Simulation'}
              </button>
              <button
                onClick={stopEnhancedFlowSimulation}
                disabled={!flowAnimation.isRunning}
                className="px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                ⏹️
              </button>
            </div>
            
            {flowAnimation.isRunning && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                <div className="text-blue-800 font-medium">🎯 Enhanced Flow Simulation Active</div>
                <div className="text-blue-700 text-xs space-y-1">
                  <div>Step {flowAnimation.currentStep + 1} of {flowAnimation.totalSteps}</div>
                  {flowAnimation.currentNode && <div>Current: {flowAnimation.currentNode}</div>}
                  {flowAnimation.currentSwimlane && <div>Swimlane: {flowAnimation.currentSwimlane}</div>}
                  {flowAnimation.progress > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${flowAnimation.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Simple Token Animation (Backup) */}
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
            <h5 className="text-green-800 font-medium text-sm mb-2">🎭 Simple Token Animation</h5>
            <div className="text-xs text-green-700 mb-2">
              Basic token simulation (backup option)
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={startTokenAnimation}
                disabled={tokenAnimation.isRunning}
                className="flex-1 p-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded hover:from-green-600 hover:to-teal-600 transition-all text-sm"
              >
                {tokenAnimation.isRunning ? '▶️ Running' : '🎭 Simple Tokens'}
              </button>
              <button
                onClick={stopTokenAnimation}
                disabled={!tokenAnimation.isRunning}
                className="px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                ⏹️
              </button>
            </div>
            
            {tokenAnimation.isRunning && (
              <div className="bg-green-100 border border-green-300 rounded p-2 text-sm mt-2">
                <div className="text-green-800 font-medium">🎯 Simple Animation Active</div>
                <div className="text-green-700 text-xs">
                  Step {tokenAnimation.currentStep + 1} of {tokenAnimation.steps.length}
                  {tokenAnimation.activeNodeId && ` • Node: ${tokenAnimation.activeNodeId}`}
                </div>
              </div>
            )}
          </div>

          {/* Flow Builder Execution */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded p-3 mb-4">
            <h5 className="text-green-800 font-medium text-sm mb-2">🚀 Flow Builder Execution</h5>
            <div className="text-xs text-green-700 mb-2">
              Execute Flow Builder flows with step-by-step visualization
            </div>
            <div className="flex space-x-1">
              <button
                onClick={executeFlow}
                disabled={flowExecution.isRunning}
                className="flex-1 p-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded hover:from-green-600 hover:to-blue-600 transition-all text-sm disabled:opacity-50"
              >
                {flowExecution.isRunning ? '▶️ Executing' : '▶️ Execute Flow'}
              </button>
              <button
                onClick={stopFlowExecution}
                disabled={!flowExecution.isRunning}
                className="px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                ⏹️
              </button>
            </div>
          </div>

          {/* n8n Integration Panel */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-300 rounded p-3 mb-4">
            <h5 className="text-orange-800 font-medium text-sm mb-2">
              🔗 n8n Integration (Demo)
            </h5>
            <div className="text-xs text-orange-700 mb-2">
              Export workflow to n8n automation platform
            </div>
            <button
              onClick={() => {
                try {
                  const workflow = transformToN8n(nodes, edges, 'HBMP Customer Workflow');
                  const summary = getWorkflowSummary(workflow);
                  
                  if (confirm(`${summary}\n\nDownload n8n workflow JSON?`)) {
                    downloadN8nWorkflow(workflow);
                    alert('✅ Workflow exported! Import this JSON into n8n at http://localhost:5678');
                  }
                } catch (error) {
                  console.error('n8n export error:', error);
                  alert('❌ Error exporting workflow. Check console for details.');
                }
              }}
              className="w-full p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded hover:from-orange-600 hover:to-red-600 transition-all text-sm"
            >
              📤 Export to n8n
            </button>
            <div className="mt-2 text-xs text-orange-600">
              💡 Tip: Install n8n with: docker run -p 5678:5678 n8nio/n8n
            </div>
          </div>

          {/* Advanced Multi-Level Animation Controls */}
          <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
            <h5 className="text-purple-800 font-medium text-sm mb-2">🌟 Multi-Level Animation</h5>
            <div className="text-xs text-purple-700 mb-2">
              Complex flow visualization: swimlanes → nodes → connections with different colors
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={startAdvancedAnimation}
                disabled={advancedAnimation.isRunning}
                className="flex-1 p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition-all text-sm"
              >
                {advancedAnimation.isRunning ? '🌟 Animating' : '🚀 Advanced Flow'}
              </button>
              <button
                onClick={stopAdvancedAnimation}
                disabled={!advancedAnimation.isRunning}
                className="px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                ⏹️
              </button>
            </div>
            
            {advancedAnimation.isRunning && (
              <div className="bg-purple-100 border border-purple-300 rounded p-2 text-sm mt-2">
                <div className="text-purple-800 font-medium">🎯 Multi-Level Animation Active</div>
                <div className="text-purple-700 text-xs space-y-1">
                  <div>Level {advancedAnimation.currentStep + 1} of {advancedAnimation.animationLevels.length}</div>
                  {advancedAnimation.progress > 0 && (
                    <div className="w-full bg-purple-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${advancedAnimation.progress}%` }}
                      ></div>
                    </div>
                  )}
                  <div className="text-xs">
                    Active: {advancedAnimation.activeElements.swimlanes.size} swimlanes, 
                    {' '}{advancedAnimation.activeElements.nodes.size} nodes, 
                    {' '}{advancedAnimation.activeElements.edges.size} edges
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Layout Results Display */}
          {showLayoutResults && layoutMetadata && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <h5 className="text-blue-800 font-medium text-sm mb-2">📊 Layout Results</h5>
              <div className="text-xs text-blue-700 space-y-1">
                <div>✅ Resized {layoutMetadata.laneResizes?.length || 0} lanes</div>
                <div>🔗 Created {layoutMetadata.autoConnections?.length || 0} auto-connections</div>
                {layoutOptions.autoConnect && (
                  <div className="text-green-600 italic">Auto-connect enabled: shapes linked automatically</div>
                )}
              </div>
            </div>
          )}

          {/* Edge Visibility Diagnostic */}
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
            <h5 className="text-orange-800 font-medium text-sm mb-2">🔍 Edge Visibility Info</h5>
            <div className="text-xs text-orange-700 space-y-1">
              <div>Total Edges: {edges.length}</div>
              <div>Nodes in Lanes: {nodes.filter(n => n.parentNode).length}</div>
              <div>Free Nodes: {nodes.filter(n => !n.parentNode && n.type !== 'lane').length}</div>
              <div className="text-orange-600 font-medium">
                💡 If edges are invisible inside lanes, click "Fix Edge Visibility" above
              </div>
            </div>
          </div>
        </div>

        {/* CRUD Operations */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Node Management</h4>
          <div className="space-y-2">
            <button
              onClick={openCreateModal}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              ➕ Create Node
            </button>
            
            <button
              onClick={() => createSwimlane({ 
                label: 'New Swimlane', 
                description: 'Custom swimlane',
                department: 'Custom Department',
                owner: 'You'
              })}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              🏊 Create Swimlane
            </button>
            
            {selectedNode && (
              <>
                <button
                  onClick={() => openEditModal(selectedNode)}
                  className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  ✏️ Edit Selected
                </button>
                
                <button
                  onClick={() => duplicateNode(selectedNode.id)}
                  className="w-full p-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                >
                  📋 Duplicate Selected
                </button>
                
                <button
                  onClick={() => {
                    if (selectedNode.type === 'lane') {
                      deleteSwimlane(selectedNode.id);
                    } else {
                      deleteNode(selectedNode.id);
                    }
                    setSelectedNode(null);
                  }}
                  className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  🗑️ Delete Selected
                </button>
              </>
            )}
          </div>
        </div>

        {/* Layout & Export */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Layout & Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => autoLayout('hierarchical')}
              disabled={isLayouting}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLayouting ? 'Layouting...' : '🔄 Auto Layout'}
            </button>
            
            <button
              onClick={() => autoLayout('swimlane')}
              disabled={isLayouting}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLayouting ? 'Layouting...' : '🏊 Swimlane Layout'}
            </button>
            
            <button
              onClick={simpleAutoLayout}
              className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              📐 Simple Layout
            </button>
            
            <button
              onClick={autoConnectNodes}
              className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              🔗 Auto Connect
            </button>
            
            <button
              onClick={() => {
                // Align existing nodes within their lanes
                const laneNodes = nodes.filter(n => n.type === 'lane');
                const updatedNodes = [...nodes];
                
                laneNodes.forEach(lane => {
                  const nodesInLane = updatedNodes
                    .filter(n => (n.parentNode === lane.id || n.data?.laneId === lane.id) && n.type !== 'lane')
                    .sort((a, b) => a.position.x - b.position.x);
                  
                  // Realign nodes horizontally within lane
                  const laneStartX = lane.position.x + 80;
                  const laneY = lane.position.y + 80;
                  const spacing = 160;
                  
                  nodesInLane.forEach((node, index) => {
                    const nodeInUpdated = updatedNodes.find(n => n.id === node.id);
                    if (nodeInUpdated) {
                      nodeInUpdated.position = {
                        x: laneStartX + (index * spacing),
                        y: laneY
                      };
                      nodeInUpdated.parentNode = lane.id;
                      nodeInUpdated.extent = 'parent' as const;
                      nodeInUpdated.draggable = true;
                      nodeInUpdated.selectable = true;
                      if (nodeInUpdated.data) {
                        nodeInUpdated.data.laneId = lane.id;
                      }
                    }
                  });
                });
                
                setNodes(updatedNodes);
                console.log('Fixed node positions within lanes');
              }}
              className="w-full p-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
            >
              🔧 Fix Positions
            </button>
            
            <button
              onClick={() => {
                // Unlock all nodes for free movement
                const updatedNodes = nodes.map(node => ({
                  ...node,
                  draggable: true,
                  selectable: true,
                  extent: undefined, // Remove constraints
                  parentNode: node.type === 'lane' ? undefined : node.parentNode
                }));
                
                setNodes(updatedNodes);
                console.log('Unlocked all nodes for free movement');
              }}
              className="w-full p-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
            >
              🔓 Unlock Movement
            </button>
          </div>
          
          {/* Save/Load */}
          <div className="space-y-1 mt-2">
            <button
              onClick={savePositions}
              className="w-full p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm"
            >
              💾 Save Layout
            </button>
            <button
              onClick={loadPositions}
              className="w-full p-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors text-sm"
            >
              📥 Load Layout
            </button>
            <button
              onClick={async () => {
                try {
                  // Clear database
                  await dbService.saveDiagramLayout({
                    diagramId: 'prototype-diagram',
                    nodes: [],
                    edges: [],
                    layoutType: 'reset'
                  });
                  
                  setNodes(initialNodes);
                  setEdges(initialEdges);
                  console.log('Reset to default layout');
                } catch (error) {
                  console.error('Error resetting layout:', error);
                  // Fallback to just setting initial nodes
                  setNodes(initialNodes);
                  setEdges(initialEdges);
                }
              }}
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              🔄 Reset Default
            </button>
          </div>
          
          <div className="space-y-1 mt-2">
            <button
              onClick={() => exportDiagram('svg')}
              className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Export SVG
            </button>
            <button
              onClick={() => exportDiagram('png')}
              className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Export PNG
            </button>
          </div>
        </div>

        {/* Testing Tools */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Testing</h4>
          <div className="space-y-1">
            <button
              onClick={() => window.open('/test-conversion', '_blank')}
              className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
            >
              🔄 RF → MX Conversion
            </button>
            <button
              onClick={() => window.open('/test-bidirectional', '_blank')}
              className="w-full p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm"
            >
              ↔️ Bidirectional Test
            </button>
            <button
              onClick={() => window.open('/xml-editor', '_blank')}
              className="w-full p-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors text-sm"
            >
              📝 XML Editor
            </button>
            <button
              onClick={() => {
                const rfData = { nodes, edges };
                console.log('Current RF Data:', rfData);
                navigator.clipboard.writeText(JSON.stringify(rfData, null, 2));
                alert('Current React Flow data copied to clipboard! Check console for details.');
              }}
              className="w-full p-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors text-sm"
            >
              📋 Export RF Data
            </button>
          </div>
        </div>

        {/* Quick Help */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-semibold text-blue-800 mb-1">💡 Swimlane Demo Guide:</div>
          <div className="text-blue-700 space-y-1">
            <div>• <strong>Drag</strong> palette items to canvas</div>
            <div>• <strong>Drop</strong> process nodes into swimlanes</div>
            <div>• <strong>Connect</strong> nodes by dragging handles</div>
            <div>• <strong>Auto-layout</strong> with mxGraph engine</div>
            <div>• <strong>Swimlane layout</strong> for lane-aware positioning</div>
            <div>• <strong>Click</strong> nodes to edit properties</div>
          </div>
        </div>
        
        {/* Drag Instructions */}
        <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="font-semibold text-green-800">🎯 Pro Tips:</div>
          <div className="text-green-700 text-xs mt-1">
            • Create swimlanes first, then drag process elements into them
            • Use "Swimlane Layout" for intelligent positioning within lanes
            • Cross-lane connections show process handoffs
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {canvasMode === 'network' ? (
          <NetworkGraphView
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={(newNodes) => setNodes(newNodes)}
            onEdgesChange={(newEdges) => setEdges(newEdges)}
          />
        ) : (
        <ReactFlow
          nodes={nodes.map(node => ({
            ...node,
            className: `${node.className || ''} ${
              tokenAnimation.activeNodeId === node.id ? 'token-active' : ''
            }`.trim()
          }))}
          edges={edges.map(edge => ({
            ...edge,
            className: `${edge.className || ''} ${
              tokenAnimation.activeEdgeId === edge.id ? 'token-active-edge' : ''
            }`.trim(),
            animated: edge.animated || tokenAnimation.activeEdgeId === edge.id
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDrag={onNodeDrag}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          fitView
          className="bg-gray-50"
          elevateEdgesOnSelect={true}
          elevateNodesOnSelect={true}
          defaultEdgeOptions={{
            animated: true,
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#6366f1' },
            zIndex: 1000
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap />

          {/* Token Animation Styles */}
          <style jsx global>{`
            .token-active {
              animation: tokenPulse 1.5s ease-in-out infinite !important;
              border: 3px solid #10b981 !important;
              box-shadow: 0 0 20px rgba(16, 185, 129, 0.6) !important;
            }
            
            .token-active-edge .react-flow__edge-path {
              stroke: #10b981 !important;
              stroke-width: 4px !important;
              animation: tokenFlow 2s ease-in-out infinite !important;
            }
            
            @keyframes tokenPulse {
              0%, 100% { 
                transform: scale(1);
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
              }
              50% { 
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.8);
              }
            }
            
            @keyframes tokenFlow {
              0%, 100% { 
                stroke-dasharray: 5, 10;
                stroke-dashoffset: 0;
              }
              50% { 
                stroke-dasharray: 5, 10;
                stroke-dashoffset: -15;
              }
            }
            
            /* Enhanced event trigger styling */
            .react-flow__node:hover {
              transform: translateY(-2px);
              transition: transform 0.2s ease;
            }
          `}</style>
          
          {/* View Toggle */}
          <Panel position="top-center">
            <ViewToggle />
          </Panel>

          {/* Header Panel */}
          <Panel position="top-left">
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">HBMP Enhanced Platform</h1>
              <p className="text-gray-600">React Flow + mxGraph with Advanced Features</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex space-x-2 text-xs">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">🏊 Autofit</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">⚡ Events</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">🎬 Animation</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span className="text-xs text-green-700">Live Demo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  <span className="text-xs text-blue-700">Interactive</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                  <span className="text-xs text-purple-700">Validated</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Stats Panel */}
          <Panel position="top-right">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Total Nodes:</strong> {nodes.length}</div>
                <div><strong>Swimlanes:</strong> {nodes.filter(n => n.type === 'lane').length}</div>
                <div><strong>Process Nodes:</strong> {nodes.filter(n => n.type !== 'lane').length}</div>
                <div><strong>Edges:</strong> {edges.length}</div>
                <div><strong>Issues:</strong> {validationIssues.length}</div>
                {isLayouting && (
                  <div className="text-blue-600 font-medium">🔄 Layout in progress...</div>
                )}
              </div>
            </div>
          </Panel>
        </ReactFlow>
        )}
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4">Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node ID
              </label>
              <input
                type="text"
                value={selectedNode.id}
                disabled
                className="w-full p-2 border border-gray-300 rounded bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label || ''}
                onChange={(e) => {
                  const updatedNodes = nodes.map(node => 
                    node.id === selectedNode.id 
                      ? { ...node, data: { ...node.data, label: e.target.value } }
                      : node
                  );
                  setNodes(updatedNodes);
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } });
                }}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                type="text"
                value={selectedNode.type || ''}
                disabled
                className="w-full p-2 border border-gray-300 rounded bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={Math.round(selectedNode.position.x)}
                  disabled
                  className="p-2 border border-gray-300 rounded bg-gray-50"
                  placeholder="X"
                />
                <input
                  type="number"
                  value={Math.round(selectedNode.position.y)}
                  disabled
                  className="p-2 border border-gray-300 rounded bg-gray-50"
                  placeholder="Y"
                />
              </div>
            </div>
            
            {/* Lane-specific properties */}
            {selectedNode.type === 'lane' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.department || ''}
                    onChange={(e) => {
                      const updatedNodes = nodes.map(node => 
                        node.id === selectedNode.id 
                          ? { ...node, data: { ...node.data, department: e.target.value } }
                          : node
                      );
                      setNodes(updatedNodes);
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, department: e.target.value } });
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., Customer Service"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.owner || ''}
                    onChange={(e) => {
                      const updatedNodes = nodes.map(node => 
                        node.id === selectedNode.id 
                          ? { ...node, data: { ...node.data, owner: e.target.value } }
                          : node
                      );
                      setNodes(updatedNodes);
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, owner: e.target.value } });
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., John Doe"
                  />
                </div>
              </>
            )}
            
            {/* Show lane assignment for process nodes */}
            {selectedNode.type !== 'lane' && selectedNode.parentNode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Lane
                </label>
                <input
                  type="text"
                  value={nodes.find(n => n.id === selectedNode.parentNode)?.data.label || 'Unknown'}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            )}

            <button
              onClick={() => setSelectedNode(null)}
              className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close Properties
            </button>
          </div>
        </div>
      )}

      {/* Create Node Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Node</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Type
                </label>
                <select
                  value={newNodeData.type}
                  onChange={(e) => setNewNodeData({...newNodeData, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="processTask">Process Task</option>
                  <option value="gateway">Gateway</option>
                  <option value="event">Event</option>
                  <option value="service">Service</option>
                  <option value="api">API</option>
                  <option value="db">Database</option>
                  <option value="dataset">Dataset</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={newNodeData.label}
                  onChange={(e) => setNewNodeData({...newNodeData, label: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter node label"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newNodeData.description}
                  onChange={(e) => setNewNodeData({...newNodeData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded h-20"
                  placeholder="Enter description"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateSubmit}
                className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Node Modal */}
      {showEditModal && editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Node</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Type
                </label>
                <select
                  value={newNodeData.type}
                  onChange={(e) => setNewNodeData({...newNodeData, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="processTask">Process Task</option>
                  <option value="gateway">Gateway</option>
                  <option value="event">Event</option>
                  <option value="service">Service</option>
                  <option value="api">API</option>
                  <option value="db">Database</option>
                  <option value="dataset">Dataset</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={newNodeData.label}
                  onChange={(e) => setNewNodeData({...newNodeData, label: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter node label"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newNodeData.description}
                  onChange={(e) => setNewNodeData({...newNodeData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded h-20"
                  placeholder="Enter description"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditSubmit}
                className="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNode(null);
                }}
                className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flow Config Drawer */}
      <FlowConfigDrawer
        isOpen={showFlowConfig}
        onClose={() => setShowFlowConfig(false)}
        nodeType={configNodeType}
        nodeData={configNodeData}
        onSave={handleFlowConfigSave}
      />

      {/* Flow Execution Panel */}
      <FlowExecutionPanel executionState={flowExecution} />
    </div>
  );
}

// Wrap with ReactFlowProvider for useReactFlow hook
export default function PrototypePage() {
  return (
    <ReactFlowProvider>
      <PrototypePageContent />
    </ReactFlowProvider>
  );
}