'use client'

import { useState } from 'react';
import { X } from 'lucide-react';
import { z } from 'zod';

const flowActionSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  actionType: z.enum(['create', 'update', 'delete', 'query']),
  targetObject: z.string().min(1, 'Target object is required'),
  fields: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
});

const flowDecisionSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  condition: z.string().min(1, 'Condition is required'),
  operator: z.enum(['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains'])
});

type FlowConfigDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  nodeType: 'flowStart' | 'flowAction' | 'flowDecision' | 'flowEnd';
  nodeData: any;
  onSave: (data: any) => void;
};

export function FlowConfigDrawer({ isOpen, onClose, nodeType, nodeData, onSave }: FlowConfigDrawerProps) {
  const [formData, setFormData] = useState(nodeData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      if (nodeType === 'flowAction') {
        flowActionSchema.parse(formData);
      } else if (nodeType === 'flowDecision') {
        flowDecisionSchema.parse(formData);
      }
      onSave(formData);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-96 bg-white h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Configure {nodeType}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full p-2 border rounded"
            />
            {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
          </div>

          {nodeType === 'flowAction' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <select
                  value={formData.actionType || 'create'}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="create">Create Record</option>
                  <option value="update">Update Record</option>
                  <option value="delete">Delete Record</option>
                  <option value="query">Query Records</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Object</label>
                <input
                  type="text"
                  value={formData.targetObject || ''}
                  onChange={(e) => setFormData({ ...formData, targetObject: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Account, Contact"
                />
                {errors.targetObject && <p className="text-red-500 text-xs mt-1">{errors.targetObject}</p>}
              </div>
            </>
          )}

          {nodeType === 'flowDecision' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <input
                  type="text"
                  value={formData.condition || ''}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Amount > 1000"
                />
                {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operator</label>
                <select
                  value={formData.operator || 'equals'}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="equals">Equals</option>
                  <option value="notEquals">Not Equals</option>
                  <option value="greaterThan">Greater Than</option>
                  <option value="lessThan">Less Than</option>
                  <option value="contains">Contains</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 p-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
