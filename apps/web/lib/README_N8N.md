# n8n Transformer Library

## Overview

Converts HBMP React Flow diagrams to n8n workflow format for automation.

## Usage

```typescript
import { transformToN8n, downloadN8nWorkflow } from '@/lib/n8nTransformer';

// Transform and download
const workflow = transformToN8n(nodes, edges, 'My Workflow');
downloadN8nWorkflow(workflow);
```

## Node Type Mapping

| HBMP Type | n8n Type | Description |
|-----------|----------|-------------|
| flowStart | webhook | Webhook trigger |
| flowAction | httpRequest | HTTP action |
| flowDecision | if | Conditional logic |
| flowProcess | function | Code execution |
| processTask | httpRequest | Task execution |
| gateway | if | Decision point |
| api | httpRequest | API call |
| db | postgres | Database op |

## Features

- Automatic node type conversion
- Connection preservation
- Parameter mapping
- Swimlane filtering (excluded from export)
- JSON download

## Example Output

```json
{
  "name": "HBMP Workflow",
  "nodes": [...],
  "connections": {...},
  "active": false
}
```

## Functions

### transformToN8n(nodes, edges, workflowName)
Converts React Flow data to n8n format.

### downloadN8nWorkflow(workflow)
Downloads workflow as JSON file.

### getWorkflowSummary(workflow)
Returns human-readable summary.
