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
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  notes?: string;
  images: string[];
  isPublic: boolean;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
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
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  notes?: string;
  images: File[];
  isPublic: boolean;
}

export interface UpdateObjectData extends Partial<CreateObjectData> {
  id: string;
}

export interface CreateRotationData {
  name: string;
  description?: string;
  objectIds: string[];
  isPublic: boolean;
}

export interface UpdateRotationData extends Partial<CreateRotationData> {
  id: string;
}
