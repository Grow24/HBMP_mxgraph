import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Table } from 'lucide-react';

export const FlowTableNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative bg-white rounded-lg shadow-lg border-4 cursor-pointer transition-all
        min-w-[200px] p-4
        ${selected ? 'border-indigo-700 ring-4 ring-indigo-300 shadow-2xl' : 'border-indigo-500'}
      `}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-200">
        <Table className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
        <span className="text-indigo-900 font-semibold text-sm">{data.label || 'Data Table'}</span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Rows:</span>
          <span className="font-medium">{data.rowCount || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Columns:</span>
          <span className="font-medium">{data.columnCount || 0}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-700 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-700 border-2 border-white" />
    </motion.div>
  );
});

FlowTableNode.displayName = 'FlowTableNode';
