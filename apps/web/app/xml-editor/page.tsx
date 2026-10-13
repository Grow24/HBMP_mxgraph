'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mxToRf } from '@hbmp/engine';
import type { RFGraph } from '@hbmp/shared-types';

// Pre-built mxGraph XML templates with advanced features
const xmlTemplates = {
  basic: {
    name: "Basic Process Flow",
    xml: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="start-1" value="Start Process" vertex="1" parent="1" style="shape=ellipse;fillColor=#e6ffcc;strokeColor=#52CC00;rounded=1;fontSize=12;fontFamily=Inter;">
      <mxGeometry x="100" y="100" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="task-1" value="Process Task" vertex="1" parent="1" style="shape=rectangle;fillColor=#cce6ff;strokeColor=#0066CC;rounded=1;fontSize=12;fontFamily=Inter;">
      <mxGeometry x="250" y="85" width="120" height="70" as="geometry"/>
    </mxCell>
    <mxCell id="end-1" value="End Process" vertex="1" parent="1" style="shape=ellipse;fillColor=#ffcccc;strokeColor=#CC0000;rounded=1;fontSize=12;fontFamily=Inter;">
      <mxGeometry x="450" y="100" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="e1-2" edge="1" parent="1" source="start-1" target="task-1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2-3" edge="1" parent="1" source="task-1" target="end-1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`
  },
  
  swimlanes: {
    name: "Swimlanes with Cross-Lane Flow",
    xml: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Customer Swimlane -->
    <mxCell id="customer-lane" value="Customer" style="swimlane;horizontal=1;startSize=30;fillColor=#f0f8ff;strokeColor=#4a90e2;fontSize=14;fontStyle=1;fontFamily=Inter;" vertex="1" parent="1">
      <mxGeometry x="50" y="50" width="700" height="150" as="geometry"/>
    </mxCell>
    <mxCell id="start-req" value="Submit Request" vertex="1" parent="customer-lane" style="shape=ellipse;fillColor=#e6ffcc;strokeColor=#52CC00;rounded=1;">
      <mxGeometry x="50" y="60" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="receive-resp" value="Receive Response" vertex="1" parent="customer-lane" style="shape=ellipse;fillColor=#ffcccc;strokeColor=#CC0000;rounded=1;">
      <mxGeometry x="550" y="60" width="100" height="50" as="geometry"/>
    </mxCell>
    
    <!-- System Swimlane -->
    <mxCell id="system-lane" value="System" style="swimlane;horizontal=1;startSize=30;fillColor=#fff0f5;strokeColor=#d63384;fontSize=14;fontStyle=1;fontFamily=Inter;" vertex="1" parent="1">
      <mxGeometry x="50" y="200" width="700" height="150" as="geometry"/>
    </mxCell>
    <mxCell id="validate" value="Validate Request" vertex="1" parent="system-lane" style="shape=rectangle;fillColor=#cce6ff;strokeColor=#0066CC;rounded=1;">
      <mxGeometry x="200" y="60" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="process" value="Process Data" vertex="1" parent="system-lane" style="shape=rectangle;fillColor=#cce6ff;strokeColor=#0066CC;rounded=1;">
      <mxGeometry x="400" y="60" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Cross-lane connections -->
    <mxCell id="req-flow" edge="1" parent="1" source="start-req" target="validate" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#666666;strokeWidth=2;endArrow=block;dashed=1;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="internal-flow" edge="1" parent="1" source="validate" target="process" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#333333;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="resp-flow" edge="1" parent="1" source="process" target="receive-resp" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#666666;strokeWidth=2;endArrow=block;dashed=1;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`
  },
  
  gateway: {
    name: "Gateway with Decision Logic",
    xml: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="start" value="Start" vertex="1" parent="1" style="shape=ellipse;fillColor=#e6ffcc;strokeColor=#52CC00;rounded=1;">
      <mxGeometry x="100" y="175" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="check-data" value="Check Data Quality" vertex="1" parent="1" style="shape=rectangle;fillColor=#cce6ff;strokeColor=#0066CC;rounded=1;">
      <mxGeometry x="220" y="165" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="decision" value="Data Valid?" vertex="1" parent="1" style="shape=rhombus;fillColor=#ffffcc;strokeColor=#CCCC00;fontSize=11;">
      <mxGeometry x="400" y="160" width="80" height="70" as="geometry"/>
    </mxCell>
    <mxCell id="accept" value="Accept Data" vertex="1" parent="1" style="shape=rectangle;fillColor=#ccffcc;strokeColor=#00CC00;rounded=1;">
      <mxGeometry x="550" y="100" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="reject" value="Reject &amp; Notify" vertex="1" parent="1" style="shape=rectangle;fillColor=#ffcccc;strokeColor=#CC0000;rounded=1;">
      <mxGeometry x="550" y="220" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="end-accept" value="End" vertex="1" parent="1" style="shape=ellipse;fillColor=#ffcccc;strokeColor=#CC0000;rounded=1;">
      <mxGeometry x="720" y="105" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="end-reject" value="End" vertex="1" parent="1" style="shape=ellipse;fillColor=#ffcccc;strokeColor=#CC0000;rounded=1;">
      <mxGeometry x="720" y="225" width="60" height="40" as="geometry"/>
    </mxCell>
    
    <!-- Edges with labels -->
    <mxCell id="e1" edge="1" parent="1" source="start" target="check-data" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2" edge="1" parent="1" source="check-data" target="decision" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e3" value="Yes" edge="1" parent="1" source="decision" target="accept" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;strokeColor=#00CC00;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e4" value="No" edge="1" parent="1" source="decision" target="reject" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;strokeColor=#CC0000;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e5" edge="1" parent="1" source="accept" target="end-accept" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e6" edge="1" parent="1" source="reject" target="end-reject" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`
  },
  
  dataFlow: {
    name: "Data Flow with Auto-sizing",
    xml: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Data Sources with auto-sizing -->
    <mxCell id="db1" value="Customer Database&#xa;(Primary Source)" vertex="1" parent="1" style="shape=cylinder;fillColor=#e6f3ff;strokeColor=#0066CC;fontSize=10;fontFamily=Inter;whiteSpace=wrap;html=1;" geometry="1">
      <mxGeometry x="50" y="50" width="100" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="db2" value="Transaction Log&#xa;(Real-time)" vertex="1" parent="1" style="shape=cylinder;fillColor=#e6f3ff;strokeColor=#0066CC;fontSize=10;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="50" y="180" width="100" height="80" as="geometry"/>
    </mxCell>
    
    <!-- Processing Services -->
    <mxCell id="etl" value="ETL Service&#xa;Data Transformation&#xa;&amp; Validation" vertex="1" parent="1" style="shape=hexagon;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="220" y="100" width="140" height="80" as="geometry"/>
    </mxCell>
    
    <!-- Analytics Engine -->
    <mxCell id="analytics" value="Analytics Engine&#xa;Machine Learning&#xa;Pattern Recognition" vertex="1" parent="1" style="shape=process;fillColor=#f8cecc;strokeColor=#b85450;fontSize=10;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="420" y="100" width="160" height="80" as="geometry"/>
    </mxCell>
    
    <!-- Output Destinations -->
    <mxCell id="dashboard" value="Executive Dashboard" vertex="1" parent="1" style="shape=document;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="640" y="50" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="api" value="REST API&#xa;External Access" vertex="1" parent="1" style="shape=document;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="640" y="150" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Data flow edges with constraints -->
    <mxCell id="flow1" value="Customer Data" edge="1" parent="1" source="db1" target="etl" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;strokeColor=#0066CC;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="flow2" value="Transaction Stream" edge="1" parent="1" source="db2" target="etl" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;strokeColor=#0066CC;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="flow3" value="Clean Data" edge="1" parent="1" source="etl" target="analytics" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=3;endArrow=block;strokeColor=#666666;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="flow4" value="Insights" edge="1" parent="1" source="analytics" target="dashboard" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;strokeColor=#82b366;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="flow5" value="API Data" edge="1" parent="1" source="analytics" target="api" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=block;strokeColor=#82b366;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`
  },
  
  constraints: {
    name: "Advanced Constraints & Validation",
    xml: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Constraint annotations -->
    <mxCell id="note1" value="Constraint: Min 2 inputs required" style="shape=note;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=9;fontFamily=Inter;" vertex="1" parent="1">
      <mxGeometry x="10" y="10" width="150" height="40" as="geometry"/>
    </mxCell>
    
    <!-- Source nodes -->
    <mxCell id="input1" value="Input Source A&#xa;(Required)" vertex="1" parent="1" style="shape=parallelogram;fillColor=#cce6ff;strokeColor=#0066CC;fontSize=10;fontFamily=Inter;">
      <mxGeometry x="50" y="100" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="input2" value="Input Source B&#xa;(Required)" vertex="1" parent="1" style="shape=parallelogram;fillColor=#cce6ff;strokeColor=#0066CC;fontSize=10;fontFamily=Inter;">
      <mxGeometry x="50" y="180" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="input3" value="Input Source C&#xa;(Optional)" vertex="1" parent="1" style="shape=parallelogram;fillColor=#f0f8ff;strokeColor=#6c757d;fontSize=10;fontFamily=Inter;dashed=1;">
      <mxGeometry x="50" y="260" width="100" height="50" as="geometry"/>
    </mxCell>
    
    <!-- Validation node with constraints -->
    <mxCell id="validator" value="Data Validator&#xa;• Min 2 inputs&#xa;• Max 3 inputs&#xa;• Type checking&#xa;• Range validation" vertex="1" parent="1" style="shape=hexagon;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=9;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="220" y="165" width="140" height="90" as="geometry"/>
    </mxCell>
    
    <!-- Gateway with business rules -->
    <mxCell id="rules-gateway" value="Business Rules&#xa;Engine" vertex="1" parent="1" style="shape=rhombus;fillColor=#ffffcc;strokeColor=#CCCC00;fontSize=10;fontFamily=Inter;">
      <mxGeometry x="420" y="175" width="100" height="70" as="geometry"/>
    </mxCell>
    
    <!-- Output with size constraints -->
    <mxCell id="output-valid" value="Valid Output&#xa;(Auto-sized based&#xa;on input volume)" vertex="1" parent="1" style="shape=document;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=9;fontFamily=Inter;whiteSpace=wrap;html=1;">
      <mxGeometry x="580" y="120" width="120" height="70" as="geometry"/>
    </mxCell>
    <mxCell id="output-error" value="Error Log&#xa;(Expandable)" vertex="1" parent="1" style="shape=document;fillColor=#ffcccc;strokeColor=#CC0000;fontSize=10;fontFamily=Inter;">
      <mxGeometry x="580" y="230" width="120" height="50" as="geometry"/>
    </mxCell>
    
    <!-- Constrained connections -->
    <mxCell id="conn1" value="Required" edge="1" parent="1" source="input1" target="validator" style="strokeWidth=3;endArrow=block;strokeColor=#0066CC;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="conn2" value="Required" edge="1" parent="1" source="input2" target="validator" style="strokeWidth=3;endArrow=block;strokeColor=#0066CC;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="conn3" value="Optional" edge="1" parent="1" source="input3" target="validator" style="strokeWidth=1;endArrow=block;strokeColor=#6c757d;dashed=1;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="conn4" edge="1" parent="1" source="validator" target="rules-gateway" style="strokeWidth=2;endArrow=block;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="conn5" value="Valid" edge="1" parent="1" source="rules-gateway" target="output-valid" style="strokeWidth=2;endArrow=block;strokeColor=#82b366;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="conn6" value="Error" edge="1" parent="1" source="rules-gateway" target="output-error" style="strokeWidth=2;endArrow=block;strokeColor=#CC0000;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`
  }
};

