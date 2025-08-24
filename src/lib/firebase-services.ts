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
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
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

// Get user by handle (for vanity URLs)
export const getUserByHandle = async (handle: string): Promise<UserDoc | null> => {
  // Decode and strip '@' from handle
  let cleanHandle = decodeURIComponent(handle);
  if (cleanHandle.startsWith('@')) cleanHandle = cleanHandle.slice(1);
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('handle', '==', cleanHandle));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { uid: docSnap.id, ...docSnap.data() } as UserDoc;
  }
  return null;
};

// Get user by UID
export const getUser = async (uid: string): Promise<UserDoc | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserDoc;
  }
  return null;
};

// Upload COA image and return its download URL
export async function uploadCOAImage(file: File, objectId: string): Promise<string> {
  const storageRef = ref(storage, `coa/${objectId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
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
    }
    console.warn('[DEBUG] No object found for slug:', slug);
    return null;
  } catch (error) {
    console.error('[DEBUG] getObjectBySlug Firestore error:', error);
    throw error;
  }
};
// ...existing code...

// Get public rotations
// Real-time listener for public rotations (returns unsubscribe function)
export function subscribePublicRotations(callback: (rotations: Rotation[]) => void): () => void {
  const rotationsRef = collection(db, 'rotations');
  const q = query(rotationsRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
  const rotations = querySnapshot.docs.map((doc: import('firebase/firestore').QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as Rotation[];
    callback(rotations);
  });
  return unsubscribe;
}
// Update user profile
export const updateUser = async (uid: string, data: Partial<UserDoc>) => {
  const userRef = doc(db, 'users', uid);
  console.log('[DEBUG] updateUser uid:', uid);
  console.log('[DEBUG] updateUser payload:', { ...data, updatedAt: new Date() });
  await updateDoc(userRef, { ...data, updatedAt: new Date() });
};

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
    isPublicProfile: userData.isPublicProfile ?? false,
  };
  console.log('[DEBUG] createUser returned object:', userToSave);
  await setDoc(userRef, { ...userToSave, createdAt: now, updatedAt: now });
  return userToSave;
};

// Object services
// Create a new object in Firestore
export const createObject = async (userId: string, data: CreateObjectData): Promise<HeldObject> => {
  // Prepare images: upload if File, keep string URLs
  const imageUrls: string[] = [];
  if (Array.isArray(data.images) && data.images.length > 0) {
    for (const img of data.images) {
      if (typeof img === 'string') {
        imageUrls.push(img);
      } else if (img instanceof File) {
        // Convert image to WebP before upload
        const webpFile = await convertImageToWebP(img);
        const storageRef = ref(storage, `objects/${userId}/${Date.now()}_${img.name.replace(/\.[^.]+$/, '.webp')}`);
        await uploadBytes(storageRef, webpFile);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
    }
  }

  // Prepare COA: if string, use as is; if File, upload as WebP
  let coaUrl: string | undefined = undefined;
  if (data.certificateOfAuthenticity) {
    if (typeof data.certificateOfAuthenticity === 'string') {
      coaUrl = data.certificateOfAuthenticity;
    } else {
      const coaFile = data.certificateOfAuthenticity as File;
      if (coaFile && typeof coaFile.name === 'string') {
        const webpFile = await convertImageToWebP(coaFile);
        const storageRef = ref(storage, `coa/${userId}/${Date.now()}_${coaFile.name.replace(/\.[^.]+$/, '.webp')}`);
        await uploadBytes(storageRef, webpFile);
        coaUrl = await getDownloadURL(storageRef);
      }
    }
  }
// Utility: Convert image File to WebP using browser canvas
async function convertImageToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('WebP conversion failed'));
        const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
        resolve(webpFile);
      }, 'image/webp', 0.92);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

  // Prepare object data
  const objectData: Record<string, unknown> = {
    ...data,
    userId,
    images: imageUrls,
    slug: generateSlug(data.title),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  // Only add certificateOfAuthenticity if defined
  if (coaUrl !== undefined) {
    objectData.certificateOfAuthenticity = coaUrl;
  }
  // Remove File objects from images if present
  if (objectData.images && Array.isArray(objectData.images) && objectData.images.some((img: unknown) => img instanceof File)) {
    objectData.images = imageUrls;
  }
  // Write to Firestore
  const docRef = await addDoc(collection(db, 'objects'), objectData);
  return { id: docRef.id, ...objectData } as HeldObject;
};
// Real-time listener for user objects (returns unsubscribe function)
export function subscribeObjects(userId: string, callback: (objects: HeldObject[]) => void): () => void {
  const objectsRef = collection(db, 'objects');
  const q = query(
    objectsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
  const objects = querySnapshot.docs.map((doc: import('firebase/firestore').QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as HeldObject[];
    callback(objects);
  });
  return unsubscribe;
}

export const getObject = async (id: string): Promise<HeldObject | null> => {
  const objectRef = doc(db, 'objects', id);
  const objectSnap = await getDoc(objectRef);
  if (objectSnap.exists()) {
  const data = objectSnap.data() as Record<string, unknown>;
  return { id: objectSnap.id, ...data } as HeldObject;
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
      // TODO: Implement image upload and processing logic here
      // For now, only keep existing image URLs
      updateData.images = [
        ...object.images.filter(img => typeof img === 'string'),
        // ...newImageUrls.filter(url => typeof url === 'string') // Uncomment when implemented
      ];
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
// Real-time listener for user rotations (returns unsubscribe function)
export function subscribeRotations(userId: string, callback: (rotations: Rotation[]) => void): () => void {
  const rotationsRef = collection(db, 'rotations');
  let q;
  if (userId) {
    q = query(rotationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    q = query(rotationsRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'));
  }
  const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
  const rotations = querySnapshot.docs.map((doc: import('firebase/firestore').QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as Rotation[];
    callback(rotations);
  });
  return unsubscribe;
}

export const getRotation = async (id: string): Promise<Rotation | null> => {
  const rotationRef = doc(db, 'rotations', id);
  const rotationSnap = await getDoc(rotationRef);
  
  if (rotationSnap.exists()) {
  const data = rotationSnap.data() as Record<string, unknown>;
  return { id: rotationSnap.id, ...data } as Rotation;
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
  const rotationData = {
    userId,
    name: data.name,
    description: data.description,
    objectIds: data.objectIds,
    isPublic: typeof data.isPublic === 'boolean' ? data.isPublic : true,
    slug,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  console.log('[DEBUG] createRotation userId:', userId);
  console.log('[DEBUG] createRotation payload:', rotationData);
  console.log('[DEBUG] createRotation field details:');
  Object.entries(rotationData).forEach(([key, value]) => {
    console.log(`  ${key}:`, value, '| type:', typeof value);
  });
  // Extra debug for objectIds
  if ('objectIds' in rotationData) {
    console.debug('[DEBUG] objectIds Array.isArray:', Array.isArray(rotationData.objectIds));
    console.debug('[DEBUG] objectIds constructor:', rotationData.objectIds?.constructor?.name);
    if (!Array.isArray(rotationData.objectIds)) {
      console.warn('[WARN] objectIds is not a plain array:', rotationData.objectIds);
    }
  }
  // Forced explicit debug for objectIds
  if ('objectIds' in rotationData) {
    console.log('[DEBUG] objectIds value:', JSON.stringify(rotationData.objectIds));
    console.log('[DEBUG] objectIds Array.isArray:', Array.isArray(rotationData.objectIds), '| constructor:', rotationData.objectIds?.constructor?.name);
    if (!Array.isArray(rotationData.objectIds)) {
      console.warn('[WARN] objectIds is not a plain array:', rotationData.objectIds);
    }
  }
  // Try/catch for Firestore write
  try {
    const docRef = await addDoc(collection(db, 'rotations'), rotationData);
    return {
      id: docRef.id,
      ...rotationData,
    };
  } catch (error) {
    console.error('[FIRESTORE ERROR]', error);
    throw error;
  }
  // Remove createdAt and updatedAt for test
  const { createdAt, updatedAt, ...rotationDataNoTimestamps } = rotationData;
  // Debug: print Firebase Auth UID and payload userId
  // Debug: Rotation payload userId
  console.log('[DEBUG] Rotation payload userId:', userId);
  const docRef = await addDoc(collection(db, 'rotations'), rotationDataNoTimestamps);
  
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
// Real-time listener for public posts (returns unsubscribe function)
export function subscribePublicPosts(callback: (objects: HeldObject[]) => void): () => void {
  const objectsRef = collection(db, 'objects');
  const q = query(objectsRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
  const objects = querySnapshot.docs.map((doc: import('firebase/firestore').QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as HeldObject[];
    callback(objects);
  });
  return unsubscribe;
}
