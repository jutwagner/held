'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isHeldPlus } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Switch from '@/components/ui/switch';
import { createObject, updateObjectAnchoring, subscribeObjects } from '@/lib/firebase-services';
import { anchorPassport, generatePassportURI } from '@/lib/blockchain-services';
import { CreateObjectData } from '@/types';
import { ArrowLeft, Upload, X, Plus, Sparkles, Camera, Heart, Zap, ChevronRight, ChevronLeft, Check, Music2, Image as ImageIcon, Palette, Package, Lamp, Cpu, Guitar, Clock3, Book, Shapes, Tag, Archive } from 'lucide-react';
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
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

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
    openToSale: false,
  });
  const [forSaleCount, setForSaleCount] = useState(0);

  const [newTag, setNewTag] = useState('');

  const steps = [
    { 
      id: 1, 
      title: "", 
      subtitle: "Basic information",
      icon: Heart,
      color: "bg-black"
    },
    { 
      id: 2, 
      title: "", 
      subtitle: "Visual record",
      icon: Camera,
      color: "bg-black"
    },
    { 
      id: 3, 
      title: "", 
      subtitle: "Technical details",
      icon: Sparkles,
      color: "bg-black"
    },
    { 
      id: 4, 
      title: "", 
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

      // Auto-anchor core fields on Polygon for all users (async mode)
      try {
        const baseURL = window.location.origin;
        const uri = generatePassportURI(result as any, baseURL);
        const anchorRes = await anchorPassport(result as any, uri, 1, 'core', 'async');
        // Mark as pending locally; background worker will flip to confirmed
        await updateObjectAnchoring((result as any).id, {
          isAnchored: false,
          version: 1,
          txHash: anchorRes.txHash,
          digest: anchorRes.digest,
          uri,
        } as any);
      } catch (anchorErr) {
        console.warn('Auto-anchor failed (non-blocking):', anchorErr);
      }

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
  } 
  
  // Smooth auto-focus on the name field
  useEffect(() => {
    const t = setTimeout(() => {
      try { titleRef.current?.focus(); } catch {}
    }, 100);
    return () => clearTimeout(t);
  }, []);
  
  // Count current user's for-sale items to hint limits
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeObjects(user.uid, (list) => {
      const count = list.filter(o => (o as any).openToSale === true).length;
      setForSaleCount(count);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="held-container held-container-wide py-8">
        {/* Header */}
        <div className="max-w-none mx-auto">
          <div className="flex items-center justify-between mb-16">
            <Button variant="ghost" asChild className="p-2 h-auto text-black hover:bg-gray-100 rounded-lg">
              <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase">
                <ArrowLeft className="h-4 w-4" />
                Registry
              </Link>
            </Button>
    
          </div>
          
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-light text-black mb-2 tracking-tighter leading-none">
              Add New
            </h1>
          </div>


          
        </div>

        {/* Progress Indicator */}
        <div className="max-w-sm mx-auto mb-12 md:mb-5">
          <div className="-mx-2 px-2">
            <div className="w-md">
              {/* Row 1: circles + connectors spanning full width */}
              <div className="flex items-center w-full mb-12 ">
                {steps.map((step, idx) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = completedSteps.has(step.id) || step.id < currentStep;
                  return (
                    <>
                      <div key={`c-${step.id}`} className={`relative z-10 flex items-center justify-center w-6 h-6 md:w-6 md:h-6 rounded-full transition-colors ${
                        isCompleted ? 'bg-black text-white' : isActive ? 'bg-white ring-2 ring-black text-black' : 'bg-white border-2 border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? <Check className="h-6 w-6" /> : <span className="text-sm">{step.id}</span>}
                      </div>
                      {idx < steps.length - 1 && (
                        <div key={`conn-${step.id}`} className={`flex-1 h-0.5 mx-3 md:mx-4 ${step.id < currentStep ? 'bg-black' : 'text-sm bg-gray-200'}`} />
                      )}
                    </>
                  );
                })}
              </div>
              {/* Row 2: labels centered under each circle */}
              <div className="flex justify-between mt-2">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = completedSteps.has(step.id) || step.id < currentStep;
                  const isProvenanceStep = step.id === 4;
                  const isUserPremium = isHeldPlus(user);
                  const isProvenanceDisabled = isProvenanceStep && !isUserPremium;
                  return (
                    <div key={`lbl-${step.id}`} className="flex flex-col items-center" style={{ width: '2.25rem' /* matches w-9 */ }}>
                      <div className={`text-xs md:text-sm font-medium text-center ${isActive || isCompleted ? 'text-black' : 'text-gray-500'}`}>{step.title}</div>
                      {isProvenanceDisabled && (
                        <div className="mt-1 text-[10px] text-amber-600 rounded-full px-2 py-0.5 bg-amber-50">Held+ Only</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-none mx-auto">
          <div className="">
            <form onSubmit={handleSubmit}>
              {/* Step Content */}
              <div className="">
                {/* Step 1: Identification */}
                {currentStep === 1 && (
                  <div className="space-y-12">
                    <div className="space-y-12">
                      <div className="transition-shadow">
                        <label htmlFor="title" className="block text-xs font-medium text-black mb-3 uppercase tracking-widest">
                          Name
                        </label>
                        <div className="focus-within:ring-2 focus-within:ring-black/80 rounded-md">
                          <Input
                            id="title"
                            ref={titleRef as any}
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            placeholder="What's the thing?"
                            className="text-3xl sm:text-4xl md:text-5xl leading-tight h-auto py-2 pb-3 border-0 border-b-2 border-gray-300 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400 transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black mb-6 uppercase tracking-widest">
                          Category
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                          {[
                            { name: 'Art', Icon: Palette },
                            { name: 'Books', Icon: Book },
                            { name: 'Electronics', Icon: Cpu },
                            { name: 'Fashion', Icon: Tag },
                            { name: 'Furniture', Icon: Shapes },
                            { name: 'HiFi', Icon: Music2 },
                            { name: 'Industrial Design', Icon: Package },
                            { name: 'Instruments', Icon: Guitar },
                            { name: 'Lighting', Icon: Lamp },
                            { name: 'Miscellaneous', Icon: Shapes },
                            { name: 'Music', Icon: Music2 },
                            { name: 'Photography', Icon: ImageIcon },
                            { name: 'Tech', Icon: Cpu },
                            { name: 'Timepieces', Icon: Clock3 },
                            { name: 'Vintage', Icon: Archive },
                          ].map(({ name, Icon }) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category: name }))}
                              className={`group flex flex-col items-center justify-center rounded-xl border transition-all duration-200 aspect-square p-3 ${
                                formData.category === name
                                  ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                                  : 'bg-white border-gray-200 text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <span className={`flex items-center justify-center rounded-full w-10 h-10 sm:w-12 sm:h-12 mb-2 ${
                                formData.category === name ? 'bg-white/10' : 'bg-gray-100'
                              }`}>
                                <Icon className={`${formData.category === name ? 'text-white' : 'text-gray-600'} w-5 h-5 sm:w-6 sm:h-6`} />
                              </span>
                              <span className={`text-xs sm:text-sm font-medium text-center leading-snug ${
                                formData.category === name ? 'text-white' : 'text-gray-800'
                              }`}>
                                {name}
                              </span>
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
                    <div className="border-b border-gray-100 pb-4">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">02</div>
                      <h2 className="text-4xl font-light text-black tracking-tight">Photos</h2>
                      <p className="text-sm text-gray-500 mt-2">Add clear photos. The first will be used as the cover.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        {/* Image Upload Area */}
                        <div
                          className={`relative rounded-2xl border-2 border-dashed ${dragActive ? 'border-black bg-gray-50' : 'border-gray-300 bg-gradient-to-b from-white to-gray-50'} px-8 sm:px-12 py-14 text-center transition-all duration-200 shadow-sm hover:shadow-lg min-h-[220px]`}
                          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragActive(false);
                            const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
                            if (files.length) setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
                          }}
                          onPaste={(e) => {
                            const items = Array.from(e.clipboardData?.items || []);
                            const images = items.map(i => i.type?.startsWith('image/') ? i.getAsFile() : null).filter(Boolean) as File[];
                            if (images.length) setFormData(prev => ({ ...prev, images: [...prev.images, ...images] }));
                          }}
                        >
                          <div className="mb-2 flex items-center justify-center">
                            <div className="w-14 h-14  text-gray-500 flex items-center justify-center">
                              <svg className="w-7 h-7 opacity-20"  id="Layer_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 44.8 44.8">
                                <path d="M25.9,14.7L17.7.6C10.1,2.2,4,7.6,1.4,14.7h24.5Z"/>
                                <path d="M30.8,21.6l8.2-14.2C34.9,2.9,29,0,22.4,0s-2.6,0-3.8.3l12.2,21.3Z"/>
                                <path d="M43.7,29.3c.7-2.2,1.1-4.5,1.1-6.9,0-5.4-1.9-10.4-5.2-14.3l-12.2,21.2h16.3Z"/>
                                <path d="M13.9,23.3l-8.2,14.1c4.1,4.5,10,7.4,16.6,7.4s2.6,0,3.8-.3l-12.2-21.2Z"/>
                                <path d="M17.4,15.5H1.1c-.7,2.2-1.1,4.5-1.1,6.9,0,5.4,1.9,10.4,5.2,14.3l12.2-21.2Z"/>
                                <path d="M18.9,30.2l8.2,14.1c7.6-1.6,13.7-7,16.3-14.1h-24.5Z"/>
                              </svg>
                            </div>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-light tracking-tight text-black">Add photos</h3>
                          <p className="text-sm text-gray-500 mt-1">Drag & drop, paste from clipboard, or select files</p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                            onChange={handleImageUpload}
                          />
                          <div className="mt-6 flex items-center justify-center gap-3">
                            <Button
                              type="button"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              className="bg-black text-white hover:bg-gray-800 rounded-md px-6 shadow mb-5"
                            >
                              Select images
                            </Button>
                          </div>
                            <span className="text-xs text-gray-500 mt-10">JPG, PNG, HEIC • up to 10MB each</span>
                          {dragActive && (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-black/30"></div>
                          )}
                        </div>

                        {/* Image Preview */}
                        {formData.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-10">
                            {formData.images.map((image, index) => (
                              <div key={index} className="relative group rounded-xl overflow-hidden ring-1 ring-black/5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <Image
                                  src={URL.createObjectURL(image)}
                                  alt={`Image ${index + 1}`}
                                  width={400}
                                  height={300}
                                  className="w-full h-56 md:h-64 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                {index === 0 ? (
                                  <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest bg-white/90 border border-gray-200 px-2 py-1 rounded">Cover</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => {
                                        const imgs = [...prev.images];
                                        const [picked] = imgs.splice(index, 1);
                                        return { ...prev, images: [picked, ...imgs] };
                                      });
                                    }}
                                    className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest bg-white/90 border border-gray-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Make cover
                                  </button>
                                )}
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
                              className={`py-4 px-6 border border-gray-200 rounded-sm transition-all duration-150 ${
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
                            className="flex-1 text-lg py-4 border-0 border-b border-gray-300 focus:border-black focus:ring-0 rounded-sm bg-transparent placeholder-gray-400"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} variant="outline" className="border-black text-black hover:bg-black hover:text-white rounded-sm font-light">
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
                        <div className="flex items-center justify-between px-3 py-3">
                          <label className="text-black font-light text-sm tracking-wide">Public</label>
                          <Switch
                            ariaLabel="Toggle Public"
                            checked={!!formData.isPublic}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between px-3 py-3">
                          <label className="text-black font-light text-sm tracking-wide">Collaborative</label>
                          <Switch
                            ariaLabel="Toggle Collaborative Sharing"
                            checked={!!formData.shareInCollaborative}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, shareInCollaborative: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between px-3 py-3">
                          <label className="text-black font-light text-sm tracking-wide">Open to sale</label>
                          <div className="flex items-center gap-3">
                            {!isHeldPlus(user) && (
                              <span className="text-xs text-gray-500">{Math.max(0, 3 - forSaleCount)} remaining on free plan</span>
                            )}
                            <Switch
                              ariaLabel="Toggle Open to sale"
                              checked={!!formData.openToSale}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, openToSale: checked }))}
                              disabled={!isHeldPlus(user) && forSaleCount >= 3 && !formData.openToSale}
                            />
                          </div>
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
                      <>
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
                        
                        {/* Blockchain Anchoring Option */}
                        <div className="border-t border-gray-100 pt-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-black mb-2">Blockchain Anchoring</h3>
                              <p className="text-sm text-gray-600">
                                Anchor this Passport on the Polygon blockchain for immutable provenance verification
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                id="anchorOnChain"
                                checked={formData.anchorOnChain || false}
                                onChange={(e) => setFormData(prev => ({ ...prev, anchorOnChain: e.target.checked }))}
                                className="h-4 w-4 text-black focus:ring-0 border-gray-300 rounded-none"
                              />
                              <label htmlFor="anchorOnChain" className="text-black font-light text-sm tracking-wide">
                                Anchor on Polygon
                              </label>
                            </div>
                          </div>
                          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-600 text-xs font-medium">ℹ</span>
                              </div>
                              <div className="text-sm text-purple-800">
                                <p className="font-medium mb-1">What is blockchain anchoring?</p>
                                <p className="text-purple-700">
                                  Your Passport data will be cryptographically hashed and stored on the Polygon blockchain, 
                                  creating an immutable record that can be verified by anyone. This ensures the authenticity 
                                  and provenance of your object can never be disputed.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <ProvenanceUpsell />
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="py-12 flex justify-between items-center">
                {currentStep === 1 ? (
                  <div></div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    className="flex items-center gap-3 border-black text-black hover:bg-black hover:text-white rounded-sm font-light tracking-wide px-8 py-3"
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
                ) : currentStep === 4 && !isHeldPlus(user) ? (
                  <Button 
                    type="submit" 
                    disabled={loading || !canProceed()}
                    className="bg-black hover:bg-gray-800 text-white font-light tracking-wide flex items-center gap-3 px-8 py-3 rounded-none"
                  >
                    {loading ? 'Processing...' : 'Skip & Submit Entry'}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-black hover:bg-gray-800 text-white font-light tracking-wide flex items-center gap-3 px-8 py-3 rounded-sm"
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
