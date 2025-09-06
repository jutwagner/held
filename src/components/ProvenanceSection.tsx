'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Plus, Calendar, MapPin, FileText, Link2, Award, Hash, Clock, Users, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadCOAImage } from '@/lib/firebase-services';

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
  objectId?: string; // Optional: enable direct upload to this object's storage path
  onUploadCOA?: (file: File) => Promise<string>; // Optional custom uploader
  editable?: boolean; // Show inputs and upload only when true
  onRequestSave?: () => void; // Optional explicit save button
  onRequestEdit?: () => void; // Optional: show an Edit button in header when not editing
}

const ProvenanceSection: React.FC<ProvenanceSectionProps> = ({ data, onChange, objectId, onUploadCOA, editable = true, onRequestSave, onRequestEdit }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const performUpload = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      let url: string | undefined;
      if (typeof onUploadCOA === 'function') {
        url = await onUploadCOA(file);
      } else if (objectId) {
        url = await uploadCOAImage(file, objectId);
      } else {
        alert('Upload available after saving the object.');
        return;
      }
      if (url) updateData({ certificateImage: url });
    } catch (e) {
      console.error('Certificate upload failed', e);
      alert('Failed to upload certificate image');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    const current = Array.isArray(data.associatedDocuments) ? [...data.associatedDocuments] : [];
    current.splice(index, 1);
    updateData({ associatedDocuments: current });
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl space-y-6 md:space-y-8">
      {/* Header with premium badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <img src="/held-seal.svg" alt="Held Seal" className="h-10 w-10" />
            </span>
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold text-gray-900">Provenance Documentation</h2>
            <p className="text-sm text-gray-600 font-mono">Held+ Premium Feature</p>
          </div>
        </div>
        <div>
          {!editable && onRequestEdit && (
            <Button variant="outline" size="sm" className="border-black text-black" onClick={onRequestEdit}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid xl:grid-cols-2 gap-8">
        
        {/* Left Column - Identity & Documentation */}
        <div className="space-y-4 md:space-y-6">
          <div className="rounded-lg shadow-sm">
            <h3 className="font-serif text-xl text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              Object Identity
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={data.serialNumber || ''}
                  onChange={(e) => updateData({ serialNumber: e.target.value })}
                  disabled={!editable}
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
                    disabled={!editable}
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
                    disabled={!editable}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Method</label>
                <select
                  value={data.transferMethod || ''}
                  onChange={(e) => updateData({ transferMethod: e.target.value })}
                  disabled={!editable}
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
          <div className="rounded-lg shadow-sm">
            <h3 className="font-serif text-xl text-gray-900 mb-3 mt-10 md:mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              Certificate of Authenticity
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Description</label>
                <textarea
                  value={data.certificateOfAuthenticity || ''}
                  onChange={(e) => updateData({ certificateOfAuthenticity: e.target.value })}
                  disabled={!editable}
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
                    disabled={!editable}
                    placeholder="https://... or reference number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Certificate Image Upload */}
              <div >
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Image</label>
                {data.certificateImage ? (
                  <div className="flex items-center gap-3">
                    <img src={data.certificateImage} alt="Certificate" className="h-16 w-auto border" />
                    {editable && <Button variant="outline" size="sm" onClick={() => updateData({ certificateImage: '' })}>Remove</Button>}
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      editable ? (dragActive ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400') : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onDragOver={(e) => { if (!editable) return; e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => { if (!editable) return; setDragActive(false); }}
                    onDrop={(e) => {
                      if (!editable) return;
                      e.preventDefault();
                      setDragActive(false);
                      const file = Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith('image/'));
                      performUpload(file);
                    }}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Drop certificate image here, or</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = (e.target.files || [])[0];
                        performUpload(f);
                        if (e.currentTarget) e.currentTarget.value = '';
                      }}
                    />
                    <Button variant="outline" size="sm" disabled={uploading || !editable} onClick={() => fileInputRef.current?.click()}>
                      {uploading ? 'Uploading…' : 'Choose File'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chain & Documents */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Chain of Ownership */}
          <div className="shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-xl-500" />
                Chain of Ownership
              </h3>
              {editable && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addChainEntry}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Owner
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {(Array.isArray(data.chain) ? data.chain : []).map((entry, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">Owner #{index + 1}</span>
                    {editable ? (
                      <button
                        onClick={() => removeChainEntry(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">&nbsp;</span>
                    )}
                  </div>
                  
                  <div className="grid gap-3">
                    <input
                      type="text"
                      value={entry.owner || ''}
                      onChange={(e) => updateChainEntry(index, { owner: e.target.value })}
                      disabled={!editable}
                      placeholder="Owner name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={entry.acquiredAt || ''}
                        onChange={(e) => updateChainEntry(index, { acquiredAt: e.target.value })}
                        disabled={!editable}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        value={entry.notes || ''}
                        onChange={(e) => updateChainEntry(index, { notes: e.target.value })}
                        disabled={!editable}
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
          <div className="">
            <h3 className="font-serif text-xl text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Associated Documents
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Add document URL or reference"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  readOnly={!editable}
                  onKeyPress={(e) => {
                    if (!editable) return;
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      addDocument(target.value);
                      target.value = '';
                    }
                  }}
                />
                {editable && (
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
                )}
              </div>

              {(Array.isArray(data.associatedDocuments) ? data.associatedDocuments : []).map((doc, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-md p-2">
                  <Link2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{doc}</span>
                  {editable && (
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Provenance Notes */}
          <div className="">
            <h3 className="font-serif text-xl text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Provenance Notes
            </h3>
            
            <textarea
              value={data.provenanceNotes || ''}
              onChange={(e) => updateData({ provenanceNotes: e.target.value })}
              disabled={!editable}
              placeholder="Additional notes about the object's history, significance, or provenance details..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
            />
          </div>
        </div>

        {editable && (
          <div className="xl:col-span-2 flex justify-end">
            {onRequestSave && (
              <Button onClick={onRequestSave} className="bg-black text-white px-5 py-2">Save Provenance</Button>
            )}
          </div>
        )}
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
