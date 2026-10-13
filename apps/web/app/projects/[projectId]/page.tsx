'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api, type ApiProject } from '@/lib/api'

const KIND_OPTIONS = [
  { value: 'process', label: 'Process' },
  { value: 'lineage', label: 'Data Lineage' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'app-arch', label: 'Architecture' },
]

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const router = useRouter()
  const projectId = params.projectId

  const [project, setProject] = useState<ApiProject | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [diagramName, setDiagramName] = useState('')
  const [diagramKind, setDiagramKind] = useState('process')
  const [isCreating, setIsCreating] = useState(false)

  const loadProject = async () => {
    try {
      setIsLoading(true)
      const data = await api<{ project: ApiProject }>(`/api/projects/${projectId}`)
      setProject(data.project)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const handleCreateDiagram = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = diagramName.trim()
    if (!name) {
      setError('Diagram name is required')
      return
    }

    try {
      setIsCreating(true)
      setError('')
      const data = await api<{ diagramId: string }>('/api/diagrams/save', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          name,
          kind: diagramKind,
          status: 'draft',
          rf: { nodes: [], edges: [] },
        }),
      })
      router.push(`/projects/${projectId}/diagrams/${data.diagramId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create diagram')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="mb-4 text-red-600">{error || 'Project not found'}</p>
        <Link href="/projects">
          <Button variant="outline">Back to projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/projects" className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to projects
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Updated {new Date(project.updatedAt).toLocaleString()}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/projects/${project.id}/edit`}>Edit project</Link>
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Diagrams</h2>
          <div className="space-y-4">
            {(project.diagrams || []).map((diagram) => (
              <Card key={diagram.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Workflow className="h-4 w-4" />
                        {diagram.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Last updated {new Date(diagram.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{diagram.kind}</Badge>
                      <Badge variant="outline">{diagram.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button asChild size="sm">
                      <Link href={`/projects/${project.id}/diagrams/${diagram.id}`}>Open editor</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/prototype">Open prototype</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(project.diagrams || []).length === 0 && (
              <p className="text-gray-500">No diagrams yet. Create one to start modeling.</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New diagram
            </CardTitle>
            <CardDescription>Add a blank diagram to this project.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDiagram} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagramName">Name</Label>
                <Input
                  id="diagramName"
                  value={diagramName}
                  onChange={(event) => setDiagramName(event.target.value)}
                  placeholder="Data Processing Flow"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagramKind">Type</Label>
                <select
                  id="diagramKind"
                  value={diagramKind}
                  onChange={(event) => setDiagramKind(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create diagram'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
