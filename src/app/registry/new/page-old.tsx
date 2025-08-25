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
    shareInCollaborative: false, // New field
  });

  const [newTag, setNewTag] = useState('');

  const steps = [
    { 
      id: 1, 
      title: "What's Your Treasure?", 
      subtitle: "Tell us about this amazing thing you own",
      icon: Heart,
      color: "bg-rose-500"
    },
    { 
      id: 2, 
      title: "Show It Off!", 
      subtitle: "Pictures make everything better",
      icon: Camera,
      color: "bg-blue-500"
    },
    { 
      id: 3, 
      title: "The Details", 
      subtitle: "What makes this special?",
      icon: Sparkles,
      color: "bg-purple-500"
    },
    { 
      id: 4, 
      title: "Provenance Power", 
      subtitle: "Document its story (Premium)",
      icon: Zap,
      color: "bg-amber-500"
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
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        if (err.stack) console.error('Stack:', err.stack);
      } else {
        console.error('Error details:', JSON.stringify(err));
      }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="held-container py-8">
        {/* Fun Header */}
        <div className="text-center mb-12">
          <Button variant="ghost" asChild className="absolute top-8 left-8">
            <Link href="/registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registry
            </Link>
          </Button>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4" />
            Add Something Amazing
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
            Let's Add Your Treasure
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every object has a story. Let's tell yours in style.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 text-white scale-110' 
                        : isActive 
                        ? `${step.color} text-white scale-110 shadow-lg`
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                    </div>
                    <div className="text-center mt-2">
                      <div className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 max-w-24">
                        {step.subtitle}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                      completedSteps.has(step.id) ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Step Content */}
              <div className="p-8">
                {/* Step 1: What's Your Treasure? */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                    <div className="text-center">
                      <Heart className="h-16 w-16 text-rose-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">What's Your Treasure?</h2>
                      <p className="text-gray-600">Give your precious object a name and tell us what kind of amazing thing it is!</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-lg font-semibold text-gray-900 mb-3">
                          What should we call this beauty? ✨
                        </label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          placeholder="My Amazing Vintage Guitar"
                          className="text-lg py-4 border-2 border-gray-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                        <p className="text-sm text-gray-500 mt-2">💡 Make it personal! This is how you'll remember it.</p>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          What kind of treasure is it? 🏆
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { value: "Audio", emoji: "🎵", label: "Audio" },
                            { value: "Photography", emoji: "📸", label: "Photography" },
                            { value: "Art", emoji: "🎨", label: "Art" },
                            { value: "Design", emoji: "✨", label: "Design" },
                            { value: "Furniture", emoji: "🪑", label: "Furniture" },
                            { value: "Lighting", emoji: "💡", label: "Lighting" },
                            { value: "Technology", emoji: "💻", label: "Technology" },
                            { value: "Instruments", emoji: "🎸", label: "Instruments" },
                            { value: "Watches", emoji: "⌚", label: "Watches" },
                            { value: "Fashion", emoji: "👗", label: "Fashion" },
                            { value: "Books", emoji: "📚", label: "Books" },
                            { value: "Miscellaneous", emoji: "🌟", label: "Other" }
                          ].map((category) => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                                formData.category === category.value
                                  ? 'border-rose-400 bg-rose-50 shadow-lg'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="text-2xl mb-2">{category.emoji}</div>
                              <div className="text-sm font-medium text-gray-700">{category.label}</div>
                            </button>
                          ))}
                        </div>
                        {formData.category && (
                          <p className="text-sm text-green-600 mt-3 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Perfect choice! Let's continue.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Show It Off! */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Show It Off!</h2>
                      <p className="text-gray-600">Pictures make everything better. Upload some photos to show off your treasure!</p>
                    </div>

                    <div className="space-y-6">

              {/* Year and Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      year: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 1956"
                  />
                </div>
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      value: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 5000.00"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    condition: e.target.value as CreateObjectData["condition"] 
                  }))}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes about this object..."
                  rows={4}
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload images of your object
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          width={256}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public/Private */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this object public (creates a shareable passport)
                </label>
              </div>

              {/* Share in theCollaborative */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shareInCollaborative"
                  checked={formData.shareInCollaborative}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareInCollaborative: e.target.checked }))}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="shareInCollaborative" className="text-sm text-gray-700">
                  Share this object in theCollaborative
                </label>
              </div>
              {/* Held+ Provenance Section */}
              {isHeldPlus(user) ? (
                <div className="mt-8">
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
                </div>
              ) : (
                <div className="mt-8">
                  <ProvenanceUpsell />
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Add Object'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/registry">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
