'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';
import { HeldObject } from '@/types';
import { getObject, deleteObject, updateObject, uploadCOAImage, subscribeObject } from '@/lib/firebase-services';
import { formatCurrency } from '@/lib/utils';
import OwnerTools from '@/components/OwnerTools';
import ProvenanceSection from '@/components/ProvenanceSection';
import ProvenanceUpsell from '@/components/ProvenanceUpsell';
import DeleteDialog from '@/components/DeleteDialog';
import passportSvg from '@/img/passport.svg';
import ImageEditorModal from '@/components/images/ImageEditorModal';

type EditableImage = {
  id: string;
  preview: string;
  file?: File;
  originalUrl?: string;
};

export default function RegistryItemPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const objectId = String(params?.id || '');

  const [item, setItem] = useState<HeldObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
  const [editorIndex, setEditorIndex] = useState(0);
  const [editorReplaceId, setEditorReplaceId] = useState<string | null>(null);

  const imagesRef = useRef<EditableImage[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    return () => {
      imagesRef.current.forEach(image => {
        if (image.file && image.preview.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  type ProvenanceSectionKey = 'identity' | 'certificate' | 'chain';
  type ProvenanceFieldKey = 'serialNumber' | 'acquisitionDate' | 'certificateDetails' | 'chain-owner';

  type FormState = {
    title: string;
    category: string;
    description?: string;
    maker: string;
    year?: number;
    value?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    tags: string;
    notes: string;
    images: Array<string | File>;
    isPublic: boolean;
    shareInCollaborative: boolean;
    openToSale?: boolean;
    // Provenance
    serialNumber?: string;
    acquisitionDate?: string;
    certificateOfAuthenticity?: string;
    certificateUrl?: string;
    certificateImage?: string;
    origin?: string;
    transferMethod?: string;
    associatedDocuments?: string; // comma-separated for inline editor
    provenanceNotes?: string;
    chain?: Array<{ owner: string; acquiredAt?: string; notes?: string }>;
  };
  const [form, setForm] = useState<FormState | null>(null);

  const syncFormImages = useCallback((list: EditableImage[]) => {
    setForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        images: list.map(image => image.file ?? image.originalUrl ?? image.preview),
      };
    });
  }, [setForm]);

  const handleProvenanceShortcut = useCallback(
    (section: ProvenanceSectionKey, field?: ProvenanceFieldKey) => {
      const sectionSelectors: Record<ProvenanceSectionKey, string> = {
        identity: '[data-provenance-section="identity"]',
        certificate: '[data-provenance-section="certificate"]',
        chain: '[data-provenance-section="chain"]',
      };

      const fieldSelectors: Record<ProvenanceFieldKey, string> = {
        serialNumber: '[data-provenance-field="serialNumber"]',
        acquisitionDate: '[data-provenance-field="acquisitionDate"]',
        certificateDetails: '[data-provenance-field="certificateDetails"]',
        'chain-owner': '[data-provenance-field="chain-owner"]',
      };

      const focusTarget = () => {
        const fieldSelector = field ? fieldSelectors[field] : undefined;
        let fieldElement = fieldSelector ? (document.querySelector(fieldSelector) as HTMLElement | null) : null;
        if (!fieldElement && section === 'chain') {
          fieldElement = document.querySelector('[data-provenance-action="add-owner"]') as HTMLElement | null;
        }
        const sectionElement = document.querySelector(sectionSelectors[section]) as HTMLElement | null;
        const target = fieldElement || sectionElement;
        if (!target) return;

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (fieldElement && typeof fieldElement.focus === 'function') {
          try {
            (fieldElement as HTMLElement).focus({ preventScroll: true } as any);
          } catch {
            fieldElement.focus();
          }
        }
      };

      if (section === 'chain') {
        setForm(prev => {
          if (!prev) return prev;
          const existingChain = Array.isArray(prev.chain) ? prev.chain : [];
          if (existingChain.length > 0) {
            return prev;
          }
          return {
            ...prev,
            chain: [...existingChain, { owner: '', acquiredAt: '', notes: '' }],
          };
        });
      }

      if (!editing) {
        setEditing(true);
        setTimeout(() => {
          requestAnimationFrame(focusTarget);
        }, 220);
      } else {
        setTimeout(() => {
          requestAnimationFrame(focusTarget);
        }, 120);
      }
    },
    [editing]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const obj = await getObject(objectId);
        if (!active) return;
        setItem(obj);
        if (obj) {
          setForm({
            title: obj.title || '',
            category: obj.category || '',
            description: obj.description || '',
            maker: obj.maker || '',
            year: obj.year,
            value: obj.value,
            condition: (obj.condition as any) || 'good',
            tags: Array.isArray(obj.tags) ? obj.tags.join(', ') : '',
            notes: obj.notes || '',
            images: obj.images || [],
            isPublic: !!obj.isPublic,
            shareInCollaborative: !!obj.shareInCollaborative,
            serialNumber: obj.serialNumber || '',
            acquisitionDate: ((): string => {
              const d: any = (obj as any).acquisitionDate;
              try {
                if (!d) return '';
                if (typeof d === 'string') return d;
                if (d.seconds) return new Date(d.seconds * 1000).toISOString().slice(0, 10);
                const dt = new Date(d);
                if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
              } catch {}
              return '';
            })(),
            certificateOfAuthenticity: obj.certificateOfAuthenticity || '',
            certificateUrl: (obj as any).certificateUrl || '',
            certificateImage: (obj as any).certificateImage || '',
            origin: obj.origin || '',
            transferMethod: obj.transferMethod || '',
            associatedDocuments: Array.isArray(obj.associatedDocuments) ? obj.associatedDocuments.join(', ') : '',
            provenanceNotes: obj.provenanceNotes || '',
            openToSale: (obj as any).openToSale || false,
            chain: Array.isArray(obj.chain)
              ? (obj.chain as any[]).map((c) => ({
                  owner: c?.owner || '',
                  acquiredAt: ((): string => {
                    const d: any = c?.acquiredAt;
                    try {
                      if (!d) return '';
                      if (typeof d === 'string') return d;
                      if (d?.seconds) return new Date(d.seconds * 1000).toISOString().slice(0, 10);
                      const dt = new Date(d);
                      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
                    } catch {}
                    return '';
                  })(),
                  notes: c?.notes || ''
                }))
              : [],
          });
          setImages(prev => {
            prev.forEach(image => {
              if (image.file && image.preview.startsWith('blob:')) {
                URL.revokeObjectURL(image.preview);
              }
            });
            const next = (obj.images || []).map((url, index) => ({
              id: `${obj.id || 'image'}-${index}`,
              preview: url,
              originalUrl: url,
            }));
            syncFormImages(next);
            return next;
          });
        }
      } catch (e) {
        setError('Failed to load object');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [objectId]);

  // Realtime: keep item in sync so anchoring status flips from Pending -> Anchored
  useEffect(() => {
    if (!objectId) return;
    const unsub = subscribeObject(objectId, (obj) => {
      if (obj) {
        setItem(obj);
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [objectId]);

  async function handleDelete() {
    if (!item || !user || item.userId !== user.uid) return;
    try {
      setDeleting(true);
      await deleteObject(item.id);
      router.push('/registry');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const resetEditorState = () => {
    setImageEditorOpen(false);
    setEditorFiles([]);
    setEditorIndex(0);
    setEditorReplaceId(null);
  };

  const openImageEditor = (files: File[], replaceId: string | null = null) => {
    if (!files.length) return;
    setEditorFiles(files);
    setEditorIndex(0);
    setEditorReplaceId(replaceId);
    setImageEditorOpen(true);
  };

  const advanceEditorQueue = () => {
    if (editorReplaceId) {
      resetEditorState();
      return;
    }
    const nextIndex = editorIndex + 1;
    if (nextIndex < editorFiles.length) {
      setEditorIndex(nextIndex);
    } else {
      resetEditorState();
    }
  };

  const upsertImage = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImages(prev => {
      let next: EditableImage[];
      if (editorReplaceId) {
        next = prev.map(image => {
          if (image.id !== editorReplaceId) return image;
          if (image.file && image.preview.startsWith('blob:')) {
            URL.revokeObjectURL(image.preview);
          }
          return {
            ...image,
            file,
            preview: previewUrl,
          };
        });
      } else {
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        next = [...prev, { id, file, preview: previewUrl }];
      }
      syncFormImages(next);
      return next;
    });
  };

  const handleEditorApply = (file: File) => {
    upsertImage(file);
    advanceEditorQueue();
  };

  const handleEditorUseOriginal = (file: File) => {
    upsertImage(file);
    advanceEditorQueue();
  };

  const handleAddImages = (files: File[]) => {
    if (!files.length) return;
    setUploadError(null);
    openImageEditor(files, null);
  };

  const handleEditImage = async (imageId: string) => {
    const target = images.find(image => image.id === imageId);
    if (!target) return;
    setUploadError(null);
    if (target.file) {
      openImageEditor([target.file], imageId);
      return;
    }
    if (target.originalUrl) {
      try {
        const response = await fetch(target.originalUrl);
        const blob = await response.blob();
        const extension = blob.type && blob.type.includes('/') ? blob.type.split('/')[1] : 'jpg';
        const file = new File([blob], `image-${imageId}.${extension}`, { type: blob.type || 'image/jpeg' });
        openImageEditor([file], imageId);
      } catch (err) {
        console.error('Failed to load image for editing', err);
        setUploadError('Unable to load image for editing. Please try again.');
      }
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => {
      const target = prev.find(image => image.id === imageId);
      if (target && target.file && target.preview.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview);
      }
      const next = prev.filter(image => image.id !== imageId);
      syncFormImages(next);
      return next;
    });
  };

  async function handleInlineSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !item) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const associatedDocuments = Array.isArray((form as any).associatedDocuments)
      ? ((form as any).associatedDocuments as string[])
      : (form.associatedDocuments || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
    // Sanitize chain entries (remove completely empty rows)
    const chain = Array.isArray(form.chain)
      ? form.chain
          .map(entry => ({
            owner: (entry.owner || '').trim(),
            acquiredAt: (entry.acquiredAt || '').trim(),
            notes: (entry.notes || '').trim(),
          }))
          .filter(entry => entry.owner || entry.acquiredAt || entry.notes)
      : undefined;

    await updateObject(item.id, {
      id: item.id,
      title: form.title,
      category: form.category,
      description: form.description,
      maker: form.maker,
      year: form.year,
      value: form.value,
      condition: form.condition,
      tags,
      notes: form.notes,
      images: form.images,
      isPublic: form.isPublic,
      shareInCollaborative: form.shareInCollaborative,
      openToSale: form.openToSale,
      // provenance
      serialNumber: form.serialNumber,
      acquisitionDate: form.acquisitionDate,
      certificateOfAuthenticity: form.certificateOfAuthenticity,
      certificateUrl: form.certificateUrl,
      certificateImage: form.certificateImage,
      origin: form.origin,
      transferMethod: form.transferMethod,
      associatedDocuments,
      provenanceNotes: form.provenanceNotes,
      chain,
    } as any);
    // Refresh local item
    const updated = await getObject(item.id);
    setItem(updated);
    if (updated) {
      setForm({
        title: updated.title || '',
        category: updated.category || '',
        description: updated.description || '',
        maker: updated.maker || '',
        year: updated.year,
        value: updated.value,
        condition: (updated.condition as any) || 'good',
        tags: Array.isArray(updated.tags) ? updated.tags.join(', ') : '',
        notes: updated.notes || '',
        images: updated.images || [],
        isPublic: !!updated.isPublic,
        shareInCollaborative: !!updated.shareInCollaborative,
        serialNumber: updated.serialNumber || '',
        acquisitionDate: ((): string => {
          const d: any = (updated as any).acquisitionDate;
          try {
            if (!d) return '';
            if (typeof d === 'string') return d;
            if (d?.seconds) return new Date(d.seconds * 1000).toISOString().slice(0, 10);
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
          } catch {}
          return '';
        })(),
        certificateOfAuthenticity: (updated as any).certificateOfAuthenticity || '',
        certificateUrl: (updated as any).certificateUrl || '',
        certificateImage: (updated as any).certificateImage || '',
        origin: updated.origin || '',
        transferMethod: updated.transferMethod || '',
        associatedDocuments: Array.isArray(updated.associatedDocuments) ? updated.associatedDocuments.join(', ') : '',
        provenanceNotes: updated.provenanceNotes || '',
        chain: Array.isArray(updated.chain)
          ? (updated.chain as any[]).map((c) => ({
              owner: c?.owner || '',
              acquiredAt: ((): string => {
                const d: any = c?.acquiredAt;
                try {
                  if (!d) return '';
                  if (typeof d === 'string') return d;
                  if (d?.seconds) return new Date(d.seconds * 1000).toISOString().slice(0, 10);
                  const dt = new Date(d);
                  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
                } catch {}
                return '';
              })(),
              notes: c?.notes || ''
            }))
          : [],
      });
      setImages(prev => {
        prev.forEach(image => {
          if (image.file && image.preview.startsWith('blob:')) {
            URL.revokeObjectURL(image.preview);
          }
        });
        const next = (updated.images || []).map((url, index) => ({
          id: `${updated.id || 'image'}-${index}`,
          preview: url,
          originalUrl: url,
        }));
        syncFormImages(next);
        return next;
      });
    }
    setEditing(false);
  }

  const activeEditorFile = editorFiles[editorIndex] ?? null;

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="full-bleed min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-gray-100">
          Loading…
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="relative min-h-screen">
        <div className="full-bleed min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Not found'}</p>
            <Button asChild>
              <Link href="/registry">Back to Registry</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ImageEditorModal
        open={imageEditorOpen}
        file={activeEditorFile}
        fileName={activeEditorFile?.name}
        onClose={resetEditorState}
        onApply={handleEditorApply}
        onUseOriginal={handleEditorUseOriginal}
      />
      {editing && (
        <div className="sticky top-0 z-50 w-full">
          <div className="bg-black dark:bg-gray-800 text-white px-6 sm:px-8 py-3 flex items-center justify-between full-bleed">
            <div className="text-sm font-medium tracking-wide uppercase">Editing</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setEditing(false)} className="bg-black dark:bg-gray-800 border border-white/70 text-white">Cancel</Button>
              <Button onClick={() => { const fake = { preventDefault() {} } as any; handleInlineSave(fake); }} className="bg-white dark:bg-gray-100 dark:bg-gray-600 text-black dark:text-gray-900 hover:bg-gray-300 dark:hover:bg-gray-200 dark:bg-gray-700">Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="full-bleed min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="held-container held-container-wide py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild className="p-0 h-auto text-black dark:text-gray-100 hover:bg-transparent">
            <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase text-current">
              <ArrowLeft className="h-4 w-4 text-current" /> Registry
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {item.isPublic && (
              <Button asChild variant="ghost" className="text-black dark:text-gray-100 p-0">
                <Link href={`/passport/${item.slug || item.id}`} className="p-0">
                  <Image src={passportSvg} alt="Passport" width={39} height={39} className=" opacity-100 float-left" />
              </Link> 
              </Button>
            )}
            {user && item.userId === user.uid && (
              <>
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-gray-50 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setEditing(v => !v)}
                >
                  <Edit className="h-4 w-4 text-current  non-dark-invert" /> {editing ? 'Cancel' : ''}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 "
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 text-current  non-dark-invert" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title + chips */}
        <div className="mb-6">
          {!editing ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight leading-loose text-black dark:text-gray-100 mb-0 md:mb-20 break-words">{item.title || 'Untitled'}</h1>
          ) : (
            <input
              className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-black dark:text-gray-100 mb-3 w-full border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-gray-300 outline-none bg-transparent"
              value={form?.title || ''}
              onChange={e => setForm(prev => ({...prev!, title: e.target.value}))}
              placeholder="Untitled"
            />
          )}
          {/* Status chips removed; shown in right rail */}
          {/* Tags moved to right rail Specifications */}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left: media + specs + provenance summary */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              {!editing ? (
                item.images && item.images.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <Image src={item.images[0]} alt={item.title} width={1600} height={1200} className="w-auto max-w-full h-auto object-contain rounded-md" />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">No image</div>
                )
              ) : (
                <div className="space-y-5">
                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {images.map(image => (
                        <div key={image.id} className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                          <img src={image.preview} alt="Object image" className="w-full h-56 object-contain bg-gray-50" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" size="sm" variant="outline" className="h-8 px-3" onClick={() => void handleEditImage(image.id)}>
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="destructive" className="h-8 px-3" onClick={() => handleRemoveImage(image.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      No images yet
                    </div>
                  )}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-black dark:border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                    onDrop={e => {
                      e.preventDefault();
                      setDragActive(false);
                      const files = Array.from(e.dataTransfer?.files || []).filter(file => file.type.startsWith('image/'));
                      if (files.length) {
                        handleAddImages(files);
                      }
                    }}
                    onClick={() => document.getElementById('registry-inline-image-input')?.click()}
                  >
                    <input
                      id="registry-inline-image-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
                        if (files.length) {
                          handleAddImages(files);
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Plus className="h-5 w-5" />
                      <span className="text-sm font-medium">Add or drop photos</span>
                      <span className="text-xs text-gray-400">JPG, PNG, HEIC up to 10MB</span>
                    </div>
                  </div>
                  {uploadError && <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
                </div>
              )}
            </div>

            {/* Specifications moved to right-rail in OwnerTools */}

            {/* Provenance moved to full-width section below */}
          </div>

          {/* Right: sticky owner tools */}
          <div className="xl:col-span-1 xl:sticky xl:top-6 h-fit">
            <OwnerTools
              object={item}
              editing={editing}
              form={form as any}
              setForm={setForm as any}
              onSaveInline={() => {
                // Trigger the same save handler used for inline form
                const fake = { preventDefault() {} } as any;
                handleInlineSave(fake);
              }}
              onCancelInline={() => setEditing(false)}
              onProvenanceShortcut={handleProvenanceShortcut}
            />
          </div>
        </div>
        {/* Full-width Provenance documentation */}
        <div className="mt-16">
          {isHeldPlus(user) ? (
            form && (
              <ProvenanceSection
                data={{
                  serialNumber: form.serialNumber,
                  acquisitionDate: form.acquisitionDate,
                  certificateOfAuthenticity: form.certificateOfAuthenticity,
                  certificateImage: form.certificateImage,
                  certificateUrl: form.certificateUrl,
                  origin: form.origin,
                  transferMethod: form.transferMethod,
                  associatedDocuments: Array.isArray((form as any).associatedDocuments)
                    ? ((form as any).associatedDocuments as string[])
                    : (form.associatedDocuments || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean),
                  provenanceNotes: form.provenanceNotes,
                  chain: Array.isArray(form.chain) ? form.chain : [],
                }}
                objectId={item.id}
                editable={editing}
                onRequestSave={() => {
                  const fake = { preventDefault() {} } as any;
                  handleInlineSave(fake);
                }}
                onRequestEdit={() => setEditing(true)}
                onChange={(provenanceData) => {
                  setForm(prev => ({
                    ...(prev as any),
                    ...provenanceData,
                    associatedDocuments: Array.isArray(provenanceData.associatedDocuments)
                      ? provenanceData.associatedDocuments
                      : [],
                  }) as any);
                }}
              />
            )
          ) : (
            <ProvenanceUpsell />
          )}
        </div>
        </div>
      </div>

      {confirmOpen && (
        <DeleteDialog
          open={true}
          title={item.title ? 'Delete ' + item.title : 'Delete Item'}
          message="Are you sure you want to delete this object? This action cannot be undone."
          busy={deleting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
