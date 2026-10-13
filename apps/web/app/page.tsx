import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HomeFeatureCards } from '@/components/HomeFeatureCards'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">HBMP Modeling Platform</h1>
        <p className="text-xl text-gray-600 mb-8">
          React Flow editor with mxGraph engine for business process modeling
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/prototype">🚀 Live Prototype</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/projects">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/demo">View Demo</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <HomeFeatureCards />
      </div>

      {/* Testing Tools Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-purple-800">🧪 Testing & Development Tools</h2>
        <p className="text-gray-700 mb-4">
          Test the core conversion engine and validate data flow between React Flow and mxGraph
        </p>
        <div className="grid md:grid-cols-3 gap-4 justify-center">
          <Button asChild variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
            <Link href="/test-conversion">🔄 RF → MX Conversion Test</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
            <Link href="/test-bidirectional">↔️ Bidirectional Conversion Test</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
            <Link href="/xml-editor">📝 mxGraph XML Editor</Link>
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Advanced XML editor with swimlanes, constraints, auto-sizing, and validation rules
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8 text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">🚀 Live Prototype Ready</h2>
        <p className="text-lg text-gray-700 mb-6">
          Interactive React Flow editor with working drag-and-drop, validation, and export features
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-2 text-green-700">✅ Working Features</h3>
            <p className="text-sm text-gray-600">
              Drag-drop nodes, real-time validation, property editing, auto-layout
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-blue-700">🎨 Professional UI</h3>
            <p className="text-sm text-gray-600">
              Modern interface with React Flow canvas, minimap, and controls
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-purple-700">🔧 Demo Ready</h3>
            <p className="text-sm text-gray-600">
              Sample business process, interactive elements, export simulation
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Technical Architecture</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Frontend Stack</h3>
            <p className="text-sm text-gray-600">
              React Flow, Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Backend Integration</h3>
            <p className="text-sm text-gray-600">
              mxGraph engine, Node.js/Express, Prisma ORM, SQLite database
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Key Capabilities</h3>
            <p className="text-sm text-gray-600">
              Validation engine, auto-layouts, SVG/PNG export, audit trails
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}