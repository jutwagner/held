import React from 'react';
import Image from 'next/image';
import { HeldObject } from '@/types';

interface PostCardProps {
  post: HeldObject;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {post.images && post.images.length > 0 && (
        <div className="w-full relative overflow-hidden flex items-center justify-center" style={{ background: '#f3f4f6', minHeight: '320px', borderRadius: '1rem' }}>
          <Image
            src={post.images[0]}
            alt={post.title}
            width={800}
            height={600}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '1rem', maxWidth: '100%' }}
            className="rounded-xl"
            sizes="100vw"
            priority
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="text-lg font-medium mb-2">{post.title}</h2>
        <p className="text-sm text-gray-600">{post.maker}</p>
        <p className="text-sm text-gray-600">{post.condition}</p>
        <p className="text-sm text-gray-600">{post.notes}</p>
      </div>
    </div>
  );
};

export default PostCard;
