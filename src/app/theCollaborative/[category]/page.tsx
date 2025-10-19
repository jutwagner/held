import React from 'react';
import TheCollaborativeCategoryPage from '../category/[slug]/page';

interface TheCollaborativeCategoryRouteProps {
  params: {
    category: string;
  };
}

export default function TheCollaborativeCategoryRoute({ params }: TheCollaborativeCategoryRouteProps) {
  return <TheCollaborativeCategoryPage params={{ slug: params.category }} />;
}








