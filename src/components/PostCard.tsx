import React from 'react';
import { HeldObject } from '@/types';

interface PostCardProps {
  post: HeldObject;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-medium mb-2">{post.title}</h2>
      <p className="text-sm text-gray-600">{post.maker}</p>
      <p className="text-sm text-gray-600">{post.condition}</p>
      <p className="text-sm text-gray-600">{post.notes}</p>
    </div>
  );
};

export default PostCard;
