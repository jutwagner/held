export type Theme = 'light' | 'dim' | 'dark';
export type Density = 'cozy' | 'standard' | 'spacious';

export interface UserDoc {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  theme: Theme;
  typeTitleSerif: boolean;
  typeMetaMono: boolean;
  density: Density;
  notifications: {
    monthlyRotation: boolean;
    quarterlyReview: boolean;
    email: boolean;
    push: boolean;
  };
  premium: {
    active: boolean;
    plan: 'plus' | null;
    since: number | null;
    renewsAt: number | null;
  };
  backup: { enabled: boolean; lastRun: number | null };
  security: {
    providers: string[];
    sessions: { id: string; device: string; lastActive: number }[];
  };
  email?: string;
  uid?: string;
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
}

export interface Rotation {
  id: string;
  userId: string;
  name: string;
  description?: string;
  objectIds: string[];
  isPublic: boolean;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RotationWithObjects extends Rotation {
  objects: HeldObject[];
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
}

export interface CreateRotationData {
  name: string;
  description?: string;
  objectIds: string[];
  isPublic: boolean;
}

export interface UpdateRotationData extends Partial<CreateRotationData> {
  id: string;
  updatedAt?: Date;
  slug?: string;
}
