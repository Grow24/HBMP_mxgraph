import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';

interface ServiceNodeData {
  label: string;
  description?: string;
}

export const ServiceNode = memo(({ data }: NodeProps<ServiceNodeData>) => {
  return (
    <Card className="min-w-[120px] bg-purple-50 border-purple-200 shadow-sm">
      <div className="p-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm font-medium text-purple-900">{data.label}</span>
        </div>
        {data.description && (
          <p className="text-xs text-purple-700 mt-1">{data.description}</p>
        )}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </Card>
  );
});

ServiceNode.displayName = 'ServiceNode';