'use client';

import React, { useState } from 'react';
import { Upload, X, Plus, Calendar, MapPin, FileText, Link2, Award, Hash, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChainEntry {
  owner: string;
  acquiredAt?: string;
  notes?: string;
}

interface ProvenanceData {
  serialNumber?: string;
  acquisitionDate?: string;
  certificateOfAuthenticity?: string;
  certificateImage?: string;
  certificateUrl?: string;
  origin?: string;
  transferMethod?: string;
  associatedDocuments?: string[];
  provenanceNotes?: string;
  chain?: ChainEntry[];
}

interface ProvenanceSectionProps {
  data: ProvenanceData;
  onChange: (data: ProvenanceData) => void;
}

const ProvenanceSection: React.FC<ProvenanceSectionProps> = ({ data, onChange }) => {
  const [dragActive, setDragActive] = useState(false);

  const updateData = (updates: Partial<ProvenanceData>) => {
    onChange({ ...data, ...updates });
  };

  const addChainEntry = () => {
    const currentChain = Array.isArray(data.chain) ? data.chain : [];
    updateData({ 
      chain: [...currentChain, { owner: '', acquiredAt: '', notes: '' }] 
    });
  };

  const updateChainEntry = (index: number, updates: Partial<ChainEntry>) => {
    const currentChain = Array.isArray(data.chain) ? [...data.chain] : [];
    currentChain[index] = { ...currentChain[index], ...updates };
    updateData({ chain: currentChain });
  };

  const removeChainEntry = (index: number) => {
    const currentChain = Array.isArray(data.chain) ? [...data.chain] : [];
    currentChain.splice(index, 1);
    updateData({ chain: currentChain });
  };

  const addDocument = (doc: string) => {
    if (!doc.trim()) return;
    const current = Array.isArray(data.associatedDocuments) ? data.associatedDocuments : [];
    updateData({ associatedDocuments: [...current, doc.trim()] });
  };

  const removeDocument = (index: number) => {
    const current = Array.isArray(data.associatedDocuments) ? [...data.associatedDocuments] : [];
    current.splice(index, 1);
    updateData({ associatedDocuments: current });
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-6 md:p-8 space-y-6 md:space-y-8">
      {/* Header with premium badge */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <Award className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold text-gray-900">Provenance Documentation</h2>
            <p className="text-sm text-gray-600 font-mono">Held+ Premium Feature</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-full px-3 py-1">
          <span className="text-xs font-semibold text-amber-800">PREMIUM</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid xl:grid-cols-2 gap-8">
        
        {/* Left Column - Identity & Documentation */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm">
            <h3 className="font-serif font-medium text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              Object Identity
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={data.serialNumber || ''}
                  onChange={(e) => updateData({ serialNumber: e.target.value })}
                  placeholder="Enter serial number or unique identifier"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={data.origin || ''}
                    onChange={(e) => updateData({ origin: e.target.value })}
                    placeholder="Place of manufacture or origin"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acquisition Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={data.acquisitionDate || ''}
                    onChange={(e) => updateData({ acquisitionDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Method</label>
                <select
                  value={data.transferMethod || ''}
                  onChange={(e) => updateData({ transferMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select method</option>
                  <option value="purchase">Purchase</option>
                  <option value="gift">Gift</option>
                  <option value="inheritance">Inheritance</option>
                  <option value="trade">Trade</option>
                  <option value="commission">Commission</option>
                  <option value="auction">Auction</option>
                  <option value="found">Found</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Certificate of Authenticity */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm">
            <h3 className="font-serif font-medium text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              Certificate of Authenticity
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Description</label>
                <textarea
                  value={data.certificateOfAuthenticity || ''}
                  onChange={(e) => updateData({ certificateOfAuthenticity: e.target.value })}
                  placeholder="Describe the certificate or authentication details"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate URL or Reference</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={data.certificateUrl || ''}
                    onChange={(e) => updateData({ certificateUrl: e.target.value })}
                    placeholder="https://... or reference number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Certificate Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Image</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    // Handle file drop - implement upload logic
                  }}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drop certificate image here, or</p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chain & Documents */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Chain of Ownership */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-serif font-medium text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                Chain of Ownership
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addChainEntry}
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Owner
              </Button>
            </div>

            <div className="space-y-3">
              {(Array.isArray(data.chain) ? data.chain : []).map((entry, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">Owner #{index + 1}</span>
                    <button
                      onClick={() => removeChainEntry(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid gap-3">
                    <input
                      type="text"
                      value={entry.owner || ''}
                      onChange={(e) => updateChainEntry(index, { owner: e.target.value })}
                      placeholder="Owner name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={entry.acquiredAt || ''}
                        onChange={(e) => updateChainEntry(index, { acquiredAt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        value={entry.notes || ''}
                        onChange={(e) => updateChainEntry(index, { notes: e.target.value })}
                        placeholder="Notes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!data.chain || data.chain.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No ownership history added yet</p>
                  <p className="text-xs text-gray-400">Track the complete ownership chain of this object</p>
                </div>
              )}
            </div>
          </div>

          {/* Associated Documents */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm">
            <h3 className="font-serif font-medium text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Associated Documents
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Add document URL or reference"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      addDocument(target.value);
                      target.value = '';
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                    if (input) {
                      addDocument(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>

              {(Array.isArray(data.associatedDocuments) ? data.associatedDocuments : []).map((doc, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-md p-2">
                  <Link2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{doc}</span>
                  <button
                    onClick={() => removeDocument(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance Notes */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm">
            <h3 className="font-serif font-medium text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Provenance Notes
            </h3>
            
            <textarea
              value={data.provenanceNotes || ''}
              onChange={(e) => updateData({ provenanceNotes: e.target.value })}
              placeholder="Additional notes about the object's history, significance, or provenance details..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer with save reminder */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Provenance data is automatically saved when you save the object</span>
        </div>
      </div>
    </div>
  );
};

export default ProvenanceSection;
