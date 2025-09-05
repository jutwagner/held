"use client";

import React, { useMemo, useState } from 'react';
import { HeldObject } from '@/types';
import { Button } from '@/components/ui/button';
import { getPolygonExplorerURL, anchorPassport, generatePassportURI, generateCoreDigest, generateFullDigest } from '@/lib/blockchain-services';
import { formatCurrency } from '@/lib/utils';
import { updateObjectAnchoring } from '@/lib/firebase-services';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';
import { CheckCircle, Clock, Shield, FileText, UploadCloud, RefreshCcw } from 'lucide-react';
import Switch from '@/components/ui/switch';

type Props = {
  object: HeldObject;
  // Inline edit wiring from parent
  editing?: boolean;
  form?: {
    title: string;
    category: string;
    description?: string;
    maker: string;
    year?: number;
    value?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    tags: string; // comma separated in form
    notes: string;
    isPublic: boolean;
    shareInCollaborative: boolean;
    serialNumber?: string;
    acquisitionDate?: string;
    certificateOfAuthenticity?: string;
    origin?: string;
    transferMethod?: string;
    associatedDocuments?: string;
    provenanceNotes?: string;
  } | null;
  setForm?: (updater: (prev: any) => any) => void;
  onSaveInline?: () => void;
  onCancelInline?: () => void;
};

function getProvenanceScore(o: HeldObject): number {
  let score = 0;
  let total = 4;
  if (o.serialNumber) score++;
  if (o.certificateOfAuthenticity) score++;
  if (Array.isArray(o.chain) && o.chain.length > 0) score++;
  if (o.acquisitionDate) score++;
  return Math.round((score / total) * 100);
}

