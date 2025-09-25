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
                const object = await getObject(objectId);
                if (object?.category) {
                  categorySet.add(object.category);
                }
              } catch {
                // Ignore fetch errors for individual objects
              }
            })
          );

          const categories = Array.from(categorySet).sort();
          cacheRef.current.set(rotation.id, { categories, objectIdsKey: idsKey });
          return [rotation.id, categories] as const;
        })
      );

      if (!isMounted) {
        return;
      }

      const nextMap: RotationCategoryMap = {};
      for (const [rotationId, categories] of entries) {
        nextMap[rotationId] = categories;
      }
      setCategoryMap(nextMap);
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [rotations]);

  return categoryMap;
}
