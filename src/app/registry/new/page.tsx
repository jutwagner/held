'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isHeldPlus } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Switch from '@/components/ui/switch';
import { createObject, updateObjectAnchoring, subscribeObjects, FREE_REGISTRY_OBJECT_LIMIT } from '@/lib/firebase-services';
import { anchorPassport, generatePassportURI } from '@/lib/blockchain-services';
import { CreateObjectData } from '@/types';
import { ArrowLeft, Upload, X, Plus, Sparkles, Camera, Heart, Zap, ChevronRight, ChevronLeft, Check, Music2, Image as ImageIcon, Palette, Package, Lamp, Cpu, Guitar, Clock3, Book, Shapes, Tag, Archive } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProvenanceUpsell from '@/components/ProvenanceUpsell';
import CascadingSelect from '@/components/CascadingSelect';
import MigrationButton from '@/components/MigrationButton';
import ImageEditorModal from '@/components/images/ImageEditorModal';

import ProvenanceSection from '@/components/ProvenanceSection';

function ObjectImagePreview({
  file,
  index,
  onEdit,
  onRemove,
}: {
  file: File;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="relative group rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-gray-700/20 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      {previewUrl ? (
        <img src={previewUrl} alt={`Image ${index + 1}`} className="w-full h-56 md:h-64 object-contain bg-gray-900/5" />
      ) : (
        <div className="w-full h-56 md:h-64 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">Loading…</div>
      )}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(index)}
          className="px-2 py-1 text-xs rounded-md bg-white/90 text-gray-700 shadow hover:bg-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="px-2 py-1 text-xs rounded-md bg-red-500 text-white shadow hover:bg-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function NewObjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [objectCount, setObjectCount] = useState(0);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [initialCountResolved, setInitialCountResolved] = useState(false);
  const isPlusMember = isHeldPlus(user);
  const LIMIT_MESSAGE = `Upgrade to Held+ to add more than ${FREE_REGISTRY_OBJECT_LIMIT} registry items.`;
  const shouldBlockForLimit = !isPlusMember && initialCountResolved && objectCount >= FREE_REGISTRY_OBJECT_LIMIT;
  const isCheckingLimit = !isPlusMember && !initialCountResolved;

  // Get contextual label for brand/maker field based on category
  const getBrandLabel = (category: string) => {
    switch (category) {
      case 'Art': return 'Artist';
      case 'Music': return 'Artist/Band';
      case 'Photography': return 'Photographer';
      case 'Books': return 'Author';
      case 'Fashion': return 'Designer/Brand';
      case 'Furniture': return 'Designer/Manufacturer';
      case 'Lighting': return 'Designer/Manufacturer';
      case 'Movie': return 'Director/Studio';
      case 'Ephemera': return 'Creator/Publisher';
      case 'Industrial Design': return 'Designer/Manufacturer';
      default: return 'Manufacturer';
    }
  };
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
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    brand?: string;
    category?: string;
    brandConfidence?: number;
    categoryConfidence?: number;
    error?: string;
    debug?: any;
  } | null>(null);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editorQueue, setEditorQueue] = useState<File[]>([]);
  const [editorQueueIndex, setEditorQueueIndex] = useState(0);
  const [editorReplaceIndex, setEditorReplaceIndex] = useState<number | null>(null);

  const [newTag, setNewTag] = useState('');
  
  // Cascading select states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [showCascadingSelect, setShowCascadingSelect] = useState(false);

  // Handle cascading select changes - memoized to prevent infinite loops
  const handleCascadingSelectChange = useCallback((category: string, brand: string, item: string) => {
    setSelectedCategory(category);
    setSelectedBrand(brand);
    setSelectedItem(item);
    
    // Update form data - auto-generate title from brand and item
    setFormData(prev => {
      const currentTitle = prev.title.trim();
      let newTitle = currentTitle;
      
      // If both brand and item are present, use "Brand, Item" format
      if (brand && item) {
        newTitle = `${brand}, ${item}`;
      } else if (item) {
        // If only item is present, use just the item
        newTitle = item;
      } else if (brand) {
        // If only brand is present, use just the brand
        newTitle = brand;
      }
      // If neither brand nor item, keep current title
      
      return {
        ...prev,
        category: category,
        maker: brand,
        title: newTitle
      };
    });
  }, []);

  const closeEditor = () => {
    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorQueue([]);
    setEditorQueueIndex(0);
    setEditorReplaceIndex(null);
  };

  const advanceQueue = () => {
    if (editorReplaceIndex !== null) {
      closeEditor();
      return;
    }
    const nextIndex = editorQueueIndex + 1;
    if (nextIndex < editorQueue.length) {
      setEditorQueueIndex(nextIndex);
      setEditorFile(editorQueue[nextIndex]);
    } else {
      closeEditor();
    }
  };

  const openEditorWithFiles = (files: File[], replaceIndex: number | null = null) => {
    if (!files.length) {
      return;
    }
    setEditorQueue(files);
    setEditorQueueIndex(0);
    setEditorFile(files[0]);
    setEditorReplaceIndex(replaceIndex);
    setImageEditorOpen(true);
  };

  const processEditedFile = async (resultFile: File) => {
    let shouldAnalyze = false;
    setFormData(prev => {
      const nextImages = [...prev.images];
      if (editorReplaceIndex !== null && nextImages[editorReplaceIndex]) {
        nextImages[editorReplaceIndex] = resultFile;
        if (!analysisTriggered && editorReplaceIndex === 0) {
          shouldAnalyze = true;
        }
      } else {
        nextImages.push(resultFile);
        if (!analysisTriggered && prev.images.length === 0) {
          shouldAnalyze = true;
        }
      }
      return {
        ...prev,
        images: nextImages,
      };
    });

    if (shouldAnalyze) {
      try {
        await analyzeFirstImage(resultFile);
      } catch (error) {
        console.warn('Automated analysis failed:', error);
      } finally {
        setAnalysisTriggered(true);
      }
    }

    advanceQueue();
  };

  const handleEditorApply = async (file: File) => {
    await processEditedFile(file);
  };

  const handleEditorUseOriginal = async (file: File) => {
    await processEditedFile(file);
  };

  // Handle category box selection
  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setSelectedCategory(category);
    setShowCascadingSelect(true);
    // Reset brand and item when changing category
    setSelectedBrand('');
    setSelectedItem('');
    setFormData(prev => ({ ...prev, maker: '', title: '' }));
  };

  const steps = [
    { 
      id: 1, 
      title: "", 
      subtitle: "Visual record",
      icon: Camera,
      color: "bg-black"
    },
    { 
      id: 2, 
      title: "", 
      subtitle: "Basic information",
      icon: Heart,
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
        return formData.images.length > 0; // Photos are required for step 1
      case 2:
        return formData.category && formData.maker; // Category and maker required, title is optional
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

    if (!isPlusMember && objectCount >= FREE_REGISTRY_OBJECT_LIMIT) {
      setLimitMessage(LIMIT_MESSAGE);
      return;
    }

    if (!formData.category || !formData.maker) {
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
      const errorCode = typeof err === 'object' && err && 'code' in err ? (err as { code?: string }).code : undefined;
      if (errorCode === 'REGISTRY_FREE_LIMIT_REACHED' || (err instanceof Error && err.message === 'REGISTRY_FREE_LIMIT_REACHED')) {
        setLimitMessage(LIMIT_MESSAGE);
      } else {
        alert('Failed to create object. See console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => 
      f.type.startsWith('image/') || 
      f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/)
    );

    if (files.length > 0) {
      openEditorWithFiles(files);
      // reset input value to allow re-uploading same file after editing
      e.target.value = '';
    }
  };

  const analyzeFirstImage = async (file: File) => {
    setAnalyzingImage(true);
    try {
      // Upload image to Firebase Storage first, then analyze via URL
      const { storage } = await import('@/lib/firebase');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      // Create a temporary reference for analysis
      const tempRef = ref(storage, `temp-analysis/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
      
      // Upload the file
      await uploadBytes(tempRef, file);
      
      // Get the public URL
      const publicUrl = await getDownloadURL(tempRef);
      
      // Analyze via URL
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        
        // Auto-fill form fields if confidence is high enough
        if (result.category && result.categoryConfidence && result.categoryConfidence > 0.5) {
          setFormData(prev => ({ ...prev, category: result.category }));
          setSelectedCategory(result.category);
          setShowCascadingSelect(true); // Automatically show the cascading select
        }
        
        if (result.brand && result.brandConfidence && result.brandConfidence > 0.6) {
          setFormData(prev => ({ ...prev, maker: result.brand }));
        }
      } else {
        // Handle API errors gracefully
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('Image analysis failed:', errorData.error);
        setAnalysisResult({ 
          error: errorData.error || 'Analysis failed',
          category: undefined,
          brand: undefined 
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisResult({ 
        error: 'Failed to analyze image',
        category: undefined,
        brand: undefined
      });
    } finally {
      setAnalyzingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const nextImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: nextImages,
    }));
    if (nextImages.length === 0) {
      setAnalysisTriggered(false);
      setAnalysisResult(null);
    }
  };

  const handleEditImage = (index: number) => {
    const target = formData.images[index];
    if (target instanceof File) {
      openEditorWithFiles([target], index);
    }
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
  
  // Count current user's items for plan limits and sale hints
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeObjects(user.uid, (list) => {
      setObjectCount(list.length);
      setInitialCountResolved(true);
      if (!isPlusMember && list.length >= FREE_REGISTRY_OBJECT_LIMIT) {
        setLimitMessage(LIMIT_MESSAGE);
      } else if (isPlusMember || list.length < FREE_REGISTRY_OBJECT_LIMIT) {
        setLimitMessage(null);
      }
      const count = list.filter(o => (o as any).openToSale === true).length;
      setForSaleCount(count);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.uid, isPlusMember]);

  useEffect(() => {
    if (shouldBlockForLimit) {
      setLimitMessage(LIMIT_MESSAGE);
    }
  }, [shouldBlockForLimit]);

  if (isCheckingLimit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-sm">Checking your registry...</div>
      </div>
    );
  }

  if (shouldBlockForLimit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="flex min-h-screen flex-col">
          <div className="held-container held-container-wide pt-8">
            <Button
              variant="ghost"
              asChild
              className="p-2 h-auto text-black dark:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/80 rounded-xl"
            >
              <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase">
                <ArrowLeft className="h-4 w-4" />
                Registry
              </Link>
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-10">
            <div className="w-full max-w-2xl">
              <div className="relative overflow-hidden rounded-[2.75rem] border border-gray-200/70 bg-white/90 p-12 text-center shadow-2xl backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/80">
                <div className="absolute inset-x-12 -top-32 h-56 bg-gradient-to-br from-black/10 via-gray-500/10 to-transparent blur-3xl dark:from-gray-100/10" aria-hidden="true" />
                <div className="relative">
                  <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full text-white">
                    <Image src="/img/registry.svg" alt="Registry" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif text-gray-900 dark:text-gray-50 tracking-tight">
                    Registry limit reached
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-200">
                    Free Held accounts can manage up to{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-50">{FREE_REGISTRY_OBJECT_LIMIT}</span>{' '}
                    registry items. Upgrade to Held+ for unlimited space, premium provenance tools, and the ability to share more of your collection.
                  </p>
                  <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button
                      asChild
                      className="w-full sm:w-auto rounded-full bg-black px-7 py-3 text-base font-medium text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black/85 focus-visible:outline-none dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      <Link href="/settings/premium">Upgrade to Held+</Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full sm:w-auto rounded-full border border-transparent px-7 py-3 text-base font-medium text-gray-700 transition hover:border-black/40 hover:text-black dark:text-gray-200 dark:hover:border-gray-200/60 dark:hover:text-gray-50"
                    >
                      <Link href="/registry">Back to registry</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ImageEditorModal
        open={imageEditorOpen}
        file={editorFile}
        fileName={editorFile?.name}
        onClose={closeEditor}
        onApply={handleEditorApply}
        onUseOriginal={handleEditorUseOriginal}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="held-container held-container-wide py-8">
        {/* Header */}
        <div className="max-w-none mx-auto">
          <div className="flex items-center justify-between mb-15">
            <Button variant="ghost" asChild className="p-2 h-auto text-black dark:text-gray-100 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase">
                <ArrowLeft className="h-4 w-4" />
                Registry
              </Link>
            </Button>
    
          </div>
          
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-light text-black dark:text-gray-100 dark:text-gray-100 mb-2 tracking-tighter leading-none">
              Add New
            </h1>
          </div>

          {/* Temporary Migration Button - Remove after migration is complete */}
          {/*
          <div className="mb-8">
            <MigrationButton />
          </div>
          */}

        
        </div>

        {limitMessage && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
              {limitMessage}
            </div>
          </div>
        )}

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
                    <React.Fragment key={`step-${step.id}`}>
                      <div className={`relative z-10 flex items-center justify-center w-6 h-6 md:w-6 md:h-6 rounded-full transition-colors ${
                        isCompleted ? 'bg-black dark:bg-gray-100 text-white dark:text-gray-900' : isActive ? 'bg-white dark:bg-gray-800 ring-2 ring-black dark:ring-gray-300 text-black dark:text-gray-100 dark:text-gray-100' : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500'
                      }`}>
                        {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-sm">{step.id}</span>}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 md:mx-2 ${step.id < currentStep ? 'bg-black dark:bg-gray-100' : 'text-sm bg-gray-200 dark:bg-gray-700'}`} />
                      )}
                    </React.Fragment>
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
                      <div className={`text-xs md:text-sm font-medium text-center ${isActive || isCompleted ? 'text-black dark:text-gray-100 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>{step.title}</div>
                      {isProvenanceDisabled && (
                        <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20">Held+ Only</div>
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
                    <div className="border-b border-gray-100 dark:border-gray-800 dark:border-gray-800 pb-4">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">01</div>
                      <h2 className="text-4xl font-light text-black dark:text-gray-100 dark:text-gray-100 tracking-tight">Photos</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">Add clear photos. The first will be used as the cover.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        {/* Image Upload Area */}
                        <div
                          className={`relative rounded-2xl border-2 border-dashed ${dragActive ? 'border-black dark:border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900'} px-8 sm:px-12 py-14 text-center transition-all duration-200 shadow-sm hover:shadow-lg min-h-[220px]`}
                          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setDragActive(false);
                            const files = Array.from(e.dataTransfer?.files || []).filter(f => 
                              f.type.startsWith('image/') || 
                              f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/)
                            );
                            if (files.length) {
                              openEditorWithFiles(files);
                            }
                          }}
                          onPaste={async (e) => {
                            const items = Array.from(e.clipboardData?.items || []);
                            const images = items.map(i => i.type?.startsWith('image/') ? i.getAsFile() : null).filter(Boolean) as File[];
                            if (images.length) {
                              openEditorWithFiles(images.filter(Boolean) as File[]);
                            }
                          }}
                        >
                          <div className="mb-2 flex items-center justify-center">
                            <div className="w-14 h-14  text-gray-500 dark:text-gray-400 dark:text-gray-500 flex items-center justify-center">
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
                          <h3 className="text-xl sm:text-2xl font-light tracking-tight text-black dark:text-gray-100 dark:text-gray-100">Add photos</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Drag & drop, paste from clipboard, or select files</p>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.heic,.heif"
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
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-10">JPG, PNG, HEIC • up to 10MB each</span>
                          {dragActive && (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-black/30"></div>
                          )}
                        </div>

                        {/* Analysis Status */}
                        {analyzingImage && (
                          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                Analyzing image with AI...
                              </span>
                            </div>
                          </div>
                        )}

                        {analysisResult && !analyzingImage && (
                          <div className={`mt-6 p-4 rounded-lg ${
                            analysisResult.error 
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          }`}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                analysisResult.error ? 'bg-red-500' : 'bg-green-500'
                              }`}>
                                {analysisResult.error ? (
                                  <X className="h-3 w-3 text-white" />
                                ) : (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className={`text-sm font-medium ${
                                analysisResult.error 
                                  ? 'text-red-700 dark:text-red-300'
                                  : 'text-green-700 dark:text-green-300'
                              }`}>
                                {analysisResult.error ? 'AI Analysis Failed' : 'AI Analysis Complete'}
                              </span>
                            </div>
                            {analysisResult.error ? (
                              <div className="text-sm text-red-600 dark:text-red-400">
                                {analysisResult.error}
                              </div>
                            ) : (
                              <div className="text-sm text-green-600 dark:text-green-400">
                                {analysisResult.category && (
                                  <div className="mb-2">
                                    <span className="font-medium">Category: {analysisResult.category}</span>
                                    {analysisResult.categoryConfidence && (
                                      <span className="ml-2 text-xs opacity-75">
                                        ({Math.round(analysisResult.categoryConfidence * 100)}% confidence)
                                      </span>
                                    )}
                                  </div>
                                )}
                                {analysisResult.brand && (
                                  <div className="mb-2">
                                    <span className="font-medium">Brand: {analysisResult.brand}</span>
                                    {analysisResult.brandConfidence && (
                                      <span className="ml-2 text-xs opacity-75">
                                        ({Math.round(analysisResult.brandConfidence * 100)}% confidence)
                                      </span>
                                    )}
                                  </div>
                                )}
                                {analysisResult.debug && (
                                  <details className="mt-2 text-xs">
                                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                      Debug Info
                                    </summary>
                                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                                      {JSON.stringify(analysisResult.debug, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Image Preview */}

                        {formData.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-10">
                            {formData.images.map((image, index) => (
                              image instanceof File ? (
                                <ObjectImagePreview
                                  key={`${index}-${image.name}`}
                                  file={image}
                                  index={index}
                                  onEdit={handleEditImage}
                                  onRemove={removeImage}
                                />
                              ) : null
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Basic Information */}
                {currentStep === 2 && (
                  <div className="space-y-12">
                    <div className="border-b border-gray-100 dark:border-gray-800 dark:border-gray-800 pb-4">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">02</div>
                      <h2 className="text-4xl font-light text-black dark:text-gray-100 dark:text-gray-100 tracking-tight">Basic Information</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">Tell us about your item.</p>
                    </div>
                    <div className="space-y-12">

                      {/* AI Category Suggestion */}
                      {analysisResult && analysisResult.category && !analysisResult.error && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                  AI Auto-Selected: {analysisResult.category}
                                </span>
                                {analysisResult.categoryConfidence && (
                                  <span className="ml-2 text-xs opacity-75">
                                    ({Math.round(analysisResult.categoryConfidence * 100)}% confidence)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAnalysisResult(null);
                                setShowCascadingSelect(false);
                                setFormData(prev => ({ ...prev, category: '', maker: '', title: '' }));
                                setSelectedCategory('');
                                setSelectedBrand('');
                                setSelectedItem('');
                              }}
                              className="px-3 py-1 bg-black dark:bg-gray-700 text-white dark:text-black text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Choose Different
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Category Selection or Cascading Select */}
                      {!showCascadingSelect && !(analysisResult && analysisResult.category && !analysisResult.error) ? (
                        <div>
                          <label className="block text-xs font-medium text-black dark:text-gray-100 dark:text-gray-100 mb-6 uppercase tracking-widest">
                            Category
                          </label>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                            {[
                              { name: 'Art', Icon: 'art.svg' },
                              { name: 'Auto', Icon: Package },
                              { name: 'Bicycle', Icon: 'bike.svg' },
                              { name: 'Books', Icon: Book },
                              { name: 'Ephemera', Icon: Archive },
                              { name: 'Everyday Carry', Icon: 'everyday-carry.svg' },
                              { name: 'Fashion', Icon: Tag },
                              { name: 'Furniture', Icon: Shapes },
                              { name: 'HiFi', Icon: Music2 },
                              { name: 'Industrial Design', Icon: Package },
                              { name: 'Instruments', Icon: Guitar },
                              { name: 'Lighting', Icon: Lamp },
                              { name: 'Miscellaneous', Icon: Shapes },
                              { name: 'Moto', Icon: Package },
                              { name: 'Movie', Icon: ImageIcon },
                              { name: 'Music', Icon: 'music.svg' },
                              { name: 'Photography', Icon: 'photography.svg' },
                              { name: 'Tech', Icon: Cpu },
                              { name: 'Timepieces', Icon: 'timepieces.svg' },
                              { name: 'Toys', Icon: 'toys.svg' },
                            ].map(({ name, Icon }) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleCategorySelect(name)}
                                className="group flex flex-col items-center justify-center rounded-xl border transition-all duration-200 aspect-square p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <span className="flex items-center justify-center rounded-full w-20 h-20 sm:w-22 sm:h-22 mb-2">
                                  {typeof Icon === 'string' ? (
                                    <Image 
                                      src={`/cats/${Icon}`} 
                                      alt={name} 
                                      width={24} 
                                      height={24} 
                                      className="w-25 h-25 sm:w-24 sm:h-24" 
                                    />
                                  ) : (
                                    <Icon className="text-gray-600 dark:text-gray-300 w-25 h-25 sm:w-25 sm:h-25" />
                                  )}
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-center leading-snug text-gray-800 dark:text-gray-200">
                                  {name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {formData.category}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Select brand and item, or add your own
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setShowCascadingSelect(false);
                                setFormData(prev => ({ ...prev, category: '', maker: '', title: '' }));
                                setSelectedCategory('');
                                setSelectedBrand('');
                                setSelectedItem('');
                              }}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                              Change category
                            </button>
                          </div>
                          <CascadingSelect 
                            onSelectionChange={handleCascadingSelectChange}
                            className="transition-shadow"
                            preSelectedCategory={formData.category}
                          />
                          
                          {/* Name field - positioned after brand/maker selection */}
                          <div className="mt-8 transition-shadow">
                            <label htmlFor="title" className="block text-xs font-medium text-black dark:text-gray-100 dark:text-gray-100 mb-3 uppercase tracking-widest">
                              Name <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                            </label>
                            <div className="focus-within:ring-2 focus-within:ring-black/80 rounded-md">
                              <Input
                                id="title"
                                ref={titleRef as any}
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder={selectedItem ? `${selectedBrand ? selectedBrand + ', ' : ''}${selectedItem}` : "Leave empty to auto-generate from brand and item"}
                                className="text-3xl sm:text-4xl md:text-5xl leading-tight h-auto py-2 pb-3 border-0 border-b-2 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-gray-300 focus:ring-0 rounded-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Specifications */}
                {currentStep === 3 && (
                  <div className="space-y-12">
                    <div className="border-b border-gray-100 dark:border-gray-800 dark:border-gray-800 pb-8">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">03</div>
                      <h2 className="text-4xl font-light text-black dark:text-gray-100 dark:text-gray-100 tracking-tight">Specifications</h2>
                    </div>

                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                          <label className="block text-xs font-medium text-black dark:text-gray-100 dark:text-gray-100 mb-4 uppercase tracking-widest">
                            {getBrandLabel(formData.category)}
                          </label>
                          <Input
                            value={formData.maker}
                            onChange={(e) => setFormData(prev => ({ ...prev, maker: e.target.value }))}
                            placeholder={formData.category === 'Art' ? 'Van Gogh' : formData.category === 'Music' ? 'The Beatles' : formData.category === 'Books' ? 'J.K. Rowling' : 'Herman Miller'}
                            className="text-xl py-6 border-0 border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-gray-300 focus:ring-0 rounded-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-black dark:text-gray-100 dark:text-gray-100 mb-4 uppercase tracking-widest">
                            Year of Production
                          </label>
                          <Input
                            type="number"
                            value={formData.year || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : undefined }))}
                            placeholder="1956"
                            className="text-xl py-6 border-0 border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-gray-300 focus:ring-0 rounded-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black dark:text-gray-100 mb-6 uppercase tracking-widest">
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
                              className={`py-4 px-6 border border-gray-200 dark:border-gray-700 rounded-sm transition-all duration-150 ${
                                formData.condition === condition.value
                                  ? 'border-black bg-black text-white'
                                  : 'bg-white dark:bg-gray-800 text-black dark:text-gray-100 hover:border-gray-400'
                              }`}
                            >
                              <div className="text-sm font-light tracking-wide">{condition.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black dark:text-gray-100 mb-6 uppercase tracking-widest">
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
                          <Button type="button" onClick={addTag} variant="outline" className="border-black text-black dark:text-gray-100 hover:bg-black hover:text-white rounded-sm font-light">
                            Add
                          </Button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {formData.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-2 bg-gray-100 text-black dark:text-gray-100 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-black dark:text-gray-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black dark:text-gray-100 mb-6 uppercase tracking-widest">
                          Additional Notes
                        </label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Technical specifications, historical context, acquisition details..."
                          rows={6}
                          className="resize-none border border-gray-200 dark:border-gray-700 focus:border-black focus:ring-0 rounded-none bg-transparent placeholder-gray-400 text-base leading-relaxed"
                        />
                      </div>

                      <div className="space-y-6 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between px-3 py-3">
                          <label className="text-black dark:text-gray-100 font-light text-sm tracking-wide">Public</label>
                          <Switch
                            ariaLabel="Toggle Public"
                            checked={!!formData.isPublic}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between px-3 py-3">
                          <label className="text-black dark:text-gray-100 font-light text-sm tracking-wide">Collaborative</label>
                          <Switch
                            ariaLabel="Toggle Collaborative Sharing"
                            checked={!!formData.shareInCollaborative}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, shareInCollaborative: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between px-3 py-3">
                          <label className="text-black dark:text-gray-100 font-light text-sm tracking-wide">Open to sale</label>
                          <div className="flex items-center gap-3">
                            {!isHeldPlus(user) && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{Math.max(0, 3 - forSaleCount)} remaining on free plan</span>
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
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-8">
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-2">04</div>
                      <h2 className="text-4xl font-light text-black dark:text-gray-100 tracking-tight">Provenance</h2>
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
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-black dark:text-gray-100 mb-2">Blockchain Anchoring</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Anchor this Passport on the Polygon blockchain for immutable provenance verification
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                id="anchorOnChain"
                                checked={formData.anchorOnChain || false}
                                onChange={(e) => setFormData(prev => ({ ...prev, anchorOnChain: e.target.checked }))}
                                className="h-4 w-4 text-black dark:text-gray-100 focus:ring-0 border-gray-300 rounded-none"
                              />
                              <label htmlFor="anchorOnChain" className="text-black dark:text-gray-100 font-light text-sm tracking-wide">
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
                    className="flex items-center gap-3 border-black text-black dark:text-gray-100 hover:bg-black hover:text-white rounded-sm font-light tracking-wide px-8 py-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}

                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-gray-500">
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
  </>
  );
}
