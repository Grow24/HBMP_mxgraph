'use client';

import React, { useCallback, useEffect, useState, useRef, DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  Connection,
  addEdge,
} from 'reactflow';
import { NetworkCircularNode } from './nodes/NetworkCircularNode';
import { D3ForceSimulation } from '@/lib/d3ForceSimulation';
import { GraphAnalyzer } from '@/lib/graphAnalysis';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { NetworkGraph, TopologyAnalysis } from '@hbmp/shared-types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Pin, 
  Layers, 
  TrendingUp, 
  Server,
  Database,
  Cloud,
  Shield,
  Wifi,
  HardDrive,
  Cpu,
  Globe,
  Download,
  Search,
  ZoomIn,
  Activity,
  AlertCircle,
  Check,
  X,
  Plus,
  Trash2
} from 'lucide-react';

const nodeTypes = {
  networkCircular: NetworkCircularNode,
};

// Network device types for drag-and-drop palette
const NETWORK_DEVICES = [
  { type: 'router', label: 'Router', icon: Wifi, color: '#3b82f6', category: 'Infrastructure' },
  { type: 'switch', label: 'Switch', icon: Layers, color: '#06b6d4', category: 'Infrastructure' },
  { type: 'firewall', label: 'Firewall', icon: Shield, color: '#ef4444', category: 'Security' },
  { type: 'server', label: 'Server', icon: Server, color: '#8b5cf6', category: 'Compute' },
  { type: 'database', label: 'Database', icon: Database, color: '#6366f1', category: 'Storage' },
  { type: 'storage', label: 'Storage', icon: HardDrive, color: '#10b981', category: 'Storage' },
  { type: 'cloud', label: 'Cloud', icon: Cloud, color: '#f59e0b', category: 'External' },
  { type: 'endpoint', label: 'Endpoint', icon: Cpu, color: '#ec4899', category: 'Compute' },
  { type: 'internet', label: 'Internet', icon: Globe, color: '#14b8a6', category: 'External' },
];

