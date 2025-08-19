// Update user profile
export const updateUser = async (uid: string, data: Partial<UserDoc>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: new Date() });
};
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  // ...existing code...
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject as deleteStorageObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { 
  HeldObject, 
  Rotation, 
  RotationWithObjects,
  CreateObjectData, 
  UpdateObjectData,
  CreateRotationData,
  UpdateRotationData,
  UserDoc
} from '@/types';
import { generateSlug } from './utils';

// User services
export const createUser = async (userData: Partial<UserDoc> & { uid: string; email: string }) => {
  const userRef = doc(db, 'users', userData.uid);
  const now = new Date();

  // Fill missing fields with sensible defaults
  const avatarUrl = userData.avatarUrl || (typeof (userData as { photoURL?: string }).photoURL === 'string' ? (userData as { photoURL?: string }).photoURL! : '');
  const userToSave: UserDoc = {
    displayName: userData.displayName || '',
    handle: userData.handle || userData.uid.slice(0, 8),
    bio: userData.bio || '',
    avatarUrl,
    theme: userData.theme || 'light',
    typeTitleSerif: userData.typeTitleSerif ?? true,
    typeMetaMono: userData.typeMetaMono ?? false,
    density: userData.density || 'standard',
    notifications: userData.notifications || {
      monthlyRotation: true,
      quarterlyReview: true,
      email: true,
      push: false,
    },
    premium: userData.premium || {
      active: false,
      plan: null,
      since: null,
      renewsAt: null,
    },
    backup: userData.backup || { enabled: false, lastRun: null },
    security: userData.security || { providers: ['password'], sessions: [] },
    email: userData.email,
    uid: userData.uid,
  };

  await setDoc(userRef, { ...userToSave, createdAt: now, updatedAt: now });
  return userToSave;
};

export const getUser = async (uid: string): Promise<UserDoc | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    // Fill missing fields with defaults
    return {
      displayName: data.displayName || '',
      handle: data.handle || uid.slice(0, 8),
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || data.photoURL || '',
      theme: data.theme || 'light',
      typeTitleSerif: data.typeTitleSerif ?? true,
      typeMetaMono: data.typeMetaMono ?? false,
      density: data.density || 'standard',
      notifications: data.notifications || {
        monthlyRotation: true,
        quarterlyReview: true,
        email: true,
        push: false,
      },
      premium: data.premium || {
        active: false,
        plan: null,
        since: null,
        renewsAt: null,
      },
      backup: data.backup || { enabled: false, lastRun: null },
      security: data.security || { providers: ['password'], sessions: [] },
      email: data.email,
      uid: data.uid,
    };
  }
  return null;
};

// Object services
export const getObjects = async (userId: string): Promise<HeldObject[]> => {
  const objectsRef = collection(db, 'objects');
  const q = query(
    objectsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as HeldObject[];
};

export const getObject = async (id: string): Promise<HeldObject | null> => {
  const objectRef = doc(db, 'objects', id);
  const objectSnap = await getDoc(objectRef);
  
  if (objectSnap.exists()) {
    return { id: objectSnap.id, ...objectSnap.data() } as HeldObject;
  }
  
  return null;
};

export const getObjectBySlug = async (slug: string): Promise<HeldObject | null> => {
  const objectsRef = collection(db, 'objects');
  const q = query(objectsRef, where('slug', '==', slug), where('isPublic', '==', true));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as HeldObject;
  }
  
  return null;
};

