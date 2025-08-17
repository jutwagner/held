'use client';

import { useParams } from 'next/navigation';
import RotationPageClient from './RotationPageClient';

export default function Page() {
  const params = useParams();
  const { id } = params;

  return <RotationPageClient id={id} />;
}
