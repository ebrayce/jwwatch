import React, { useState, useEffect } from 'react';
import type {SchemaMapping} from '../types';
import { ArrowRight, LayoutTemplate } from 'lucide-react';

interface ColumnSelectorProps {
  headers: string[];
  onConfirm: (mapping: SchemaMapping) => void;
  onCancel: () => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({ headers, onConfirm, onCancel }) => {
  const [mapping, setMapping] = useState<SchemaMapping>({
    nameKey: '',
    phoneKey: '',
    dateKey: '',
    descriptionKey: ''
  });

  // Initial Heuristic Guess
  useEffect(() => {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findH = (terms: string[]) => {
      const idx = lowerHeaders.findIndex(h => terms.some(t => h.includes(t)));
      return idx !== -1 ? headers[idx] : '';
    };

    setMapping({
      nameKey: findH(['name', 'client', 'customer', 'person', 'beneficiary']) || headers[0] || '',
      phoneKey: findH(['phone', 'mobile', 'cell', 'tel', 'contact']) || headers[1] || '',
      dateKey: findH(['date', 'day', 'time', 'dob']) || '',
      descriptionKey: findH(['note', 'desc', 'address', 'remark', 'location']) || ''
    });
  }, [headers]);

  const handleChange = (field: keyof SchemaMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const isValid = mapping.nameKey && mapping.phoneKey;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <LayoutTemplate className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Map Your Columns</h2>
        <p className="text-sm text-gray-500">Select which column matches each field.</p>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto px-1">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name Column <span className="text-red-500">*</span>
          </label>
          <select 
            value={mapping.nameKey || ''}
            onChange={(e) => handleChange('nameKey', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800"
          >
            <option value="" disabled>Select a column...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Column <span className="text-red-500">*</span>
          </label>
          <select 
            value={mapping.phoneKey || ''}
            onChange={(e) => handleChange('phoneKey', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800"
          >
            <option value="" disabled>Select a column...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Column (Optional)
          </label>
          <select 
            value={mapping.dateKey || ''}
            onChange={(e) => handleChange('dateKey', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800"
          >
            <option value="" >Don't use date</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / Note (Optional)
          </label>
          <select 
            value={mapping.descriptionKey || ''}
            onChange={(e) => handleChange('descriptionKey', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800"
          >
            <option value="">None</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => onConfirm(mapping)}
          disabled={!isValid}
          className={`flex-1 py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all
            ${isValid ? 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20' : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          <span>Import Data</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};