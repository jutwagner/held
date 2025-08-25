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
      title: "What's Your Treasure?", 
      subtitle: "Name and category",
      icon: Heart,
      color: "bg-rose-500"
    },
    { 
      id: 2, 
      title: "Show It Off!", 
      subtitle: "Add some photos",
      icon: Camera,
      color: "bg-blue-500"
    },
    { 
      id: 3, 
      title: "The Details", 
      subtitle: "Tell us more",
      icon: Sparkles,
      color: "bg-purple-500"
    },
    { 
      id: 4, 
      title: "Provenance Power", 
      subtitle: "Document its story",
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
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Add some gorgeous photos 📸
                        </label>
                        
                        {/* Image Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">Drag & drop photos here, or click to browse</p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Photos
                          </Button>
                        </div>

                        {/* Image Preview */}
                        {formData.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                            {formData.images.map((image, index) => (
                              <div key={index} className="relative group">
                                <Image
                                  src={URL.createObjectURL(image)}
                                  alt={`Upload ${index + 1}`}
                                  width={200}
                                  height={200}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: The Details */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                    <div className="text-center">
                      <Sparkles className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">The Details</h2>
                      <p className="text-gray-600">Tell us what makes this special and add some personal touches!</p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-3">
                            Who made it? 🏭
                          </label>
                          <Input
                            value={formData.maker}
                            onChange={(e) => setFormData(prev => ({ ...prev, maker: e.target.value }))}
                            placeholder="e.g., Herman Miller, Apple, Vintage Co."
                            className="py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-3">
                            What year? 📅
                          </label>
                          <Input
                            type="number"
                            value={formData.year || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : undefined }))}
                            placeholder="e.g., 1960"
                            className="py-3"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          What condition is it in? ⭐
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { value: 'excellent', emoji: '✨', label: 'Excellent' },
                            { value: 'good', emoji: '👍', label: 'Good' },
                            { value: 'fair', emoji: '👌', label: 'Fair' },
                            { value: 'poor', emoji: '🔧', label: 'Needs Work' }
                          ].map((condition) => (
                            <button
                              key={condition.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, condition: condition.value as any }))}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                formData.condition === condition.value
                                  ? 'border-purple-400 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-xl mb-1">{condition.emoji}</div>
                              <div className="text-sm font-medium">{condition.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Add some tags 🏷️
                        </label>
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="vintage, rare, handmade..."
                            className="flex-1"
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
                                className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Tell us more about it! 💭
                        </label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="What makes this special? Any interesting stories? How did you get it?"
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={formData.isPublic}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isPublic" className="text-gray-700 font-medium">
                            🌍 Make this public (others can see it)
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="shareInCollaborative"
                            checked={formData.shareInCollaborative}
                            onChange={(e) => setFormData(prev => ({ ...prev, shareInCollaborative: e.target.checked }))}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="shareInCollaborative" className="text-gray-700 font-medium">
                            🤝 Share in theCollaborative
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Provenance Power */}
                {currentStep === 4 && (
                  <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                    <div className="text-center">
                      <Zap className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Provenance Power</h2>
                      <p className="text-gray-600">Document the complete story and history of your treasure!</p>
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
              <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </div>

                {currentStep === steps.length ? (
                  <Button 
                    type="submit" 
                    disabled={loading || !canProceed()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8"
                  >
                    {loading ? 'Creating...' : 'Create My Treasure! 🎉'}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold flex items-center gap-2"
                  >
                    Next Step
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
