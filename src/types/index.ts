import { Timestamp, FieldValue } from 'firebase/firestore';
export type Theme = 'light' | 'dim' | 'dark';
export type Density = 'cozy' | 'standard' | 'spacious';

export interface UserDoc {
  displayName: string;
  handle: string;
  id: string;
  name: string;
  description?: string;
  bio?: string;
  avatarUrl?: string;
  objectIds: string[];
  isPublic: boolean;
  createdAt: Date | Timestamp | FieldValue;
  updatedAt?: Date | Timestamp | FieldValue;
  slug?: string;
  coverImage?: string;
  quarterlyReview: boolean;
  theme?: 'light' | 'dim' | 'dark';
  typeTitleSerif?: boolean;
  typeMetaMono?: boolean;
  density?: 'cozy' | 'standard' | 'spacious';
  notifications?: {
    monthlyRotation: boolean;
    quarterlyReview: boolean;
    email: boolean;
    push: boolean;
    dms: boolean;
  };
  push: boolean;
  dms?: boolean;
  premium: {
    active: boolean;
    plan: 'plus' | 'heldplus' | null;
    since: number | null;
    renewsAt: number | null;
    cancelRequested?: boolean;
  };
  backup: { enabled: boolean; lastRun: number | null };
  security: {
    providers: string[];
    sessions: { id: string; device: string; lastActive: number }[];
  };
  email?: string;
  uid: string;
  isPublicProfile?: boolean;
}
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeldObject {
  id: string;
  userId: string;
  title: string;
  maker?: string;
  year?: number;
  value?: number;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  notes?: string;
  images: string[];
  isPublic: boolean;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  shareInCollaborative?: boolean; // New field
  // Purchase link fields (Held+ only)
  purchaseLink?: {
    url: string;
    platform?: 'amazon' | 'ebay' | 'etsy' | 'shopify' | 'other';
    title?: string; // "Buy on Amazon", "Purchase on Etsy"
  };
  isForSale?: boolean;
  // Provenance fields
  chain?: Array<{ owner: string; acquiredAt?: Date; notes?: string }>;
  serialNumber?: string;
  acquisitionDate?: Date;
  certificateOfAuthenticity?: string;
  certificateImage?: string;
  certificateUrl?: string;
  origin?: string;
  conditionHistory?: Array<{ date: Date; condition: string; notes?: string }>;
  transferMethod?: string;
  associatedDocuments?: string[];
  provenanceNotes?: string;
  // Blockchain anchoring fields
  anchoring?: {
    isAnchored: boolean;
    txHash?: string;
    blockNumber?: number;
    digest?: string;
    version: number;
    anchoredAt?: Date;
    uri?: string;
  };
  // Marketplace
  openToSale?: boolean;
}

export interface Rotation {
  id: string;
  userId: string;
  name: string;
  description?: string;
  objectIds: string[];
  isPublic: boolean;
  slug: string;
  createdAt: Date | import('firebase/firestore').Timestamp | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').Timestamp | import('firebase/firestore').FieldValue;
  coverImage?: string;
}

export interface RotationWithObjects extends Rotation {
  objects: HeldObject[];
  coverImage?: string;
}

export interface CreateObjectData {
  title: string;
  maker?: string;
  year?: number;
  value?: number;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  notes?: string;
  images: File[];
  isPublic: boolean;
  shareInCollaborative?: boolean; // New field
  // Held+ Provenance fields
  chain?: Array<{ owner: string; acquiredAt?: string; notes?: string }>;
  serialNumber?: string;
  acquisitionDate?: string;
  certificateOfAuthenticity?: string;
  certificateImage?: string;
  certificateUrl?: string;
  origin?: string;
  conditionHistory?: Array<{ date: string; condition: string; notes?: string }>;
  transferMethod?: string;
  associatedDocuments?: string[];
  provenanceNotes?: string;
  // Blockchain anchoring fields
  anchorOnChain?: boolean;
  // Marketplace
  openToSale?: boolean;
}

export interface UpdateObjectData {
  id: string;
  title?: string;
  maker?: string;
  year?: number;
  value?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  tags?: string[];
  notes?: string;
  images?: File[] | string[];
  isPublic?: boolean;
  shareInCollaborative?: boolean;
  updatedAt?: Date;
  slug?: string;
  // Held+ Provenance fields
  chain?: Array<{ owner: string; acquiredAt?: string; notes?: string }>;
  serialNumber?: string;
  acquisitionDate?: string;
  certificateOfAuthenticity?: string;
  certificateImage?: string;
  certificateUrl?: string;
  origin?: string;
  conditionHistory?: Array<{ date: string; condition: string; notes?: string }>;
  transferMethod?: string;
  associatedDocuments?: string[];
  provenanceNotes?: string;
  // Blockchain anchoring fields
  anchorOnChain?: boolean;
  // Marketplace
  openToSale?: boolean;
}

export interface CreateRotationData {
  name: string;
  description?: string;
  objectIds: string[];
  isPublic: boolean;
  coverImage?: string; // URL of the uploaded cover image
}

export interface UpdateRotationData extends Partial<CreateRotationData> {
  id: string;
  updatedAt?: Date;
  slug?: string;
  coverImage?: string; // URL of the uploaded cover image
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  createdAt: Date;
}
