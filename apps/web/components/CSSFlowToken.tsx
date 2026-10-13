/**
 * CSS-Only Flow Token Component
 * Animated token that follows the flow path using pure CSS animations
 */

import React from 'react';

export interface FlowToken {
  id: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  nodeId: string;
  swimlaneId?: string;
  isActive: boolean;
}

interface FlowTokenProps {
  token: FlowToken;
}

export const CSSFlowTokenComponent: React.FC<FlowTokenProps> = ({ token }) => {
  console.log('🎯 Rendering token:', token.id, 'at position:', token.targetPosition, 'active:', token.isActive);
  
  if (!token.isActive) {
    console.log('❌ Token', token.id, 'is not active, not rendering');
    return null;
  }

  return (
    <div
      className="css-flow-token"
      style={{
        position: 'absolute',
        left: `${token.targetPosition.x - 12}px`,
        top: `${token.targetPosition.y - 12}px`,
        zIndex: 1000,
        pointerEvents: 'none',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Outer glow ring */}
      <div 
        style={{
          position: 'absolute',
          width: '32px',
          height: '32px',
          left: '-4px',
          top: '-4px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 70%, transparent 100%)',
          animation: 'tokenGlow 1.5s ease-in-out infinite'
        }}
      />
      
      {/* Main token */}
      <div 
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'tokenPulse 1.5s ease-in-out infinite',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
        }}
      >
        {/* Inner sparkle effect */}
        <div 
          style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%)',
            animation: 'tokenSparkle 2s ease-in-out infinite'
          }}
        />
        
        {/* Flow direction indicator */}
        <div 
          style={{
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'tokenRotate 3s linear infinite'
          }}
        >
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'white',
              opacity: 0.9,
              transform: 'translateX(6px)'
            }}
          />
        </div>
      </div>

      {/* Token trail effect */}
      <div 
        style={{
          position: 'absolute',
          inset: '0',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
          width: '24px',
          height: '24px',
          left: '-6px',
          top: '-6px',
          animation: 'tokenTrail 1s ease-in-out infinite'
        }}
      />
    </div>
  );
};

interface MultipleTokensProps {
  tokens: FlowToken[];
}

export const MultipleCSSFlowTokens: React.FC<MultipleTokensProps> = ({ tokens }) => {
  console.log('🎭 Rendering', tokens.length, 'CSS flow tokens:', tokens);
  
  return (
    <>
      {tokens.map(token => (
        <CSSFlowTokenComponent 
          key={token.id} 
          token={token}
        />
      ))}
      
      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes tokenGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.2;
          }
        }
        
        @keyframes tokenPulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
          }
          50% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
          }
        }
        
        @keyframes tokenSparkle {
          0%, 100% {
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
          }
          50% {
            background: radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
          }
        }
        
        @keyframes tokenRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes tokenTrail {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
          }
        }
      `}</style>
    </>
  );
};