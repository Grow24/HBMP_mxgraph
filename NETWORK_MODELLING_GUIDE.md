# 🚀 Network Modelling - Implementation Guide

## Quick Start for Next Developer

This guide helps you continue implementing the remaining 8 tasks to complete the full Network Modelling Engine.

---

## 📋 Current State (4/12 Complete)

✅ **Completed:**
1. Network Type Registry
2. Port-Level Semantics  
3. Backend Connection Rules
4. Topology Validation

🔄 **In Progress:**
5. Edge & Node Metadata (schemas done, XML encoding needed)

⏳ **Remaining:**
6. Node Metadata Schema (complete XML integration)
7. Composite Node Internal Modelling
8. Execution Semantics
9. Extend RF ⇄ MX Converters
10. Network Query APIs
11. Network Versioning
12. Rule Builder UI

---

## 🎯 TASK 5-6: Complete Metadata Implementation

### What's Done
- ✅ TypeScript interfaces in `packages/shared-types/src/metadata.ts`
- ✅ Comprehensive schemas for all node types
- ✅ Edge metadata schema

### What's Needed

1. **Update RF → MX Converter** (`packages/engine/src/rfToMx.ts`)
   ```typescript
   // Add metadata serialization to XML
   function serializeNodeMetadata(metadata: NodeMetadata): string {
     // Convert metadata to mxGraph XML attributes
     return `<metadata>${JSON.stringify(metadata)}</metadata>`;
   }
   ```

2. **Update MX → RF Converter** (`packages/engine/src/mxToRf.ts`)
   ```typescript
   // Parse metadata from XML
   function parseNodeMetadata(xmlNode: any): NodeMetadata {
     const metadataTag = xmlNode.querySelector('metadata');
     return metadataTag ? JSON.parse(metadataTag.textContent) : {};
   }
   ```

3. **Add Validation**
   - Use registry schemas to validate metadata
   - Integrate with existing validation service

---

## 🎯 TASK 7: Composite Node Internal Modelling

### Goal
Make composite nodes (lanes) into true subgraphs with internal logic.

### Implementation Steps

1. **Create Composite Engine** (`packages/engine/src/composite/compositeEngine.ts`)
   ```typescript
   export interface CompositeNode {
     id: string;
     type: 'composite';
     internalGraph: RFGraph;
     portMapping: PortMapping[];
     autoWiring: AutoWiringRule[];
   }
   
   export interface PortMapping {
     externalPort: string;
     internalNodeId: string;
     internalPort: string;
     direction: 'input' | 'output';
   }
   ```

2. **Add to Registry**
   - Update `LANE_NODE` in registry with composite config
   - Define auto-wiring rules

3. **Update UI**
   - Double-click to "drill into" composite
   - Breadcrumb navigation
   - Port mapping UI

---

## 🎯 TASK 8: Execution Semantics

### Goal
Add real execution logic to token simulation (not just animation).

### Implementation Steps

1. **Create Execution Engine** (`apps/web/lib/executionEngine.ts`)
   ```typescript
   export class ExecutionEngine {
     private registry: NetworkTypeRegistry;
     
     async executeNode(nodeId: string, input: any): Promise<any> {
       const node = this.getNode(nodeId);
       const nodeType = this.registry.nodeTypes[node.data.kind];
       
       if (!nodeType.behavior.executable) {
         throw new Error('Node is not executable');
       }
       
       // Execute based on node type
       switch(node.data.kind) {
         case 'processTask':
           return this.executeTransform(node, input);
         case 'gateway':
           return this.evaluateCondition(node, input);
         case 'api':
           return this.executeApiCall(node, input);
       }
     }
   }
   ```

2. **Add Condition Evaluator**
   ```typescript
   evaluateCondition(condition: string, context: any): boolean {
     // Use expr-eval or similar
     return expr.evaluate(condition, context);
   }
   ```

3. **Token State Management**
   ```typescript
   interface TokenState {
     id: string;
     data: any;
     currentNodeId: string;
     history: string[];
     status: 'running' | 'paused' | 'completed' | 'error';
   }
   ```

---

## 🎯 TASK 9: Extend RF ⇄ MX Converters

### Goal
Preserve ALL semantic data through round-trip conversions.

### Implementation Steps

1. **Update `rfToMx.ts`**
   ```typescript
   export function rfToMx(rfGraph: RFGraph, options?: RfToMxOptions): string {
     // Include metadata in XML
     const cells = rfGraph.nodes.map(node => {
       const metadata = serializeMetadata(node.data);
       const ports = serializePorts(node.data.kind);
       
       return `
         <mxCell id="${node.id}" 
                 value="${node.data.label}"
                 style="${generateStyle(node)}"
                 vertex="1">
           <mxGeometry x="${node.position.x}" 
                       y="${node.position.y}"
                       width="${node.width}" 
                       height="${node.height}" />
           ${metadata}
           ${ports}
         </mxCell>
       `;
     });
   }
   ```

2. **Add Round-Trip Tests**
   ```typescript
   // In packages/engine/src/testing/
   describe('Round-trip preservation', () => {
     it('preserves node metadata', () => {
       const original = createTestGraph();
       const xml = rfToMx(original);
       const restored = mxToRf(xml);
       
       expect(restored.nodes[0].data.metadata)
         .toEqual(original.nodes[0].data.metadata);
     });
   });
   ```

---

## 🎯 TASK 10: Network Query APIs (HIGH PRIORITY)

### Goal
Provide graph analysis APIs like lineage tools.

### Implementation Steps

1. **Create Query Service** (`apps/server/src/services/networkQuery.ts`)
   ```typescript
   export class NetworkQueryService {
     getUpstream(nodeId: string, graph: RFGraph): string[] {
       // BFS backwards through edges
       const upstream: string[] = [];
       const queue = [nodeId];
       const visited = new Set();
       
       while (queue.length > 0) {
         const current = queue.shift()!;
         if (visited.has(current)) continue;
         visited.add(current);
         
         const incoming = graph.edges.filter(e => e.target === current);
         incoming.forEach(edge => {
           upstream.push(edge.source);
           queue.push(edge.source);
         });
       }
       
       return upstream;
     }
     
     getDownstream(nodeId: string, graph: RFGraph): string[] {
       // BFS forwards through edges
     }
     
     getPaths(startId: string, endId: string, graph: RFGraph): string[][] {
       // Find all paths between two nodes
     }
     
     findMissingInputs(graph: RFGraph): string[] {
       // Nodes with required inputs that aren't connected
     }
     
     getImpactAnalysis(nodeId: string, graph: RFGraph) {
       // What would break if this node was removed?
       return {
         affectedNodes: this.getDownstream(nodeId, graph),
         brokenPaths: this.findBrokenPaths(nodeId, graph),
         criticalImpact: this.isCriticalNode(nodeId, graph)
       };
     }
   }
   ```

2. **Add REST Endpoints**
   ```typescript
   // In apps/server/src/routes/diagrams.ts
   router.post('/query/upstream', async (req, res) => {
     const { nodeId, graph } = req.body;
     const upstream = networkQueryService.getUpstream(nodeId, graph);
     res.json({ upstream });
   });
   
   router.post('/query/impact', async (req, res) => {
     const { nodeId, graph } = req.body;
     const impact = networkQueryService.getImpactAnalysis(nodeId, graph);
     res.json(impact);
   });
   ```

3. **Add React Hook**
   ```typescript
   // apps/web/hooks/useNetworkQuery.ts
   export function useNetworkQuery() {
     const { getNodes, getEdges } = useReactFlow();
     
     const getUpstream = useCallback((nodeId: string) => {
       const graph = { nodes: getNodes(), edges: getEdges() };
       // Call API or compute locally
     }, [getNodes, getEdges]);
     
     return { getUpstream, getDownstream, getPaths, getImpact };
   }
   ```

---

## 🎯 TASK 11: Network Versioning

### Goal
Add version control for networks (like Git for diagrams).

### Implementation Steps

1. **Add Prisma Schema** (`apps/server/prisma/schema.prisma`)
   ```prisma
   model DiagramVersion {
     id          String   @id @default(cuid())
     diagramId   String
     version     Int
     snapshot    Json     // Complete graph state
     diff        Json?    // Changes from previous version
     message     String?  // Commit message
     createdAt   DateTime @default(now())
     createdBy   String?
     
     diagram     Diagram  @relation(fields: [diagramId], references: [id])
   }
   ```

