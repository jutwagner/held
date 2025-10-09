import { useEffect, useRef, useState } from 'react';
import { getObject } from '@/lib/firebase-services';
import type { Rotation } from '@/types';

type RotationCategoryMap = Record<string, string[]>;

interface CacheEntry {
  categories: string[];
  objectIdsKey: string;
}

export function useRotationCategories(rotations: Rotation[]): RotationCategoryMap {
  const [categoryMap, setCategoryMap] = useState<RotationCategoryMap>({});
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const rotationIds = new Set(rotations.map((rotation) => rotation.id));
        for (const key of Array.from(cacheRef.current.keys())) {
          if (!rotationIds.has(key)) {
            cacheRef.current.delete(key);
          }
        }

        if (rotations.length === 0) {
          if (isMounted) {
            setCategoryMap({});
          }
          return;
        }

        const entries = await Promise.all(
          rotations.map(async (rotation) => {
            try {
              if (!rotation || !rotation.id) {
                return [null, []] as const;
              }

              const objectIds = Array.isArray(rotation.objectIds) ? rotation.objectIds : [];
              const idsKey = objectIds.slice().sort().join('|');

              const cached = cacheRef.current.get(rotation.id);
              if (cached && cached.objectIdsKey === idsKey) {
                return [rotation.id, cached.categories] as const;
              }

              if (objectIds.length === 0) {
                const categories: string[] = [];
                cacheRef.current.set(rotation.id, { categories, objectIdsKey: idsKey });
                return [rotation.id, categories] as const;
              }

              const categorySet = new Set<string>();

              await Promise.all(
                objectIds.map(async (objectId) => {
                  try {
                    if (objectId) {
                      const object = await getObject(objectId);
                      if (object?.category) {
                        categorySet.add(object.category);
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching object for category:', objectId, error);
                    // Ignore fetch errors for individual objects
                  }
                })
              );

              const categories = Array.from(categorySet).sort();
              cacheRef.current.set(rotation.id, { categories, objectIdsKey: idsKey });
              return [rotation.id, categories] as const;
            } catch (error) {
              console.error('Error processing rotation:', rotation, error);
              return [rotation?.id || null, []] as const;
            }
          })
        );

        if (!isMounted) {
          return;
        }

        const nextMap: RotationCategoryMap = {};
        for (const [rotationId, categories] of entries) {
          if (rotationId) {
            nextMap[rotationId] = Array.from(categories);
          }
        }
        setCategoryMap(nextMap);
      } catch (error) {
        console.error('Error loading rotation categories:', error);
        if (isMounted) {
          setCategoryMap({});
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [rotations]);

  return categoryMap;
}
