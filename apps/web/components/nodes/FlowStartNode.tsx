import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export const FlowStartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`
        relative w-20 h-20 rounded-full bg-green-500 
        flex items-center justify-center
        shadow-lg border-4 transition-all cursor-pointer
        ${selected ? 'border-green-700 ring-4 ring-green-300 shadow-2xl' : 'border-green-600'}
      `}
    >
      <Play className="w-8 h-8 text-white" fill="white" />
      <motion.div 
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {data.label || 'Start'}
      </motion.div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-green-700 border-2 border-white"
      />
    </motion.div>
  );
});

FlowStartNode.displayName = 'FlowStartNode';
