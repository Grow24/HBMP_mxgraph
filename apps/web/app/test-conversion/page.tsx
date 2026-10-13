'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { rfToMx } from '@hbmp/engine';
import type { RFGraph, RFNode, RFEdge } from '@hbmp/shared-types';

// Sample React Flow JSON structures for testing
const sampleGraphs: Record<string, RFGraph> = {
  simple: {
    nodes: [
      {
        id: 'start-1',
        type: 'event',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start Process',
          description: 'Process initiation'
        }
      },
      {
        id: 'task-1',
        type: 'processTask',
        position: { x: 300, y: 100 },
        data: {
          label: 'Process Task',
          description: 'Main processing step'
        }
      },
      {
        id: 'end-1',
        type: 'event',
        position: { x: 500, y: 100 },
        data: {
          label: 'End Process',
          description: 'Process completion'
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
        target: 'end-1',
        type: 'default',
        data: {}
      }
    ]
  },
  gateway: {
    nodes: [
      {
        id: 'start-1',
        type: 'event',
        position: { x: 50, y: 150 },
        data: { label: 'Start' }
      },
      {
        id: 'gateway-1',
        type: 'gateway',
        position: { x: 200, y: 150 },
        data: { label: 'Decision' }
      },
      {
        id: 'task-1',
        type: 'processTask',
        position: { x: 350, y: 100 },
        data: { label: 'Path A' }
      },
      {
        id: 'task-2',
        type: 'processTask',
        position: { x: 350, y: 200 },
        data: { label: 'Path B' }
      },
      {
        id: 'end-1',
        type: 'event',
        position: { x: 500, y: 150 },
        data: { label: 'End' }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'start-1',
        target: 'gateway-1',
        type: 'default',
        data: {}
      },
      {
        id: 'e2',
        source: 'gateway-1',
        target: 'task-1',
        type: 'default',
        data: { label: 'Yes' }
      },
      {
        id: 'e3',
        source: 'gateway-1',
        target: 'task-2',
        type: 'default',
        data: { label: 'No' }
      },
      {
        id: 'e4',
        source: 'task-1',
        target: 'end-1',
        type: 'default',
        data: {}
      },
      {
        id: 'e5',
        source: 'task-2',
        target: 'end-1',
        type: 'default',
        data: {}
      }
    ]
  },
  swimlane: {
    nodes: [
      {
        id: 'lane-1',
        type: 'lane',
        position: { x: 0, y: 0 },
        data: {
          label: 'Customer',
          width: 600,
          height: 150
        }
      },
      {
        id: 'lane-2',
        type: 'lane',
        position: { x: 0, y: 150 },
        data: {
          label: 'System',
          width: 600,
          height: 150
        }
      },
      {
        id: 'start-1',
        type: 'event',
        position: { x: 50, y: 75 },
        data: {
          label: 'Submit Request',
          laneId: 'lane-1'
        }
      },
      {
        id: 'task-1',
        type: 'processTask',
        position: { x: 200, y: 225 },
        data: {
          label: 'Process Request',
          laneId: 'lane-2'
        }
      },
      {
        id: 'end-1',
        type: 'event',
        position: { x: 400, y: 75 },
        data: {
          label: 'Request Complete',
          laneId: 'lane-1'
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'start-1',
        target: 'task-1',
        type: 'default',
        data: { label: 'Request' }
      },
      {
        id: 'e2',
        source: 'task-1',
        target: 'end-1',
        type: 'default',
        data: { label: 'Response' }
      }
    ]
  }
};

export default function TestConversionPage() {
  const [selectedGraph, setSelectedGraph] = useState<string>('simple');
  const [customJson, setCustomJson] = useState<string>('');
  const [mxGraphXml, setMxGraphXml] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [conversionTime, setConversionTime] = useState<number>(0);

  const performConversion = useCallback((rfGraph: RFGraph) => {
    try {
      setError('');
      const startTime = performance.now();
      
      const xml = rfToMx(rfGraph, {
        includeModel: true,
        prettyPrint: true
      });
      
      const endTime = performance.now();
      setConversionTime(endTime - startTime);
      setMxGraphXml(xml);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setMxGraphXml('');
    }
  }, []);

  const handleSampleSelect = useCallback((sampleKey: string) => {
    setSelectedGraph(sampleKey);
    setCustomJson('');
    performConversion(sampleGraphs[sampleKey]);
  }, [performConversion]);

  const handleCustomJsonConvert = useCallback(() => {
    try {
      const parsedGraph = JSON.parse(customJson) as RFGraph;
      performConversion(parsedGraph);
    } catch (err) {
      setError('Invalid JSON format');
      setMxGraphXml('');
    }
  }, [customJson, performConversion]);

  // Initial conversion
  React.useEffect(() => {
    if (selectedGraph && sampleGraphs[selectedGraph]) {
      performConversion(sampleGraphs[selectedGraph]);
    }
  }, [selectedGraph, performConversion]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">React Flow → mxGraph Conversion Tester</h1>
        <p className="text-muted-foreground">
          Test the conversion from React Flow JSON structure to mxGraph XML format
        </p>
      </div>

      {/* Sample Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Sample Graph or Input Custom JSON</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(sampleGraphs).map((key) => (
              <Button
                key={key}
                variant={selectedGraph === key ? "default" : "outline"}
                onClick={() => handleSampleSelect(key)}
                className="capitalize"
              >
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Or paste custom React Flow JSON:</label>
            <textarea
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              placeholder="Paste your React Flow JSON here..."
              className="w-full h-32 p-3 border rounded-md font-mono text-sm"
            />
            <Button 
              onClick={handleCustomJsonConvert}
              disabled={!customJson.trim()}
              variant="outline"
            >
              Convert Custom JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input JSON */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>2. React Flow JSON (Input)</CardTitle>
            <Badge variant="secondary">
              {selectedGraph && !customJson ? `Sample: ${selectedGraph}` : 'Custom'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                <code>
                  {JSON.stringify(
                    customJson ? JSON.parse(customJson || '{}') : sampleGraphs[selectedGraph] || {},
                    null,
                    2
                  )}
                </code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(
                  JSON.stringify(
                    customJson ? JSON.parse(customJson || '{}') : sampleGraphs[selectedGraph] || {},
                    null,
                    2
                  )
                )}
              >
                Copy JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output XML */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>3. mxGraph XML (Output)</CardTitle>
            <div className="flex items-center gap-2">
              {conversionTime > 0 && (
                <Badge variant="outline">
                  {conversionTime.toFixed(2)}ms
                </Badge>
              )}
              <Badge variant={error ? "destructive" : "default"}>
                {error ? "Error" : "Success"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  <code>{mxGraphXml}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(mxGraphXml)}
                  disabled={!mxGraphXml}
                >
                  Copy XML
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Analysis */}
      {!error && mxGraphXml && (
        <Card>
          <CardHeader>
            <CardTitle>4. Conversion Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(customJson ? JSON.parse(customJson) : sampleGraphs[selectedGraph])?.nodes?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Nodes Converted</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(customJson ? JSON.parse(customJson) : sampleGraphs[selectedGraph])?.edges?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Edges Converted</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(mxGraphXml.length / 1024 * 100) / 100}KB
                </div>
                <div className="text-sm text-muted-foreground">XML Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Testing with Samples:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Click any sample button above</li>
                <li>• See immediate JSON → XML conversion</li>
                <li>• Check conversion time and analysis</li>
                <li>• Copy output for external validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Testing with Custom Data:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Paste your React Flow JSON in the textarea</li>
                <li>• Click "Convert Custom JSON"</li>
                <li>• Verify the XML structure matches expectations</li>
                <li>• Test with edge cases and complex graphs</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Integration Testing:</strong> You can copy the generated XML and test it in the 
              diagrams.net online editor or use it with the mxGraph library directly to verify 
              the conversion accuracy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}