'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isHeldPlus } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createObject } from '@/lib/firebase-services';
import { CreateObjectData } from '@/types';
import { ArrowLeft, Upload, X, Plus, Sparkles, Camera, Heart, Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProvenanceUpsell from '@/components/ProvenanceUpsell';
import ProvenanceSection from '@/components/ProvenanceSection';

export default function NewObjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>());

  const [formData, setFormData] = useState<CreateObjectData>({
    title: '',
    maker: '',
    year: undefined,
    value: undefined,
    category: '',
    condition: 'good',
    tags: [],
    notes: '',
    images: [],
    isPublic: false,
    shareInCollaborative: false,
  });

  const [newTag, setNewTag] = useState('');

  const steps = [
    { 
      id: 1, 
      title: "Identification", 
      subtitle: "Basic information",
      icon: Heart,
      color: "bg-black"
    },
    { 
      id: 2, 
      title: "Documentation", 
      subtitle: "Visual record",
      icon: Camera,
      color: "bg-black"
    },
    { 
      id: 3, 
      title: "Specifications", 
      subtitle: "Technical details",
      icon: Sparkles,
      color: "bg-black"
    },
    { 
      id: 4, 
      title: "Provenance", 
      subtitle: "History & ownership",
      icon: Zap,
      color: "bg-black"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return formData.title.trim() && formData.category;
      case 2:
        return true; // Images are optional
      case 3:
        return true; // Details are optional
      case 4:
        return true; // Provenance is optional
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || typeof user.uid !== 'string') return;

    if (!formData.title.trim() || !formData.category) {
      return;
    }

    setLoading(true);

    try {
      const result = await createObject(user.uid, formData);
      console.log('Object created:', result);
      router.push('/registry');
    } catch (err) {
      console.error('Error creating object:', err);
      alert('Failed to create object. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="held-container py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-16">
            <Button variant="ghost" asChild className="p-0 h-auto text-black hover:bg-transparent">
              <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase">
                <ArrowLeft className="h-4 w-4" />
                Registry
              </Link>
            </Button>
            
            <div className="text-xs font-medium tracking-widest uppercase text-gray-400">
              New Entry
            </div>
          </div>
          
          <div className="mb-20">
            <h1 className="text-6xl md:text-7xl font-light text-black mb-6 tracking-tighter leading-none">
              Acquisition
            </h1>
            <div className="w-16 h-0.5 bg-black mb-8"></div>
            <p className="text-base text-gray-600 max-w-xl font-light leading-relaxed">
              Systematic documentation for permanent collection records.
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid grid-cols-4 gap-8">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              
              return (
                <div key={step.id} className="text-center">
                  <div className={`text-xs font-medium tracking-widest uppercase mb-2 transition-colors ${
                    isCompleted 
                      ? 'text-black' 
                      : isActive 
                      ? 'text-black'
                      : 'text-gray-300'
                  }`}>
                    {String(step.id).padStart(2, '0')}
                  </div>
                  <div className={`h-0.5 mb-3 transition-colors ${
                    isCompleted 
                      ? 'bg-black' 
                      : isActive 
                      ? 'bg-black'
                      : 'bg-gray-200'
                  }`} />
                  <div className={`text-xs font-medium tracking-wide uppercase transition-colors ${
                    isCompleted 
                      ? 'text-black' 
                      : isActive 
                      ? 'text-black'
                      : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Step Content */}
              <div className="p-16">
                {/* Step 1: Identification */}
                {currentStep === 1 && (
                  <div className="space-y-12">
                    <div className="border-b border-gray-100 pb-8">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">01</div>
                      <h2 className="text-4xl font-light text-black tracking-tight">Identification</h2>
                    </div>

                    <div className="space-y-12">
                      <div>
                        <label htmlFor="title" className="block text-xs font-medium text-black mb-4 uppercase tracking-widest">
                          Object Title
                        </label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          placeholder="Eames Lounge Chair and Ottoman"
                          className="text-xl py-6 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black mb-6 uppercase tracking-widest">
                          Classification
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {[
                            { value: "Audio", label: "Audio Equipment" },
                            { value: "Photography", label: "Photography" },
                            { value: "Art", label: "Fine Art" },
                            { value: "Design", label: "Industrial Design" },
                            { value: "Furniture", label: "Furniture" },
                            { value: "Lighting", label: "Lighting" },
                            { value: "Technology", label: "Technology" },
                            { value: "Instruments", label: "Musical Instruments" },
                            { value: "Watches", label: "Timepieces" },
                            { value: "Fashion", label: "Fashion & Textiles" },
                            { value: "Books", label: "Publications" },
                            { value: "Miscellaneous", label: "Miscellaneous" }
                          ].map((category) => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                              className={`py-4 px-6 border border-gray-200 text-left transition-all duration-150 ${
                                formData.category === category.value
                                  ? 'border-black bg-black text-white'
                                  : 'bg-white text-black hover:border-gray-400'
                              }`}
                            >
                              <div className="text-sm font-light tracking-wide">{category.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Documentation */}
                {currentStep === 2 && (
                  <div className="space-y-12">
                    <div className="border-b border-gray-100 pb-8">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">02</div>
                      <h2 className="text-4xl font-light text-black tracking-tight">Documentation</h2>
                    </div>

                    <div className="space-y-12">
                      <div>
                        <label className="block text-xs font-medium text-black mb-6 uppercase tracking-widest">
                          Visual Record
                        </label>
                        
                        {/* Image Upload Area */}
                        <div className="border border-gray-200 p-20 text-center hover:border-black transition-colors">
                          <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-8">
                            Image Upload
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => document.getElementById('image-upload')?.click()} 
                            className="border-black text-black hover:bg-black hover:text-white rounded-none font-light tracking-wide"
                          >
                            Select Files
                          </Button>
                        </div>

                        {/* Image Preview */}
                        {formData.images.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                            {formData.images.map((image, index) => (
                              <div key={index} className="relative group border border-gray-200">
                                <Image
                                  src={URL.createObjectURL(image)}
                                  alt={`Image ${index + 1}`}
                                  width={400}
                                  height={300}
                                  className="w-full h-64 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-4 right-4 bg-black text-white w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Specifications */}
                {currentStep === 3 && (
                  <div className="space-y-12">
                    <div className="border-b border-gray-100 pb-8">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">03</div>
                      <h2 className="text-4xl font-light text-black tracking-tight">Specifications</h2>
                    </div>

                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                          <label className="block text-xs font-medium text-black mb-4 uppercase tracking-widest">
                            Manufacturer
                          </label>
                          <Input
                            value={formData.maker}
                            onChange={(e) => setFormData(prev => ({ ...prev, maker: e.target.value }))}
                            placeholder="Herman Miller"
                            className="text-xl py-6 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-black mb-4 uppercase tracking-widest">
                            Year of Production
                          </label>
                          <Input
                            type="number"
                            value={formData.year || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : undefined }))}
                            placeholder="1956"
                            className="text-xl py-6 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black mb-6 uppercase tracking-widest">
                          Physical Condition
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { value: 'excellent', label: 'Excellent' },
                            { value: 'good', label: 'Good' },
                            { value: 'fair', label: 'Fair' },
                            { value: 'poor', label: 'Poor' }
                          ].map((condition) => (
                            <button
                              key={condition.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, condition: condition.value as any }))}
                              className={`py-4 px-6 border border-gray-200 transition-all duration-150 ${
                                formData.condition === condition.value
                                  ? 'border-black bg-black text-white'
                                  : 'bg-white text-black hover:border-gray-400'
                              }`}
                            >
                              <div className="text-sm font-light tracking-wide">{condition.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black mb-6 uppercase tracking-widest">
                          Keywords
                        </label>
                        <div className="flex gap-3 mb-6">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="vintage, limited edition, signed"
                            className="flex-1 text-lg py-4 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} variant="outline" className="border-black text-black hover:bg-black hover:text-white rounded-none font-light">
                            Add
                          </Button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {formData.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-2 bg-gray-100 text-black px-4 py-2 text-sm border border-gray-200"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-gray-500 hover:text-black"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black mb-6 uppercase tracking-widest">
                          Additional Notes
                        </label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Technical specifications, historical context, acquisition details..."
                          rows={6}
                          className="resize-none border border-gray-200 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400 text-base leading-relaxed"
                        />
                      </div>

                      <div className="space-y-6 pt-8 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={formData.isPublic}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                            className="h-4 w-4 text-black focus:ring-0 border-gray-300 rounded-none"
                          />
                          <label htmlFor="isPublic" className="text-black font-light text-sm tracking-wide">
                            Public Visibility
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            id="shareInCollaborative"
                            checked={formData.shareInCollaborative}
                            onChange={(e) => setFormData(prev => ({ ...prev, shareInCollaborative: e.target.checked }))}
                            className="h-4 w-4 text-black focus:ring-0 border-gray-300 rounded-none"
                          />
                          <label htmlFor="shareInCollaborative" className="text-black font-light text-sm tracking-wide">
                            Collaborative Sharing
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Provenance */}
                {currentStep === 4 && (
                  <div className="space-y-12">
                    <div className="border-b border-gray-100 pb-8">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">04</div>
                      <h2 className="text-4xl font-light text-black tracking-tight">Provenance</h2>
                    </div>

                    {isHeldPlus(user) ? (
                      <ProvenanceSection 
                        data={{
                          serialNumber: formData.serialNumber,
                          acquisitionDate: formData.acquisitionDate,
                          certificateOfAuthenticity: formData.certificateOfAuthenticity,
                          certificateImage: formData.certificateImage,
                          certificateUrl: formData.certificateUrl,
                          origin: formData.origin,
                          transferMethod: formData.transferMethod,
                          associatedDocuments: Array.isArray(formData.associatedDocuments) 
                            ? formData.associatedDocuments 
                            : [],
                          provenanceNotes: formData.provenanceNotes,
                          chain: Array.isArray(formData.chain) 
                            ? formData.chain 
                            : []
                        }}
                        onChange={(provenanceData) => {
                          setFormData(prev => ({
                            ...prev,
                            ...provenanceData,
                            associatedDocuments: Array.isArray(provenanceData.associatedDocuments) 
                              ? provenanceData.associatedDocuments
                              : []
                          }));
                        }}
                      />
                    ) : (
                      <ProvenanceUpsell />
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="bg-white border-t border-gray-100 px-16 py-12 flex justify-between items-center">
                {currentStep === 1 ? (
                  <div></div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    className="flex items-center gap-3 border-black text-black hover:bg-black hover:text-white rounded-none font-light tracking-wide px-8 py-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}

                <div className="text-xs font-medium tracking-widest uppercase text-gray-400">
                  {String(currentStep).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
                </div>

                {currentStep === steps.length ? (
                  <Button 
                    type="submit" 
                    disabled={loading || !canProceed()}
                    className="bg-black hover:bg-gray-800 text-white font-light tracking-wide px-12 py-3 rounded-none"
                  >
                    {loading ? 'Processing...' : 'Submit Entry'}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-black hover:bg-gray-800 text-white font-light tracking-wide flex items-center gap-3 px-8 py-3 rounded-none"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
