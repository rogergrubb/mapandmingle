import React, { useState, useEffect } from 'react';
import { Modal, Button, Avatar, Badge, Textarea, EmptyState } from '../common';
import { api } from '../../lib/api';
import { Pin } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface PinDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: Pin | null;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export const PinDetailModal: React.FC<PinDetailModalProps> = ({ isOpen, onClose, pin }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pin && isOpen) {
      loadPinDetails();
    }
  }, [pin, isOpen]);

  const loadPinDetails = async () => {
    if (!pin) return;
    try {
      const [commentsRes, likesRes, savedRes] = await Promise.all([
        api.get(`/pins/${pin.id}/comments`),
        api.get(`/pins/${pin.id}/likes`),
        api.get(`/pins/${pin.id}/saved`)
      ]);
      setComments(commentsRes.data);
      setLikeCount(likesRes.data.count);
      setIsLiked(likesRes.data.isLiked);
      setIsSaved(savedRes.data.isSaved);
    } catch (error) {
      console.error('Failed to load pin details:', error);
    }
  };

  const handleLike = async () => {
    if (!pin) return;
    try {
      if (isLiked) {
        await api.delete(`/pins/${pin.id}/like`);
        setLikeCount(prev => prev - 1);
      } else {
        await api.post(`/pins/${pin.id}/like`);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSave = async () => {
    if (!pin) return;
    try {
      if (isSaved) {
        await api.delete(`/pins/${pin.id}/save`);
      } else {
        await api.post(`/pins/${pin.id}/save`);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const handleShare = async () => {
    if (!pin) return;
    const url = `${window.location.origin}/pin/${pin.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: pin.title,
          text: pin.description,
          url
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !newComment.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/pins/${pin.id}/comments`, {
        text: newComment
      });
      setComments(prev => [...prev, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pin) return null;

  const categoryIcon = pin.category === 'food' ? '🍔' :
    pin.category === 'entertainment' ? '🎭' :
    pin.category === 'outdoors' ? '🏞️' :
    pin.category === 'sports' ? '⚽' :
    pin.category === 'culture' ? '🎨' :
    pin.category === 'nightlife' ? '🌃' :
    pin.category === 'shopping' ? '🛍️' :
    pin.category === 'community' ? '👥' : '📍';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{categoryIcon}</span>
              <Badge>{pin.category}</Badge>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{pin.title}</h2>
            <p className="text-gray-600 mt-1">{pin.address}</p>
          </div>
        </div>

        {/* Description */}
        <div className="prose max-w-none">
          <p className="text-gray-700">{pin.description}</p>
        </div>

        {/* Tags */}
        {pin.tags && pin.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pin.tags.map((tag, idx) => (
              <Badge key={idx} variant="info" size="sm">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-4 py-4 border-y">
          <Button
            variant={isLiked ? 'primary' : 'ghost'}
            size="sm"
            onClick={handleLike}
            leftIcon={
              <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          >
            {likeCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          >
            {comments.length}
          </Button>

          <Button
            variant={isSaved ? 'primary' : 'ghost'}
            size="sm"
            onClick={handleSave}
            leftIcon={
              <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            }
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            }
          >
            Share
          </Button>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Comments</h3>
          
          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleAddComment} className="flex space-x-2">
              <Avatar src={user.avatar} alt={user.name} size="sm" />
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                />
              </div>
              <Button type="submit" size="sm" isLoading={isLoading} disabled={!newComment.trim()}>
                Post
              </Button>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <EmptyState
                title="No comments yet"
                description="Be the first to comment on this pin!"
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar src={comment.userAvatar} alt={comment.userName} size="sm" />
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{comment.userName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
