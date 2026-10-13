# 🧪 Testing the Network Modelling Features

## Quick Test Guide

This document helps you verify that all implemented features are working correctly.

---

## ✅ TASK 1: Test Network Type Registry

### Test 1.1: Registry Loads
```typescript
import { HBMP_NETWORK_REGISTRY } from '@hbmp/engine';

// Should return registry object
console.log(HBMP_NETWORK_REGISTRY.version); // "1.0.0"
console.log(Object.keys(HBMP_NETWORK_REGISTRY.nodeTypes).length); // 11 node types
```

### Test 1.2: Node Types Defined
```typescript
const datasetNode = HBMP_NETWORK_REGISTRY.nodeTypes.dataset;

console.log(datasetNode.name); // "Dataset"
console.log(datasetNode.ports.length); // 1 (output port)
console.log(datasetNode.allowedTargets); // ['model', 'report', 'api', 'filter']
console.log(datasetNode.category); // "data"
```

### Test 1.3: Validation Rules Exist
```typescript
const processTask = HBMP_NETWORK_REGISTRY.nodeTypes.processTask;

console.log(processTask.validation.minInputs); // 1
console.log(processTask.validation.customRules?.length); // Should have rules
```

**Expected Result:** ✅ All node types load with complete definitions

---

## ✅ TASK 2: Test Port-Level Semantics

### Test 2.1: Registry Query Engine
```typescript
import { createRegistryQuery, HBMP_NETWORK_REGISTRY } from '@hbmp/engine';

const query = createRegistryQuery(HBMP_NETWORK_REGISTRY);

// Get compatible targets
const targets = query.getCompatibleTargets('dataset');
console.log(targets); // Should include 'processTask', 'report', etc.

// Validate connection
const result = query.isConnectionValid('dataset', 'processTask');
console.log(result.valid); // true
console.log(result.reason); // undefined (no errors)
```

### Test 2.2: Invalid Connection Blocked
```typescript
// Try connecting report to dataset (backwards flow)
const result = query.isConnectionValid('report', 'dataset');
console.log(result.valid); // false
console.log(result.reason); // "Report cannot connect to Dataset"
```

### Test 2.3: Port Type Validation
```typescript
const dataPort = query.getPortsByType('dataset', 'data');
console.log(dataPort.length); // 1
console.log(dataPort[0].direction); // 'out'
console.log(dataPort[0].type); // 'data'
```

### Test 2.4: React Flow UI Test

**Manual Test Steps:**
1. Open the diagram editor (`/prototype` or `/projects/[id]/diagrams/[id]`)
2. Add a Dataset node
3. Add a Report node
4. Try to connect Dataset → Report
   - ✅ Should work (valid connection)
5. Try to connect Report → Dataset
   - ❌ Should be blocked with error message
6. Hover over node ports
   - ✅ Should show port type and compatible connections

**Expected Result:** ✅ Invalid connections are blocked at UI level

---

## ✅ TASK 3: Test Backend Connection Rules

### Test 3.1: Validation Endpoint

**Manual API Test:**
```bash
curl -X POST http://localhost:3001/api/diagrams/validate \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        {
          "id": "1",
          "type": "dataset",
          "data": { "kind": "dataset", "label": "Data" },
          "position": { "x": 0, "y": 0 }
        },
        {
          "id": "2",
          "type": "report",
          "data": { "kind": "report", "label": "Report" },
          "position": { "x": 200, "y": 0 }
        }
      ],
      "edges": [
        {
          "id": "e1",
          "source": "1",
          "target": "2"
        }
      ]
    },
    "registryVersion": "v1"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "issues": [],
  "summary": {
    "totalIssues": 0,
    "errorCount": 0,
    "warningCount": 0,
    "infoCount": 0
  },
  "networkValidation": {
    "hasCycles": false,
    "hasOrphanedNodes": false,
    "connectionRulesEnforced": true
  }
}
```

### Test 3.2: Invalid Connection Rejected
```bash
# Try connecting Report → Dataset (backwards)
curl -X POST http://localhost:3001/api/diagrams/validate \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [...],
      "edges": [
        {
          "id": "e1",
          "source": "2",  // Report
          "target": "1"   // Dataset
        }
      ]
    },
    "registryVersion": "v1"
  }'
```

**Expected Response:**
```json
{
  "ok": false,
  "issues": [
    {
      "id": "e1-invalid-connection",
      "edgeId": "e1",
      "level": "error",
      "message": "Report cannot connect to Dataset",
      "type": "edge"
    }
  ],
  "summary": {
    "errorCount": 1,
    ...
  }
}
```

