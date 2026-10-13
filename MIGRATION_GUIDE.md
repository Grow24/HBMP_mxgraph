# Migration Guide - Flow Builder Integration

## Overview

This guide explains what changed in the HBMP platform with the Flow Builder integration.

---

## 🔄 What Changed

### New Dependencies
```json
{
  "zod": "^3.22.4"
}
```

**Action Required**: Run `pnpm install` to install new dependencies.

---

## 📁 New Files Added

### Components (8 files)
```
apps/web/components/nodes/
├── FlowStartNode.tsx          (NEW)
├── FlowActionNode.tsx         (NEW)
├── FlowDecisionNode.tsx       (NEW)
├── FlowProcessNode.tsx        (NEW)
├── FlowTableNode.tsx          (NEW)
└── FlowEndNode.tsx            (NEW)

apps/web/components/flow/
├── FlowConfigDrawer.tsx       (NEW)
└── FlowExecutionPanel.tsx     (NEW)
```

### Libraries (1 file)
```
apps/web/lib/
└── flowExecutionEngine.ts     (NEW)
```

### Documentation (4 files)
```
Root/
├── FLOW_BUILDER_INTEGRATION_COMPLETE.md  (NEW)
├── QUICK_START_FLOW_BUILDER.md           (NEW)
├── IMPLEMENTATION_SUMMARY.md             (NEW)
├── VERIFICATION_CHECKLIST.md             (NEW)
└── MIGRATION_GUIDE.md                    (NEW - this file)
```

---

## 📝 Modified Files

### 1. apps/web/app/prototype/page.tsx

**Changes**:
- Added 6 new imports for Flow Builder nodes
- Added 2 new imports for Flow components
- Added 1 new import for execution engine
- Registered 6 new node types in `nodeTypes` object
- Added 6 new items to `paletteItems` array
- Added new state variables for Flow Builder
- Added Flow Builder execution controls
- Added configuration drawer integration
- Added execution panel integration

**Impact**: 
- ✅ No breaking changes to existing functionality
- ✅ All existing features continue to work
- ✅ New Flow Builder category appears in palette

### 2. apps/web/package.json

**Changes**:
- Added `"zod": "^3.22.4"` to dependencies

**Impact**:
- ✅ No breaking changes
- ✅ Requires `pnpm install` to update

### 3. README.md

**Changes**:
- Added Flow Builder Integration section
- Added links to new documentation

**Impact**:
- ✅ Documentation only
- ✅ No code changes

---

## 🔧 Breaking Changes

**NONE** ✅

All changes are additive. No existing functionality was modified or removed.

---

## 🚀 Migration Steps

### For Existing Projects

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Verify Installation**
   ```bash
   pnpm dev
   ```

4. **Test Existing Features**
   - Open prototype page
   - Verify existing nodes work
   - Verify swimlanes work
   - Verify animations work
   - Verify save/load works

5. **Test New Features**
   - Look for "Flow Builder" in palette
   - Try creating Flow nodes
   - Try configuring nodes
   - Try executing a flow

### For New Projects

Just follow the standard setup:
```bash
pnpm install
pnpm dev
```

---

## 🔍 Compatibility

### Backward Compatibility
- ✅ All existing nodes work unchanged
- ✅ All existing features work unchanged
- ✅ All existing APIs work unchanged
- ✅ All existing data structures work unchanged

### Forward Compatibility
- ✅ Flow Builder nodes can be used alongside existing nodes
- ✅ Flow Builder nodes work in swimlanes
- ✅ Flow Builder nodes work with existing animations
- ✅ Flow Builder nodes save/load with existing system

---

## 📊 Feature Comparison

### Before Integration
```
Node Types: 9 (lane, processTask, gateway, event, dataset, service, report, api, db)
Palette Categories: 3 (Structure, Process, Data)
Execution: Token animation only
Configuration: Properties panel only
Validation: Diagram-level only
```

### After Integration
```
Node Types: 15 (9 existing + 6 Flow Builder)
Palette Categories: 4 (Structure, Process, Data, Flow Builder)
Execution: Token animation + Flow execution engine
Configuration: Properties panel + Configuration drawer
Validation: Diagram-level + Node-level (Zod)
```

---

## 🎯 Usage Patterns

