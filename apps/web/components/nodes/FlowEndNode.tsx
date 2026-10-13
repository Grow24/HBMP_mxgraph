import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Square } from 'lucide-react';

export const FlowEndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative w-20 h-20 rounded-full bg-red-500 
        flex items-center justify-center
        shadow-lg border-4 transition-all cursor-pointer
        ${selected ? 'border-red-700 ring-4 ring-red-300 shadow-2xl' : 'border-red-600'}
      `}
    >
      <Square className="w-8 h-8 text-white" fill="white" strokeWidth={0} />
      <motion.div 
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {data.label || 'End'}
      </motion.div>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-red-700 border-2 border-white"
      />
    </motion.div>
  );
});

FlowEndNode.displayName = 'FlowEndNode';
