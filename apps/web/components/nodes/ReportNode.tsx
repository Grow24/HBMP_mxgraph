import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { PortAwareNode } from './PortAwareNode';

interface ReportNodeData {
  label: string;
  description?: string;
  kind: 'report';
  [key: string]: any;
}

export const ReportNode = memo((props: NodeProps<ReportNodeData>) => {
  const { data } = props;
  
  return (
    <PortAwareNode 
      {...props}
      className="bg-red-50 border-red-200"
    >
      <div className="flex items-center space-x-2 mt-2">
        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
        <span className="text-xs text-red-700">Output</span>
      </div>
      {data.description && (
        <p className="text-xs text-red-600 mt-1">{data.description}</p>
      )}
    </PortAwareNode>
  );
});

ReportNode.displayName = 'ReportNode';