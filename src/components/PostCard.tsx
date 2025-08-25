import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { HeldObject, UserDoc } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Send, User, Calendar } from 'lucide-react';
import { getUser, toggleLike, getLikesCount, hasUserLiked, addComment, subscribeToComments } from '@/lib/firebase-services';

interface PostCardProps {
  post: HeldObject;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const [postUser, setPostUser] = useState<UserDoc | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    userId: string;
    userDisplayName: string;
    userHandle: string;
    text: string;
    createdAt: Date;
  }>>([]);

  // Fetch post user data and social data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser(post.userId);
        setPostUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    const fetchSocialData = async () => {
      if (!user) return;
      
      try {
        const [likes, hasLiked] = await Promise.all([
          getLikesCount(post.id),
          hasUserLiked(post.id, user.uid)
        ]);
        setLikesCount(likes);
        setLiked(hasLiked);
      } catch (error) {
        console.error('Error fetching social data:', error);
      }
    };
    
    fetchUser();
    fetchSocialData();
  }, [post.userId, post.id, user]);

  // Handle like
  const handleLike = async () => {
    if (!user) return;
    
    try {
      await toggleLike(post.id, user.uid);
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle comment
  const handleComment = async () => {
    if (!user || !newComment.trim()) return;
    
    try {
      await addComment(post.id, {
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userHandle: user.handle || 'anonymous',
        text: newComment.trim(),
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Subscribe to comments when comments section is opened
  useEffect(() => {
    if (!showComments) return;
    
    const unsubscribe = subscribeToComments(post.id, (newComments) => {
      setComments(newComments);
      setCommentsCount(newComments.length);
    });
    
    return unsubscribe;
  }, [showComments, post.id]);

  // Handle DM
  const handleDM = () => {
    if (!user || !postUser) return;
    
    // TODO: Implement DM functionality
    // This could open a modal or navigate to a DM page
    console.log('Open DM with:', postUser.handle);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* User Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {postUser?.avatarUrl ? (
                <Image
                  src={postUser.avatarUrl}
                  alt={postUser.displayName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {postUser?.displayName || 'Anonymous'}
              </div>
              <div className="text-sm text-gray-500">
                @{postUser?.handle || 'anonymous'}
              </div>
            </div>
          </div>
          
          {user && user.uid !== post.userId && (
            <button
              onClick={handleDM}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="text-sm">Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      {post.images && post.images.length > 0 && (
        <div className="w-full relative overflow-hidden flex items-center justify-center" style={{ background: '#f3f4f6', minHeight: '320px' }}>
          <Image
            src={post.images[0]}
            alt={post.title}
            width={800}
            height={600}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', maxWidth: '100%' }}
            className="rounded-none"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h2 className="text-lg font-medium mb-2">{post.title}</h2>
        {post.maker && <p className="text-sm text-gray-600 mb-1">by {post.maker}</p>}
        {post.year && <p className="text-sm text-gray-600 mb-1">{post.year}</p>}
        <p className="text-sm text-gray-600 mb-2 capitalize">{post.condition}</p>
        {post.notes && <p className="text-sm text-gray-700 mb-3">{post.notes}</p>}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Date */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>

        {/* Social Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likesCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{commentsCount}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 pt-3 mt-3">
            {/* Add Comment */}
            {user && (
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.userDisplayName}
                      </span>
                      <span className="text-xs text-gray-500">
                        @{comment.userHandle}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
