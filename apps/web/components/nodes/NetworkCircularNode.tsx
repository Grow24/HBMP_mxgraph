'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Pin, 
  Wifi, 
  Server, 
  Database, 
  Shield, 
  Cloud, 
  HardDrive, 
  Cpu, 
  Globe,
  Layers,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface NetworkNodeData {
  label: string;
  type: string;
  deviceType?: string;
  degree?: number;
  clusterId?: string;
  influenceScore?: number;
  isPinned?: boolean;
  isHighlighted?: boolean;
  health?: {
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    cpu?: number;
    memory?: number;
    latency?: number;
  };
}

const NODE_COLORS: Record<string, string> = {
  router: '#3b82f6',
  switch: '#06b6d4',
  firewall: '#ef4444',
  server: '#8b5cf6',
  database: '#6366f1',
  storage: '#10b981',
  cloud: '#f59e0b',
  endpoint: '#ec4899',
  internet: '#14b8a6',
  // Legacy fallbacks
  processTask: '#3b82f6',
  gateway: '#f59e0b',
  event: '#10b981',
  dataset: '#8b5cf6',
  service: '#06b6d4',
  api: '#ec4899',
  db: '#6366f1',
  default: '#64748b',
};

const DEVICE_ICONS: Record<string, any> = {
  router: Wifi,
  switch: Layers,
  firewall: Shield,
  server: Server,
  database: Database,
  storage: HardDrive,
  cloud: Cloud,
  endpoint: Cpu,
  internet: Globe,
};

export const NetworkCircularNode = memo(({ data, selected }: NodeProps<NetworkNodeData>) => {
  const deviceType = data.deviceType || data.type;
  const color = NODE_COLORS[deviceType] || NODE_COLORS.default;
  const influenceRadius = 40 + (data.influenceScore || 0) * 20;
  const isHighDegree = (data.degree || 0) > 3;
  const DeviceIcon = DEVICE_ICONS[deviceType];
  
  // Health status color
  const healthColor = data.health?.status === 'healthy' ? '#10b981' :
                      data.health?.status === 'warning' ? '#f59e0b' :
                      data.health?.status === 'critical' ? '#ef4444' : '#64748b';
  
  const HealthIcon = data.health?.status === 'healthy' ? Check :
                     data.health?.status === 'warning' ? AlertCircle : X;

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Influence glow for high-degree nodes */}
      {isHighDegree && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: influenceRadius * 2,
            height: influenceRadius * 2,
            left: -influenceRadius + 45,
            top: -influenceRadius + 45,
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main node circle with modern styling */}
      <motion.div
        className="relative flex flex-col items-center justify-center rounded-full cursor-pointer backdrop-blur-sm"
        style={{
          width: 90,
          height: 90,
          background: `linear-gradient(135deg, ${color}dd 0%, ${color}aa 100%)`,
          border: selected || data.isHighlighted 
            ? `3px solid ${color}` 
            : data.health?.status === 'critical' 
            ? `3px solid ${healthColor}`
            : `2px solid ${color}dd`,
          boxShadow: selected || data.isHighlighted
            ? `0 0 30px ${color}60, 0 8px 16px rgba(0,0,0,0.3)`
            : `0 4px 12px rgba(0,0,0,0.2)`,
        }}
        animate={{
          scale: data.isHighlighted ? 1.15 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Device Icon */}
        {DeviceIcon && (
          <div className="mb-1">
            <DeviceIcon size={24} className="text-white" strokeWidth={2} />
          </div>
        )}

        {/* Node label */}
        <div className="text-white text-center px-2">
          <div className="text-[10px] font-bold truncate max-w-[70px]">
            {data.label}
          </div>
        </div>

        {/* Connection count badge */}
        {data.degree !== undefined && data.degree > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-600">
            {data.degree}
          </div>
        )}

        {/* Health status indicator */}
        {data.health && (
          <div
            className="absolute -top-2 -left-2 rounded-full p-1.5 shadow-lg border-2 border-slate-900"
            style={{ backgroundColor: healthColor }}
          >
            {HealthIcon && <HealthIcon size={12} className="text-white" />}
          </div>
        )}

        {/* Pin indicator */}
        {data.isPinned && (
          <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1.5 shadow-lg border-2 border-slate-900">
            <Pin size={12} className="text-white" />
          </div>
        )}

        {/* Cluster indicator */}
        {data.clusterId && (
          <div
            className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full border-2 border-slate-900 shadow-lg"
            style={{
              backgroundColor: `hsl(${parseInt(data.clusterId.split('-')[1] || '0') * 137.5}, 70%, 60%)`,
            }}
          />
        )}
      </motion.div>

      {/* Invisible handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        style={{ background: color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0"
        style={{ background: color }}
      />
    </motion.div>
  );
});

NetworkCircularNode.displayName = 'NetworkCircularNode';
