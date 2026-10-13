# Test n8n Export - Quick Checklist

## ✅ Pre-Demo Checklist

### 1. Install n8n
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```
- [ ] n8n running at http://localhost:5678
- [ ] Can access n8n web interface

### 2. Start HBMP
```bash
cd d:\Mxgraph_ReactFlow
pnpm dev
```
- [ ] HBMP running at http://localhost:3000
- [ ] Can access prototype page

### 3. Test Export
- [ ] Open http://localhost:3000/prototype
- [ ] See existing workflow with swimlanes
- [ ] Find "n8n Integration" panel in sidebar
- [ ] Click "Export to n8n" button
- [ ] See workflow summary dialog
- [ ] JSON file downloads successfully
- [ ] File name: `hbmp-customer-workflow.json`

### 4. Test Import
- [ ] Open n8n at http://localhost:5678
- [ ] Click "Import from File"
- [ ] Select downloaded JSON
- [ ] Workflow imports without errors
- [ ] All nodes visible in n8n canvas
- [ ] Connections preserved

## 🎯 Demo Day Checklist

- [ ] n8n running (start 10 min before)
- [ ] HBMP running (start 10 min before)
- [ ] Browser tabs open and ready
- [ ] Sample workflow visible in HBMP
- [ ] Backup screenshots prepared
- [ ] Demo script printed/available
- [ ] Manager's calendar confirmed

## 📊 Expected Results

**Workflow Summary Should Show:**
- Name: HBMP Customer Workflow
- Nodes: 7-8 nodes
- Connections: 6-7 connections
- Node Types: 3-4 types

**n8n Should Display:**
- All nodes from HBMP
- Proper connections
- Node names preserved
- Ready to activate

## 🐛 Common Issues

**Export button does nothing:**
- Check browser console (F12)
- Refresh page and try again

**Import fails in n8n:**
- Verify n8n is running
- Check JSON file is valid
- Try sample-n8n-workflow.json first

**Nodes missing in n8n:**
- Swimlane nodes are filtered out (expected)
- Only process nodes are exported

## ✨ Success Criteria

- ✅ Export completes in < 5 seconds
- ✅ JSON file downloads
- ✅ Import works in n8n
- ✅ Workflow looks correct
- ✅ Manager is impressed!
