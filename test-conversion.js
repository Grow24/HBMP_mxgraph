#!/usr/bin/env node

/**
 * Node.js script to test the React Flow <-> mxGraph conversion engine
 * Run with: node test-conversion.js
 */

const { rfToMx, mxToRf } = require('./packages/engine/dist/index.js');

// Sample React Flow graph
const sampleRFGraph = {
  nodes: [
    {
      id: 'start-1',
      type: 'event',
      position: { x: 100, y: 100 },
      data: {
        label: 'Start Process',
        description: 'Process initiation',
        kind: 'event'
      }
    },
    {
      id: 'task-1',
      type: 'processTask',
      position: { x: 300, y: 100 },
      data: {
        label: 'Process Task',
        description: 'Main processing step',
        kind: 'processTask'
      }
    },
    {
      id: 'gateway-1',
      type: 'gateway',
      position: { x: 500, y: 100 },
      data: {
        label: 'Decision Point',
        description: 'Branching logic',
        kind: 'gateway'
      }
    },
    {
      id: 'end-1',
      type: 'event',
      position: { x: 700, y: 100 },
      data: {
        label: 'End Process',
        description: 'Process completion',
        kind: 'event'
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'start-1',
      target: 'task-1',
      type: 'default',
      data: {}
    },
    {
      id: 'e2-3',
      source: 'task-1',
      target: 'gateway-1',
      type: 'default',
      data: {}
    },
    {
      id: 'e3-4',
      source: 'gateway-1',
      target: 'end-1',
      type: 'default',
      data: { label: 'Yes' }
    }
  ]
};

// Sample mxGraph XML
const sampleMxXML = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="start-1" value="Start Process" vertex="1" parent="1" style="shape=ellipse;fillColor=#e6f3ff;strokeColor=#1f77b4;rounded=1;">
      <mxGeometry x="100" y="100" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="task-1" value="Process Task" vertex="1" parent="1" style="shape=rectangle;fillColor=#f0f8ff;strokeColor=#4a90e2;rounded=1;">
      <mxGeometry x="250" y="100" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="end-1" value="End Process" vertex="1" parent="1" style="shape=ellipse;fillColor=#ffe6e6;strokeColor=#e74c3c;rounded=1;">
      <mxGeometry x="450" y="100" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="e1-2" edge="1" parent="1" source="start-1" target="task-1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2-3" edge="1" parent="1" source="task-1" target="end-1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

console.log('🔄 Testing React Flow ↔ mxGraph Conversion Engine\n');

// Test 1: RF to MX conversion
console.log('1️⃣ Testing React Flow → mxGraph conversion...');
try {
  const startTime = Date.now();
  const mxXML = rfToMx(sampleRFGraph, { 
    includeModel: true, 
    prettyPrint: true 
  });
  const endTime = Date.now();
  
  console.log(`✅ Success! Converted in ${endTime - startTime}ms`);
  console.log(`📊 Input: ${sampleRFGraph.nodes.length} nodes, ${sampleRFGraph.edges.length} edges`);
  console.log(`📄 Output: ${Math.round(mxXML.length / 1024 * 100) / 100}KB XML\n`);
  
  // Save to file for inspection
  require('fs').writeFileSync('./test-output-rf-to-mx.xml', mxXML);
  console.log('💾 Saved output to: test-output-rf-to-mx.xml\n');
  
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 2: MX to RF conversion
console.log('2️⃣ Testing mxGraph → React Flow conversion...');
try {
  const startTime = Date.now();
  const rfGraph = mxToRf(sampleMxXML, { validateTypes: true });
  const endTime = Date.now();
  
  console.log(`✅ Success! Converted in ${endTime - startTime}ms`);
  console.log(`📊 Output: ${rfGraph.nodes.length} nodes, ${rfGraph.edges.length} edges`);
  
  const jsonOutput = JSON.stringify(rfGraph, null, 2);
  console.log(`📄 Output: ${Math.round(jsonOutput.length / 1024 * 100) / 100}KB JSON\n`);
  
  // Save to file for inspection
  require('fs').writeFileSync('./test-output-mx-to-rf.json', jsonOutput);
  console.log('💾 Saved output to: test-output-mx-to-rf.json\n');
  
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 3: Round-trip conversion
console.log('3️⃣ Testing round-trip conversion (RF → MX → RF)...');
try {
  const startTime = Date.now();
  
  // RF → MX
  const mxXML = rfToMx(sampleRFGraph, { includeModel: true, prettyPrint: true });
  
  // MX → RF
  const convertedRF = mxToRf(mxXML, { validateTypes: true });
  
  const endTime = Date.now();
  
  // Compare results
  const originalNodeCount = sampleRFGraph.nodes.length;
  const convertedNodeCount = convertedRF.nodes.length;
  const originalEdgeCount = sampleRFGraph.edges.length;
  const convertedEdgeCount = convertedRF.edges.length;
  
  console.log(`✅ Round-trip completed in ${endTime - startTime}ms`);
  console.log(`📊 Original: ${originalNodeCount} nodes, ${originalEdgeCount} edges`);
  console.log(`📊 Converted: ${convertedNodeCount} nodes, ${convertedEdgeCount} edges`);
  
  if (originalNodeCount === convertedNodeCount && originalEdgeCount === convertedEdgeCount) {
    console.log('🎉 Round-trip test PASSED! Node and edge counts match.');
  } else {
    console.log('⚠️  Round-trip test shows differences in counts.');
  }
  
  // Check for data preservation
  const originalLabels = sampleRFGraph.nodes.map(n => n.data.label).sort();
  const convertedLabels = convertedRF.nodes.map(n => n.data.label).sort();
  
  const labelsMatch = JSON.stringify(originalLabels) === JSON.stringify(convertedLabels);
  if (labelsMatch) {
    console.log('✅ Node labels preserved correctly');
  } else {
    console.log('⚠️  Some node labels may have been lost or changed');
    console.log('   Original labels:', originalLabels);
    console.log('   Converted labels:', convertedLabels);
  }
  
  // Save round-trip result
  require('fs').writeFileSync('./test-output-roundtrip.json', JSON.stringify(convertedRF, null, 2));
  console.log('💾 Saved round-trip result to: test-output-roundtrip.json\n');
  
} catch (error) {
  console.log(`❌ Round-trip error: ${error.message}\n`);
}

console.log('🎯 Test Summary:');
console.log('================');
console.log('This test validates the core conversion engine that powers the HBMP platform.');
console.log('The conversion engine is responsible for:');
console.log('• Converting React Flow JSON to mxGraph XML for server-side processing');
console.log('• Converting mxGraph XML back to React Flow JSON for client display');
console.log('• Preserving data integrity through round-trip conversions');
console.log('• Supporting validation, layout algorithms, and export generation\n');

console.log('🔍 Next Steps:');
console.log('• Check the generated files for detailed output inspection');
console.log('• Test with your own React Flow JSON or mxGraph XML');
console.log('• Use the web interface at /test-conversion for interactive testing');
console.log('• Integration test with the full React Flow → mxGraph → Export pipeline\n');