### Test 3.3: Cycle Detection
```bash
# Create a cycle: A → B → C → A
curl -X POST http://localhost:3001/api/diagrams/validate \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        { "id": "A", "data": { "kind": "processTask" }, ... },
        { "id": "B", "data": { "kind": "processTask" }, ... },
        { "id": "C", "data": { "kind": "processTask" }, ... }
      ],
      "edges": [
        { "id": "e1", "source": "A", "target": "B" },
        { "id": "e2", "source": "B", "target": "C" },
        { "id": "e3", "source": "C", "target": "A" }  // Cycle!
      ]
    },
    "registryVersion": "v1"
  }'
```

**Expected Response:**
```json
{
  "ok": false,
  "issues": [
    {
      "id": "global-cycles-detected",
      "level": "error",
      "message": "Network contains 1 cycle(s). Cycles are not allowed.",
      "type": "graph"
    }
  ],
  "networkValidation": {
    "hasCycles": true,
    ...
  }
}
```

**Expected Result:** ✅ Backend rejects invalid networks

---

## ✅ TASK 4: Test Topology Validation

### Test 4.1: Topology Analysis Endpoint

```bash
curl -X POST http://localhost:3001/api/diagrams/topology \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        { "id": "dataset1", "data": { "kind": "dataset", "label": "Source" }, ... },
        { "id": "task1", "data": { "kind": "processTask", "label": "Transform" }, ... },
        { "id": "report1", "data": { "kind": "report", "label": "Output" }, ... },
        { "id": "orphan", "data": { "kind": "processTask", "label": "Disconnected" }, ... }
      ],
      "edges": [
        { "id": "e1", "source": "dataset1", "target": "task1" },
        { "id": "e2", "source": "task1", "target": "report1" }
      ]
    },
    "registryVersion": "v1"
  }'
```

**Expected Response:**
```json
{
  "valid": true,
  "issues": [
    {
      "id": "global-orphaned-nodes",
      "level": "warn",
      "message": "Found 1 orphaned node(s) with no connections",
      "type": "graph",
      "details": {
        "orphanedNodes": ["orphan"]
      }
    }
  ],
  "metrics": {
    "totalNodes": 4,
    "totalEdges": 2,
    "startNodes": 1,
    "endNodes": 1,
    "maxDepth": 2,
    "averageConnectivity": 0.5,
    "cycleCount": 0,
    "componentCount": 2,
    "longestPath": 2
  },
  "flowPaths": [
    {
      "id": "path-0",
      "nodes": ["dataset1", "task1", "report1"],
      "edges": ["e1", "e2"],
      "length": 3,
      "isComplete": true,
      "hasGaps": false
    }
  ],
  "unreachableNodes": [],
  "deadEnds": [],
  "criticalNodes": ["task1"]
}
```

### Test 4.2: Unreachable Node Detection

```bash
# Create network with unreachable node
curl -X POST http://localhost:3001/api/diagrams/topology \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        { "id": "start", "data": { "kind": "dataset" }, ... },
        { "id": "task1", "data": { "kind": "processTask" }, ... },
        { "id": "unreachable", "data": { "kind": "processTask" }, ... }
      ],
      "edges": [
        { "id": "e1", "source": "start", "target": "task1" }
        // unreachable node has no incoming edges from start
      ]
    },
    "registryVersion": "v1"
  }'
```

**Expected Response:**
```json
{
  "unreachableNodes": ["unreachable"],
  "issues": [
    {
      "id": "topology-unreachable-nodes",
      "level": "warn",
      "message": "Found 1 unreachable node(s) from start nodes"
    }
  ]
}
```

### Test 4.3: Critical Node Detection

```bash
# Create network with critical node
curl -X POST http://localhost:3001/api/diagrams/topology \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        { "id": "source", "data": { "kind": "dataset" }, ... },
        { "id": "bottleneck", "data": { "kind": "processTask" }, ... },
        { "id": "output", "data": { "kind": "report" }, ... }
      ],
      "edges": [
        { "id": "e1", "source": "source", "target": "bottleneck" },
        { "id": "e2", "source": "bottleneck", "target": "output" }
      ]
    },
    "registryVersion": "v1"
  }'
```

**Expected Response:**
```json
{
  "criticalNodes": ["bottleneck"],
  "issues": [
    {
      "id": "topology-critical-nodes",
      "level": "info",
      "message": "Found 1 critical node(s) that would break flow if removed"
    }
  ]
}
```

**Expected Result:** ✅ Topology analysis identifies all issues

---

## 🔄 TASK 5-6: Test Metadata Schemas

### Test 5.1: Metadata Types Import
```typescript
import type { 
  EdgeMetadata, 
  DatasetNodeMetadata,
  ProcessTaskNodeMetadata 
} from '@hbmp/shared-types';

// Should compile without errors
const edgeMetadata: EdgeMetadata = {
  label: "Data Flow",
  mapping: [
    { sourceField: "id", targetField: "userId", required: true }
  ],
  transform: {
    type: "map",
    operation: "uppercase"
  }
};

const nodeMetadata: DatasetNodeMetadata = {
  label: "Customer Data",
  source: {
    type: "database",
    connectionString: "postgres://...",
    query: "SELECT * FROM customers"
  },
  schema: {
    fields: [
      { name: "id", type: "number", required: true },
      { name: "name", type: "string", required: true }
    ]
  },
  refreshRate: 3600
};
```

