import React, { memo } from 'react';
import { Handle, NodeResizer, Position, NodeProps } from 'reactflow';

interface EventNodeData {
  label: string;
  description?: string;
}

export const EventNode = memo(({ data, selected }: NodeProps<EventNodeData>) => {
  return (
    <div className="relative h-full w-full">
      <NodeResizer
        isVisible={selected}
        minWidth={110}
        minHeight={72}
        lineClassName="border-orange-400"
        handleClassName="h-2 w-2 bg-orange-500"
      />
      <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-orange-400 bg-orange-100 px-3 shadow-sm">
        <span className="text-center text-xs font-medium leading-tight text-orange-900 break-words">
          {data.label}
        </span>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </div>
  );
});

EventNode.displayName = 'EventNode';