export default function MxGraphXmlEditorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic');
  const [xmlInput, setXmlInput] = useState<string>(xmlTemplates.basic.xml);
  const [rfOutput, setRfOutput] = useState<string>('');
  const [conversionError, setConversionError] = useState<string>('');
  const [conversionTime, setConversionTime] = useState<number>(0);
  const [xmlValidation, setXmlValidation] = useState<{ valid: boolean; message: string }>({ valid: true, message: '' });

  // Validate XML syntax
  const validateXml = useCallback((xml: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      const parserError = doc.querySelector('parsererror');
      
      if (parserError) {
        return { valid: false, message: parserError.textContent || 'XML parsing error' };
      }
      
      // Check for mxGraphModel structure
      const model = doc.querySelector('mxGraphModel');
      if (!model) {
        return { valid: false, message: 'Missing mxGraphModel root element' };
      }
      
      const root = model.querySelector('root');
      if (!root) {
        return { valid: false, message: 'Missing root element inside mxGraphModel' };
      }
      
      return { valid: true, message: 'Valid mxGraph XML structure' };
    } catch (error) {
      return { valid: false, message: `XML validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }, []);

  // Convert XML to React Flow JSON
  const convertXmlToRf = useCallback(() => {
    try {
      setConversionError('');
      const startTime = performance.now();
      
      // Validate XML first
      const validation = validateXml(xmlInput);
      setXmlValidation(validation);
      
      if (!validation.valid) {
        setConversionError(`XML Validation Error: ${validation.message}`);
        setRfOutput('');
        return;
      }
      
      // Convert to React Flow
      const rfGraph = mxToRf(xmlInput, { validateTypes: true });
      
      const endTime = performance.now();
      setConversionTime(endTime - startTime);
      setRfOutput(JSON.stringify(rfGraph, null, 2));
    } catch (err) {
      setConversionError(err instanceof Error ? err.message : 'Conversion failed');
      setRfOutput('');
    }
  }, [xmlInput, validateXml]);

  // Load template
  const loadTemplate = useCallback((templateKey: string) => {
    setSelectedTemplate(templateKey);
    setXmlInput(xmlTemplates[templateKey as keyof typeof xmlTemplates].xml);
  }, []);

  // Auto-convert when XML changes
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (xmlInput.trim()) {
        convertXmlToRf();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [xmlInput, convertXmlToRf]);

  // Initialize with default template
  React.useEffect(() => {
    convertXmlToRf();
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">mxGraph XML Editor & Converter</h1>
        <p className="text-muted-foreground">
          Create and edit mxGraph XML with advanced features, then convert to React Flow JSON
        </p>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>XML Templates with Advanced Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {Object.entries(xmlTemplates).map(([key, template]) => (
              <Button
                key={key}
                variant={selectedTemplate === key ? "default" : "outline"}
                onClick={() => loadTemplate(key)}
                className="h-auto p-3 text-left"
              >
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs opacity-70 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor and Output */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* XML Editor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>mxGraph XML Editor</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={xmlValidation.valid ? "default" : "destructive"}>
                {xmlValidation.valid ? "Valid XML" : "Invalid XML"}
              </Badge>
              <Button 
                onClick={convertXmlToRf}
                size="sm"
                variant="outline"
              >
                Convert →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!xmlValidation.valid && (
              <Alert variant="destructive">
                <AlertDescription>{xmlValidation.message}</AlertDescription>
              </Alert>
            )}
            
            <textarea
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              className="w-full h-96 p-3 border rounded-md font-mono text-sm"
              placeholder="Paste or edit mxGraph XML here..."
              spellCheck={false}
            />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Lines: {xmlInput.split('\n').length}</span>
              <span>Size: {Math.round(xmlInput.length / 1024 * 100) / 100}KB</span>
            </div>
          </CardContent>
        </Card>

        {/* React Flow JSON Output */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>React Flow JSON Output</CardTitle>
            <div className="flex items-center gap-2">
              {conversionTime > 0 && (
                <Badge variant="outline">
                  {conversionTime.toFixed(2)}ms
                </Badge>
              )}
              <Badge variant={conversionError ? "destructive" : "default"}>
                {conversionError ? "Error" : "Success"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {conversionError ? (
              <Alert variant="destructive">
                <AlertDescription>{conversionError}</AlertDescription>
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
                  Copy JSON
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Analysis */}
      {!conversionError && rfOutput && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {JSON.parse(rfOutput).nodes?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Nodes Converted</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {JSON.parse(rfOutput).edges?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Edges Converted</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(xmlInput.length / 1024 * 100) / 100}KB
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
      )}

      {/* Feature Guide */}
      <Card>
        <CardHeader>
          <CardTitle>mxGraph Advanced Features Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Swimlanes & Containers:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>style="swimlane"</code> creates container elements</li>
                <li>• <code>horizontal=1</code> for horizontal lanes</li>
                <li>• Child elements use <code>parent="lane-id"</code></li>
                <li>• Auto-sizing with <code>startSize</code> property</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Shapes & Styling:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>shape=rhombus</code> for gateways</li>
                <li>• <code>shape=ellipse</code> for events</li>
                <li>• <code>shape=cylinder</code> for databases</li>
                <li>• Rich styling with fillColor, strokeColor, etc.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Edge Constraints:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>edgeStyle=orthogonalEdgeStyle</code> for routing</li>
                <li>• <code>strokeWidth</code> for visual hierarchy</li>
                <li>• <code>dashed=1</code> for optional connections</li>
                <li>• Edge labels with positioning</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Auto-sizing & Layout:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>whiteSpace=wrap</code> for text wrapping</li>
                <li>• <code>html=1</code> for rich text support</li>
                <li>• Geometry constraints with min/max sizes</li>
                <li>• Automatic positioning based on content</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Pro Tips:</strong> Use the templates above to see real examples of advanced mxGraph features. 
              Each template demonstrates different capabilities like swimlanes, constraints, auto-sizing, and 
              complex styling that will be preserved when converting to React Flow JSON.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}