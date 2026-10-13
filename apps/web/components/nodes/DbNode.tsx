import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';

interface DbNodeData {
  label: string;
  description?: string;
}

export const DbNode = memo(({ data }: NodeProps<DbNodeData>) => {
  return (
    <Card className="min-w-[120px] bg-gray-50 border-gray-200 shadow-sm">
      <div className="p-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">{data.label}</span>
        </div>
        {data.description && (
          <p className="text-xs text-gray-700 mt-1">{data.description}</p>
        )}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500 border-2 border-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-500 border-2 border-white"
      />
    </Card>
  );
});

DbNode.displayName = 'DbNode';