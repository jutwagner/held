'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
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
    }
    setEditing(false);
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading…</div>;
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Not found'}</p>
          <Button asChild>
            <Link href="/registry">Back to Registry</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {editing && (
        <div className="sticky top-0 z-50 w-full">
          <div className="bg-black text-white px-6 sm:px-8 py-3 flex items-center justify-between">
            <div className="text-sm font-medium tracking-wide uppercase">Editing</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setEditing(false)} className="bg-black border border-white-70 text-white">Cancel</Button>
              <Button onClick={() => { const fake = { preventDefault() {} } as any; handleInlineSave(fake); }} className="bg-white text-black hover:bg-gray-300">Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild className="p-0 h-auto text-black hover:bg-transparent">
            <Link href="/registry" className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase">
              <ArrowLeft className="h-4 w-4" /> Registry
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {item.isPublic && (
              <Button asChild variant="outline" className="text-black p-0 border-0">
                <Link href={`/passport/${item.slug || item.id}`} target="_blank" className="p-0">
                  <Image src={passportSvg} alt="Passport" width={39} height={39} className="hidden md:inline-block opacity-100 float-left" />
              </Link> 
              </Button>
            )}
            {user && item.userId === user.uid && (
              <>
                <Button variant="outline" className="border-black text-black" onClick={() => setEditing(v => !v)}>
                  <Edit className="h-4 w-4" /> {editing ? 'Cancel' : ''}
                </Button>
                <Button variant="outline" className="text-gray-600" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title + chips */}
        <div className="mb-6">
          {!editing ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight leading-loose text-black mb-20 break-words">{item.title || 'Untitled'}</h1>
          ) : (
            <input
              className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-black mb-3 w-full border-b border-gray-300 focus:border-black outline-none bg-transparent"
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
            <div className="bg-white border border-gray-200 rounded-lg">
              {item.images && item.images.length > 0 ? (
                <div className="flex items-center justify-center">
                  <Image src={item.images[0]} alt={item.title} width={1600} height={1200} className="w-auto max-w-full h-auto object-contain rounded-md" />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">No image</div>
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
