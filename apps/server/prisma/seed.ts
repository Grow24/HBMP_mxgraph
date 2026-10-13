import { PrismaClient } from '@prisma/client';
import type { RFGraph } from '@hbmp/shared-types';
import { rfToMx } from '@hbmp/engine';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'HBMP Demo Project',
    },
  });

  console.log(`✅ Created project: ${project.name} (${project.id})`);

  // Sample React Flow graph - simple process flow
  const sampleRFGraph: RFGraph = {
    nodes: [
      {
        id: 'lane1',
        type: 'lane',
        position: { x: 0, y: 0 },
        data: {
          label: 'Data Processing Lane',
          kind: 'lane'
        }
      },
      {
        id: 'start',
        type: 'event',
        position: { x: 50, y: 100 },
        data: {
          label: 'Start Event',
          kind: 'event',
          laneId: 'lane1',
          status: 'ok'
        }
      },
      {
        id: 'task1',
        type: 'processTask',
        position: { x: 200, y: 100 },
        data: {
          label: 'Extract Data',
          kind: 'processTask',
          laneId: 'lane1',
          status: 'ok',
          props: {
            description: 'Extract data from source systems'
          }
        }
      },
      {
        id: 'gateway1',
        type: 'gateway',
        position: { x: 400, y: 100 },
        data: {
          label: 'Valid Data?',
          kind: 'gateway',
          laneId: 'lane1',
          status: 'ok'
        }
      },
      {
        id: 'task2',
        type: 'processTask',
        position: { x: 600, y: 50 },
        data: {
          label: 'Transform Data',
          kind: 'processTask',
          laneId: 'lane1',
          status: 'ok'
        }
      },
      {
        id: 'task3',
        type: 'processTask',
        position: { x: 600, y: 150 },
        data: {
          label: 'Handle Error',
          kind: 'processTask',
          laneId: 'lane1',
          status: 'warn'
        }
      },
      {
        id: 'dataset1',
        type: 'dataset',
        position: { x: 800, y: 50 },
        data: {
          label: 'Clean Dataset',
          kind: 'dataset',
          laneId: 'lane1',
          status: 'ok'
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'start',
        target: 'task1',
        label: 'trigger'
      },
      {
        id: 'e2',
        source: 'task1',
        target: 'gateway1',
        label: 'data'
      },
      {
        id: 'e3',
        source: 'gateway1',
        target: 'task2',
        label: 'valid'
      },
      {
        id: 'e4',
        source: 'gateway1',
        target: 'task3',
        label: 'invalid'
      },
      {
        id: 'e5',
        source: 'task2',
        target: 'dataset1',
        label: 'output'
      }
    ],
    meta: {
      lanes: ['lane1'],
      orientation: 'LR'
    }
  };

  // Convert to mxGraph XML
  const mxXml = rfToMx(sampleRFGraph);
  
  // Create sample diagram
  const diagram = await prisma.diagram.create({
    data: {
      projectId: project.id,
      name: 'Data Processing Flow',
      kind: 'process',
      status: 'published',
      rfJson: sampleRFGraph,
      mxXml: Buffer.from(mxXml, 'utf-8'),
      mermaid: `graph LR
    start((Start Event)) --> task1[Extract Data]
    task1 --> gateway1{Valid Data?}
    gateway1 -->|valid| task2[Transform Data]
    gateway1 -->|invalid| task3[Handle Error]
    task2 --> dataset1[/Clean Dataset/]`,
      createdBy: 'seed-script',
    },
  });

  console.log(`✅ Created diagram: ${diagram.name} (${diagram.id})`);

  // Create sample audit event
  await prisma.auditEvent.create({
    data: {
      diagramId: diagram.id,
      actor: 'seed-script',
      action: 'create',
      payload: {
        nodes: sampleRFGraph.nodes.length,
        edges: sampleRFGraph.edges.length,
        version: 1
      }
    }
  });

  // Create another project with reporting lineage
  const reportingProject = await prisma.project.create({
    data: {
      name: 'Reporting & Analytics',
    },
  });

  const reportingGraph: RFGraph = {
    nodes: [
      {
        id: 'source-db',
        type: 'db',
        position: { x: 50, y: 100 },
        data: {
          label: 'Source DB',
          kind: 'db',
          status: 'ok'
        }
      },
      {
        id: 'etl-service',
        type: 'service',
        position: { x: 250, y: 100 },
        data: {
          label: 'ETL Service',
          kind: 'service',
          status: 'ok'
        }
      },
      {
        id: 'data-warehouse',
        type: 'db',
        position: { x: 450, y: 100 },
        data: {
          label: 'Data Warehouse',
          kind: 'db',
          status: 'ok'
        }
      },
      {
        id: 'reporting-api',
        type: 'api',
        position: { x: 650, y: 100 },
        data: {
          label: 'Reporting API',
          kind: 'api',
          status: 'ok'
        }
      },
      {
        id: 'dashboard',
        type: 'widget',
        position: { x: 850, y: 100 },
        data: {
          label: 'Analytics Dashboard',
          kind: 'widget',
          status: 'ok'
        }
      }
    ],
    edges: [
      {
        id: 'r1',
        source: 'source-db',
        target: 'etl-service',
        label: 'extract'
      },
      {
        id: 'r2',
        source: 'etl-service',
        target: 'data-warehouse',
        label: 'load'
      },
      {
        id: 'r3',
        source: 'data-warehouse',
        target: 'reporting-api',
        label: 'query'
      },
      {
        id: 'r4',
        source: 'reporting-api',
        target: 'dashboard',
        label: 'data'
      }
    ],
    meta: {
      orientation: 'LR'
    }
  };

  const reportingDiagram = await prisma.diagram.create({
    data: {
      projectId: reportingProject.id,
      name: 'Data Lineage Flow',
      kind: 'lineage',
      status: 'draft',
      rfJson: reportingGraph,
      mxXml: Buffer.from(rfToMx(reportingGraph), 'utf-8'),
      createdBy: 'seed-script',
    },
  });

  console.log(`✅ Created reporting diagram: ${reportingDiagram.name} (${reportingDiagram.id})`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });