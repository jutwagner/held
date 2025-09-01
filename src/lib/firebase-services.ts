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
import { db, storage, auth } from './firebase';
import {
  HeldObject,
  Rotation,
  RotationWithObjects,
  CreateObjectData,
  UpdateObjectData,
  CreateRotationData,
  UpdateRotationData,
  UserDoc,
  Conversation,
  Message
} from '@/types';
import { generateSlug } from './utils';

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

// Alias for getUser (for consistency)
export const getUserById = getUser;

// Upload COA image and return its download URL
export async function uploadCOAImage(file: File, objectId: string): Promise<string> {
  const storageRef = ref(storage, `coa/${objectId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
export const getObjectBySlug = async (slug: string): Promise<HeldObject | null> => {
  try {
    console.log('[DEBUG] getObjectBySlug starting with slug:', slug);
    const objectsRef = collection(db, 'objects');
    console.log('[DEBUG] Collection reference created');
    
    // First, let's try to get all objects to see if we can access the collection at all
    const allObjectsQuery = query(objectsRef, limit(5));
    const allObjectsSnapshot = await getDocs(allObjectsQuery);
    console.log('[DEBUG] All objects query result:', { 
      empty: allObjectsSnapshot.empty, 
      size: allObjectsSnapshot.size,
      docs: allObjectsSnapshot.docs.map(d => ({ id: d.id, data: d.data() }))
    });
    
    const q = query(objectsRef, where('slug', '==', slug), where('isPublic', '==', true));
    console.log('[DEBUG] Slug query created');
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
      dms: true,
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
// Standalone function to upload images
export const uploadImages = async (files: File[], userId: string): Promise<string[]> => {
  const imageUrls: string[] = [];
  
  for (const file of files) {
    if (file && file.size > 0) {
      try {
        // Convert image to WebP before upload
        const webpFile = await convertImageToWebP(file);
        const storageRef = ref(storage, `objects/${userId}/${Date.now()}_${file.name.replace(/\.[^.]+$/, '.webp')}`);
        await uploadBytes(storageRef, webpFile);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
  }
  
  return imageUrls;
};

// Account deletion
export const deleteUserAccount = async (userId: string): Promise<void> => {
  try {
    // Delete user document
    await deleteDoc(doc(db, 'users', userId));
    
    // Delete user's objects
    const objectsQuery = query(collection(db, 'objects'), where('ownerId', '==', userId));
    const objectsSnapshot = await getDocs(objectsQuery);
    
    for (const objectDoc of objectsSnapshot.docs) {
      await deleteObject(objectDoc.id);
    }
    
    // Delete user's rotations
    const rotationsQuery = query(collection(db, 'rotations'), where('ownerId', '==', userId));
    const rotationsSnapshot = await getDocs(rotationsQuery);
    
    for (const rotationDoc of rotationsSnapshot.docs) {
      await deleteDoc(doc(db, 'rotations', rotationDoc.id));
    }
    
    // Delete user's conversations
    const conversationsQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
    const conversationsSnapshot = await getDocs(conversationsQuery);
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      await deleteDoc(doc(db, 'conversations', conversationDoc.id));
    }
    
    // Clean up user presence
    try {
      await deleteDoc(doc(db, 'presence', userId));
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    console.log('✅ User data deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting user data:', error);
    throw error;
  }
};

export const createObject = async (userId: string, data: CreateObjectData): Promise<HeldObject> => {
  // Process images: if string, use as is; if File, upload as WebP
  const imageUrls: string[] = [];
  for (const img of data.images) {
    if (img && typeof img === 'string') {
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
  // Prepare object data - filter out undefined values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  
  const objectData: Record<string, unknown> = {
    ...cleanData,
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
    let newImageUrls: string[] = [];
    if (object) {
      for (const img of data.images) {
        if (typeof img !== 'string' && img instanceof File) {
          try {
            const storageRef = ref(storage, `objects/${id}/${img.name}`);
            await uploadBytes(storageRef, img);
            const url = await getDownloadURL(storageRef);
            newImageUrls.push(url);
            console.debug('[updateObject] Uploaded image:', url);
          } catch (err) {
            console.error('[updateObject] Image upload failed:', err);
          }
        } else if (typeof img === 'string') {
          newImageUrls.push(img);
        }
      }
      updateData.images = newImageUrls.filter(url => typeof url === 'string');
    }
  }

  // Update slug if title changed
  if (data.title) {
    updateData.slug = generateSlug(data.title);
  }

  delete updateData.id; // Remove id from update data
  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });
  console.debug('[updateObject] Update payload:', updateData);
  try {
    await updateDoc(objectRef, updateData);
    console.debug('[updateObject] Update successful for object:', id);
  } catch (err) {
    console.error('[updateObject] Firestore update failed:', err);
    throw err;
  }
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
    coverImage: data.coverImage,
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

// Social Features

// Like/Unlike a post
export const toggleLike = async (postId: string, userId: string): Promise<void> => {
  console.log('[DEBUG] toggleLike called with:', { postId, userId });
  
  // Check if Firebase Auth is ready
  const currentUser = auth.currentUser;
  console.log('[DEBUG] Firebase Auth current user:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : null);
  
  if (!currentUser) {
    throw new Error('Firebase Auth not ready - no current user');
  }
  
  // Wait for Firebase Auth to be fully established
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 5000);
  });
  
  const likeRef = doc(db, 'likes', `${postId}_${userId}`);
  const likeSnap = await getDoc(likeRef);
  
  if (likeSnap.exists()) {
    // Unlike
    console.log('[DEBUG] Unlike existing like');
    await deleteDoc(likeRef);
  } else {
    // Like
    console.log('[DEBUG] Creating new like');
    await setDoc(likeRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
  }
};

// Get likes count for a post
export const getLikesCount = async (postId: string): Promise<number> => {
  console.log('[DEBUG] getLikesCount called with:', { postId });
  
  // Check if Firebase Auth is ready
  const currentUser = auth.currentUser;
  console.log('[DEBUG] Firebase Auth current user for getLikesCount:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : null);
  
  const likesRef = collection(db, 'likes');
  const q = query(likesRef, where('postId', '==', postId));
  const querySnapshot = await getDocs(q);
  console.log('[DEBUG] getLikesCount result:', { count: querySnapshot.size });
  return querySnapshot.size;
};

// Check if user has liked a post
export const hasUserLiked = async (postId: string, userId: string): Promise<boolean> => {
  console.log('[DEBUG] hasUserLiked called with:', { postId, userId });
  
  // Check if Firebase Auth is ready
  const currentUser = auth.currentUser;
  console.log('[DEBUG] Firebase Auth current user for hasUserLiked:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : null);
  
  const likeRef = doc(db, 'likes', `${postId}_${userId}`);
  const likeSnap = await getDoc(likeRef);
  const exists = likeSnap.exists();
  console.log('[DEBUG] hasUserLiked result:', { exists });
  return exists;
};

// Add a comment to a post
export const addComment = async (postId: string, comment: {
  userId: string;
  userDisplayName: string;
  userHandle: string;
  text: string;
}): Promise<void> => {
  const commentId = `${postId}_${comment.userId}_${Date.now()}`;
  const commentRef = doc(db, 'comments', commentId);
  await setDoc(commentRef, {
    postId,
    ...comment,
    createdAt: serverTimestamp(),
  });
};

// Get comments for a post
export const getComments = async (postId: string): Promise<Array<{
  id: string;
  userId: string;
  userDisplayName: string;
  userHandle: string;
  text: string;
  createdAt: Date;
}>> => {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Array<{
    id: string;
    userId: string;
    userDisplayName: string;
    userHandle: string;
    text: string;
    createdAt: Date;
  }>;
};

// Real-time listener for comments
export const subscribeToComments = (postId: string, callback: (comments: Array<{
  id: string;
  userId: string;
  userDisplayName: string;
  userHandle: string;
  text: string;
  createdAt: Date;
}>) => void): () => void => {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const comments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Array<{
      id: string;
      userId: string;
      userDisplayName: string;
      userHandle: string;
      text: string;
      createdAt: Date;
    }>;
    callback(comments);
  });
  
  return unsubscribe;
};

// DM Functions
export const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    console.log('[DEBUG] Getting display name for userId:', userId);
    console.log('[DEBUG] Current auth user:', auth.currentUser?.uid);
    console.log('[DEBUG] DB instance:', !!db);
    
    // Check if we have an authenticated user
    if (!auth.currentUser) {
      console.log('[DEBUG] No authenticated user, returning default');
      return 'User';
    }
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const displayName = userData.displayName || userData.handle || 'User';
      console.log('[DEBUG] Found display name:', displayName, 'for user:', userId);
      return displayName;
    }
    console.log('[DEBUG] User document does not exist for:', userId);
    return 'User';
  } catch (error) {
    console.error('[DEBUG] Error getting user display name for', userId, ':', error);
    console.error('[DEBUG] Error details:', {
      code: (error as any).code,
      message: (error as any).message,
      authState: !!auth.currentUser
    });
    return 'User';
  }
};

export const findExistingConversation = async (participants: string[]): Promise<string | null> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', participants[0]));
  const querySnapshot = await getDocs(q);
  
  // Find conversation that contains exactly these participants
  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const conversationParticipants = data.participants || [];
    
    // Check if participants arrays are the same (regardless of order)
    if (conversationParticipants.length === participants.length &&
        participants.every(p => conversationParticipants.includes(p))) {
      return doc.id;
    }
  }
  
  return null;
};

export const createConversation = async (conversation: Omit<Conversation, 'id' | 'createdAt'>): Promise<Conversation> => {
  const conversationRef = collection(db, 'conversations');
  const docRef = await addDoc(conversationRef, {
    ...conversation,
    createdAt: serverTimestamp(),
  });
  
  return {
    id: docRef.id,
    ...conversation,
    createdAt: new Date(),
  };
};

export const sendMessage = async (message: Omit<Message, 'id'>): Promise<void> => {
  // Add null check for conversationId
  if (!message.conversationId) {
    throw new Error('ConversationId is required to send a message');
  }

  const messageRef = collection(db, 'messages');
  await addDoc(messageRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
  
  // Update conversation with last message
  const conversationRef = doc(db, 'conversations', message.conversationId);
  await updateDoc(conversationRef, {
    lastMessage: message.text,
    lastMessageTime: serverTimestamp(),
    unreadCount: serverTimestamp(), // This will be incremented by a Cloud Function
  });
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }) as Message[];
};

export const subscribeToMessages = (conversationId: string, callback: (messages: Message[]) => void): () => void => {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId), orderBy('createdAt', 'asc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Message[];
    callback(messages);
  });
  
  return unsubscribe;
};

export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    unreadCount: 0,
  });
};

export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  
  let totalUnread = 0;
  querySnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.participants[0] !== userId) { // Only count messages from others
      totalUnread += data.unreadCount || 0;
    }
  });
  
  return totalUnread;
};

export const subscribeToUnreadMessages = (userId: string, callback: (count: number) => void): () => void => {
  // Get all conversations where user is a participant
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    let totalUnread = 0;
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || [];
      const lastMessage = data.lastMessage;
      const lastMessageTime = data.lastMessageTime?.toDate();
      
      // Only count if there's actually a last message and it's recent
      if (lastMessage && lastMessageTime) {
        const hoursSinceLastMessage = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);
        
        // Consider messages from last 24 hours as potentially unread
        if (hoursSinceLastMessage < 24) {
          // Add 1 unread per active conversation (more realistic)
          totalUnread += 1;
        }
      }
    });
    
    callback(totalUnread);
  });
  
  return unsubscribe;
};

export const updateUserUnreadCount = async (userId: string, count: number): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    unreadMessages: count,
  });
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  console.log('[DEBUG] getUserConversations called for userId:', userId);
  const conversationsRef = collection(db, 'conversations');
  
  // Use simple query without orderBy to avoid issues with missing lastMessageTime
  const q = query(conversationsRef, where('participants', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  console.log('[DEBUG] Found', querySnapshot.docs.length, 'conversations');
  
  const conversations = querySnapshot.docs.map(doc => {
    const data = doc.data();
    console.log('[DEBUG] Conversation data:', doc.id, data);
    return {
      id: doc.id,
      participants: data.participants || [],
      lastMessage: data.lastMessage || '',
      lastMessageTime: data.lastMessageTime?.toDate ? data.lastMessageTime.toDate() : new Date(0), // Use epoch if no time
      unreadCount: data.unreadCount || 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  });
  
  // Sort manually by lastMessageTime (newest first)
  conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
  
  console.log('[DEBUG] Returning conversations:', conversations);
  return conversations as Conversation[];
};

export const subscribeToConversations = (userId: string, callback: (conversations: Conversation[]) => void): () => void => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId), orderBy('lastMessageTime', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const conversations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastMessageTime: doc.data().lastMessageTime?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Conversation[];
    callback(conversations);
  });
  
  return unsubscribe;
};

// Typing indicators
export const setTypingStatus = async (conversationId: string, userId: string, isTyping: boolean): Promise<void> => {
  const typingRef = doc(db, 'typing', `${conversationId}_${userId}`);
  
  if (isTyping) {
    await setDoc(typingRef, {
      conversationId,
      userId,
      timestamp: serverTimestamp(),
    });
  } else {
    await deleteDoc(typingRef);
  }
};

export const subscribeToTypingIndicators = (
  conversationId: string, 
  currentUserId: string,
  callback: (typingUsers: string[]) => void
): () => void => {
  const q = query(
    collection(db, 'typing'),
    where('conversationId', '==', conversationId)
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const typingUsers: string[] = [];
    const cutoffTime = new Date(Date.now() - 10000); // 10 seconds ago
    
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate();
      
      // Only include if typing within last 10 seconds and not current user
      if (timestamp && timestamp > cutoffTime && data.userId !== currentUserId) {
        typingUsers.push(data.userId);
      }
    });
    
    callback(typingUsers);
  });
  
  return unsubscribe;
};

// Presence system
export const setUserPresence = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    console.log('[DEBUG] Setting presence for user:', userId, 'online:', isOnline);
    console.log('[DEBUG] Current auth user:', auth.currentUser?.uid);
    console.log('[DEBUG] Auth state:', !!auth.currentUser);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('[DEBUG] No authenticated user, skipping presence update');
      return;
    }
    
    const presenceRef = doc(db, 'presence', userId);
    console.log('[DEBUG] Presence ref created for path:', `presence/${userId}`);
    
    const presenceData = {
      isOnline,
      lastSeen: serverTimestamp(),
      userId: userId // Add userId for clarity
    };
    
    console.log('[DEBUG] Setting presence data:', presenceData);
    await setDoc(presenceRef, presenceData);
    console.log('[DEBUG] Successfully set presence for user:', userId);
  } catch (error) {
    console.error('[DEBUG] Error setting presence for user:', userId, error);
    console.error('[DEBUG] Error details:', {
      code: (error as any).code,
      message: (error as any).message,
      authUser: !!auth.currentUser
    });
  }
};

export const subscribeToUserPresence = (userId: string, callback: (isOnline: boolean, lastSeen?: Date) => void): () => void => {
  const presenceRef = doc(db, 'presence', userId);
  
  const unsubscribe = onSnapshot(presenceRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const lastSeen = data.lastSeen?.toDate();
      
      // Consider user online if they were active in the last 5 minutes
      const isRecent = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;
      const isOnline = data.isOnline && isRecent;
      
      callback(isOnline, lastSeen);
    } else {
      callback(false);
    }
  });
  
  return unsubscribe;
};

export const initializePresence = (userId: string): (() => void) => {
  let initDelay: NodeJS.Timeout;
  let heartbeat: NodeJS.Timeout;
  
  // Wait for auth to be ready before starting presence
  const waitForAuth = () => {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      console.log('[DEBUG] Auth ready, initializing presence for:', userId);
      setUserPresence(userId, true);
      
      // Set up heartbeat to maintain presence
      heartbeat = setInterval(() => {
        if (auth.currentUser && auth.currentUser.uid === userId) {
          setUserPresence(userId, true);
        }
      }, 60000); // Update every minute
    } else {
      console.log('[DEBUG] Auth not ready, retrying in 1s for:', userId);
      initDelay = setTimeout(waitForAuth, 1000);
    }
  };
  
  // Start the auth check
  initDelay = setTimeout(waitForAuth, 1000);
  
  // Set up offline detection
  const handleBeforeUnload = () => {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      setUserPresence(userId, false);
    }
  };
  
  const handleVisibilityChange = () => {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      if (document.hidden) {
        setUserPresence(userId, false);
      } else {
        setUserPresence(userId, true);
      }
    }
  };
  
  // Only add listeners if we're in browser environment
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  
  // Return cleanup function
  return () => {
    clearTimeout(initDelay);
    clearInterval(heartbeat);
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    if (auth.currentUser && auth.currentUser.uid === userId) {
      setUserPresence(userId, false);
    }
  };
};
