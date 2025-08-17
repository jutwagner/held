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
  limit,
  serverTimestamp,
  writeBatch,
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
  User 
} from '@/types';
import { generateSlug } from './utils';

// User services
export const createUser = async (userData: Omit<User, 'createdAt' | 'updatedAt'>) => {
  const userRef = doc(db, 'users', userData.uid);
  const now = new Date();
  
  // Filter out undefined values
  const cleanUserData = Object.fromEntries(
    Object.entries(userData).filter(([_, value]) => value !== undefined)
  );
  
  await setDoc(userRef, {
    ...cleanUserData,
    createdAt: now,
    updatedAt: now,
  });
  
  return { ...cleanUserData, createdAt: now, updatedAt: now };
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as User;
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
  console.log('Creating object with data:', data); // Debug log

  // Upload images first
  const imageUrls = await Promise.all(
    data.images.map(async (file) => {
      const imageRef = ref(storage, `objects/${userId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('Uploaded image URL:', url); // Debug log
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
  console.log('Object created with ID:', docRef.id); // Debug log

  return {
    id: docRef.id,
    ...objectData,
  };
};

export const updateObject = async (id: string, data: UpdateObjectData): Promise<void> => {
  const objectRef = doc(db, 'objects', id);
  const updateData: any = {
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
      const newImageUrls = await Promise.all(
        data.images.map(async (file) => {
          const imageRef = ref(storage, `objects/${object.userId}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );
      
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
      } catch (error) {
        console.error('Error deleting image:', error);
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
  const updateData: any = {
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