### Test 5.2: Metadata Validation (When Integrated)
```typescript
// This will work when TASK 9 is complete
import { rfToMx, mxToRf } from '@hbmp/engine';

const graphWithMetadata = {
  nodes: [{
    id: "1",
    type: "dataset",
    data: {
      kind: "dataset",
      label: "Test",
      metadata: nodeMetadata  // Rich metadata
    }
  }],
  edges: [{
    id: "e1",
    source: "1",
    target: "2",
    data: edgeMetadata  // Rich edge metadata
  }]
};

// Round-trip test
const xml = rfToMx(graphWithMetadata);
const restored = mxToRf(xml);

// Should preserve metadata
expect(restored.nodes[0].data.metadata).toEqual(nodeMetadata);
```

**Expected Result:** ✅ Types compile, metadata structures are type-safe

---

## 🎯 Integration Test: Complete Workflow

### End-to-End Test Scenario

1. **Create a Valid Network**
   ```typescript
   const testGraph = {
     nodes: [
       { id: "1", type: "dataset", data: { kind: "dataset", label: "Source" } },
       { id: "2", type: "processTask", data: { kind: "processTask", label: "Transform" } },
       { id: "3", type: "report", data: { kind: "report", label: "Output" } }
     ],
     edges: [
       { id: "e1", source: "1", target: "2" },
       { id: "e2", source: "2", target: "3" }
     ]
   };
   ```

2. **Validate Locally (Frontend)**
   ```typescript
   const { isValidConnection } = useConnectionValidation();
   const valid = isValidConnection({ source: "1", target: "2" });
   // ✅ Should be true
   ```

3. **Validate on Backend**
   ```typescript
   const response = await fetch('/api/diagrams/validate', {
     method: 'POST',
     body: JSON.stringify({ graph: testGraph, registryVersion: 'v1' })
   });
   const result = await response.json();
   // ✅ result.ok should be true
   ```

4. **Analyze Topology**
   ```typescript
   const topology = await fetch('/api/diagrams/topology', {
     method: 'POST',
     body: JSON.stringify({ graph: testGraph })
   });
   const analysis = await topology.json();
   // ✅ Should show: 1 start node, 1 end node, max depth 2
   ```

5. **Save and Reload**
   ```typescript
   await saveDiagram(testGraph);
   const loaded = await loadDiagram(diagramId);
   // ✅ Should match original structure
   ```

**Expected Result:** ✅ Complete workflow works end-to-end

---

## 📊 Test Checklist

### Registry Tests
- [ ] Registry loads successfully
- [ ] All 11 node types are defined
- [ ] Node types have ports defined
- [ ] Validation rules exist
- [ ] Lane types are configured

### Connection Validation Tests
- [ ] Valid connections are allowed
- [ ] Invalid connections are blocked
- [ ] Port type compatibility works
- [ ] Multiplicity rules enforced
- [ ] Cycle detection works

### Backend Tests
- [ ] `/validate` endpoint works
- [ ] Invalid networks are rejected
- [ ] Cycles are detected
- [ ] Orphan nodes are flagged
- [ ] Connection rules enforced

### Topology Tests
- [ ] `/topology` endpoint works
- [ ] Metrics are calculated
- [ ] Unreachable nodes found
- [ ] Dead ends identified
- [ ] Critical nodes detected
- [ ] Flow paths calculated

### Metadata Tests
- [ ] Types compile without errors
- [ ] Interfaces are type-safe
- [ ] Metadata structures are complete

---

## 🐛 Common Issues

### Issue 1: Registry Not Found
**Error:** `Cannot find module '@hbmp/engine'`

**Solution:**
```bash
cd packages/engine
pnpm build
cd ../..
pnpm install
```

### Issue 2: Type Errors
**Error:** `Property 'metadata' does not exist`

**Solution:**
```bash
cd packages/shared-types
pnpm build
cd ../../apps/web
pnpm install
```

### Issue 3: Validation Endpoint 404
**Error:** `POST /api/diagrams/validate 404`

**Solution:**
```bash
cd apps/server
pnpm dev  # Make sure server is running
```

---

## 🎉 Success Criteria

Your implementation is working if:

✅ All node types load from registry  
✅ Invalid connections are blocked in UI  
✅ Backend rejects invalid networks  
✅ Topology analysis returns metrics  
✅ No TypeScript compilation errors  
✅ All manual tests pass  

---

**Ready to test? Start with the registry tests and work your way down! 🧪**
