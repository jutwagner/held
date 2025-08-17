'use client';

import { useParams } from 'next/navigation';
import RotationPageClient from './RotationPageClient';

export default function Page() {
  const params = useParams();
  const { id } = params;

  if (typeof id !== 'string') {
    throw new Error('Invalid id parameter');
  }

  return <RotationPageClient id={id} />;
}
