import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Cog } from 'lucide-react';

export const FlowProcessNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`
        relative px-6 py-3 bg-purple-500 rounded-lg
        flex items-center gap-2 shadow-lg border-4 cursor-pointer transition-all
        min-w-[120px] justify-center
        ${selected ? 'border-purple-700 ring-4 ring-purple-300 shadow-2xl' : 'border-purple-600'}
      `}
    >
      <Cog className="w-5 h-5 text-white" strokeWidth={2.5} />
      <span className="text-white font-semibold text-sm">{data.label || 'Process'}</span>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-700 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-700 border-2 border-white" />
    </motion.div>
  );
});

FlowProcessNode.displayName = 'FlowProcessNode';
