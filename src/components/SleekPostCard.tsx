import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HeldObject, UserDoc } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Send, User, Calendar, Tag as TagIcon, ShoppingCart, ExternalLink, Info } from 'lucide-react';
import { getUser, toggleLike, getLikesCount, hasUserLiked, addComment, getComments, subscribeToComments } from '@/lib/firebase-services';
import Link from 'next/link';
import DMModal from './DMModal';
import TagList from './TagList';

interface PostCardProps {
  post: HeldObject;
}

const SleekPostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user, firebaseUser, loading } = useAuth();

  // Helper function to get platform-specific styling
  const getPlatformStyling = (platform?: string) => {
    switch (platform) {
      case 'amazon':
        return 'bg-orange-500/90 border-orange-400/30 hover:bg-orange-600/90';
      case 'ebay':
        return 'bg-blue-500/90 border-blue-400/30 hover:bg-blue-600/90';
      case 'etsy':
        return 'bg-pink-500/90 border-pink-400/30 hover:bg-pink-600/90';
      case 'shopify':
        return 'bg-green-500/90 border-green-400/30 hover:bg-green-600/90';
      default:
        return 'bg-gray-500/90 border-gray-400/30 hover:bg-gray-600/90';
    }
  };
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
  const [showDetails, setShowDetails] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
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
        // Set fallback user data that satisfies UserDoc shape
        setPostUser({
          id: post.userId,
          uid: post.userId,
          name: 'Anonymous',
          displayName: 'Anonymous',
          handle: 'anonymous',
          email: '',
          avatarUrl: '',
          objectIds: [],
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          quarterlyReview: false,
          push: false,
          premium: {
            active: false,
            plan: null,
            since: null,
            renewsAt: null,
            cancelRequested: false,
          },
          backup: { enabled: false, lastRun: null },
          security: { providers: [], sessions: [] },
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
      isLiking,
      loading
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

  // Measure overlay height when it changes
  useEffect(() => {
    if (overlayRef.current && (showComments || showDetails)) {
      const height = overlayRef.current.offsetHeight;
      setOverlayHeight(height);
    } else {
      setOverlayHeight(0);
    }
  }, [showComments, showDetails, comments]);

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
    <div className="w-full relative" style={{ marginBottom: overlayHeight > 0 ? `${overlayHeight + 16}px` : '0' }}>
      <div 
        className="overflow-hidden relative rounded-2xl transition-all duration-300 hover:scale-[1.01] cursor-pointer group shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.25)]"
        style={{ 
          willChange: 'transform',
          borderRadius: '1rem',
          transform: 'translateZ(0)'
        }}
      >
        {/* Image determines the card size */}
        {post.images && post.images.length > 0 ? (
          <div className="relative">
            <Image
              src={post.images[0]}
              alt={post.title}
              width={800}
              height={600}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              priority={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/img/placeholder.svg';
              }}
            />
            
            {/* Subtle blur gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
            
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[4/5] bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center">
            <Image src="/img/placeholder.svg" alt="No image" width={48} height={48} className="w-12 h-12 opacity-40" loading="lazy" priority={false} />
            
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          </div>
        )}

        {/* User Header - positioned at top with gradient background */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 avatar-header">
          {/* Gradient background for better readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
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
                <div className="font-medium text-white text-sm drop-shadow-lg">
                  {postUser?.displayName || 'Anonymous'}
                </div>
                <div className="text-xs text-white/90 drop-shadow-lg">
                  @{postUser?.handle || 'anonymous'}
                </div>
              </div>
            </div>
            
            {user && user.uid !== post.userId && (
              <>
                {post.openToSale ? (
                  <button
                    onClick={handleDM}
                    disabled={!user}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-colors ${
                      !user ? 'bg-green-500/50 text-white/50 border-green-400/20 cursor-not-allowed' : 'bg-green-500/90 text-white border-green-400/30 hover:bg-green-600/90'
                    }`}
                    title={!user ? 'Sign in to send messages' : 'Message seller about this item'}
                  >
                    <Send className="h-4 w-4" />
                    <span className="text-sm font-medium">Open to sale</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDM}
                    disabled={!user}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-colors ${
                      !user ? 'bg-white/10 text-white/50 border-white/20 cursor-not-allowed' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                    }`}
                    title={!user ? 'Sign in to send messages' : 'Send a message'}
                  >
                    <Send className="h-4 w-4" />
                    <span className="text-sm">Message</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content overlay - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
          {/* Title and description */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2 text-white leading-tight">{post.title}</h2>
            
            {/*post.description && (
              <p className="text-white/90 text-sm mb-3 line-clamp-2">{post.description}</p>
            )*/}
          </div>

          {/* Maker/Artist as clickable tag
          {post.maker && (
            <div className="mb-3">
              <Link
                href={`/tags/${encodeURIComponent(post.maker)}`}
                className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30 hover:bg-white/30 transition-colors"
              >
                {post.maker}
              </Link>
            </div>
          )}
          */}
          {/* Tags 
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-medium rounded-full border border-white/30"
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-medium rounded-full border border-white/30">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}*/}

          {/* Social Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLike();
                }}
                disabled={!firebaseUser || isLiking}
                className={`flex items-center gap-1.5 transition ${liked ? 'text-rose-400' : 'text-white/80 hover:text-white'} ${!firebaseUser || isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} drop-shadow-md`}
                title={!firebaseUser ? 'Sign in to like posts' : isLiking ? 'Processing...' : 'Like this post'}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : 'stroke-current'}`} />
                <span className="text-sm font-medium">{likesCount}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowComments(!showComments);
                  if (!showComments) {
                    setShowDetails(false); // Close details when opening comments
                  }
                }}
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition cursor-pointer drop-shadow-md"
                title="View comments"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{commentsCount}</span>
              </button>

              {/* Buy Button - Show for all users if post has purchase link */}
              {post.purchaseLink && (
                <a
                  href={post.purchaseLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-sm text-white border transition-colors cursor-pointer ${getPlatformStyling(post.purchaseLink.platform)}`}
                  title={`${post.purchaseLink.title || 'Buy this item'}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">Buy</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* Details Button - Always show */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                  if (!showDetails) {
                    setShowComments(false); // Close comments when opening details
                  }
                }}
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition cursor-pointer drop-shadow-md"
                title="View details"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Details</span>
              </button>
            </div>
          </div>

          {/* Sign-in Prompt for Unauthenticated Users */}
          {!firebaseUser && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Want to interact?</p>
                  <p className="text-xs text-white/80">Sign in to like, comment, and message other collectors</p>
                </div>
                <Link 
                  href="/auth/signin" 
                  className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section - Positioned below the card */}
      {showComments && (
        <div ref={overlayRef} className="absolute top-full left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl border-l border-r border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg rotation-tab max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm text-gray-900 dark:text-gray-100 font-sans">
              Comments ({commentsCount})
            </h4>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowComments(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          {/* Add Comment */}
          {firebaseUser && (
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Comment"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-sm text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xlg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commentsLoading ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center">
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-bottom border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 space-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">@{comment.userHandle}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Details Section - Positioned below the card */}
      {showDetails && (
        <div ref={overlayRef} className="absolute top-full left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl border-l border-r border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg rotation-tab max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Item Details
            </h4>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          {/* Description */}
          {post.description && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Description</h5>
              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{post.description}</p>
            </div>
          )}

          {/* Maker */}
          {post.maker && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Maker</h5>
              <Link
                href={`/tags/${encodeURIComponent(post.maker)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-block px-3 py-1.5 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
              >
                {post.maker}
              </Link>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Tags</h5>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    {tag}
                  </Link>
                ))}
                {post.tags.length > 8 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
                    +{post.tags.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {post.year && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Year:</span>
                <span className="ml-1 text-gray-900 dark:text-gray-100">{post.year}</span>
              </div>
            )}
            {post.condition && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Condition:</span>
                <span className="ml-1 text-gray-900 dark:text-gray-100 capitalize">{post.condition}</span>
              </div>
            )}
            {post.category && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span className="ml-1 text-gray-900 dark:text-gray-100 capitalize">{post.category}</span>
              </div>
            )}
            {post.value && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Value:</span>
                <span className="ml-1 text-gray-900 dark:text-gray-100">${post.value.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DM Modal */}
      {isDMOpen && postUser && (
        <DMModal
          isOpen={isDMOpen}
          onClose={() => setIsDMOpen(false)}
          targetUserId={postUser.uid}
          targetUserName={postUser.displayName || postUser.name}
        />
      )}
    </div>
  );
};

export default SleekPostCard;