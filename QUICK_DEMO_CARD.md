# 🎯 n8n Demo - Quick Reference Card

## Before Demo (10 min)

```bash
# Terminal 1: Start n8n
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n

# Terminal 2: Start HBMP
cd d:\Mxgraph_ReactFlow
pnpm dev
```

**Open Tabs:**
- http://localhost:5678 (n8n)
- http://localhost:3000/prototype (HBMP)

---

## Demo Script (3 min)

### 1. Show Design (30 sec)
"This is our customer service workflow - designed visually in HBMP"
- Point to swimlanes
- Click a node to show config

### 2. Export (30 sec)
"With one click, we export to n8n"
- Scroll to "n8n Integration" panel
- Click "Export to n8n"
- Show summary dialog
- Download JSON

### 3. Import (1 min)
"Now we import into n8n for execution"
- Switch to n8n tab
- Import from File
- Select downloaded JSON
- Show workflow in n8n

### 4. Value (1 min)
"This saves 90% of development time"
- Current: 2-3 days per workflow
- With HBMP+n8n: 30 minutes
- ROI: $8K/month savings

---

## Key Points

✅ Visual design by business users
✅ One-click export
✅ 300+ integrations via n8n
✅ 90% time savings
✅ Self-hosted & secure

---

## Backup Plan

If live demo fails:
1. Show screenshots
2. Walk through JSON file
3. Explain the concept
4. Schedule follow-up demo

---

## Expected Questions

**Q: How secure?**
A: Self-hosted, we control everything

**Q: What if n8n fails?**
A: Redundant deployment, HBMP works independently

**Q: Cost?**
A: n8n self-hosted is free

**Q: Timeline?**
A: 2-week pilot, then rollout

---

## Success = Manager Says:

✅ "Let's do a pilot"
✅ "When can we start?"
✅ "Show this to the team"

---

**You got this! 🚀**
