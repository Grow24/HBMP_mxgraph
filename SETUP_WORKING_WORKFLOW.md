# Setup Working n8n Workflow - Complete Demo

## 🎯 This Workflow Will:
1. ✅ Receive customer feedback via webhook
2. ✅ Check if rating is positive (≥4) or negative (<4)
3. ✅ Generate appropriate response message
4. ✅ Log results to webhook.site (visible in browser)
5. ✅ Complete successfully with summary

**No database needed! Everything works in real-time!**

---

## Step 1: Get Webhook.site URL (30 seconds)

1. Open https://webhook.site in new browser tab
2. You'll see a **unique URL** like: `https://webhook.site/abc123-def456`
3. **Copy this URL** - we'll use it to see results

---

## Step 2: Import Working Workflow to n8n

### Option A: Import New Workflow
1. In n8n, go to **Workflows**
2. Click **"Create workflow"**
3. Press **Ctrl + V** (paste)
4. Paste content from `working-n8n-workflow.json`

### Option B: Replace Current Workflow
1. Open `working-n8n-workflow.json` in Notepad
2. Copy all content (**Ctrl + A**, **Ctrl + C**)
3. In n8n, select all (**Ctrl + A**)
4. Paste (**Ctrl + V**)

---

## Step 3: Configure Webhook.site Node

1. In n8n, click **"Log to Webhook.site"** node
2. Find the **URL** field
3. Replace `https://webhook.site/unique-url-here` with **your actual webhook.site URL**
4. Click **"Execute Node"** to test (optional)

---

## Step 4: Get Webhook URL

1. Click **"Receive Customer Feedback"** node (first node)
2. Copy the **Test URL** from right panel
3. Should be: `http://localhost:5678/webhook-test/customer-feedback`

---

## Step 5: Update Trigger Script

Open `trigger-workflow.bat` and update:
```batch
set WEBHOOK_URL=http://localhost:5678/webhook-test/customer-feedback
```

---

## Step 6: Activate Workflow

1. Toggle **"Active"** switch at top-right to **ON**
2. Workflow is now live!

---

## Step 7: Test It!

Run the trigger:
```bash
cd d:\Mxgraph_ReactFlow
trigger-workflow.bat
```

---

## Step 8: See Results

### In n8n:
- ✅ All nodes turn green
- ✅ Workflow completes successfully
- ✅ Click nodes to see data flow

### In webhook.site:
- ✅ New request appears
- ✅ Shows customer data
- ✅ Shows response message
- ✅ Shows timestamp

---

## Test Different Scenarios

### Positive Feedback (Rating ≥ 4):
```bash
curl -X POST http://localhost:5678/webhook-test/customer-feedback ^
  -H "Content-Type: application/json" ^
  -d "{\"customer\":\"John Doe\",\"rating\":5,\"comment\":\"Excellent!\"}"
```

**Result:** "Thank you John Doe for your positive feedback!"

### Negative Feedback (Rating < 4):
```bash
curl -X POST http://localhost:5678/webhook-test/customer-feedback ^
  -H "Content-Type: application/json" ^
  -d "{\"customer\":\"Jane Smith\",\"rating\":2,\"comment\":\"Not good\"}"
```

**Result:** "We're sorry Jane Smith. A manager will contact you within 24 hours."

---

## For Manager Demo

### Setup (5 min before):
1. ✅ n8n running with workflow active
2. ✅ webhook.site open in browser tab
3. ✅ HBMP running
4. ✅ trigger-workflow.bat ready

### Demo Flow (3 minutes):

**1. Show HBMP (30 sec):**
- "We design workflows visually in HBMP"
- Show the canvas with nodes

**2. Export (30 sec):**
- Click "Export to n8n"
- Download JSON

**3. Show n8n (30 sec):**
- "Workflow is now in n8n"
- Point out the nodes and flow

**4. Trigger (30 sec):**
- Run `trigger-workflow.bat`
- Watch n8n execute in real-time

**5. Show Results (30 sec):**
- All nodes green in n8n
- Show webhook.site with logged data
- "This happens automatically for every customer"

**6. Business Value (30 sec):**
- "90% faster than manual coding"
- "Business users can design"
- "$8K/month savings"

---

## What Each Node Does

| Node | Purpose | Output |
|------|---------|--------|
| Receive Customer Feedback | Webhook trigger | Raw customer data |
| Check Rating | Decision logic | Routes to positive/negative |
| Positive Response | Format message | Thank you message |
| Negative Response | Format message | Apology + manager alert |
| Log to Webhook.site | External logging | Sends to webhook.site |
| Final Summary | Completion status | Success confirmation |

---

## Troubleshooting

**Workflow stops at IF node?**
- Check test data has `rating` field
- Verify rating is a number (not string)

**Webhook.site not receiving?**
- Verify URL is correct in node
- Check workflow is ACTIVE
- Test node individually first

**Trigger script fails?**
- Verify webhook URL is correct
- Check n8n is running
- Make sure workflow is active

---

## 🎉 Success Criteria

When working correctly:
- ✅ Trigger script shows success
- ✅ All 6 nodes turn green in n8n
- ✅ Webhook.site shows new request
- ✅ Data flows through entire workflow
- ✅ Manager is impressed!

---

**This proves end-to-end automation works!** 🚀
