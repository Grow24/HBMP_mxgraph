import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const FlowActionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`
        relative px-6 py-3 bg-blue-500 rounded-lg
        flex items-center gap-2 shadow-lg border-4 cursor-pointer transition-all
        min-w-[120px] justify-center
        ${selected ? 'border-blue-700 ring-4 ring-blue-300 shadow-2xl' : 'border-blue-600'}
      `}
    >
      <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
      <span className="text-white font-semibold text-sm">{data.label || 'Action'}</span>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-700 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-700 border-2 border-white" />
    </motion.div>
  );
});

FlowActionNode.displayName = 'FlowActionNode';
