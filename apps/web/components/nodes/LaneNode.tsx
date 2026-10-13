import React, { memo } from 'react';
import { Handle, NodeResizer, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LaneNodeData {
  label: string;
  description?: string;
  department?: string;
  owner?: string;
  // Swimlane styling
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  headerHeight?: number;
}

export const LaneNode = memo(({ data, selected }: NodeProps<LaneNodeData>) => {
  const {
    label,
    description,
    department,
    owner,
    backgroundColor = '#f8fafc',
    borderColor = '#cbd5e1',
    headerHeight = 40
  } = data;

  return (
    <div className="relative h-full w-full">
      <NodeResizer
        isVisible={selected}
        minWidth={420}
        minHeight={180}
        lineClassName="border-blue-400"
        handleClassName="h-2 w-2 bg-blue-500"
      />
      <div
        className={`
          h-full w-full border-2 rounded-lg transition-all duration-200 lane-container
          ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        `}
        style={{
          backgroundColor,
          borderColor: selected ? '#3b82f6' : borderColor,
          position: 'relative',
          zIndex: 0
        }}
      >
        {/* Lane header - draggable handle */}
        <div 
          className="lane-header flex items-center justify-between p-3 border-b cursor-move"
          style={{ 
            height: `${headerHeight}px`,
            borderBottomColor: borderColor,
            backgroundColor: `${backgroundColor}dd` // Slightly darker
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: borderColor }}
              />
              <h3 className="font-semibold text-gray-800">{label}</h3>
            </div>
            
            {department && (
              <Badge variant="outline" className="text-xs">
                {department}
              </Badge>
            )}
          </div>
          
          {owner && (
            <div className="text-xs text-gray-600">
              Owner: {owner}
            </div>
          )}
        </div>

        {/* Lane content area */}
        <div className="p-2 h-full">
          {description && (
            <p className="text-sm text-gray-600 mb-2">{description}</p>
          )}
          
          {description ? null : (
            <div className="pointer-events-none flex h-16 items-center justify-center text-sm text-gray-300">
              Team lane
            </div>
          )}
        </div>
      </div>

      {/* Connection handles for lane-to-lane connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="lane-out"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ top: `${headerHeight / 2}px` }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="lane-in"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ top: `${headerHeight / 2}px` }}
      />
    </div>
  );
});

LaneNode.displayName = 'LaneNode';