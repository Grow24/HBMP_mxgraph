# HBMP Modeling Platform

Production-ready monorepo implementing React Flow editor frontend with mxGraph backend engine for HBMP (grow24.ai).

## Architecture

- **Frontend**: React Flow editor with modern UI (Next.js, Tailwind, shadcn/ui)
- **Backend**: Node/Express with mxGraph engine for validation, layouts, and exports
- **Database**: MySQL with Prisma for persistent storage
- **Engine**: TypeScript conversion layer between React Flow JSON ↔ mxGraph XML

## Features

### Core Modeling
- 🎨 Modern React Flow canvas with hover/click interactions
- 🔧 mxGraph engine for auto-layouts, validation, and exports  
- 🏊 Swimlane support with lane-aware layouts
- 🔗 Port-based connections with semantic validation
- 📊 SVG/PNG/PDF export via diagrams.net pipeline
- 📝 Mermaid generation for documentation
- 🔍 Audit trail for all changes

### 🚀 **NEW: Enterprise Network Modelling** (33% Complete)
- ✅ **Network Type Registry** - Define node types, ports, and validation rules
- ✅ **Port-Level Semantics** - Intelligent connection validation with typed ports
- ✅ **Backend Validation** - Server-side enforcement of network rules
- ✅ **Topology Analysis** - Deep graph analysis (cycles, dead ends, critical paths)
- 🔄 **Rich Metadata Schemas** - Comprehensive metadata models for nodes/edges
- ⏳ **Coming Soon:** Lineage APIs, Versioning, Execution Engine, Rule Builder UI

📖 **See [NETWORK_FEATURES_README.md](./NETWORK_FEATURES_README.md) for details**

### ⚡ **NEW: Flow Builder Integration** (100% Complete) ✅
- ✅ **6 Flow Node Types** - Start, Action, Decision, Process, Table, End with animations
- ✅ **Configuration System** - Drawer-based configuration with Zod validation
- ✅ **Execution Engine** - Step-by-step flow execution with real-time visualization
- ✅ **Execution Panel** - Live progress tracking with logs and status indicators
- ✅ **Full Integration** - Works seamlessly with swimlanes and existing features
- ✅ **Production Ready** - Complete with documentation and testing

📖 **See [FLOW_BUILDER_INTEGRATION_COMPLETE.md](./FLOW_BUILDER_INTEGRATION_COMPLETE.md) for details**
📖 **Quick Start: [QUICK_START_FLOW_BUILDER.md](./QUICK_START_FLOW_BUILDER.md)**

## Packages

- `apps/web` - React Flow frontend (Next.js)
- `apps/server` - Node/Express backend with mxGraph engine
- `packages/engine` - Core conversion and layout logic
- `packages/shared-types` - TypeScript interfaces and contracts
- `packages/ui-tokens` - Design tokens for visual consistency

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup database
cp .env.example .env
# Edit .env with your MySQL connection
pnpm seed

# Start development
pnpm dev
```

## Scripts

- `pnpm dev` - Start both frontend and backend
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages
- `pnpm seed` - Seed database with sample data
- `pnpm studio` - Open Prisma Studio

## Environment Variables

```bash
DATABASE_URL="mysql://user:password@localhost:3306/hbmp"
SERVER_URL="http://localhost:3001"
EXPORT_SERVER_URL="http://localhost:3002"
```