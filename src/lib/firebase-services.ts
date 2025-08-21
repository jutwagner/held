// Get object by slug
export const getObjectBySlug = async (slug: string): Promise<HeldObject | null> => {
  try {
    const objectsRef = collection(db, 'objects');
    const q = query(objectsRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    console.log('[DEBUG] getObjectBySlug:', { slug, found: !querySnapshot.empty, count: querySnapshot.size, docs: querySnapshot.docs.map(d => d.data()) });
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log('[DEBUG] getObjectBySlug doc:', data);
      if (!data) {
        console.warn('[DEBUG] No data found for doc');
        return null;
      }
      if (data.isPublic !== true) {
        console.warn('[DEBUG] Object is not public', { isPublic: data.isPublic });
        return null;
      }
      if (!data.title) {
        console.warn('[DEBUG] Object missing title');
        return null;
      }
      if (!data.userId) {
        console.warn('[DEBUG] Object missing userId');
        return null;
      }
      if (!data.category) {
        console.warn('[DEBUG] Object missing category');
        return null;
      }
      console.log('[DEBUG] Returning public object:', { id: doc.id, ...data });
      return { id: doc.id, ...data } as HeldObject;
    } else {
      console.warn('[DEBUG] No object found for slug:', slug);
    }
    return null;
  } catch (error) {
    console.error('[DEBUG] getObjectBySlug Firestore error:', error);
    throw error;
  }
};
// Compress and convert image to WEBP using browser APIs
export async function compressAndConvertToWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject('WEBP conversion failed');
        },
        'image/webp',
        0.8 // Compression quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
// Create a new object with image upload and optimization
export const createObject = async (userId: string, data: CreateObjectData): Promise<string> => {
  // Upload images (compress and convert to WEBP)
  let imageUrls: string[] = [];
  if (data.images && data.images.length > 0) {
    const filesToUpload = data.images.filter((img): img is File => typeof img !== 'string');
    imageUrls = await Promise.all(
      filesToUpload.map(async (file) => {
        const processedFile = await compressAndConvertToWebp(file);
        const imageRef = ref(storage, `objects/${userId}/${Date.now()}_${file.name.replace(/\.[^.]+$/, '.webp')}`);
        const snapshot = await uploadBytes(imageRef, processedFile);
        return getDownloadURL(snapshot.ref);
      })
    );
  }
  // Generate base slug
  const baseSlug = generateSlug(data.title);
  let slug = baseSlug;
  let suffix = 1;
  // Ensure slug is unique
  while (true) {
    const existing = await getObjectBySlug(slug);
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }
  // Prepare object data with all required fields for passport/public access
  const objectData = {
    title: data.title,
    maker: data.maker || '',
    year: data.year ?? undefined,
    value: data.value ?? undefined,
    category: data.category || '',
    condition: data.condition || 'fair',
    tags: Array.isArray(data.tags) ? data.tags : [],
    notes: data.notes || '',
    images: imageUrls,
    isPublic: data.isPublic === true,
    shareInCollaborative: data.shareInCollaborative ?? false,
    slug,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  // description field removed to match CreateObjectData type
  };
  // Add to Firestore
  const docRef = await addDoc(collection(db, 'objects'), objectData);
  return docRef.id;
}
// Get user by handle (for public user page)
export const getUserByHandle = async (handle: string): Promise<UserDoc | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('handle', '==', handle));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
      displayName: data.displayName || '',
      handle: data.handle || '',
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
      isPublicProfile: data.isPublicProfile ?? false,
    };
  }
  return null;
};
// Get public rotations
export const getPublicRotations = async (): Promise<Rotation[]> => {
  const rotationsRef = collection(db, 'rotations');
  const q = query(rotationsRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rotation[];
};
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
    console.log('[DEBUG] getUser raw Firestore data:', data);
    const userObj = {
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
      isPublicProfile: data.isPublicProfile ?? false,
    };
    console.log('[DEBUG] getUser returned object:', userObj);
    return userObj;
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
          // Compress and convert to WEBP before upload
          const processedFile = await compressAndConvertToWebp(file);
          const imageRef = ref(storage, `objects/${object.userId}/${Date.now()}_${file.name.replace(/\.[^.]+$/, '.webp')}`);
          const snapshot = await uploadBytes(imageRef, processedFile);
          return getDownloadURL(snapshot.ref);
        })
      );
      // When updating, images should be URLs (string[]), not File[]
      updateData.images = [...object.images, ...newImageUrls];
// Compress and convert image to WEBP using browser APIs
async function compressAndConvertToWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject('WEBP conversion failed');
        },
        'image/webp',
        0.8 // Compression quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
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
