"use client";

import CollaborativeView from '../../components/CollaborativeView';

interface TheCollaborativeCategoryPageProps {
  params: {
    slug: string;
  };
}

export default function TheCollaborativeCategoryPage({ params }: TheCollaborativeCategoryPageProps) {
  const category = params.slug ? decodeURIComponent(params.slug) : null;

  return (
    <CollaborativeView
      selectedCategory={category}
      showFilters={false}
    />
  );
}
