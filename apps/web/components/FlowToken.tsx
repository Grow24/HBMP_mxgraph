/**
 * Framer Motion Flow Token Component
 * Animated token that follows the flow path while respecting swimlane boundaries
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowToken } from '@/lib/framerFlowAnimator';

interface FlowTokenProps {
  token: FlowToken;
  reactFlowBounds?: DOMRect;
}

export const FlowTokenComponent: React.FC<FlowTokenProps> = ({ token }) => {
  if (!token.isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={token.id}
        className="absolute pointer-events-none z-50"
        initial={{ 
          x: token.position.x - 12,
          y: token.position.y - 12,
          scale: 0,
          opacity: 0
        }}
        animate={{ 
          x: token.targetPosition.x - 12,
          y: token.targetPosition.y - 12,
          scale: 1,
          opacity: 1
        }}
        exit={{ 
          scale: 0,
          opacity: 0
        }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 25,
          duration: 0.8
        }}
        style={{
          // Use transform to position relative to React Flow viewport
          transformOrigin: 'center',
        }}
      >
        <motion.div
          className="relative"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 70%, transparent 100%)',
              width: '32px',
              height: '32px',
              left: '-4px',
              top: '-4px',
            }}
          />
          
          {/* Main token */}
          <motion.div
            className="w-6 h-6 rounded-full shadow-lg relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
            }}
            animate={{
              boxShadow: [
                '0 0 10px rgba(16, 185, 129, 0.6)',
                '0 0 20px rgba(16, 185, 129, 0.8)',
                '0 0 10px rgba(16, 185, 129, 0.6)'
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Inner sparkle effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                background: [
                  'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%)',
                  'radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.8) 0%, transparent 50%)',
                  'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%)',
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Flow direction indicator */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div 
                className="w-2 h-2 rounded-full bg-white opacity-90"
                style={{
                  transform: 'translateX(6px)',
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Token trail effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
            width: '24px',
            height: '24px',
            left: '-6px',
            top: '-6px',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

interface MultipleTokensProps {
  tokens: FlowToken[];
  reactFlowBounds?: DOMRect;
}

export const MultipleFlowTokens: React.FC<MultipleTokensProps> = ({ tokens, reactFlowBounds }) => {
  return (
    <>
      {tokens.map(token => (
        <FlowTokenComponent 
          key={token.id} 
          token={token} 
          reactFlowBounds={reactFlowBounds}
        />
      ))}
    </>
  );
};