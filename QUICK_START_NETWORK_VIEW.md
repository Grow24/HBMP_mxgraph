# Quick Start: Network View Integration

## ✅ Dependencies Installed

d3-force and @types/d3-force have been added to your project.

## 🚀 Integration Steps

### Step 1: Add View Toggle to Prototype Page

Open `apps/web/app/prototype/page.tsx` and add these imports at the top:

```typescript
import { ViewToggle } from '@/components/ViewToggle';
import { NetworkGraphView } from '@/components/NetworkGraphView';
import { useAppStore } from '@/lib/store';
```

### Step 2: Add Canvas Mode State

Inside `PrototypePageContent()`, add this line after the other state declarations:

```typescript
const { canvasMode } = useAppStore();
```

### Step 3: Add View Toggle in Header

Replace the existing header Panel with:

```typescript
<Panel position="top-center">
  <ViewToggle />
</Panel>
```

### Step 4: Conditional Canvas Rendering

Replace the main `<ReactFlow>` component with:

```typescript
{canvasMode === 'network' ? (
  <NetworkGraphView 
    initialNodes={nodes}
    initialEdges={edges}
    onNodesChange={(newNodes) => setNodes(newNodes)}
    onEdgesChange={(newEdges) => setEdges(newEdges)}
  />
) : (
  <ReactFlow
    // ... existing ReactFlow props
  >
    {/* ... existing ReactFlow children */}
  </ReactFlow>
)}
```

### Step 5: Setup Backend Routes

Open `apps/server/src/index.ts` and add:

```typescript
import networkRoutes from './routes/network';

// After other routes
app.use('/api/network', networkRoutes);
```

### Step 6: Run Database Migration

```bash
cd apps/server
npx prisma migrate dev --name add_network_modeling
npx prisma generate
```

### Step 7: Start Development

```bash
# From root directory
npx pnpm dev
```

## 🎯 Usage

1. Open http://localhost:3000/prototype
2. Click the **Network** tab in the top center
3. Watch nodes arrange with physics simulation
4. Click nodes to highlight neighbors
5. Drag nodes to reposition
6. Use sliders to adjust physics
7. Click "Analyze" to see topology metrics

## 🎨 Features Available

- **Play/Pause** - Control simulation
- **Re-run Layout** - Reset physics
- **Auto-fit** - Fit all nodes in view
- **Analyze** - Show topology analysis
- **Pin Nodes** - Click pin icon to fix position
- **Highlight Neighbors** - Click node to see connections
- **Adjust Physics** - Use sliders for repulsion, gravity, link strength

## 🔄 Switching Views

- **Flow** - Original flow builder with execution
- **Swimlane** - Lane-based process modeling
- **Network** - Force-directed graph visualization

All three views share the same node/edge data!

## 📝 Notes

- Network view uses dark theme (gray-900 background)
- Nodes are circular with color-coding by type
- High-degree nodes show influence glow
- Pinned nodes have a pin indicator
- Analysis panel shows metrics, clusters, critical nodes

## 🐛 Troubleshooting

**If view toggle doesn't appear:**
- Check that ViewToggle component is imported
- Verify useAppStore is imported from '@/lib/store'

**If network view is blank:**
- Ensure d3-force is installed (check package.json)
- Check browser console for errors
- Verify nodes have valid positions

**If simulation doesn't run:**
- Click "Play" button in control panel
- Check that nodes array is not empty
- Try clicking "Re-run Layout"

## 🎉 You're Done!

The Network Modeling View is now integrated. Switch between views using the toggle and explore the force-directed graph visualization!
