"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HeldObject, Rotation } from '@/types';
import { getObject, getUser, toggleLike, getLikesCount, hasUserLiked, addComment, subscribeToComments } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Eye, Calendar, Info } from 'lucide-react';

interface CollaborativeRotationCardProps {
  rotation: Rotation;
  onDelete: () => void;
}

export default function CollaborativeRotationCard({ rotation, onDelete }: CollaborativeRotationCardProps) {
  const { user, firebaseUser, loading } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rotationObjects, setRotationObjects] = useState<HeldObject[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<{
    id: string;
    userId: string;
    userDisplayName: string;
    userHandle: string;
    text: string;
    createdAt: Date;
  }>>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchObjects = async () => {
      if (!rotation.objectIds || rotation.objectIds.length === 0) {
        setLoadingObjects(false);
        return;
      }
      try {
        const objects = await Promise.all(
          rotation.objectIds.map(async (objectId) => {
            try {
              return await getObject(objectId);
            } catch (error) {
              return null;
            }
          })
        );
        setRotationObjects(objects.filter(Boolean) as HeldObject[]);
      } catch (error) {
        // ignore fetch errors for individual objects
      } finally {
        setLoadingObjects(false);
      }
    };

    fetchObjects();
  }, [rotation.objectIds]);

  useEffect(() => {
    const fetchOwner = async () => {
      if (!rotation.userId) return;
      try {
        const user = await getUser(rotation.userId);
        if (user) {
          const name =
            (user as any).displayName ||
            (user as any).name ||
            (user as any).handle ||
            'Collector';
          const avatar =
            (user as any).avatarUrl ||
            (user as any).photoURL ||
            null;
          setOwnerName(name);
          setOwnerAvatar(typeof avatar === 'string' && avatar.trim().length > 0 ? avatar : null);
        }
      } catch (error) {
        // ignore owner fetch errors
      }
    };

    fetchOwner();
  }, [rotation.userId]);

  // Fetch social data (likes, comments)
  useEffect(() => {
    const fetchSocialData = async () => {
      if (!firebaseUser || loading) {
        console.log('Rotation social data fetch skipped:', { firebaseUser: !!firebaseUser, loading });
        return;
      }
      
      console.log('Fetching rotation social data for:', rotation.id);
      
      try {
        const [likesCount, hasLiked] = await Promise.all([
          getLikesCount(rotation.id),
          hasUserLiked(rotation.id, firebaseUser.uid)
        ]);
        console.log('Rotation social data fetched:', { likesCount, hasLiked });
        setLikes(likesCount);
        setLiked(hasLiked);
      } catch (error) {
        console.error('Error fetching rotation social data:', error);
      }
    };

    if (firebaseUser && !loading) {
      fetchSocialData();
    }
  }, [rotation.id, firebaseUser, loading]);

  // Subscribe to comments when comments section is opened
  useEffect(() => {
    if (!showComments || !firebaseUser || loading) return;
    
    const unsubscribe = subscribeToComments(rotation.id, (newComments) => {
      setComments(newComments);
      setCommentsCount(newComments.length);
    });
    
    return unsubscribe;
  }, [showComments, rotation.id, firebaseUser, loading]);

  // Measure overlay height when it changes
  useEffect(() => {
    if (overlayRef.current && (showComments || showDetails)) {
      const height = overlayRef.current.offsetHeight;
      setOverlayHeight(height);
    } else {
      setOverlayHeight(0);
    }
  }, [showComments, showDetails, comments, rotationObjects]);

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await import('@/lib/firebase-services').then((mod) => mod.deleteRotation(rotation.id));
      onDelete();
    } catch (err) {
      alert('Failed to delete rotation.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Rotation like clicked:', { 
      rotationId: rotation.id, 
      firebaseUser: !!firebaseUser, 
      loading, 
      isLiking 
    });
    
    if (!firebaseUser || loading || isLiking) {
      console.log('Cannot like rotation:', { firebaseUser: !!firebaseUser, loading, isLiking });
      return;
    }
    
    setIsLiking(true);
    
    // Optimistic update
    const wasLiked = liked;
    const oldCount = likes;
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    
    try {
      console.log('Calling toggleLike for rotation:', rotation.id);
      await toggleLike(rotation.id, firebaseUser.uid);
      console.log('Rotation like toggled successfully');
    } catch (error) {
      console.error('Error toggling rotation like:', error);
      // Rollback optimistic update on error
      setLiked(wasLiked);
      setLikes(oldCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!firebaseUser || !user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(rotation.id, {
        userId: firebaseUser.uid,
        userDisplayName: user.displayName,
        userHandle: user.handle,
        text: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative" style={{ marginBottom: overlayHeight > 0 ? `${overlayHeight + 16}px` : '0' }}>
    <Link href={`/rotations/${rotation.id}`}>
      <div 
        className="rotation-height overflow-hidden group relative rounded-2xl  cursor-pointer hover:shadow-2xl transition-shadow duration-300"
        style={{ 
          willChange: 'transform',
          borderRadius: '1rem',
          transform: 'translateZ(0)'
        }}
      >
      {/* Background Image */}
      <div className="absolute inset-0">
        {rotation.coverImage ? (
          <Image
            src={rotation.coverImage}
            alt={rotation.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600" />
        )}
      </div>

      {/* Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />


        {/* Owner Info */}
        {ownerName && (
          <div className="px-3 py-1.5 flex items-center gap-2 mb-3">
            <Avatar className="h-7 w-7 border-2 border-white shadow-lg">
              {ownerAvatar ? (
                <AvatarImage src={ownerAvatar} alt={ownerName} />
              ) : (
                <AvatarFallback className="text-xs">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-medium text-white/90 drop-shadow-md">{ownerName}</span>
          </div>
        )}



      {/* Public Badge 
      {rotation.isPublic && (
        <div className="absolute top-4 left-4 z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900 dark:text-gray-100 shadow-lg border border-white/20">
            <Eye className="h-3 w-3" />
            Public
          </span>
        </div>
      )}*/}

      {/* Content */}
      <div className="rotation-height relative z-10 flex flex-col justify-end h-full p-6">

        {/* Title */}
        <h3 className="text-2xl font-semibold text-white mb-2 line-clamp-2 drop-shadow-lg">
          {rotation.name}
        </h3>
        
        {/* Description
        {rotation.description && (
          <p className="text-white/90 text-sm mb-4 line-clamp-2 drop-shadow-md">
            {rotation.description}
          </p>
        )} */}
        
        {/* Maker/Artist tags from rotation objects */}
        {rotationObjects.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(rotationObjects
                .map(obj => obj.maker)
                .filter(Boolean)
              )).slice(0, 4).map((maker) => (
                <Link
                  key={maker}
                  href={`/tags/${encodeURIComponent(maker!)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 text-xs rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 transition drop-shadow-md"
                >
                  {maker}
                </Link>
              ))}
              {Array.from(new Set(rotationObjects
                .map(obj => obj.maker)
                .filter(Boolean)
              )).length > 4 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/20 drop-shadow-md">
                  +{Array.from(new Set(rotationObjects
                    .map(obj => obj.maker)
                    .filter(Boolean)
                  )).length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Registry Objects Circles */}
        <div className="mb-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 transition-all duration-300 group-hover:bg-white/15">
            <div className="flex justify-center items-center px-2">
              {loadingObjects ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : rotationObjects.length > 0 ? (
                <>
                  {rotationObjects.slice(0, 5).map((obj: HeldObject, index) => (
                    <div 
                      key={obj.id} 
                      className="w-12 h-12 bg-white rounded-full border-2 border-white shadow-lg overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-110"
                      style={{ 
                        zIndex: 10 - index, 
                        marginLeft: index > 0 ? '-8px' : '0',
                      }}
                    >
                      {obj.images && obj.images.length > 0 ? (
                        <Image 
                          src={obj.images[0]} 
                          alt={obj.title} 
                          width={48} 
                          height={48} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {rotationObjects.length > 5 && (
                    <div 
                      className="w-12 h-12 bg-white/90 rounded-full border-2 border-white shadow-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        zIndex: 5, 
                        marginLeft: '-8px',
                      }}
                    >
                      <span className="text-gray-700 text-xs font-semibold">+{rotationObjects.length - 5}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white/60 text-sm">No objects</div>
              )}
            </div>

          </div>
        </div>

        {/* Social Actions */}
        <div className="flex items-center justify-between">
          <div className='flex items-center space-x-4'>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleLike(e);
            }}
            disabled={!firebaseUser || isLiking}
            className={`flex items-center gap-1.5 transition ${liked ? 'text-rose-400' : 'text-white/80 hover:text-white'} ${!firebaseUser || isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} drop-shadow-md`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : 'stroke-current'}`} />
            <span className="text-sm font-medium">{likes}</span>
          </button>
          <button
            type="button"
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
          <button
            type="button"
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
      </div>
      </div>
    </Link>

      {rotation.isPublic && (
        <>

          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Confirm Delete</h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete <span className="font-bold">{rotation.name}</span>? This cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Comments Section - Positioned below the card */}
      {showComments && (
        <div ref={overlayRef} className="absolute top-full left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl border-l border-r border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg rotation-tab max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
          
          {/* Comments List */}
          <div className="max-h-96 overflow-y-auto mb-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                      {comment.userDisplayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/user/${comment.userHandle}`}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
                      >
                        {comment.userDisplayName}
                      </Link>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          {firebaseUser && user ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Sign in to comment
            </p>
          )}
        </div>
      )}

      {/* Details Section - Positioned below the card */}
      {showDetails && (
        <div ref={overlayRef} className="rotation-tab absolute top-full left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl border-l border-r border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Rotation Details
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
          {rotation.description && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Description</h5>
              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{rotation.description}</p>
            </div>
          )}

          {/* Objects in Rotation */}
          {rotationObjects.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Objects in Rotation</h5>
              <div className="grid grid-cols-2 gap-2">
                {rotationObjects.slice(0, 6).map((obj) => (
                  <div key={obj.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {obj.images && obj.images.length > 0 && (
                      <Image
                        src={obj.images[0]}
                        alt={obj.title}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{obj.title}</p>
                      {obj.maker && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{obj.maker}</p>
                      )}
                    </div>
                  </div>
                ))}
                {rotationObjects.length > 6 && (
                  <div className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400">+{rotationObjects.length - 6} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unique Makers from Objects */}
          {rotationObjects.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Featured Makers</h5>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(rotationObjects
                  .map(obj => obj.maker)
                  .filter(Boolean)
                )).slice(0, 6).map((maker) => (
                  <Link
                    key={maker}
                    href={`/tags/${encodeURIComponent(maker!)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    {maker}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Unique Tags from Objects */}
          {rotationObjects.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Tags</h5>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(rotationObjects
                  .flatMap(obj => obj.tags)
                  .filter(Boolean)
                )).slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag!)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Rotation Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Objects:</span>
              <span className="ml-1 text-gray-900 dark:text-gray-100">{rotation.objectIds?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <span className="ml-1 text-gray-900 dark:text-gray-100">
                {(() => {
                  if (rotation.createdAt instanceof Date) {
                    return rotation.createdAt.toLocaleDateString();
                  }
                  if (rotation.createdAt && typeof rotation.createdAt === 'object' && 'toDate' in rotation.createdAt) {
                    return (rotation.createdAt as any).toDate().toLocaleDateString();
                  }
                  return 'Recently';
                })()}
              </span>
            </div>
            {rotation.isPublic && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="ml-1 text-green-600 dark:text-green-400 font-medium">Public</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
