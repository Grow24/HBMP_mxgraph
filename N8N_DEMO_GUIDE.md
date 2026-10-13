# n8n Integration Demo - Quick Start Guide

## 🎯 5-Minute Demo Setup

### Step 1: Install n8n (2 minutes)

**Option A: Docker (Recommended)**
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

**Option B: NPM**
```bash
npm install n8n -g
n8n start
```

Access n8n at: **http://localhost:5678**

---

### Step 2: Start HBMP Platform (1 minute)

```bash
cd d:\Mxgraph_ReactFlow
pnpm dev
```

Access HBMP at: **http://localhost:3000/prototype**

---

### Step 3: Export Workflow (2 minutes)

1. **In HBMP**:
   - Look at the existing workflow (Customer Service → Back Office)
   - Scroll down in the left sidebar
   - Find the **"🔗 n8n Integration (Demo)"** panel
   - Click **"📤 Export to n8n"** button
   - Confirm the export
   - A JSON file will download: `hbmp-customer-workflow.json`

2. **In n8n**:
   - Open http://localhost:5678
   - Click **"Import from File"** (or Settings → Import)
   - Select the downloaded JSON file
   - Click **"Import"**
   - Your HBMP workflow is now in n8n!

---

## 🎬 Demo Script for Manager

### Opening (30 seconds)
"I'll show you how HBMP integrates with n8n to turn visual designs into automated workflows."

### Part 1: Show HBMP Design (1 minute)
1. Point to the workflow on screen
2. "This is our customer service process - designed visually"
3. Click a few nodes to show configuration
4. "Business users can design this without coding"

### Part 2: Export to n8n (1 minute)
1. Scroll to n8n Integration panel
2. Click "Export to n8n"
3. Show the confirmation dialog with workflow summary
4. Download the JSON file
5. "With one click, we convert visual design to executable workflow"

### Part 3: Import to n8n (1 minute)
1. Switch to n8n tab (http://localhost:5678)
2. Import the JSON file
3. Show the workflow in n8n
4. "Now it's ready to execute with real integrations"

### Part 4: Business Value (1 minute)
"This reduces workflow creation time by 90%:
- Current: 2-3 days of developer time
- With HBMP+n8n: 30 minutes by business users
- ROI: $8,000 saved per month for 10 workflows"

---

## 📊 What Gets Exported

### HBMP Node → n8n Node Mapping

| HBMP Node | n8n Node | Purpose |
|-----------|----------|---------|
| Event (Start) | Webhook Trigger | Start workflow |
| Process Task | HTTP Request | API calls |
| Gateway | IF Node | Decisions |
| API Node | HTTP Request | External APIs |
| DB Node | Database Node | Database ops |
| Flow Action | HTTP Request | Actions |
| Flow Decision | IF Node | Conditions |

### Example Export

**HBMP Workflow:**
```
[Request Received] → [Validate Request] → [Valid?] → [Process Application]
```

**Becomes n8n Workflow:**
```json
{
  "name": "HBMP Customer Workflow",
  "nodes": [
    {
      "name": "Request Received",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "webhook-trigger" }
    },
    {
      "name": "Validate Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "method": "GET" }
    },
    {
      "name": "Valid?",
      "type": "n8n-nodes-base.if",
      "parameters": { "conditions": {...} }
    }
  ],
  "connections": {...}
}
```

---

## 🔧 Troubleshooting

### n8n not starting?
```bash
# Check if port 5678 is in use
netstat -ano | findstr :5678

# Kill the process if needed
taskkill /PID <PID> /F

# Restart n8n
docker restart n8n
```

### Export button not working?
- Check browser console (F12) for errors
- Ensure you have nodes and edges in the diagram
- Try refreshing the page

### Import fails in n8n?
- Ensure n8n is running
- Check the JSON file is valid
- Try importing a simpler workflow first

---

## 💡 Demo Tips

1. **Keep it Simple**: Use the default workflow, don't create complex ones
2. **Practice First**: Run through the demo 2-3 times before showing manager
3. **Have Backup**: Take screenshots in case live demo fails
4. **Show Value**: Focus on time savings and business user empowerment
5. **Be Ready**: Have n8n and HBMP running before the meeting

---

## 📝 Follow-Up Actions

After successful demo:

1. **Pilot Project**: Identify 3 workflows to automate
2. **Training**: Schedule session for business users
3. **Infrastructure**: Plan n8n self-hosted deployment
4. **Integration**: Connect to company's APIs and databases
5. **Rollout**: Gradual adoption across departments

---

## 🎯 Success Metrics

- ✅ Manager sees the export/import working
- ✅ Manager understands the business value
- ✅ Manager approves pilot project
- ✅ Timeline agreed for next steps

---

## 🚀 Next Steps

1. **Week 1-2**: Pilot with 3 workflows
2. **Week 3-4**: Gather feedback and refine
3. **Week 5-6**: Train business users
4. **Week 7-8**: Full rollout

---

## 📞 Support

- **n8n Docs**: https://docs.n8n.io/
- **HBMP Issues**: Check project README
- **Questions**: Contact development team

---

**Good luck with your demo! 🎉**
