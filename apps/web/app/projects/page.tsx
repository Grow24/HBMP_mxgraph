'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api, type ApiProject } from '@/lib/api'

const getTypeColor = (kind?: string) => {
  switch (kind) {
    case 'process': return 'bg-blue-100 text-blue-800'
    case 'lineage':
    case 'data': return 'bg-green-100 text-green-800'
    case 'dashboard': return 'bg-purple-100 text-purple-800'
    case 'app-arch':
    case 'architecture': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const data = await api<{ projects: ApiProject[] }>('/api/projects')
      setProjects(data.projects || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const kind = new URLSearchParams(window.location.search).get('kind')
    if (kind) setSelectedType(kind)
    loadProjects()
  }, [])

  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project and all of its diagrams?')) {
      return
    }

    try {
      await api(`/api/projects/${projectId}`, { method: 'DELETE' })
      setProjects((current) => current.filter((project) => project.id !== projectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const handleDuplicate = async (project: ApiProject) => {
    try {
      const data = await api<{ project: ApiProject }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: `${project.name} Copy` }),
      })
      setProjects((current) => [data.project, ...current])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate project')
    }
  }

  const filteredProjects = projects.filter((project) => {
    const kind = project.diagrams?.[0]?.kind
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || kind === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedType('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedType('process')}>
                Process Models
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('lineage')}>
                Data Lineage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('dashboard')}>
                Dashboards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('app-arch')}>
                Architecture
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-gray-500">Loading projects...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const kind = project.diagrams?.[0]?.kind || 'process'
            const diagramCount = project.diagrams?.length || 0

            return (
              <Card key={project.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2 text-lg">
                        <Link
                          href={`/projects/${project.id}`}
                          className="transition-colors hover:text-blue-600"
                        >
                          {project.name}
                        </Link>
                      </CardTitle>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className={getTypeColor(kind)}>
                          {kind}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {diagramCount} diagram{diagramCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(project.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {diagramCount > 0
                      ? project.diagrams?.map((diagram) => diagram.name).join(', ')
                      : 'No diagrams yet'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    Last modified: {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && filteredProjects.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-gray-500">No projects found</p>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
