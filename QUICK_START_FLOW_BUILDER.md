# Quick Start: Flow Builder Integration

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd d:\Mxgraph_ReactFlow
pnpm install
```

### Step 2: Start Development Server
```bash
pnpm dev
```

### Step 3: Open Prototype
Navigate to: `http://localhost:3000/prototype`

---

## 🎯 Try Flow Builder Features

### Create Your First Flow

1. **Find Flow Builder Palette**
   - Look for "Flow Builder" category in left sidebar
   - 6 new node types available

2. **Build a Simple Flow**
   ```
   Flow Start → Flow Action → Flow Decision → Flow End
                                    ↓
                              Flow Action (alternate path)
   ```

3. **Configure Nodes**
   - Click any Action or Decision node
   - Drawer opens from right
   - Fill in configuration
   - Click Save

4. **Execute Flow**
   - Click "▶️ Execute Flow" button in sidebar
   - Watch execution panel appear (bottom-right)
   - See step-by-step progress
   - View logs in real-time

---

## 🎨 Available Node Types

| Node | Icon | Color | Purpose |
|------|------|-------|---------|
| Flow Start | ▶️ | Green | Entry point |
| Flow Action | ⚡ | Blue | CRUD operations |
| Flow Decision | ◆ | Yellow | Conditional branching |
| Flow Process | ⚙️ | Purple | Custom processing |
| Flow Table | 📊 | Indigo | Data visualization |
| Flow End | ⏹️ | Red | Exit point |

---

## 💡 Quick Tips

### Animations
- All nodes have entrance animations
- Hover for lift effect
- Selection shows ring highlight

### Configuration
- Action nodes: Set action type (create/update/delete/query)
- Decision nodes: Set condition and operator
- Validation prevents invalid data

### Execution
- Must have Flow Start node
- Follows edge connections
- Decision nodes branch based on condition
- Logs show each step

### Integration
- Works with swimlanes
- Compatible with existing features
- Saves with layout
- Exports with mxGraph

---

## 🔧 Troubleshooting

### Nodes Not Appearing?
- Check console for errors
- Verify pnpm install completed
- Refresh browser

### Configuration Not Saving?
- Check validation errors (red text)
- Ensure required fields filled
- Try again after fixing errors

### Execution Not Starting?
- Verify Flow Start node exists
- Check nodes are connected
- Look for console errors

---

## 📚 Next Steps

1. **Explore Examples**: Try different flow patterns
2. **Combine Features**: Use with swimlanes and animations
3. **Read Full Docs**: See FLOW_BUILDER_INTEGRATION_COMPLETE.md
4. **Customize**: Modify node styles and behavior

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Flow Builder category appears in palette
- ✅ Nodes have smooth animations
- ✅ Configuration drawer opens on click
- ✅ Execution panel shows progress
- ✅ Logs display in real-time

---

**Ready to build flows!** 🎉
