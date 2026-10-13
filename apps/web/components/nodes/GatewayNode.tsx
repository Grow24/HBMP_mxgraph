import React, { memo } from 'react';
import { Handle, NodeResizer, Position, NodeProps, useStore } from 'reactflow';

interface GatewayNodeData {
  label: string;
  description?: string;
}

const DOT: React.CSSProperties = {
  width: 14,
  height: 14,
  background: '#eab308',
  border: '2px solid white',
  zIndex: 6,
}

export const GatewayNode = memo(({ data, selected }: NodeProps<GatewayNodeData>) => {
  const connecting = useStore((state) => Boolean((state as { connectionNodeId?: string | null }).connectionNodeId))
  return (
    <div className="relative h-full w-full">
      <NodeResizer
        isVisible={selected}
        minWidth={72}
        minHeight={72}
        lineClassName="border-yellow-400"
        handleClassName="h-2 w-2 bg-yellow-500"
      />
      {/* Diamond is the node. Handles sit on its three points, not on an empty box around it. */}
      <div
        className="pointer-events-none h-full w-full border-2 border-yellow-500 bg-yellow-100 shadow-sm"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[160px] -translate-x-1/2 text-center text-xs font-medium leading-tight text-yellow-900">
        {data.label}
      </div>

      {/* Wide drop target so the line lands when it is released on the diamond, and attaches at the left point. */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="gateway-input-target"
        isConnectableStart={false}
        title="Connect into this decision"
        style={{
          width: '72%',
          height: '72%',
          left: 0,
          top: '14%',
          transform: 'none',
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
          opacity: 0,
          zIndex: 2,
          pointerEvents: connecting ? 'all' : 'none',
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="true-output"
        title="Yes"
        style={{ ...DOT, right: -2, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false-output"
        title="No"
        style={{ ...DOT, left: '50%', bottom: -2 }}
      />
    </div>
  );
});

GatewayNode.displayName = 'GatewayNode';