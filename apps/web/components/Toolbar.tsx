'use client'

import { useState } from 'react'
import { 
  Save, 
  Eye, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Layout,
  FileImage,
  FileText,
  Code
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { type ValidationIssue } from '@hbmp/shared-types'

interface ToolbarProps {
  onValidate: () => void
  onLayout: (algorithm: string) => void
  onExport: (format: 'svg' | 'png' | 'pdf' | 'mermaid') => void
  validationIssues: ValidationIssue[]
  isSaving: boolean
}

export function Toolbar({ 
  onValidate, 
  onLayout, 
  onExport, 
  validationIssues, 
  isSaving 
}: ToolbarProps) {
  const errorCount = validationIssues.filter(issue => issue.level === 'error').length
  const warningCount = validationIssues.filter(issue => issue.level === 'warn').length

  return (
    <div className="flex items-center justify-between px-4 h-full bg-white border-b border-gray-200">
      {/* Left side - Main actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onValidate}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Validate
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Layout className="h-4 w-4 mr-2" />
              Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onLayout('hierarchical')}>
              Hierarchical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLayout('organic')}>
              Organic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLayout('lane-aware')}>
              Lane Aware
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onLayout('reset')}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Positions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExport('svg')}>
              <FileImage className="h-4 w-4 mr-2" />
              SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('png')}>
              <FileImage className="h-4 w-4 mr-2" />
              PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport('mermaid')}>
              <Code className="h-4 w-4 mr-2" />
              Mermaid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center - Validation status */}
      <div className="flex items-center gap-2">
        {validationIssues.length > 0 ? (
          <>
            {errorCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Valid
          </Badge>
        )}
      </div>

      {/* Right side - Save status */}
      <div className="flex items-center gap-2">
        {isSaving ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Save className="h-4 w-4" />
            Saved
          </div>
        )}
      </div>
    </div>
  )
}