'use client'

import { FlowExecutionState } from '@/lib/flowExecutionEngine';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';

type FlowExecutionPanelProps = {
  executionState: FlowExecutionState;
};

export function FlowExecutionPanel({ executionState }: FlowExecutionPanelProps) {
  if (!executionState.isRunning && executionState.steps.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 flex items-center gap-2">
        <Play className="w-5 h-5" />
        <h3 className="font-semibold">Flow Execution</h3>
        {executionState.isRunning && (
          <div className="ml-auto">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {executionState.steps.map((step, index) => (
          <div
            key={step.nodeId}
            className={`p-2 rounded border ${
              step.status === 'success' ? 'bg-green-50 border-green-200' :
              step.status === 'error' ? 'bg-red-50 border-red-200' :
              step.status === 'running' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {step.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {step.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
              {step.status === 'running' && <Clock className="w-4 h-4 text-blue-600 animate-pulse" />}
              {step.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
            {step.error && (
              <p className="text-xs text-red-600 mt-1">{step.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t p-2 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1 max-h-20 overflow-y-auto">
          {executionState.logs.slice(-3).map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
