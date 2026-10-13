'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rfToMx, mxToRf } from '@hbmp/engine';
import type { RFGraph } from '@hbmp/shared-types';

// Sample mxGraph XML for testing reverse conversion
const sampleMxXml = `<mxGraphModel>
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

export default function BidirectionalConversionTester() {
  const [activeTab, setActiveTab] = useState<'rf-to-mx' | 'mx-to-rf'>('rf-to-mx');
  
  // RF to MX state
  const [rfInput, setRfInput] = useState<string>('');
  const [mxOutput, setMxOutput] = useState<string>('');
  const [rfToMxError, setRfToMxError] = useState<string>('');
  const [rfToMxTime, setRfToMxTime] = useState<number>(0);
  
  // MX to RF state
  const [mxInput, setMxInput] = useState<string>(sampleMxXml);
  const [rfOutput, setRfOutput] = useState<string>('');
  const [mxToRfError, setMxToRfError] = useState<string>('');
  const [mxToRfTime, setMxToRfTime] = useState<number>(0);

  // Sample RF Graph
  const sampleRfGraph = {
    nodes: [
      {
        id: 'start-1',
        type: 'event',
        position: { x: 100, y: 100 },
        data: { label: 'Start Process', description: 'Process initiation' }
      },
      {
        id: 'task-1',
        type: 'processTask',
        position: { x: 300, y: 100 },
        data: { label: 'Process Task', description: 'Main processing step' }
      },
      {
        id: 'end-1',
        type: 'event',
        position: { x: 500, y: 100 },
        data: { label: 'End Process', description: 'Process completion' }
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
        target: 'end-1',
        type: 'default',
        data: {}
      }
    ]
  };

  // RF to MX conversion
  const convertRfToMx = useCallback(() => {
    try {
      setRfToMxError('');
      const startTime = performance.now();
      
      const parsedGraph = rfInput ? JSON.parse(rfInput) as RFGraph : sampleRfGraph;
      const xml = rfToMx(parsedGraph, {
        includeModel: true,
        prettyPrint: true
      });
      
      const endTime = performance.now();
      setRfToMxTime(endTime - startTime);
      setMxOutput(xml);
    } catch (err) {
      setRfToMxError(err instanceof Error ? err.message : 'Conversion failed');
      setMxOutput('');
    }
  }, [rfInput]);

  // MX to RF conversion
  const convertMxToRf = useCallback(() => {
    try {
      setMxToRfError('');
      const startTime = performance.now();
      
      const rfGraph = mxToRf(mxInput, { validateTypes: true });
      
      const endTime = performance.now();
      setMxToRfTime(endTime - startTime);
      setRfOutput(JSON.stringify(rfGraph, null, 2));
    } catch (err) {
      setMxToRfError(err instanceof Error ? err.message : 'Conversion failed');
      setRfOutput('');
    }
  }, [mxInput]);

  // Initialize with sample data
  React.useEffect(() => {
    if (!rfInput) {
      setRfInput(JSON.stringify(sampleRfGraph, null, 2));
    }
    convertRfToMx();
  }, []);

  React.useEffect(() => {
    convertMxToRf();
  }, [mxInput]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const loadSampleRf = useCallback(() => {
    setRfInput(JSON.stringify(sampleRfGraph, null, 2));
  }, []);

  const loadSampleMx = useCallback(() => {
    setMxInput(sampleMxXml);
  }, []);

  const testRoundTrip = useCallback(() => {
    try {
      // RF → MX → RF
      const originalRf = JSON.parse(rfInput) as RFGraph;
      const mx = rfToMx(originalRf, { includeModel: true, prettyPrint: true });
      const convertedRf = mxToRf(mx, { validateTypes: true });
      
      // Show both results
      setMxOutput(mx);
      setRfOutput(JSON.stringify(convertedRf, null, 2));
      
      // Compare structures (simplified)
      const originalNodeCount = originalRf.nodes.length;
      const convertedNodeCount = convertedRf.nodes.length;
      const originalEdgeCount = originalRf.edges.length;
      const convertedEdgeCount = convertedRf.edges.length;
      
      if (originalNodeCount === convertedNodeCount && originalEdgeCount === convertedEdgeCount) {
        alert('✅ Round-trip test successful! Node and edge counts match.');
      } else {
        alert(`⚠️ Round-trip test shows differences:\n- Original: ${originalNodeCount} nodes, ${originalEdgeCount} edges\n- Converted: ${convertedNodeCount} nodes, ${convertedEdgeCount} edges`);
      }
      
    } catch (err) {
      alert(`❌ Round-trip test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [rfInput]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Bidirectional Conversion Tester</h1>
        <p className="text-muted-foreground">
          Test React Flow ↔ mxGraph conversion in both directions
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <Button onClick={testRoundTrip} variant="default" size="lg">
          🔄 Test Round-Trip Conversion
        </Button>
        <Button onClick={loadSampleRf} variant="outline">
          Load Sample RF
        </Button>
        <Button onClick={loadSampleMx} variant="outline">
          Load Sample MX
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rf-to-mx">React Flow → mxGraph</TabsTrigger>
          <TabsTrigger value="mx-to-rf">mxGraph → React Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="rf-to-mx" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* RF Input */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>React Flow JSON Input</CardTitle>
                <Button 
                  onClick={convertRfToMx}
                  size="sm"
                  variant="outline"
                >
                  Convert →
                </Button>
              </CardHeader>
              <CardContent>
                <textarea
                  value={rfInput}
                  onChange={(e) => setRfInput(e.target.value)}
                  className="w-full h-96 p-3 border rounded-md font-mono text-sm"
                  placeholder="Paste React Flow JSON here..."
                />
              </CardContent>
            </Card>

            {/* MX Output */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>mxGraph XML Output</CardTitle>
                <div className="flex items-center gap-2">
                  {rfToMxTime > 0 && (
                    <Badge variant="outline">
                      {rfToMxTime.toFixed(2)}ms
                    </Badge>
                  )}
                  <Badge variant={rfToMxError ? "destructive" : "default"}>
                    {rfToMxError ? "Error" : "Success"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {rfToMxError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{rfToMxError}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded-lg overflow-auto h-96 text-sm">
                      <code>{mxOutput}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(mxOutput)}
                      disabled={!mxOutput}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mx-to-rf" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* MX Input */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>mxGraph XML Input</CardTitle>
                <Button 
                  onClick={convertMxToRf}
                  size="sm"
                  variant="outline"
                >
                  Convert →
                </Button>
              </CardHeader>
              <CardContent>
                <textarea
                  value={mxInput}
                  onChange={(e) => setMxInput(e.target.value)}
                  className="w-full h-96 p-3 border rounded-md font-mono text-sm"
                  placeholder="Paste mxGraph XML here..."
                />
              </CardContent>
            </Card>

            {/* RF Output */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>React Flow JSON Output</CardTitle>
                <div className="flex items-center gap-2">
                  {mxToRfTime > 0 && (
                    <Badge variant="outline">
                      {mxToRfTime.toFixed(2)}ms
                    </Badge>
                  )}
                  <Badge variant={mxToRfError ? "destructive" : "default"}>
                    {mxToRfError ? "Error" : "Success"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {mxToRfError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{mxToRfError}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded-lg overflow-auto h-96 text-sm">
                      <code>{rfOutput}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(rfOutput)}
                      disabled={!rfOutput}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {rfToMxTime.toFixed(2)}ms
              </div>
              <div className="text-sm text-muted-foreground">RF → MX Time</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {mxToRfTime.toFixed(2)}ms
              </div>
              <div className="text-sm text-muted-foreground">MX → RF Time</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(mxOutput.length / 1024 * 100) / 100}KB
              </div>
              <div className="text-sm text-muted-foreground">XML Size</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(rfOutput.length / 1024 * 100) / 100}KB
              </div>
              <div className="text-sm text-muted-foreground">JSON Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Single Direction Testing:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Use tabs to switch between RF→MX and MX→RF</li>
                <li>• Paste your data in the input textarea</li>
                <li>• Click "Convert" to see the output</li>
                <li>• Check conversion time and error status</li>
                <li>• Copy results for external validation</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Round-Trip Testing:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Click "Test Round-Trip Conversion"</li>
                <li>• Verifies RF → MX → RF conversion</li>
                <li>• Compares original vs final structure</li>
                <li>• Alerts you to any data loss or corruption</li>
                <li>• Essential for validating conversion fidelity</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Pro Tip:</strong> Use the round-trip test to verify that your data survives 
              the full conversion cycle. This is crucial for ensuring data integrity in production.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}