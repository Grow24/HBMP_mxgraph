import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { PortAwareNode } from './PortAwareNode';

interface DatasetNodeData {
  label: string;
  description?: string;
  kind: 'dataset';
  [key: string]: any;
}

export const DatasetNode = memo((props: NodeProps<DatasetNodeData>) => {
  const { data, selected } = props;
  
  return (
    <PortAwareNode 
      {...props}
      className="bg-purple-50 border-purple-200"
    >
      <div className="flex items-center space-x-2 mt-2">
        <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
        <span className="text-xs text-purple-700">Data Source</span>
      </div>
      {data.description && (
        <p className="text-xs text-purple-600 mt-1">{data.description}</p>
      )}
    </PortAwareNode>
  );
});

DatasetNode.displayName = 'DatasetNode';