export default function OwnerTools({ object, editing, form, setForm, onSaveInline, onCancelInline }: Props) {
  const { user } = useAuth();
  const heldPlus = isHeldPlus(user);
  const [busy, setBusy] = useState(false);
  const prov = useMemo(() => getProvenanceScore(object), [object]);

  const anchored = !!object.anchoring?.isAnchored;
  const pending = !!object.anchoring?.txHash && !anchored;

  // Compute whether current object matches last anchored digest
  let upToDate = false;
  try {
    const core = generateCoreDigest(object as any);
    const full = generateFullDigest(object as any);
    const last = (object.anchoring?.digest || '').toLowerCase();
    upToDate = !!last && (last === core.toLowerCase() || last === full.toLowerCase());
  } catch {}

  async function doAnchor(kind: 'core' | 'full') {
    if (!object?.id) return;
    setBusy(true);
    try {
      const baseURL = window.location.origin;
      const uri = generatePassportURI(object as any, baseURL);
      const version = (object.anchoring?.version || 0) + 1 || 1;
      const res = await anchorPassport(object as any, uri, version, kind, 'async');
      await updateObjectAnchoring(object.id, {
        isAnchored: false,
        version,
        txHash: res.txHash,
        digest: res.digest,
        uri,
      } as any);
    } catch (e) {
      console.error('OwnerTools anchor failed', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="p-4 md:p-6">
      <h3 className="text-lg font-light text-black mb-4">Owner Tools</h3>

      {/* Details summary chips */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Details</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {object.maker && (
            <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-800">
              {object.maker}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-800">
            {object.isPublic ? 'Public' : 'Private'}
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${anchored ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : (pending ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-700')}`}>
            {anchored ? 'Anchored' : (pending ? 'Pending' : 'Not Anchored')}
          </span>
        </div>
      </div>

      {/* Specifications (read-only, right rail) */}
      {!editing && (
        <div className="mb-6">
          <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">Specifications</div>
          <div className="space-y-4 text-black">
            {(Array.isArray((object as any).tags) && (object as any).tags.length > 0) && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Tags</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {((object as any).tags as string[]).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 inline-flex items-center gap-2 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(object.maker || object.year) && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Maker</div>
                <p className="text-sm text-gray-800">
                  {object.maker || '—'}{object.year ? `, ${object.year}` : ''}
                </p>
              </div>
            )}
            {object.description && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Description</div>
                <p className="leading-relaxed text-sm text-gray-800">{object.description}</p>
              </div>
            )}
            {object.category && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Category</div>
                <p className="text-sm">{object.category}</p>
              </div>
            )}
            {object.condition && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Condition</div>
                <p className="capitalize text-sm">{object.condition}</p>
              </div>
            )}
            {typeof object.value !== 'undefined' && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Estimated Value (Private)</div>
                <p className="text-sm">{isNaN(object.value as any) ? '—' : formatCurrency(object.value as number)}</p>
              </div>
            )}
            {object.notes && (
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Private Notes</div>
                <p className="text-sm text-gray-800">{object.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Edit Panel (only when editing). Focus on fields not on the main view */}
      {editing && form && setForm && (
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-3">Quick Edit</div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs text-gray-700">Private</span>
                <Switch
                  ariaLabel="Toggle Private"
                  checked={!form.isPublic}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, isPublic: !checked }))}
                />
              </div>
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs text-gray-700">Collaborative</span>
                <Switch
                  ariaLabel="Toggle Collaborative Sharing"
                  checked={form.shareInCollaborative}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, shareInCollaborative: checked }))}
                />
              </div>
            </div>
            {/* Item Details */}
            <div className="pt-2">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Details</div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    className="w-full border px-3 py-2 bg-white"
                    value={form.category || ''}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {['Audio','Photography','Art','Industrial Design','Furniture','Lighting','Tech','Instruments','Timepieces','Fashion','Books','Miscellaneous'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Condition</label>
                  <select
                    className="w-full border px-3 py-2 bg-white"
                    value={form.condition}
                    onChange={e => setForm(prev => ({ ...prev, condition: e.target.value as any }))}
                  >
                    {['excellent','good','fair','poor'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Estimated Value (USD)</label>
                  <input
                    type="number"
                    className="w-full border px-3 py-2"
                    value={typeof form.value === 'number' && !isNaN(form.value as any) ? String(form.value) : ''}
                    onChange={e => setForm(prev => ({ ...prev, value: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Maker</label>
                  <input
                    className="w-full border px-3 py-2"
                    value={form.maker || ''}
                    onChange={e => setForm(prev => ({ ...prev, maker: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <input
                    type="number"
                    className="w-full border px-3 py-2"
                    value={typeof form.year === 'number' && !isNaN(form.year as any) ? String(form.year) : ''}
                    onChange={e => setForm(prev => ({ ...prev, year: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea
                    className="w-full border px-3 py-2"
                    value={form.description || ''}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Private Notes</label>
                  <textarea
                    className="w-full border px-3 py-2"
                    value={form.notes || ''}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            {/* Provenance fields */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Serial Number</label>
                <input className="w-full border px-3 py-2" value={form.serialNumber || ''} onChange={e => setForm(prev => ({...prev, serialNumber: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Acquisition Date</label>
                <input className="w-full border px-3 py-2" type="date" value={form.acquisitionDate || ''} onChange={e => setForm(prev => ({...prev, acquisitionDate: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Certificate URL</label>
                <input className="w-full border px-3 py-2" value={form.certificateOfAuthenticity || ''} onChange={e => setForm(prev => ({...prev, certificateOfAuthenticity: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Origin</label>
                <input className="w-full border px-3 py-2" value={form.origin || ''} onChange={e => setForm(prev => ({...prev, origin: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Method</label>
                <input className="w-full border px-3 py-2" value={form.transferMethod || ''} onChange={e => setForm(prev => ({...prev, transferMethod: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Associated Documents (comma separated URLs)</label>
                <input className="w-full border px-3 py-2" value={form.associatedDocuments || ''} onChange={e => setForm(prev => ({...prev, associatedDocuments: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Provenance Notes</label>
                <textarea className="w-full border px-3 py-2" value={form.provenanceNotes || ''} onChange={e => setForm(prev => ({...prev, provenanceNotes: e.target.value}))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {onCancelInline && <Button variant="outline" onClick={onCancelInline}>Cancel</Button>}
              {onSaveInline && <Button onClick={onSaveInline}>Save</Button>}
            </div>
          </div>
        </div>
      )}

      {/* Anchoring Panel */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">Anchoring Status</div>
          {anchored ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 text-sm"><CheckCircle className="h-4 w-4" /> Anchored</span>
          ) : pending ? (
            <span className="inline-flex items-center gap-1 text-amber-700 text-sm"><Clock className="h-4 w-4" /> Pending</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gray-600 text-sm"><Shield className="h-4 w-4" /> Not Anchored</span>
          )}
        </div>
        {object.anchoring?.txHash && (
          <div className="text-xs text-gray-600 mb-3">
            Tx:&nbsp;
            <a href={getPolygonExplorerURL(object.anchoring.txHash)} target="_blank" rel="noopener noreferrer" className="text-black underline">
              {object.anchoring.txHash.slice(0, 8)}...{object.anchoring.txHash.slice(-6)}
            </a>
          </div>
        )}
        {!pending && (
          <div className="flex items-center gap-2">
            {/* Basic anchoring: only offer if not yet anchored. Never re‑anchor Basic. */}
            {!anchored ? (
              <Button onClick={() => doAnchor('core')} disabled={busy}>
                {busy ? 'Anchoring…' : 'Anchor Basic'}
              </Button>
            ) : upToDate ? (
              <span className="text-xs text-gray-600">Up‑to‑date with last anchor</span>
            ) : null}

            {/* Full anchoring (Held+): allow initial or re‑anchor */}
            {heldPlus && (!anchored || !upToDate) && (
              <Button variant="outline" onClick={() => doAnchor('full')} disabled={busy}>
                Anchor Full
              </Button>
            )}

            <Button variant="outline" onClick={() => fetch('/api/anchor/worker').catch(() => {})} title="Run worker">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Provenance Meter (Held+) */}
      {heldPlus ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Provenance Completeness</div>
            <div className="text-sm font-mono">{prov}%</div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gray-900" style={{ width: `${prov}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <Prompt ok={!!object.serialNumber}>Add Serial</Prompt>
            <Prompt ok={!!object.certificateOfAuthenticity || (object.associatedDocuments && object.associatedDocuments.length>0)}>Attach Document</Prompt>
            <Prompt ok={Array.isArray(object.chain) && object.chain.length>0}>Add Owner</Prompt>
            <Prompt ok={!!object.acquisitionDate}>Add Acquisition Date</Prompt>
          </div>
        </div>
      ) : (
        <div className="mb-6 text-sm text-gray-600">
          <div className="mb-2">Provenance (Held+)</div>
          <div className="text-gray-500">Upgrade to track serials, documents and ownership history.</div>
        </div>
      )}

      {/* Documents (Held+) */}
      {heldPlus ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2"><FileText className="h-4 w-4" /> Documents</div>
          {object.certificateOfAuthenticity || (object.associatedDocuments && object.associatedDocuments.length>0) ? (
            <ul className="list-disc list-inside text-sm text-gray-700">
              {object.certificateOfAuthenticity && (
                <li>
                  <a href={object.certificateOfAuthenticity} target="_blank" rel="noopener noreferrer" className="text-black underline">Certificate of Authenticity</a>
                </li>
              )}
              {(object.associatedDocuments||[]).map((d, i) => (
                <li key={i}><a href={d} target="_blank" rel="noopener noreferrer" className="text-black underline">Document {i+1}</a></li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No documents attached.</div>
          )}
        </div>
      ) : null}

      {/* Activity */}
      <div>
        <div className="text-sm text-gray-600 mb-2">Activity</div>
        <div className="text-xs text-gray-700 space-y-1">
          <div>Created: {formatMaybeDate(object.createdAt)}</div>
          <div>Updated: {formatMaybeDate(object.updatedAt)}</div>
          {object.anchoring?.version && <div>Last Anchor Version: {object.anchoring.version}</div>}
          {object.anchoring?.blockNumber && <div>Last Anchor Block: {object.anchoring.blockNumber}</div>}
        </div>
      </div>
    </aside>
  );
}

function Prompt({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`border px-2 py-1 text-center ${ok ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-700 bg-white'}`}>
      {children}
    </div>
  );
}

function formatMaybeDate(d: any): string {
  try {
    if (!d) return '-';
    // Firestore Timestamp
    if (d.seconds) return new Date(d.seconds * 1000).toLocaleString();
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toLocaleString();
  } catch {}
  return '-';
}
