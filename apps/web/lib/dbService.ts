// Simple SQLite service using browser's IndexedDB as fallback
export interface NodePosition {
  id: string;
  diagramId: string;
  nodeId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  parentNodeId?: string;
  laneId?: string;
  layoutType: 'auto' | 'manual' | 'swimlane';
  updatedAt: number;
}

export interface DiagramLayout {
  id: string;
  diagramId: string;
  nodes: any[];
  edges: any[];
  layoutType: string;
  updatedAt: number;
}

class IndexedDBService {
  private dbName = 'hbmp-diagrams';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create node positions store
        if (!db.objectStoreNames.contains('nodePositions')) {
          const nodeStore = db.createObjectStore('nodePositions', { keyPath: 'id' });
          nodeStore.createIndex('diagramId', 'diagramId', { unique: false });
          nodeStore.createIndex('nodeId', 'nodeId', { unique: false });
        }
        
        // Create diagram layouts store
        if (!db.objectStoreNames.contains('diagramLayouts')) {
          const layoutStore = db.createObjectStore('diagramLayouts', { keyPath: 'id' });
          layoutStore.createIndex('diagramId', 'diagramId', { unique: false });
        }
      };
    });
  }

  async saveNodePositions(diagramId: string, positions: Omit<NodePosition, 'id' | 'diagramId' | 'updatedAt'>[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['nodePositions'], 'readwrite');
    const store = transaction.objectStore('nodePositions');
    
    // Clear existing positions for this diagram
    const index = store.index('diagramId');
    const deletePromises: Promise<void>[] = [];
    
    return new Promise((resolve, reject) => {
      const clearRequest = index.openCursor(IDBKeyRange.only(diagramId));
      clearRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Add new positions
          positions.forEach((pos, index) => {
            const nodePosition: NodePosition = {
              id: `${diagramId}-${pos.nodeId}-${Date.now()}-${index}`,
              diagramId,
              ...pos,
              updatedAt: Date.now()
            };
            store.add(nodePosition);
          });
          
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        }
      };
    });
  }

  async getNodePositions(diagramId: string): Promise<NodePosition[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['nodePositions'], 'readonly');
      const store = transaction.objectStore('nodePositions');
      const index = store.index('diagramId');
      const request = index.getAll(diagramId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveDiagramLayout(layout: Omit<DiagramLayout, 'id' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.init();
    
    const diagramLayout: DiagramLayout = {
      id: `${layout.diagramId}-${Date.now()}`,
      ...layout,
      updatedAt: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['diagramLayouts'], 'readwrite');
      const store = transaction.objectStore('diagramLayouts');
      
      // Remove old layouts for this diagram
      const index = store.index('diagramId');
      const deleteRequest = index.openCursor(IDBKeyRange.only(layout.diagramId));
      
      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Add new layout
          const addRequest = store.add(diagramLayout);
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
    });
  }

  async getDiagramLayout(diagramId: string): Promise<DiagramLayout | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['diagramLayouts'], 'readonly');
      const store = transaction.objectStore('diagramLayouts');
      const index = store.index('diagramId');
      const request = index.getAll(diagramId);
      
      request.onsuccess = () => {
        const layouts = request.result;
        if (layouts.length > 0) {
          // Return the most recent layout
          const latest = layouts.sort((a, b) => b.updatedAt - a.updatedAt)[0];
          resolve(latest);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new IndexedDBService();