export const createObject = async (userId: string, data: CreateObjectData): Promise<HeldObject> => {
  // Debug log removed for production

  // Upload images first
  const imageUrls = await Promise.all(
    data.images.map(async (file) => {
      const imageRef = ref(storage, `objects/${userId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const url = await getDownloadURL(snapshot.ref);
  // Debug log removed for production
      return url;
    })
  );

  const slug = generateSlug(data.title);
  const now = new Date();

  const objectData = {
    userId,
    title: data.title,
    maker: data.maker,
    year: data.year,
    value: data.value,
    condition: data.condition,
    tags: data.tags,
    notes: data.notes,
    images: imageUrls,
    isPublic: data.isPublic,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, 'objects'), objectData);
  // Debug log removed for production

  return {
    id: docRef.id,
    ...objectData,
  };
};

export const updateObject = async (id: string, data: UpdateObjectData): Promise<void> => {
  const objectRef = doc(db, 'objects', id);
  const updateData: Partial<UpdateObjectData> = {
    ...data,
    updatedAt: new Date(),
  };

  // Ensure shareInCollaborative is included in the update
  if (data.shareInCollaborative !== undefined) {
    updateData.shareInCollaborative = data.shareInCollaborative;
  }

  // Handle new images if provided
  if (data.images && data.images.length > 0) {
    const object = await getObject(id);
    if (object) {
      // Upload new images
      const filesToUpload = data.images.filter((img): img is File => typeof img !== 'string');
      const newImageUrls = await Promise.all(
        filesToUpload.map(async (file) => {
          const imageRef = ref(storage, `objects/${object.userId}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );
      // When updating, images should be URLs (string[]), not File[]
      updateData.images = [...object.images, ...newImageUrls];
    }
  }

  // Update slug if title changed
  if (data.title) {
    updateData.slug = generateSlug(data.title);
  }

  delete updateData.id; // Remove id from update data
  await updateDoc(objectRef, updateData);
};

export const deleteObject = async (id: string): Promise<void> => {
  const object = await getObject(id);
  if (!object) return;
  
  // Delete images from storage
  await Promise.all(
    object.images.map(async (imageUrl) => {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteStorageObject(imageRef);
      } catch {
  // Error log removed for production
      }
    })
  );
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'objects', id));
};

// Rotation services
export const getRotations = async (userId: string): Promise<Rotation[]> => {
  const rotationsRef = collection(db, 'rotations');
  const q = query(
    rotationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rotation[];
};

export const getRotation = async (id: string): Promise<Rotation | null> => {
  const rotationRef = doc(db, 'rotations', id);
  const rotationSnap = await getDoc(rotationRef);
  
  if (rotationSnap.exists()) {
    return { id: rotationSnap.id, ...rotationSnap.data() } as Rotation;
  }
  
  return null;
};

export const getRotationBySlug = async (slug: string): Promise<Rotation | null> => {
  const rotationsRef = collection(db, 'rotations');
  const q = query(rotationsRef, where('slug', '==', slug), where('isPublic', '==', true));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Rotation;
  }
  
  return null;
};

export const getRotationWithObjects = async (id: string): Promise<RotationWithObjects | null> => {
  const rotation = await getRotation(id);
  if (!rotation) return null;
  
  const objects = await Promise.all(
    rotation.objectIds.map(id => getObject(id))
  );
  
  return {
    ...rotation,
    objects: objects.filter(Boolean) as HeldObject[],
  };
};

export const createRotation = async (userId: string, data: CreateRotationData): Promise<Rotation> => {
  const slug = generateSlug(data.name);
  const now = new Date();
  
  const rotationData = {
    userId,
    name: data.name,
    description: data.description,
    objectIds: data.objectIds,
    isPublic: data.isPublic,
    slug,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, 'rotations'), rotationData);
  
  return {
    id: docRef.id,
    ...rotationData,
  };
};

export const updateRotation = async (id: string, data: UpdateRotationData): Promise<void> => {
  const rotationRef = doc(db, 'rotations', id);
  const updateData: Partial<UpdateRotationData> = {
    ...data,
    updatedAt: new Date(),
  };
  
  // Update slug if name changed
  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }
  
  delete updateData.id; // Remove id from update data
  await updateDoc(rotationRef, updateData);
};

export const deleteRotation = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'rotations', id));
};

// Public posts
export const getPublicPosts = async (): Promise<HeldObject[]> => {
  const objectsRef = collection(db, 'objects');
  const q = query(objectsRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as HeldObject[];
};
