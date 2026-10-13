# Trigger n8n Workflow - Live Demo

## 🎯 Goal
Automatically trigger the n8n workflow to prove it works in real-time.

---

## Step 1: Get Webhook URL

1. In **n8n**, click the **first node** (webhook/trigger)
2. Right panel shows **"Webhook URLs"**
3. Copy the **"Test URL"** (looks like: `http://localhost:5678/webhook/...`)

---

## Step 2: Update Trigger Script

Open `trigger-workflow.bat` and replace the URL:

```batch
set WEBHOOK_URL=http://localhost:5678/webhook/YOUR-WEBHOOK-PATH
```

---

## Step 3: Run the Trigger

### Option A: Batch Script (Easiest)
```bash
trigger-workflow.bat
```

### Option B: Node Script
```bash
node trigger-n8n-workflow.js
```

### Option C: Direct curl
```bash
curl -X POST http://localhost:5678/webhook/customer-feedback \
  -H "Content-Type: application/json" \
  -d "{\"customer\":\"John Doe\",\"rating\":5,\"comment\":\"Great!\"}"
```

---

## Step 4: Watch n8n Execute

In n8n, you'll see:
- ✅ Workflow executes automatically
- ✅ Nodes light up as they process
- ✅ Data flows through the workflow
- ✅ Results appear in execution log

---

## For Manager Demo

### Setup (Before Demo):
1. n8n running with workflow active
2. HBMP running
3. `trigger-workflow.bat` ready

### Demo Flow:
1. **Show HBMP**: "We design workflows visually"
2. **Export**: Click "Export to n8n"
3. **Show n8n**: "Workflow is now in n8n"
4. **Trigger**: Run `trigger-workflow.bat`
5. **Watch**: Workflow executes in real-time!
6. **Explain**: "This happens automatically when customers submit feedback"

---

## Test Data Examples

### Positive Feedback (Rating >= 4):
```json
{
  "customer": "Jane Smith",
  "rating": 5,
  "comment": "Excellent service!"
}
```

### Negative Feedback (Rating < 4):
```json
{
  "customer": "Bob Johnson",
  "rating": 2,
  "comment": "Not satisfied"
}
```

---

## Troubleshooting

**"Connection refused"?**
- Check n8n is running
- Verify webhook URL is correct
- Make sure workflow is ACTIVE

**"Workflow not executing"?**
- Toggle workflow OFF then ON
- Check webhook node configuration
- Look at n8n execution logs

**"curl not found"?**
- Use Node script instead: `node trigger-n8n-workflow.js`
- Or install curl for Windows

---

## 🎉 Success!

When it works, you'll see:
- ✅ Script shows "Workflow triggered successfully!"
- ✅ n8n shows execution in progress
- ✅ Workflow completes with results
- ✅ Manager is impressed!

---

**This proves the automation works end-to-end!** 🚀
