'use client';

import { useParams } from 'next/navigation';
import RotationPageClient from './RotationPageClient';

export default function Page() {
  const params = useParams();
  const id = params && typeof params === 'object' ? (params as Record<string, string>).id : undefined;

  if (typeof id !== 'string') {
    throw new Error('Invalid id parameter');
  }

  return <RotationPageClient id={id} />;
}
 