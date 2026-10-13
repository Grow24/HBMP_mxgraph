# Flow Builder Integration Guide

## Overview
This document describes the integration of the Salesforce-style Flow Builder with the HBMP modeling platform.

## Architecture

### Phase 1: Type System Integration ✅
- Extended `NodeKind` in shared-types to include flow node types
- Added `FlowExecutionRequest` and `FlowExecutionResponse` types
- Created `FlowAdapter` for format conversion between systems

### Phase 2: Backend Integration ✅
- Added `FlowExecution` model to Prisma schema
- Created `/api/flows/:diagramId/execute` endpoint
- Created `/api/flows/:diagramId/executions` endpoint for history

### Phase 3: UI Integration ✅
- Created `FlowBuilderIframe` component for seamless embedding
- Added flow builder card to homepage
- Set up iframe communication for API integration

## Usage

### Starting the Integrated System

1. **Start HBMP Platform**:
   ```bash
   cd d:\Mxgraph_ReactFlow
   pnpm dev
   ```

2. **Start Flow Builder** (in separate terminal):
   ```bash
   cd d:\Mxgraph_ReactFlow\flow-builder
   npm run dev
   ```

3. **Access the Platform**:
   - HBMP Homepage: http://localhost:3000
   - Flow Builder (integrated): http://localhost:3000 → Click "Flow Builder" card
   - Flow Builder (standalone): http://localhost:5173

### Database Migration

Run the migration to add flow execution tables:

```bash
cd apps/server
pnpm db:migrate
```

### API Endpoints

#### Execute Flow
```http
POST /api/flows/:diagramId/execute
Content-Type: application/json

{
  "inputData": { "key": "value" },
  "executionMode": "test"
}
```

#### Get Execution History
```http
GET /api/flows/:diagramId/executions
```

## Format Conversion

### Flow Builder → HBMP
```typescript
import { FlowAdapter } from '@hbmp/engine';

const salesforceFlow = { nodes: [...], edges: [...] };
const hbmpGraph = FlowAdapter.salesforceToHBMP(salesforceFlow);
```

### HBMP → Flow Builder
```typescript
import { FlowAdapter } from '@hbmp/engine';

const hbmpGraph = { nodes: [...], edges: [...] };
const salesforceFlow = FlowAdapter.hbmpToSalesforce(hbmpGraph);
```

## Node Type Mapping

| Flow Builder | HBMP | Description |
|--------------|------|-------------|
| start | flowStart | Flow start event |
| decision | flowDecision | Decision/gateway node |
| action | flowAction | Action/task node |
| process | flowProcess | Process node |
| end | flowEnd | Flow end event |
| table | flowTable | Table/data node |

## Features

### Unified Platform
- Single entry point for all modeling needs
- Shared authentication and authorization
- Common database for persistence

### Cross-Compatibility
- Convert between HBMP and Flow Builder formats
- Export flows as mxGraph XML
- Import flows from both systems

### Enhanced Capabilities
- Flow execution engine from Flow Builder
- mxGraph export from HBMP
- Network modeling from HBMP
- Real-time collaboration from Flow Builder

## Configuration

### Environment Variables

```env
# HBMP Platform
DATABASE_URL="mysql://user:password@localhost:3306/hbmp"
SERVER_URL="http://localhost:3001"

# Flow Builder
VITE_API_URL="http://localhost:3001/api"
```

### Iframe Communication

The Flow Builder receives integration messages:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'HBMP_INTEGRATION') {
    const { apiEndpoint, features } = event.data;
    // Configure flow builder to use HBMP APIs
  }
});
```

## Troubleshooting

### Flow Builder Not Loading
- Ensure flow builder is running on port 5173
- Check browser console for CORS errors
- Verify iframe src URL in FlowBuilderIframe component

### API Errors
- Verify database migration completed
- Check server logs for errors
- Ensure FlowExecution model exists in Prisma

### Format Conversion Issues
- Verify node types match mapping table
- Check FlowAdapter for missing type mappings
- Validate input data structure

## Next Steps

1. **Authentication**: Add JWT/OAuth integration
2. **Real-time Sync**: Sync flow changes across systems
3. **Advanced Execution**: Implement full flow execution engine
4. **Collaboration**: Enable multi-user editing
5. **Version Control**: Add flow versioning and rollback

## Support

For issues or questions:
- Check HBMP documentation: `README.md`
- Check Flow Builder documentation: `flow-builder/README.md`
- Review integration code in `packages/engine/src/flowAdapter.ts`
