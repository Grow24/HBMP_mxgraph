import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

export const FlowDecisionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        className={`
          w-24 h-24 bg-yellow-500 
          flex items-center justify-center shadow-lg border-4
          transform rotate-45 cursor-pointer transition-all
          ${selected ? 'border-yellow-700 ring-4 ring-yellow-300 shadow-2xl' : 'border-yellow-600'}
        `}
      >
        <div className="transform -rotate-45">
          <GitBranch className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
      </motion.div>
      <motion.div 
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {data.label || 'Decision'}
      </motion.div>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-700 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} id="yes" className="w-3 h-3 bg-yellow-700 border-2 border-white" />
      <Handle type="source" position={Position.Right} id="no" className="w-3 h-3 bg-yellow-700 border-2 border-white" />
    </div>
  );
});

FlowDecisionNode.displayName = 'FlowDecisionNode';
