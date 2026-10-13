'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Workflow, Database, BarChart3, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, type ApiProject } from '@/lib/api'

const CARDS = [
  {
    kind: 'process',
    title: 'Process Modeling',
    description: 'Create BPMN-style process flows with swimlanes and auto-layouts',
    body: 'Drag-and-drop editor with validation rules and export capabilities',
    icon: Workflow,
  },
  {
    kind: 'lineage',
    title: 'Data Lineage',
    description: 'Map data flows from sources to destinations',
    body: 'Track data transformations and dependencies across systems',
    icon: Database,
  },
  {
    kind: 'dashboard',
    title: 'Dashboard Design',
    description: 'Design dashboard layouts and widget compositions',
    body: 'Auto-arrange widgets and define drill-down relationships',
    icon: BarChart3,
  },
  {
    kind: 'app-arch',
    title: 'Architecture Maps',
    description: 'Model system architectures with API contracts',
    body: 'Define services, APIs, and their connections with validation',
    icon: Layers,
  },
]

export function HomeFeatureCards() {
  const [links, setLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await api('/api/projects/ensure-samples', { method: 'POST', body: JSON.stringify({}) })
        const data = await api<{ projects: ApiProject[] }>('/api/projects')
        if (cancelled) return
        const next: Record<string, string> = {}
        for (const card of CARDS) {
          const match = data.projects
            .flatMap((project) => (project.diagrams || []).map((diagram) => ({ project, diagram })))
            .find((item) => item.diagram.kind === card.kind)
          next[card.kind] = match
            ? `/projects/${match.project.id}/diagrams/${match.diagram.id}`
            : `/projects?kind=${card.kind}`
        }
        setLinks(next)
      } catch (error) {
        console.error('Failed to resolve home diagram links:', error)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {CARDS.map((card) => {
        const Icon = card.icon
        const href = links[card.kind] || `/projects?kind=${card.kind}`
        return (
          <Link key={card.kind} href={href} className="block h-full">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{card.body}</p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </>
  )
}
