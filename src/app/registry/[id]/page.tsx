'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';
import { HeldObject } from '@/types';
import { getObject, deleteObject, updateObject } from '@/lib/firebase-services';
import { formatCurrency } from '@/lib/utils';
import OwnerTools from '@/components/OwnerTools';
import DeleteDialog from '@/components/DeleteDialog';

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
    images: string[];
    isPublic: boolean;
    shareInCollaborative: boolean;
    // Provenance
    serialNumber?: string;
    acquisitionDate?: string;
    certificateOfAuthenticity?: string;
    origin?: string;
    transferMethod?: string;
    associatedDocuments?: string;
    provenanceNotes?: string;
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
            acquisitionDate: typeof (obj as any).acquisitionDate === 'string' ? (obj as any).acquisitionDate : '',
            certificateOfAuthenticity: obj.certificateOfAuthenticity || '',
            origin: obj.origin || '',
            transferMethod: obj.transferMethod || '',
            associatedDocuments: Array.isArray(obj.associatedDocuments) ? obj.associatedDocuments.join(', ') : '',
            provenanceNotes: obj.provenanceNotes || '',
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
    const associatedDocuments = (form.associatedDocuments || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
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
      // provenance
      serialNumber: form.serialNumber,
      acquisitionDate: form.acquisitionDate,
      certificateOfAuthenticity: form.certificateOfAuthenticity,
      origin: form.origin,
      transferMethod: form.transferMethod,
      associatedDocuments,
      provenanceNotes: form.provenanceNotes,
    } as any);
    // Refresh local item
    const updated = await getObject(item.id);
    setItem(updated);
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
              <Button asChild variant="outline" className="border-black text-black">
                <Link href={`/passport/${item.slug || item.id}`} target="_blank">View Passport</Link>
              </Button>
            )}
            {user && item.userId === user.uid && (
              <>
                <Button variant="outline" className="border-black text-black" onClick={() => setEditing(v => !v)}>
                  <Edit className="h-4 w-4 mr-2" /> {editing ? 'Cancel' : 'Edit'}
                </Button>
                <Button variant="outline" className="text-gray-600" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title + chips */}
        <div className="mb-6">
          {!editing ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-black mb-3">{item.title || 'Untitled'}</h1>
          ) : (
            <input
              className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-black mb-3 w-full border-b border-gray-300 focus:border-black outline-none bg-transparent"
              value={form?.title || ''}
              onChange={e => setForm(prev => ({...prev!, title: e.target.value}))}
              placeholder="Untitled"
            />
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            {item.maker && (
              <span>{item.maker}{item.year ? `, ${item.year}` : ''}</span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200">{item.isPublic ? 'Public' : 'Private'}</span>
            <span className={`px-2.5 py-1 rounded-full border ${item.anchoring?.isAnchored ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : (item.anchoring?.txHash ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-700')}`}>
              {item.anchoring?.isAnchored ? 'Anchored' : (item.anchoring?.txHash ? 'Pending' : 'Not Anchored')}
            </span>
          </div>
          {/* Tags under the title */}
          <div className="mt-3 flex flex-wrap gap-2">
            {((form?.tags || '')
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)).map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 inline-flex items-center gap-2">
                {t}
                {editing && (
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => setForm(prev => ({...prev!, tags: prev!.tags.split(',').map(s=>s.trim()).filter(Boolean).filter(x => x !== t).join(', ')}))}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left: media + specs + provenance summary */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              {item.images && item.images.length > 0 ? (
                <div className="flex items-center justify-center">
                  <Image src={item.images[0]} alt={item.title} width={1600} height={1200} className="w-auto max-w-full h-auto max-h-[70vh] object-contain" />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">No image</div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">Specifications</div>
              {!editing ? (
                <div className="space-y-4 text-black">
                  {item.description && (
                    <div>
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Description</div>
                      <p className="leading-relaxed">{item.description}</p>
                    </div>
                  )}
                  {item.category && (
                    <div>
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Category</div>
                      <p>{item.category}</p>
                    </div>
                  )}
                  {item.condition && (
                    <div>
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Condition</div>
                      <p className="capitalize">{item.condition}</p>
                    </div>
                  )}
                  {typeof item.value !== 'undefined' && (
                    <div>
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Estimated Value (Private)</div>
                      <p>{isNaN(item.value as any) ? '—' : formatCurrency(item.value as number)}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Private Notes</div>
                      <p className="text-gray-800">{item.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Use the right‑side Quick Edit panel to update fields. Title and tags edit inline above.</div>
              )}
            </div>

            {/* Provenance summary / upsell */}
            {isHeldPlus(user) ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">Provenance (Summary)</div>
                <div className="space-y-2 text-sm text-gray-800">
                  <div>Serial Number: {item.serialNumber || '—'}</div>
                  <div>Acquisition Date: {item.acquisitionDate ? new Date(item.acquisitionDate as any).toLocaleDateString() : '—'}</div>
                  <div>Ownership Chain: {Array.isArray(item.chain) && item.chain.length > 0 ? `${item.chain.length} entr${item.chain.length === 1 ? 'y' : 'ies'}` : '—'}</div>
                  <div>Documents: {item.certificateOfAuthenticity ? 'Certificate attached' : (item.associatedDocuments && item.associatedDocuments.length ? `${item.associatedDocuments.length} document(s)` : '—')}</div>
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline"><Link href={`/registry/${item.id}/edit`}>Open Provenance Editor</Link></Button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">Provenance (Held+)</div>
                <p className="text-sm text-gray-600">Upgrade to track serials, documents and ownership history.</p>
              </div>
            )}
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
