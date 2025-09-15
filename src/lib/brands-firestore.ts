import { db } from './firebase';
import { collection, doc, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface BrandItem {
  id?: string;
  category: string;
  brand: string;
  item: string;
  era?: string;
  country?: string;
  type?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get brands for a specific category (optimized query)
export async function getBrandsByCategory(category: string, limitCount: number = 50): Promise<BrandItem[]> {
  try {
    const brandsRef = collection(db, 'brands');
    const q = query(
      brandsRef,
      where('category', '==', category),
      orderBy('brand'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BrandItem));
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

// Get items for a specific brand within a category
export async function getItemsByBrand(category: string, brand: string, limitCount: number = 50): Promise<BrandItem[]> {
  try {
    const brandsRef = collection(db, 'brands');
    const q = query(
      brandsRef,
      where('category', '==', category),
      where('brand', '==', brand),
      orderBy('item'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BrandItem));
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

// Add a new brand/item entry
export async function addBrandItem(data: Omit<BrandItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const brandsRef = collection(db, 'brands');
    const now = new Date();
    
    const docRef = await addDoc(brandsRef, {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding brand item:', error);
    throw error;
  }
}

// Real-time listener for brands by category
export function subscribeToBrandsByCategory(
  category: string, 
  callback: (brands: BrandItem[]) => void,
  limitCount: number = 50
): Unsubscribe {
  const brandsRef = collection(db, 'brands');
  const q = query(
    brandsRef,
    where('category', '==', category),
    orderBy('brand'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const brands = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BrandItem));
    callback(brands);
  });
}

// Real-time listener for items by brand
export function subscribeToItemsByBrand(
  category: string,
  brand: string,
  callback: (items: BrandItem[]) => void,
  limitCount: number = 50
): Unsubscribe {
  const brandsRef = collection(db, 'brands');
  const q = query(
    brandsRef,
    where('category', '==', category),
    where('brand', '==', brand),
    orderBy('item'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BrandItem));
    callback(items);
  });
}

// Get unique categories
export async function getCategories(): Promise<string[]> {
  try {
    const brandsRef = collection(db, 'brands');
    const snapshot = await getDocs(brandsRef);
    
    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Check if a brand/item combination already exists
export async function checkBrandItemExists(category: string, brand: string, item: string): Promise<boolean> {
  try {
    const brandsRef = collection(db, 'brands');
    const q = query(
      brandsRef,
      where('category', '==', category),
      where('brand', '==', brand),
      where('item', '==', item)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking brand item existence:', error);
    return false;
  }
}
