# Phase 1: Node Types Integration - Implementation Guide

## Step 1: Install Dependencies

```bash
cd D:\Mxgraph_ReactFlow\apps\web
pnpm add @xyflow/react@^12.0.4 zod@^3.22.4
```

## Step 2: Create Flow Node Components Directory

```bash
mkdir apps\web\components\flow-nodes
```

## Step 3: Create Node Components

### StartNode.tsx
```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`
        relative w-24 h-24 rounded-full bg-green-500 
        flex items-center justify-center shadow-lg border-2
        ${selected ? 'border-green-700 ring-4 ring-green-200' : 'border-green-600'}
      `}
    >
      <Play className="w-8 h-8 text-white" fill="white" />
      <div className="absolute -bottom-6 text-xs font-medium">
        {data.label || 'Start'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
});
```

### DecisionNode.tsx
```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

export const DecisionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 45 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative w-24 h-24 bg-yellow-500 
        flex items-center justify-center shadow-lg border-2
        ${selected ? 'border-yellow-700 ring-4 ring-yellow-200' : 'border-yellow-600'}
      `}
      style={{ transform: 'rotate(45deg)' }}
    >
      <div style={{ transform: 'rotate(-45deg)' }}>
        <GitBranch className="w-6 h-6 text-white" />
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="yes" />
      <Handle type="source" position={Position.Right} id="no" />
    </motion.div>
  );
});
```

### ActionNode.tsx
```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`
        relative px-6 py-4 bg-blue-500 rounded-lg
        flex items-center gap-2 shadow-lg border-2
        ${selected ? 'border-blue-700 ring-4 ring-blue-200' : 'border-blue-600'}
      `}
    >
      <Zap className="w-5 h-5 text-white" />
      <span className="text-white font-medium">{data.label || 'Action'}</span>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
});
```

### EndNode.tsx
```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Square } from 'lucide-react';

export const EndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative w-24 h-24 rounded-full bg-red-500 
        flex items-center justify-center shadow-lg border-2
        ${selected ? 'border-red-700 ring-4 ring-red-200' : 'border-red-600'}
      `}
    >
      <Square className="w-8 h-8 text-white" fill="white" />
      <div className="absolute -bottom-6 text-xs font-medium">
        {data.label || 'End'}
      </div>
      <Handle type="target" position={Position.Top} />
    </motion.div>
  );
});
```

## Step 4: Register Node Types in Prototype

Update `apps/web/app/prototype/page.tsx`:

```typescript
import { StartNode } from '@/components/flow-nodes/StartNode';
import { DecisionNode } from '@/components/flow-nodes/DecisionNode';
import { ActionNode } from '@/components/flow-nodes/ActionNode';
import { EndNode } from '@/components/flow-nodes/EndNode';

const nodeTypes = {
  // Existing HBMP nodes
  processTask: ProcessTaskNode,
  gateway: GatewayNode,
  event: EventNode,
  lane: LaneNode,
  
  // New Flow Builder nodes
  flowStart: StartNode,
  flowDecision: DecisionNode,
  flowAction: ActionNode,
  flowEnd: EndNode,
};
```

## Step 5: Update Node Palette

Add Flow Builder nodes to palette:

```typescript
const paletteItems = [
  // Existing items...
  
  // Flow Builder Section
  { type: 'flowStart', label: 'Start', icon: '▶️', color: 'bg-green-100', category: 'Flow' },
  { type: 'flowDecision', label: 'Decision', icon: '◆', color: 'bg-yellow-100', category: 'Flow' },
  { type: 'flowAction', label: 'Action', icon: '⚡', color: 'bg-blue-100', category: 'Flow' },
  { type: 'flowEnd', label: 'End', icon: '⏹️', color: 'bg-red-100', category: 'Flow' },
];
```

## Step 6: Install and Test

```bash
# Install dependencies
cd D:\Mxgraph_ReactFlow
pnpm install

# Start HBMP
pnpm dev

# Open http://localhost:3000/prototype
# Test dragging new Flow Builder nodes
```

## Expected Result

✅ New Flow Builder nodes appear in palette under "Flow" category
✅ Nodes have Framer Motion animations (entrance, hover, selection)
✅ Nodes work alongside existing HBMP nodes
✅ Swimlanes still work with new nodes
✅ All nodes can be connected together

## Next Steps

After Phase 1 is complete and tested:
- **Phase 2**: Add configuration drawers for Flow nodes
- **Phase 3**: Add Zod validation
- **Phase 4**: Add execution engine
- **Phase 5**: Add collaboration features

## Troubleshooting

**Issue**: Nodes don't appear
- Check node types are registered
- Verify imports are correct
- Check console for errors

**Issue**: Animations don't work
- Verify framer-motion is installed
- Check Tailwind classes are applied
- Test in browser dev tools

**Issue**: Can't connect nodes
- Verify Handle components are present
- Check position props are correct
- Test with existing HBMP nodes