interface NetworkGraphViewProps {
  diagramId?: string | null;
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

interface NodeHealth {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu?: number;
  memory?: number;
  latency?: number;
}

export function NetworkGraphView({
  diagramId,
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
}: NetworkGraphViewProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(
    initialNodes.map(n => ({
      ...n,
      type: 'networkCircular',
      position: { x: Math.random() * 800, y: Math.random() * 600 },
    }))
  );
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(
    initialEdges.map(e => ({
      ...e,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#64748b', strokeWidth: 2 },
    }))
  );

  const {
    simulationConfig,
    updateSimulationConfig,
    pinnedNodes,
    setPinnedNodes,
    togglePinNode,
    highlightedNodes,
    setHighlightedNodes,
    clearHighlights,
  } = useAppStore();

  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [analysis, setAnalysis] = useState<TopologyAnalysis | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nodeHealth, setNodeHealth] = useState<Map<string, NodeHealth>>(new Map());
  const [showTrafficFlow, setShowTrafficFlow] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const simulationRef = useRef(new D3ForceSimulation());
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pinnedRef = useRef(pinnedNodes);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  pinnedRef.current = pinnedNodes;
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Convert ReactFlow nodes to NetworkGraph format
  const convertToNetworkGraph = useCallback((): NetworkGraph => {
    return {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'default',
        label: n.data.label || n.id,
        position: {
          x: n.position.x,
          y: n.position.y,
          fx: pinnedNodes.has(n.id) ? n.position.x : null,
          fy: pinnedNodes.has(n.id) ? n.position.y : null,
        },
        degree: edges.filter(e => e.source === n.id || e.target === n.id).length,
        metadata: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        strength: e.data?.strength || 0.5,
        type: e.data?.type || 'data',
      })),
    };
  }, [nodes, edges, pinnedNodes]);

  const [networkReady, setNetworkReady] = useState(false);

  const saveNetworkPositions = useCallback(async (pinned: Set<string> = pinnedNodes) => {
    if (!diagramId) return;
    const positions = nodes.map((node) => ({
      nodeId: node.id,
      x: node.position.x,
      y: node.position.y,
      fx: pinned.has(node.id) ? node.position.x : null,
      fy: pinned.has(node.id) ? node.position.y : null,
      isPinned: pinned.has(node.id),
      degree: edges.filter((edge) => edge.source === node.id || edge.target === node.id).length,
      influenceScore: 0,
    }));
    await api('/api/network/positions', {
      method: 'POST',
      body: JSON.stringify({ diagramId, positions }),
    });
  }, [diagramId, nodes, edges, pinnedNodes]);

  const saveNetworkAnalysis = useCallback(async () => {
    if (!diagramId) return;
    const started = Date.now();
    const networkGraph = convertToNetworkGraph();
    const result = GraphAnalyzer.analyzeTopology(networkGraph);
    setAnalysis(result);
    await api('/api/network/clusters', {
      method: 'POST',
      body: JSON.stringify({ diagramId, clusters: result.clusters }),
    });
    await api('/api/network/analysis', {
      method: 'POST',
      body: JSON.stringify({
        diagramId,
        analysisType: 'topology',
        results: {
          clusters: result.clusters,
          criticalNodes: result.criticalNodes,
          deadEnds: result.deadEnds,
          unreachableNodes: result.unreachableNodes,
        },
        metrics: result.metrics,
        duration: Date.now() - started,
      }),
    });
    return result;
  }, [diagramId, convertToNetworkGraph]);

  useEffect(() => {
    if (!diagramId) return;
    let cancelled = false;
    setNetworkReady(false);

    const loadNetworkState = async () => {
      try {
        const [positionData, configData] = await Promise.all([
          api<{ positions: Array<{ nodeId: string; x: number; y: number; isPinned: boolean }> }>(`/api/network/positions/${diagramId}`),
          api<{ config: { repulsion: number; gravity: number; linkStrength: number; collisionRadius: number } }>(`/api/network/simulation-config/${diagramId}`),
        ]);
        if (cancelled) return;
        if (configData.config) updateSimulationConfig(configData.config);
        if (positionData.positions?.length) {
          const byId = new Map(positionData.positions.map((pos) => [pos.nodeId, pos]));
          setNodes((current) => current.map((node) => {
            const saved = byId.get(node.id);
            if (!saved) return node;
            return { ...node, position: { x: saved.x, y: saved.y } };
          }));
          setPinnedNodes(new Set(positionData.positions.filter((pos) => pos.isPinned).map((pos) => pos.nodeId)));
        }
      } catch (error) {
        console.error('Failed to load network state:', error);
      } finally {
        if (!cancelled) setNetworkReady(true);
      }
    };

    loadNetworkState();
    return () => {
      cancelled = true;
    };
  }, [diagramId, setNodes, setPinnedNodes, updateSimulationConfig]);

  useEffect(() => {
    if (!diagramId || !networkReady) return;
    const timeoutId = setTimeout(() => {
      api('/api/network/simulation-config', {
        method: 'POST',
        body: JSON.stringify({ diagramId, ...simulationConfig }),
      }).catch((error) => console.error('Failed to save simulation config:', error));
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [diagramId, simulationConfig, networkReady]);

  useEffect(() => {
    if (!diagramId || !networkReady) return;
    const timeoutId = setTimeout(() => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const pinned = pinnedRef.current;
      const positions = currentNodes.map((node) => ({
        nodeId: node.id,
        x: node.position.x,
        y: node.position.y,
        fx: pinned.has(node.id) ? node.position.x : null,
        fy: pinned.has(node.id) ? node.position.y : null,
        isPinned: pinned.has(node.id),
        degree: currentEdges.filter((edge) => edge.source === node.id || edge.target === node.id).length,
        influenceScore: 0,
      }));
      api('/api/network/positions', {
        method: 'POST',
        body: JSON.stringify({ diagramId, positions }),
      }).catch((error) => console.error('Failed to save network positions:', error));
    }, 1600);
    return () => clearTimeout(timeoutId);
  }, [diagramId, networkReady]);

  useEffect(() => {
    if (!diagramId) return;
    const timeoutId = setTimeout(() => {
      saveNetworkAnalysis().catch((error) => console.error('Failed to save network analysis:', error));
    }, 1200);
    return () => clearTimeout(timeoutId);
    // Save clusters once when the network view opens for this diagram.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramId]);

  // Start/update simulation
  useEffect(() => {
    if (!isSimulationRunning) return;

    const networkGraph = convertToNetworkGraph();
    
    simulationRef.current.start(networkGraph, simulationConfig, (updatedNodes) => {
      setNodes((nds) =>
        nds.map((node) => {
          const simNode = updatedNodes.find((n) => n.id === node.id);
          if (simNode) {
            return {
              ...node,
              position: {
                x: simNode.position.x,
                y: simNode.position.y,
              },
              data: {
                ...node.data,
                degree: simNode.degree,
                isPinned: pinnedNodes.has(node.id),
                isHighlighted: highlightedNodes.has(node.id),
              },
            };
          }
          return node;
        })
      );
    });

    return () => {
      simulationRef.current.stop();
    };
  }, [isSimulationRunning, simulationConfig]);

  // Analyze topology
  const analyzeGraph = useCallback(() => {
    saveNetworkAnalysis()
      .then(() => setShowAnalysisPanel(true))
      .catch((error) => console.error('Failed to analyze network:', error));
  }, [saveNetworkAnalysis]);

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      
      // Highlight 1-hop neighbors
      const networkGraph = convertToNetworkGraph();
      const neighbors = GraphAnalyzer.getNeighbors(networkGraph, node.id);
      setHighlightedNodes(new Set([node.id, ...neighbors]));
    },
    [convertToNetworkGraph, setHighlightedNodes]
  );

  // Handle node drag
  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (pinnedNodes.has(node.id)) {
        simulationRef.current.pinNode(node.id, convertToNetworkGraph().nodes);
      }
    },
    [pinnedNodes, convertToNetworkGraph]
  );

  // Handle pin toggle
  const handlePinToggle = useCallback(
    (nodeId: string) => {
      const nextPinned = new Set(pinnedNodes);
      if (nextPinned.has(nodeId)) nextPinned.delete(nodeId);
      else nextPinned.add(nodeId);
      togglePinNode(nodeId);
      const networkGraph = convertToNetworkGraph();
      
      if (pinnedNodes.has(nodeId)) {
        simulationRef.current.unpinNode(nodeId, networkGraph.nodes);
      } else {
        simulationRef.current.pinNode(nodeId, networkGraph.nodes);
      }
      saveNetworkPositions(nextPinned).catch((error) => console.error('Failed to save pin:', error));
    },
    [togglePinNode, pinnedNodes, convertToNetworkGraph, saveNetworkPositions]
  );

  // Control handlers
  const handlePlayPause = () => {
    if (isSimulationRunning) {
      simulationRef.current.pause();
      saveNetworkPositions().catch((error) => console.error('Failed to save network positions:', error));
    } else {
      simulationRef.current.resume();
    }
    setIsSimulationRunning(!isSimulationRunning);
  };

  const handleRerun = () => {
    const networkGraph = convertToNetworkGraph();
    simulationRef.current.rerun(networkGraph, simulationConfig);
    setIsSimulationRunning(true);
  };

  const handleAutoFit = () => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Drag and Drop handlers
  const onDragStart = useCallback((event: DragEvent, deviceType: string) => {
    setDraggedType(deviceType);
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
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const device = NETWORK_DEVICES.find(d => d.type === draggedType);
      const newNode: Node = {
        id: `${draggedType}-${Date.now()}`,
        type: 'networkCircular',
        position,
        data: {
          label: device?.label || draggedType,
          type: draggedType,
          deviceType: draggedType,
          degree: 0,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setDraggedType(null);

      // Initialize health status for new node
      setNodeHealth(prev => new Map(prev).set(newNode.id, {
        status: 'healthy',
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        latency: Math.random() * 50,
      }));
    },
    [draggedType, reactFlowInstance, setNodes]
  );

  // Simulate network health monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setNodeHealth(prev => {
        const newMap = new Map(prev);
        nodes.forEach(node => {
          const health = newMap.get(node.id) || {
            status: 'healthy' as const,
            cpu: 0,
            memory: 0,
            latency: 0,
          };
          
          // Simulate changing metrics
          const newCpu = Math.max(0, Math.min(100, health.cpu! + (Math.random() - 0.5) * 10));
          const newMemory = Math.max(0, Math.min(100, health.memory! + (Math.random() - 0.5) * 10));
          const newLatency = Math.max(0, Math.min(200, health.latency! + (Math.random() - 0.5) * 5));
          
          // Determine status based on metrics
          let status: NodeHealth['status'] = 'healthy';
          if (newCpu > 90 || newMemory > 90 || newLatency > 100) {
            status = 'critical';
          } else if (newCpu > 70 || newMemory > 70 || newLatency > 50) {
            status = 'warning';
          }
          
          newMap.set(node.id, {
            status,
            cpu: newCpu,
            memory: newMemory,
            latency: newLatency,
          });
        });
        return newMap;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [nodes]);

  // Context menu handlers
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setContextMenu(null);
  }, [setNodes, setEdges]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (nodeToDuplicate) {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: `${nodeToDuplicate.id}-copy-${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 100,
          y: nodeToDuplicate.position.y + 100,
        },
      };
      setNodes(nds => [...nds, newNode]);
    }
    setContextMenu(null);
  }, [nodes, setNodes]);

  const handleZoomToNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && reactFlowInstance) {
      reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
    }
    setContextMenu(null);
  }, [nodes, reactFlowInstance]);

  // Filter nodes by search term
  const filteredNodes = nodes.filter(node =>
    node.data.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate network metrics
  const networkMetrics = {
    totalDevices: nodes.length,
    activeConnections: edges.length,
    healthyNodes: Array.from(nodeHealth.values()).filter(h => h.status === 'healthy').length,
    warningNodes: Array.from(nodeHealth.values()).filter(h => h.status === 'warning').length,
    criticalNodes: Array.from(nodeHealth.values()).filter(h => h.status === 'critical').length,
    avgLatency: Array.from(nodeHealth.values()).reduce((sum, h) => sum + (h.latency || 0), 0) / Math.max(nodeHealth.size, 1),
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isPinned: pinnedNodes.has(node.id),
            isHighlighted: highlightedNodes.has(node.id),
            health: nodeHealth.get(node.id),
          }
        }))}
        edges={edges.map(edge => ({
          ...edge,
          animated: showTrafficFlow || edge.animated,
          style: {
            ...edge.style,
            stroke: showTrafficFlow ? '#10b981' : '#64748b',
            strokeWidth: showTrafficFlow ? 3 : 2,
          },
        }))}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeContextMenu={onNodeContextMenu}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#64748b', strokeWidth: 2 },
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#334155" 
          className="bg-slate-900" 
        />
        <Controls className="!bg-slate-800/90 !border-slate-600 backdrop-blur-sm !shadow-xl" />

        {/* Enhanced Control Panel with Glassmorphism */}
        <Panel position="top-left" className="space-y-3">
          <motion.div
            className="bg-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl p-5 border border-slate-600/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Activity className="text-cyan-400" size={20} />
                Network Control
              </h3>
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isSimulationRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isSimulationRunning ? '● Live' : '○ Paused'}
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handlePlayPause}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg"
              >
                {isSimulationRunning ? <Pause size={18} /> : <Play size={18} />}
                {isSimulationRunning ? 'Pause Physics' : 'Start Physics'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRerun}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-all text-sm"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <button
                  onClick={handleAutoFit}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-all text-sm"
                >
                  <ZoomIn size={16} />
                  Fit View
                </button>
              </div>

              <button
                onClick={analyzeGraph}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg transition-all font-medium"
              >
                <TrendingUp size={16} />
                Analyze Topology
              </button>

              <button
                onClick={() => setShowTrafficFlow(!showTrafficFlow)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  showTrafficFlow 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Activity size={16} />
                Traffic Flow {showTrafficFlow ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Simulation Config Sliders with modern styling */}
            <div className="mt-4 pt-4 border-t border-slate-600/50 space-y-3 text-slate-300 text-sm">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-medium text-cyan-400">Repulsion</label>
                  <span className="text-white font-mono">{simulationConfig.repulsion}</span>
                </div>
                <input
                  type="range"
                  min="-1000"
                  max="-50"
                  value={simulationConfig.repulsion}
                  onChange={(e) => updateSimulationConfig({ repulsion: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-medium text-purple-400">Gravity</label>
                  <span className="text-white font-mono">{simulationConfig.gravity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simulationConfig.gravity}
                  onChange={(e) => updateSimulationConfig({ gravity: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-medium text-green-400">Link Strength</label>
                  <span className="text-white font-mono">{simulationConfig.linkStrength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simulationConfig.linkStrength}
                  onChange={(e) => updateSimulationConfig({ linkStrength: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
            </div>
          </motion.div>
        </Panel>

        {/* Enhanced Node Info Panel */}
        {selectedNodeId && (
          <Panel position="top-right">
            <motion.div
              className="bg-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl p-5 border border-slate-600/50 w-72"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Server className="text-cyan-400" size={18} />
                  Device Info
                </h3>
                <button
                  onClick={() => {
                    setSelectedNodeId(null);
                    clearHighlights();
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-slate-300 text-sm space-y-3">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">ID:</span>
                    <span className="text-white font-mono text-xs">{selectedNodeId}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-cyan-400 font-medium">{nodes.find(n => n.id === selectedNodeId)?.data.type}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Connections:</span>
                    <span className="text-white font-semibold">{nodes.find(n => n.id === selectedNodeId)?.data.degree || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Neighbors:</span>
                    <span className="text-white font-semibold">{highlightedNodes.size - 1}</span>
                  </div>
                </div>

                {/* Health Status */}
                {nodeHealth.get(selectedNodeId) && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 font-medium">Health Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        nodeHealth.get(selectedNodeId)?.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                        nodeHealth.get(selectedNodeId)?.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {nodeHealth.get(selectedNodeId)?.status === 'healthy' ? <Check size={12} className="inline" /> :
                         nodeHealth.get(selectedNodeId)?.status === 'warning' ? <AlertCircle size={12} className="inline" /> :
                         <X size={12} className="inline" />}
                        {' '}{nodeHealth.get(selectedNodeId)?.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>CPU</span>
                          <span className="text-white">{nodeHealth.get(selectedNodeId)?.cpu?.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${nodeHealth.get(selectedNodeId)?.cpu! > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                            style={{ width: `${nodeHealth.get(selectedNodeId)?.cpu}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Memory</span>
                          <span className="text-white">{nodeHealth.get(selectedNodeId)?.memory?.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${nodeHealth.get(selectedNodeId)?.memory! > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                            style={{ width: `${nodeHealth.get(selectedNodeId)?.memory}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Latency</span>
                          <span className="text-white">{nodeHealth.get(selectedNodeId)?.latency?.toFixed(0)} ms</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${nodeHealth.get(selectedNodeId)?.latency! > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${(nodeHealth.get(selectedNodeId)?.latency || 0) / 2}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handlePinToggle(selectedNodeId)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                    pinnedNodes.has(selectedNodeId)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
                      : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Pin size={16} />
                  {pinnedNodes.has(selectedNodeId) ? 'Unpin Device' : 'Pin Device'}
                </button>
              </div>
            </motion.div>
          </Panel>
        )}

        {/* Analysis Panel */}
        <AnimatePresence>
          {showAnalysisPanel && analysis && (
            <Panel position="bottom-right">
              <motion.div
                className="bg-white rounded-lg shadow-xl p-4 border border-gray-200 w-80 max-h-96 overflow-y-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-800 font-semibold">Topology Analysis</h3>
                  <button
                    onClick={() => setShowAnalysisPanel(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-gray-700 text-sm space-y-3">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="font-semibold text-gray-800 mb-2">Metrics</div>
                    <div className="space-y-1">
                      <div>Nodes: {analysis.metrics.nodeCount}</div>
                      <div>Edges: {analysis.metrics.edgeCount}</div>
                      <div>Avg Degree: {analysis.metrics.avgDegree.toFixed(2)}</div>
                      <div>Density: {(analysis.metrics.density * 100).toFixed(1)}%</div>
                      <div>Components: {analysis.metrics.connectedComponents}</div>
                      <div>Has Cycles: {analysis.metrics.hasCycles ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {analysis.clusters.length > 0 && (
                    <div className="bg-gray-100 rounded p-2">
                      <div className="font-semibold text-gray-800 mb-2">Clusters</div>
                      {analysis.clusters.map((cluster, i) => (
                        <div key={i} className="text-xs">
                          Cluster {i + 1}: {cluster.size} nodes
                        </div>
                      ))}
                    </div>
                  )}

                  {analysis.criticalNodes.length > 0 && (
                    <div className="bg-red-900/30 rounded p-2">
                      <div className="font-semibold text-red-300 mb-2">Critical Nodes</div>
                      <div className="text-xs">{analysis.criticalNodes.join(', ')}</div>
                    </div>
                  )}

                  {analysis.deadEnds.length > 0 && (
                    <div className="bg-yellow-900/30 rounded p-2">
                      <div className="font-semibold text-yellow-300 mb-2">Dead Ends</div>
                      <div className="text-xs">{analysis.deadEnds.join(', ')}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>

        {/* Enhanced Network Metrics Dashboard */}
        {showMetrics && (
          <Panel position="bottom-left">
            <motion.div
              className="bg-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl p-5 border border-slate-600/50 w-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="text-green-400" size={18} />
                  Network Metrics
                </h3>
                <button
                  onClick={() => setShowMetrics(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-lg p-3 border border-blue-500/30">
                  <div className="text-blue-400 text-xs font-medium mb-1">Total Devices</div>
                  <div className="text-white text-2xl font-bold">{networkMetrics.totalDevices}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-lg p-3 border border-purple-500/30">
                  <div className="text-purple-400 text-xs font-medium mb-1">Connections</div>
                  <div className="text-white text-2xl font-bold">{networkMetrics.activeConnections}</div>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-lg p-3 border border-green-500/30">
                  <div className="text-green-400 text-xs font-medium mb-1 flex items-center gap-1">
                    <Check size={12} />
                    Healthy
                  </div>
                  <div className="text-white text-2xl font-bold">{networkMetrics.healthyNodes}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-lg p-3 border border-yellow-500/30">
                  <div className="text-yellow-400 text-xs font-medium mb-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Warning
                  </div>
                  <div className="text-white text-2xl font-bold">{networkMetrics.warningNodes}</div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Critical Nodes</span>
                  <span className={`font-bold ${networkMetrics.criticalNodes > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {networkMetrics.criticalNodes}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Avg Latency</span>
                  <span className={`font-bold ${networkMetrics.avgLatency > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {networkMetrics.avgLatency.toFixed(1)} ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Pinned Devices</span>
                  <span className="text-blue-400 font-bold">{pinnedNodes.size}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Simulation</span>
                  <span className={`font-bold flex items-center gap-1 ${isSimulationRunning ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isSimulationRunning ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </motion.div>
          </Panel>
        )}
        
        {!showMetrics && (
          <Panel position="bottom-left">
            <button
              onClick={() => setShowMetrics(true)}
              className="bg-slate-800/90 backdrop-blur-md rounded-lg shadow-xl p-3 border border-slate-600/50 text-white hover:bg-slate-700 transition-all"
            >
              <TrendingUp size={20} />
            </button>
          </Panel>
        )}
      </ReactFlow>

      {/* Device Palette Sidebar with Drag-and-Drop */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            className="absolute left-4 top-20 bottom-4 w-72 bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-600/50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="p-4 border-b border-slate-600/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Layers className="text-cyan-400" size={20} />
                  Network Devices
                </h3>
                <button
                  onClick={() => setShowPalette(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {['Infrastructure', 'Compute', 'Storage', 'Security', 'External'].map(category => {
                const devices = NETWORK_DEVICES.filter(d => d.category === category);
                if (devices.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                      {category}
                    </div>
                    <div className="space-y-2">
                      {devices.map((device) => {
                        const Icon = device.icon;
                        return (
                          <motion.div
                            key={device.type}
                            draggable
                            onDragStart={(e) => onDragStart(e as any, device.type)}
                            className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600/50 hover:border-slate-500 cursor-grab active:cursor-grabbing transition-all group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                              style={{
                                backgroundColor: device.color + '20',
                                borderColor: device.color + '40',
                                borderWidth: '1px',
                              }}
                            >
                              <Icon size={20} style={{ color: device.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium text-sm">{device.label}</div>
                              <div className="text-slate-400 text-xs">Drag to canvas</div>
                            </div>
                            <Plus size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-600/50 bg-slate-900/50">
              <div className="text-slate-400 text-xs">
                💡 <span className="font-medium">Tip:</span> Drag devices to the canvas to build your network topology
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Palette Toggle Button */}
      {!showPalette && (
        <button
          onClick={() => setShowPalette(true)}
          className="absolute left-4 top-20 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl p-3 border border-slate-600/50 text-white hover:bg-slate-700 transition-all"
        >
          <Layers size={20} />
        </button>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="fixed bg-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-slate-600/50 overflow-hidden z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setContextMenu(null)}
          >
            <div className="py-1">
              <button
                onClick={() => handleZoomToNode(contextMenu.nodeId)}
                className="w-full px-4 py-2.5 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
              >
                <ZoomIn size={16} className="text-cyan-400" />
                <span className="text-sm">Zoom to Device</span>
              </button>
              <button
                onClick={() => {
                  handlePinToggle(contextMenu.nodeId);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
              >
                <Pin size={16} className="text-blue-400" />
                <span className="text-sm">
                  {pinnedNodes.has(contextMenu.nodeId) ? 'Unpin Device' : 'Pin Device'}
                </span>
              </button>
              <button
                onClick={() => handleDuplicateNode(contextMenu.nodeId)}
                className="w-full px-4 py-2.5 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
              >
                <Plus size={16} className="text-green-400" />
                <span className="text-sm">Duplicate Device</span>
              </button>
              <div className="h-px bg-slate-600 my-1" />
              <button
                onClick={() => handleDeleteNode(contextMenu.nodeId)}
                className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              >
                <Trash2 size={16} />
                <span className="text-sm">Delete Device</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Network Name */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl px-6 py-3 border border-slate-600/50">
        <h1 className="text-white font-bold text-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <Globe size={24} className="text-white" />
          </div>
          <div>
            <div className="text-white">Network Topology</div>
            <div className="text-slate-400 text-xs font-normal">Interactive Force-Directed Layout</div>
          </div>
        </h1>
      </div>

      {/* Export/Download Button */}
      <button
        onClick={() => {
          const data = { nodes, edges, config: simulationConfig };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'network-topology.json';
          a.click();
        }}
        className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl px-4 py-2.5 border border-slate-600/50 text-white hover:bg-slate-700 transition-all flex items-center gap-2 font-medium"
      >
        <Download size={18} />
        Export Network
      </button>
    </div>
  );
}
