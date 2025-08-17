import React from 'react';
import { HeldObject } from '@/types';

interface PostCardProps {
  post: HeldObject;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {post.images && post.images.length > 0 && (
        <div className="w-full aspect-square overflow-hidden"> {/* Ensures a 1:1 aspect ratio */}
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover" // Ensures the image covers the square area
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