2. **Create Versioning Service**
   ```typescript
   export class VersioningService {
     async createSnapshot(diagramId: string, graph: RFGraph, message?: string) {
       const latestVersion = await this.getLatestVersion(diagramId);
       const diff = this.calculateDiff(latestVersion?.snapshot, graph);
       
       return prisma.diagramVersion.create({
         data: {
           diagramId,
           version: (latestVersion?.version || 0) + 1,
           snapshot: graph,
           diff,
           message
         }
       });
     }
     
     calculateDiff(oldGraph: RFGraph, newGraph: RFGraph) {
       return {
         nodesAdded: findAddedNodes(oldGraph, newGraph),
         nodesRemoved: findRemovedNodes(oldGraph, newGraph),
         nodesModified: findModifiedNodes(oldGraph, newGraph),
         edgesAdded: findAddedEdges(oldGraph, newGraph),
         edgesRemoved: findRemovedEdges(oldGraph, newGraph)
       };
     }
   }
   ```

---

## 🎯 TASK 12: Rule Builder UI

### Goal
Visual interface for configuring network rules and constraints.

### Implementation Steps

1. **Create Rule Builder Component**
   ```typescript
   // apps/web/components/RuleBuilder.tsx
   export function RuleBuilder() {
     return (
       <Tabs>
         <TabsList>
           <TabsTrigger value="nodes">Node Types</TabsTrigger>
           <TabsTrigger value="connections">Connections</TabsTrigger>
           <TabsTrigger value="ports">Ports</TabsTrigger>
           <TabsTrigger value="validation">Validation</TabsTrigger>
         </TabsList>
         
         <TabsContent value="nodes">
           <NodeTypeEditor />
         </TabsContent>
         
         <TabsContent value="connections">
           <ConnectionRuleEditor />
         </TabsContent>
       </Tabs>
     );
   }
   ```

2. **Node Type Editor**
   - Edit allowed targets/sources
   - Configure ports
   - Set validation rules

3. **Connection Rule Editor**
   - Visual matrix of allowed connections
   - Port compatibility rules
   - Custom conditions

---

## 🏃 Recommended Order

1. **TASK 10** (Network Query APIs) - Most valuable, enables analytics
2. **TASK 9** (Extend Converters) - Critical for persistence
3. **TASK 8** (Execution Semantics) - Brings simulation to life
4. **TASK 11** (Versioning) - Enterprise feature
5. **TASK 7** (Composite Nodes) - Power user feature
6. **TASK 12** (Rule Builder UI) - Last, requires all others

---

## 📚 Reference Implementation

Look at these projects for inspiration:

- **Camunda Modeler** - BPMN execution semantics
- **N8N** - Node execution and port system
- **Apache NiFi** - Flow-based programming
- **Dagster** - Data pipeline orchestration
- **PowerBI** - Lineage tracking

---

## 🧪 Testing Strategy

For each task, create:

1. **Unit Tests** - Test individual functions
2. **Integration Tests** - Test end-to-end flows
3. **UI Tests** - Test user interactions
4. **Round-Trip Tests** - Ensure data preservation

Example:
```typescript
describe('NetworkQueryService', () => {
  it('finds upstream nodes', () => {
    const graph = createTestGraph();
    const upstream = queryService.getUpstream('node-3', graph);
    expect(upstream).toContain('node-1');
    expect(upstream).toContain('node-2');
  });
});
```

---

## 💡 Pro Tips

1. **Start Simple** - Implement basic version first, then enhance
2. **Use Existing Patterns** - Follow the structure in completed tasks
3. **Test Continuously** - Don't wait until the end
4. **Document As You Go** - Update NETWORK_MODELLING_PROGRESS.md
5. **Ask Questions** - Refer to registry types for guidance

---

## 📞 Need Help?

- Check existing implementations in `/packages/engine/src/network/`
- Look at tests in `/packages/engine/src/testing/`
- Review `NETWORK_MODELLING_PROGRESS.md` for context

---

**Good luck! You're building something amazing! 🚀**
