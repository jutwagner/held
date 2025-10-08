import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { HeldObject, UserDoc } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Send, User, Calendar, Tag as TagIcon } from 'lucide-react';
import { getUser, toggleLike, getLikesCount, hasUserLiked, addComment, getComments, subscribeToComments } from '@/lib/firebase-services';
import Link from 'next/link';
import DMModal from './DMModal';
import TagList from './TagList';

interface PostCardProps {
  post: HeldObject;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user, firebaseUser, loading } = useAuth();
  const [postUser, setPostUser] = useState<UserDoc | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<Array<{
    id: string;
    userId: string;
    userDisplayName: string;
    userHandle: string;
    text: string;
    createdAt: Date;
  }>>([]);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const isOwner = !!firebaseUser && firebaseUser.uid === post.userId;

  // Fetch post user data and social data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user data for:', post.userId);
        const userData = await getUser(post.userId);
        console.log('Fetched user data:', userData);
        setPostUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        // Set fallback user data
        setPostUser({
          id: post.userId,
          uid: post.userId,
          name: 'Anonymous',
          displayName: 'Anonymous',
          handle: 'anonymous',
          avatarUrl: '',
          bio: '',
          objectIds: [],
          isPublic: false,
          quarterlyReview: false,
          push: false,
          theme: 'light',
          typeTitleSerif: false,
          typeMetaMono: false,
          density: 'standard',
          notifications: {
            monthlyRotation: false,
            quarterlyReview: false,
            email: false,
            push: false,
            dms: false,
          },
          premium: {
            active: false,
            plan: null,
            since: null,
            renewsAt: null,
          },
          backup: { enabled: false, lastRun: null },
          security: {
            providers: [],
            sessions: [],
          },
          isPublicProfile: false,
          createdAt: new Date(),
        });
      }
    };
    
    const fetchSocialData = async () => {
      if (!firebaseUser) {
        console.log('No firebaseUser, skipping social data fetch');
        return;
      }
      
      if (loading) {
        console.log('Auth still loading, skipping social data fetch');
        return;
      }
      
      // Double-check that Firebase Auth is ready
      if (!firebaseUser.uid) {
        console.log('Firebase user UID not available, skipping social data fetch');
        return;
      }
      
      try {
        console.log('Fetching social data for post:', post.id, {
          firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified
          }
        });
        
        // Add a small delay to ensure Firebase Auth is fully established
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const [likes, hasLiked] = await Promise.all([
          getLikesCount(post.id),
          hasUserLiked(post.id, firebaseUser.uid)
        ]);
        console.log('Social data fetched:', { likes, hasLiked });
        setLikesCount(likes);
        setLiked(hasLiked);
      } catch (error) {
        console.error('Error fetching social data:', error);
        // Set default values on error
        setLikesCount(0);
        setLiked(false);
      }
    };
    
    fetchUser();
    // Only fetch social data if user is authenticated and auth is ready
    if (firebaseUser && !loading) {
      console.log('Auth ready, fetching social data...');
      // Ensure Firebase Auth is fully established
      if (firebaseUser.uid) {
        fetchSocialData();
      } else {
        console.log('Firebase user UID not available yet');
      }
    } else {
      console.log('Auth not ready yet:', { firebaseUser: !!firebaseUser, loading });
    }
  }, [post.userId, post.id, firebaseUser, loading]);

  // Handle like
  const handleLike = async () => {
    console.log('Like button clicked!', { 
      user: !!firebaseUser, 
      postId: post.id, 
      userId: firebaseUser?.uid,
      loading,
      isLiking,
      firebaseUser: firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified
      } : null
    });
    
    if (!firebaseUser) {
      console.log('No user authenticated, cannot like');
      return;
    }
    
    if (loading) {
      console.log('Auth still loading, cannot like yet');
      return;
    }
    
    if (isLiking) {
      console.log('Already processing like, ignoring click');
      return;
    }
    
    // Prevent multiple clicks
    setIsLiking(true);
    
    // Optimistic update - show change immediately
    const wasLiked = liked;
    const oldCount = likesCount;
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    
    try {
      console.log('Attempting to toggle like...');
      
      // Add a small delay to ensure Firebase Auth is fully established
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await toggleLike(post.id, firebaseUser.uid);
      console.log('Like toggled successfully!');
    } catch (error) {
      console.error('Error toggling like:', error);
      // Rollback optimistic update on error
      setLiked(wasLiked);
      setLikesCount(oldCount);
    } finally {
      // Always reset the liking state
      setIsLiking(false);
    }
  };

  // Handle comment
  const handleComment = async () => {
    console.log('Comment button clicked!', { user: !!firebaseUser, comment: newComment.trim() });
    if (!firebaseUser) {
      console.log('No user authenticated, cannot comment');
      return;
    }
    if (!newComment.trim()) {
      console.log('No comment text, cannot submit');
      return;
    }
    
    const commentText = newComment.trim();
    setNewComment(''); // Clear input immediately for better UX
    
    try {
      console.log('Attempting to add comment...');
      await addComment(post.id, {
        userId: firebaseUser.uid,
        userDisplayName: user?.displayName || 'Anonymous',
        userHandle: user?.handle || 'anonymous',
        text: commentText,
      });
      
      console.log('Comment added successfully!');
      // The real-time listener will update the comments automatically
    } catch (error) {
      console.error('Error adding comment:', error);
      // Restore the comment text if it failed
      setNewComment(commentText);
    }
  };

  // Subscribe to comments when comments section is opened
  useEffect(() => {
    if (!showComments || !firebaseUser || loading) return;
    
    const unsubscribe = subscribeToComments(post.id, (newComments) => {
      console.log('Comments updated:', newComments);
      setComments(newComments);
      setCommentsCount(newComments.length);
    });
    
    return unsubscribe;
  }, [showComments, post.id, firebaseUser, loading]);

  // Fetch initial comments when component mounts
  useEffect(() => {
    const fetchInitialComments = async () => {
      if (!firebaseUser) {
        console.log('No firebaseUser, skipping comments fetch');
        return;
      }
      
      if (loading) {
        console.log('Auth still loading, skipping comments fetch');
        return;
      }
      
      // Double-check that Firebase Auth is ready
      if (!firebaseUser.uid) {
        console.log('Firebase user UID not available, skipping comments fetch');
        return;
      }
      
      setCommentsLoading(true);
      try {
        console.log('Fetching initial comments for post:', post.id, {
          firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified
          }
        });
        
        // Add a small delay to ensure Firebase Auth is fully established
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const initialComments = await getComments(post.id);
        console.log('Initial comments fetched:', initialComments);
        setComments(initialComments);
        setCommentsCount(initialComments.length);
      } catch (error) {
        console.error('Error fetching initial comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };
    
    // Only fetch comments if user is authenticated and auth is ready
    if (firebaseUser && !loading) {
      console.log('Auth ready, fetching comments...');
      // Ensure Firebase Auth is fully established
      if (firebaseUser.uid) {
        fetchInitialComments();
      } else {
        console.log('Firebase user UID not available yet for comments');
      }
    } else {
      console.log('Auth not ready yet for comments:', { firebaseUser: !!firebaseUser, loading });
    }
  }, [post.id, firebaseUser, loading]);

  // Handle DM
  const handleDM = () => {
    console.log('DM button clicked!', { user: !!firebaseUser, postUser: !!postUser, postUserId: post.userId });
    if (!firebaseUser) {
      console.log('No user authenticated, cannot send DM');
      return;
    }
    if (!postUser) {
      console.log('No post user data, cannot send DM');
      return;
    }
    if (firebaseUser.uid === post.userId) {
      console.log('Cannot message yourself');
      return;
    }
    
    // Open DM modal
    console.log('Open DM with:', postUser.handle || postUser.displayName || 'Unknown User');
    setIsDMOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow overflow-hidden transition-colors">
      {/* User Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {postUser?.avatarUrl ? (
                <Image
                  src={postUser.avatarUrl}
                  alt={postUser.displayName}
                  width={40}
                  height={40}
                  className="rounded-full avatarCollaborative"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {postUser?.displayName || 'Anonymous'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{postUser?.handle || 'anonymous'}
              </div>
            </div>
          </div>
          
          {user && user.uid !== post.userId && (
            <button
              onClick={handleDM}
              disabled={!user}
              className={`flex items-center space-x-1 transition-colors ${
                !user ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer'
              }`}
              title={!user ? 'Sign in to send messages' : 'Send a message'}
            >
              <Send className="h-4 w-4" />
              <span className="text-sm">Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      {post.images && post.images.length > 0 && (
        <div className="w-full relative overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-900">
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
        <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{post.title}</h2>
        {/* {post.maker && <p className="text-sm text-gray-600 mb-1">by {post.maker}</p>}
        {post.year && <p className="text-sm text-gray-600 mb-1">{post.year}</p>} */}
        {/* <p className="text-sm text-gray-600 mb-2 capitalize">{post.condition}</p> */}
        {post.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line">{post.description}</p>
        )}
        {post.notes && <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{post.notes}</p>}
        
        {/* Maker/Artist as clickable tag */}
        {post.maker && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/tags/${encodeURIComponent(post.maker)}`}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                {post.maker}
              </Link>
            </div>
          </div>
        )}

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mb-3">
            <TagList tags={post.tags} limit={6} size="xs" />
          </div>
        )}

        {/* Post Date */}
        {/* <div className="flex items-center text-xs text-gray-500 mb-3">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div> */}

        {/* Social Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={!firebaseUser || isLiking}
              className={`flex items-center space-x-1 transition-colors ${
                liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              } ${!firebaseUser || isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={!firebaseUser ? 'Sign in to like posts' : isLiking ? 'Processing...' : 'Like this post'}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likesCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="View comments"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{commentsCount}</span>
            </button>
          </div>
          {post.openToSale && (
            <div className="flex items-center">
              {isOwner ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <Send className="h-3.5 w-3.5" /> Open to sale
                </span>
              ) : (
                <button
                  onClick={handleDM}
                  disabled={!firebaseUser}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${!firebaseUser ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                  title={!firebaseUser ? 'Sign in to message' : 'Message seller'}
                  aria-label="Message seller about this item"
                >
                  <Send className="h-3.5 w-3.5" /> Open to sale
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sign-in Prompt for Unauthenticated Users */}
        {!firebaseUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">Want to interact?</p>
                <p className="text-xs text-blue-600">Sign in to like, comment, and message other collectors</p>
              </div>
              <Link 
                href="/auth/signin" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 pt-3 mt-3">
            {/* Add Comment */}
            {firebaseUser && (
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
              {commentsLoading ? (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">Loading comments...</div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">No comments yet. Be the first to comment!</div>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50">
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
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* DM Modal */}
      <DMModal
        isOpen={isDMOpen}
        onClose={() => setIsDMOpen(false)}
        targetUserId={postUser?.uid}
        targetUserName={postUser?.handle || postUser?.displayName}
      />
    </div>
  );
};

export default PostCard;
