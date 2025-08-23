import { getUserByHandle } from '../../lib/firebase-services';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function VanityUserPage({ params }: { params: { handle: string } }) {
  // Strip leading @ if present
  const cleanHandle = params.handle.startsWith('@') ? params.handle.slice(1) : params.handle;
  const user = await getUserByHandle(cleanHandle);

  if (!user || !user.isPublicProfile) {
    notFound();
  }

  return (
    <main className="held-container py-12">
      <div className="flex flex-col items-center gap-6">
        <Image
          src={user.avatarUrl || '/placeholder.png'}
          alt={user.displayName || user.handle}
          width={128}
          height={128}
          className="w-32 h-32 rounded-full border-4 border-blue-200 shadow mb-4"
        />
        <h1 className="text-4xl font-serif font-bold text-gray-900">{user.displayName || user.handle}</h1>
        <p className="text-lg text-gray-600 font-mono">@{user.handle}</p>
        {user.bio && <p className="text-base text-gray-700 mt-2 whitespace-pre-line font-sans leading-relaxed">{user.bio}</p>}
        {/* Add more public info here as needed */}
      </div>
    </main>
  );
}
