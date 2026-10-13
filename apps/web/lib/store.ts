import { create } from 'zustand';

export type CanvasMode = 'flow' | 'swimlane' | 'network';

export interface SimulationConfig {
  repulsion: number;
  gravity: number;
  linkStrength: number;
  collisionRadius: number;
}

interface AppState {
  canvasMode: CanvasMode;
  setCanvasMode: (mode: CanvasMode) => void;
  
  simulationConfig: SimulationConfig;
  updateSimulationConfig: (config: Partial<SimulationConfig>) => void;
  
  pinnedNodes: Set<string>;
  setPinnedNodes: (nodeIds: Set<string>) => void;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  togglePinNode: (nodeId: string) => void;
  
  highlightedNodes: Set<string>;
  setHighlightedNodes: (nodeIds: Set<string>) => void;
  clearHighlights: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  canvasMode: 'flow',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  
  simulationConfig: {
    repulsion: -300,
    gravity: 0.1,
    linkStrength: 0.5,
    collisionRadius: 50,
  },
  updateSimulationConfig: (config) =>
    set((state) => ({
      simulationConfig: { ...state.simulationConfig, ...config },
    })),
  
  pinnedNodes: new Set(),
  setPinnedNodes: (nodeIds) => set({ pinnedNodes: nodeIds }),
  pinNode: (nodeId) =>
    set((state) => ({
      pinnedNodes: new Set(state.pinnedNodes).add(nodeId),
    })),
  unpinNode: (nodeId) =>
    set((state) => {
      const newSet = new Set(state.pinnedNodes);
      newSet.delete(nodeId);
      return { pinnedNodes: newSet };
    }),
  togglePinNode: (nodeId) =>
    set((state) => {
      const newSet = new Set(state.pinnedNodes);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return { pinnedNodes: newSet };
    }),
  
  highlightedNodes: new Set(),
  setHighlightedNodes: (nodeIds) => set({ highlightedNodes: nodeIds }),
  clearHighlights: () => set({ highlightedNodes: new Set() }),
}));
