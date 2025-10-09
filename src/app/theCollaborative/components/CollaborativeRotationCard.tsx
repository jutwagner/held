"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HeldObject, Rotation } from '@/types';
import { getObject, getUser, toggleLike, getLikesCount, hasUserLiked, addComment, subscribeToComments } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send } from 'lucide-react';

interface CollaborativeRotationCardProps {
  rotation: Rotation;
  onDelete: () => void;
}

export default function CollaborativeRotationCard({ rotation, onDelete }: CollaborativeRotationCardProps) {
  const { firebaseUser, loading } = useAuth();
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
    if (!firebaseUser || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(rotation.id, firebaseUser.uid, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
      <div className="relative h-64 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-md pad-top-rotation opacity-90">
          <Image src="/img/rotations.svg" alt="Rotation" width={24} height={24} className="h-6 w-6 dark:invert" />
        </div>
        {rotation.coverImage && (
          <Image
            src={rotation.coverImage}
            alt="Rotation Cover"
            fill
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 blur-sm scale-105"
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
        <div className="relative z-10 w-full flex items-center justify-center">
          {loadingObjects ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : rotationObjects.length > 0 ? (
            <div className="flex items-center justify-center px-4">
              {rotationObjects.slice(0, 6).map((obj, index) => (
                <div key={obj.id} className="relative flex-shrink-0">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white shadow-xl bg-gray-200 dark:bg-gray-800 hover:scale-105 transition-transform duration-200 flex-shrink-0"
                    style={{
                      aspectRatio: '1',
                      marginLeft: index > 0 ? '-8px' : '0',
                      zIndex: 10 - index,
                    }}
                  >
                    {obj.images && obj.images.length > 0 ? (
                      <Image
                        src={obj.images[0]}
                        alt={obj.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '1' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center" style={{ aspectRatio: '1' }}>
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-gray-500">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {index === 5 && rotationObjects.length > 6 && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold font-serif">+{rotationObjects.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
              <svg width="64" height="64" fill="none" viewBox="0 0 32 32" className="text-gray-400 dark:text-gray-500">
                <rect x="3" y="3" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 12h8v8h-8z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}
        </div>
        {rotation.isPublic && (
          <div className="absolute top-3 right-3">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Public</span>
          </div>
        )}
      </div>

      <div className="p-6">
        {ownerName && (
          <div className="flex items-center gap-3 mb-3 text-sm text-gray-600 dark:text-gray-300">
            <Avatar className="h-8 w-8">
              {ownerAvatar ? (
                <AvatarImage src={ownerAvatar} alt={ownerName} />
              ) : (
                <AvatarFallback>{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium">{ownerName}</span>
          </div>
        )}
        <h3 className="font-serif font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">{rotation.name}</h3>
        {rotation.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">{rotation.description}</p>
        )}
        
        {/* Maker/Artist tags from rotation objects */}
        {rotationObjects.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(rotationObjects
                .map(obj => obj.maker)
                .filter(Boolean)
              )).slice(0, 6).map((maker) => (
                <Link
                  key={maker}
                  href={`/tags/${encodeURIComponent(maker!)}`}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  {maker}
                </Link>
              ))}
              {Array.from(new Set(rotationObjects
                .map(obj => obj.maker)
                .filter(Boolean)
              )).length > 6 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
                  +{Array.from(new Set(rotationObjects
                    .map(obj => obj.maker)
                    .filter(Boolean)
                  )).length - 6}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-400 dark:text-gray-500">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="font-medium">{rotation.objectIds?.length || 0} objects</span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {(() => {
              if (rotation.createdAt instanceof Date) {
                return rotation.createdAt.toLocaleDateString();
              }
              if (
                rotation.createdAt &&
                typeof rotation.createdAt === 'object' &&
                typeof (rotation.createdAt as any).toDate === 'function'
              ) {
                return (rotation.createdAt as any).toDate().toLocaleDateString();
              }
              return 'Recently created';
            })()}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={!firebaseUser || isLiking}
              className={`flex items-center gap-1 transition ${liked ? 'text-rose-500' : 'hover:text-gray-700 dark:hover:text-gray-200'} ${!firebaseUser || isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : 'stroke-current'}`} />
              <span className="font-medium">{likes}</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                setShowComments(!showComments);
              }}
              title="View comments"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">{commentsCount}</span>
            </button>
          </div>
          <a
            href={`/rotations/${rotation.id}`}
            className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            View Rotation
          </a>
        </div>
      </div>
      {rotation.isPublic && (
        <>
          <button
            className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition disabled:opacity-50"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            title="Delete rotation"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
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

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Comments ({commentsCount})
          </h4>
          
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
          {firebaseUser ? (
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
    </div>
  );
}
