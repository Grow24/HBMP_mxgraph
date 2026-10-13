'use client';

import React from 'react';
import { useAppStore, CanvasMode } from '@/lib/store';
import { motion } from 'framer-motion';

export function ViewToggle() {
  const { canvasMode, setCanvasMode } = useAppStore();

  const modes: { value: CanvasMode; label: string; icon: string }[] = [
    { value: 'flow', label: 'Flow', icon: '▶️' },
    { value: 'swimlane', label: 'Swimlane', icon: '🏊' },
    { value: 'network', label: 'Network', icon: '🕸️' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-1">
      {modes.map((mode) => (
        <motion.button
          key={mode.value}
          onClick={() => setCanvasMode(mode.value)}
          className={`
            relative px-4 py-2 rounded-md font-medium text-sm transition-colors
            ${
              canvasMode === mode.value
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {canvasMode === mode.value && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
