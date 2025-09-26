"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CollaborativeView from './components/CollaborativeView';

export default function TheCollaborativePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const selectedCategory = searchParams.get('category');

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <CollaborativeView
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      showFilters
    />
  );
}