### Old Pattern (Still Works)
```typescript
// Create node
const node = {
  id: 'node-1',
  type: 'processTask',
  position: { x: 100, y: 100 },
  data: { label: 'Task' }
};

// Configure via properties panel
// Execute via token animation
```

### New Pattern (Flow Builder)
```typescript
// Create Flow node
const flowNode = {
  id: 'flow-1',
  type: 'flowAction',
  position: { x: 100, y: 100 },
  data: { 
    label: 'Create Record',
    actionType: 'create',
    targetObject: 'Account'
  }
};

// Configure via drawer (click node)
// Execute via execution engine
```

---

## 🔐 Security Considerations

### New Validation
- Zod schemas validate all Flow Builder configurations
- Client-side validation prevents invalid data
- Server-side validation (future enhancement)

### Execution Safety
- Execution engine runs in isolated context
- No direct database access from execution
- All operations logged for audit

---

## 🧪 Testing Recommendations

### Regression Testing
Test these existing features to ensure no breakage:
- [ ] Create/edit/delete existing nodes
- [ ] Swimlane creation and layout
- [ ] Node connections and edges
- [ ] Save/load functionality
- [ ] Export functionality
- [ ] Validation system
- [ ] Animation systems

### New Feature Testing
Test these new features:
- [ ] Create all 6 Flow Builder node types
- [ ] Configure Action and Decision nodes
- [ ] Execute complete flows
- [ ] View execution progress
- [ ] Stop execution mid-flow
- [ ] Integration with swimlanes

---

## 📚 Documentation Updates

### New Documentation
- FLOW_BUILDER_INTEGRATION_COMPLETE.md - Complete technical docs
- QUICK_START_FLOW_BUILDER.md - Quick start guide
- IMPLEMENTATION_SUMMARY.md - Implementation overview
- VERIFICATION_CHECKLIST.md - Testing checklist
- MIGRATION_GUIDE.md - This file

### Updated Documentation
- README.md - Added Flow Builder section

---

## 🐛 Known Issues

**NONE** ✅

All features tested and working as expected.

---

## 💡 Tips for Developers

### Working with Flow Nodes
```typescript
// Check if node is Flow Builder type
const isFlowNode = node.type?.startsWith('flow');

// Get Flow node configuration
const config = node.data; // Contains validated config

// Execute flow programmatically
import { flowExecutionEngine } from '@/lib/flowExecutionEngine';
await flowExecutionEngine.executeFlow(nodes, edges, inputData);
```

### Extending Flow Builder
```typescript
// Add new Flow node type
// 1. Create component in components/nodes/
// 2. Register in nodeTypes
// 3. Add to paletteItems
// 4. Add validation schema (if needed)
// 5. Add execution logic in flowExecutionEngine
```

---

## 🔄 Rollback Plan

If you need to rollback:

1. **Remove Flow Builder Files**
   ```bash
   rm -rf apps/web/components/nodes/Flow*.tsx
   rm -rf apps/web/components/flow/
   rm -rf apps/web/lib/flowExecutionEngine.ts
   ```

2. **Revert Modified Files**
   ```bash
   git checkout apps/web/app/prototype/page.tsx
   git checkout apps/web/package.json
   git checkout README.md
   ```

3. **Reinstall Dependencies**
   ```bash
   pnpm install
   ```

4. **Restart Server**
   ```bash
   pnpm dev
   ```

---

## 📞 Support

### Questions?
- Check FLOW_BUILDER_INTEGRATION_COMPLETE.md for technical details
- Check QUICK_START_FLOW_BUILDER.md for usage examples
- Check VERIFICATION_CHECKLIST.md for testing guidance

### Issues?
- Check browser console for errors
- Verify all files were created correctly
- Ensure pnpm install completed successfully
- Review this migration guide

---

## ✅ Migration Checklist

- [ ] Pulled latest code
- [ ] Ran `pnpm install`
- [ ] Verified no errors in console
- [ ] Tested existing features
- [ ] Tested new Flow Builder features
- [ ] Read documentation
- [ ] Team informed of changes

---

**Migration Status**: ✅ SAFE - No breaking changes
**Rollback Difficulty**: Easy
**Risk Level**: Low
**Testing Required**: Regression + New features
