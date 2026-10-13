import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { PortAwareNode } from './PortAwareNode';

export interface EventTrigger {
  type: 'onSuccess' | 'onFailure' | 'onTimeout' | 'onRetry';
  action: string;
  description?: string;
  enabled: boolean;
}

interface ProcessTaskNodeData {
  label: string;
  description?: string;
  events?: EventTrigger[];
  status?: 'idle' | 'running' | 'success' | 'error';
  kind: 'processTask';
  [key: string]: any;
}

export const ProcessTaskNode = memo((props: NodeProps<ProcessTaskNodeData>) => {
  const { data } = props;
  const [showEvents, setShowEvents] = useState(false);
  const events = data.events || [];
  const hasEvents = events.length > 0;
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-blue-400 bg-blue-50';
      case 'success': return 'border-green-400 bg-green-50';
      case 'error': return 'border-red-400 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '';
    }
  };

  return (
    <div className="relative">
      <PortAwareNode 
        {...props}
        className={`${getStatusColor()}`}
        onMouseEnter={() => setShowEvents(true)}
        onMouseLeave={() => setShowEvents(false)}
      >
        <div className="mt-1 flex items-center justify-end">
          <div className="flex items-center space-x-1">
            {getStatusIcon() && <span className="text-xs">{getStatusIcon()}</span>}
            {hasEvents && <span className="text-xs">⚡</span>}
          </div>
        </div>
        {data.description && (
          <p className="text-xs text-blue-600 mt-1">{data.description}</p>
        )}
      </PortAwareNode>

      {/* Event Triggers Popup - Feature 3 */}
      {showEvents && hasEvents && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
          <h4 className="text-xs font-semibold text-gray-800 mb-2">⚡ Event Triggers</h4>
          <div className="space-y-2">
            {events.map((event, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    event.enabled ? 'bg-green-400' : 'bg-gray-300'
                  }`}></span>
                  <span className="font-medium">{event.type}</span>
                </div>
                <span className="text-gray-600">{event.action}</span>
              </div>
            ))}
          </div>
          {events.some(e => e.description) && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              {events.filter(e => e.description).map((event, index) => (
                <p key={index} className="text-xs text-gray-500 italic">
                  {event.type}: {event.description}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ProcessTaskNode.displayName = 'ProcessTaskNode';