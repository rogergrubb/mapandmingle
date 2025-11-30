import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Clock, Share2, Bookmark, MessageCircle,
  UserPlus, UserMinus, AlertCircle, CheckCircle, X, Edit2, Trash2, Flag
} from 'lucide-react';
import { Button } from '../components/common/Button';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  venueAddress?: string;
  latitude: number;
  longitude: number;
  category: string;
  maxAttendees?: number;
  image?: string;
  host: {
    id: string;
    name: string;
    image?: string;
  };
  attendees: Array<{
    id: string;
    name: string;
    image?: string;
    status: 'going' | 'maybe' | 'waitlist';
  }>;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

export function EventDetail() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<'going' | 'maybe' | null>(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [reportModal, setReportModal] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchEventDetails();
      fetchComments();
    }
  }, [params.id]);

  const fetchEventDetails = async () => {
    try {
      const response: any = await api.get(`/api/events/${params.id}`);
      // API interceptor already extracts .data
      setEvent(response);
      if (response?.isAttending) {
        setRsvpStatus('going');
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response: any = await api.get(`/api/events/${params.id}/comments`);
      setComments(response || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleRSVP = async (status: 'going' | 'maybe') => {
    if (!event) return;

    try {
      await api.post(`/api/events/${event.id}/rsvp`, { status });
      setRsvpStatus(status);
      fetchEventDetails(); // Refresh to get updated counts
    } catch (error) {
      console.error('Failed to RSVP:', error);
    }
  };

  const handleLeave = async () => {
    if (!event) return;

    try {
      await api.delete(`/api/events/${event.id}/rsvp`);
      setRsvpStatus(null);
      fetchEventDetails();
    } catch (error) {
      console.error('Failed to leave event:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !event) return;

    try {
      const response: Comment = await api.post(`/api/events/${event.id}/comments`, {
        text: newComment,
      });

      setComments((prev) => [...prev, response]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share && event) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    }
  };

  const handleSave = async () => {
    if (!event) return;
    try {
      await api.post(`/api/events/${event.id}/save`);
      alert('Event saved!');
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/api/events/${event.id}`);
      navigate('/events', { replace: true });
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!event) return;
    
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;
    
    try {
      await api.delete(`/api/events/${event.id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleReportComment = (comment: Comment) => {
    setReportModal(comment);
    setReportReason('inappropriate');
    setReportDescription('');
  };

  const submitReport = async () => {
    if (!reportModal || !event) return;
    
    try {
      await api.post(`/api/events/${event.id}/comments/${reportModal.id}/report`, {
        reason: reportReason,
        description: reportDescription,
      });
      
      alert('Report submitted. Our team will review it.');
      setReportModal(null);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const attendeesCount = event.attendees?.length || 0;
  const capacity = event.maxAttendees || 999;
  const isFull = attendeesCount >= capacity;
  const isAttending = event.attendees?.some(a => a.id === user?.id);
  const isCreator = event.host?.id === user?.id;
  const canJoin = !isAttending && !isFull;
  const isOnWaitlist = event.attendees?.some(a => a.id === user?.id && a.status === 'waitlist');

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Image */}
      {event.image && (
        <div className="h-64 bg-gray-200">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium mb-2">
                {event.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <Link to={`/profile/${event.host?.id}`}>
                <div className="flex items-center text-gray-600 hover:text-gray-900">
                  <img
                    src={event.host?.image || '/default-avatar.png'}
                    alt={event.host?.name || 'Host'}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span>Hosted by {event.host?.name || 'Unknown'}</span>
                </div>
              </Link>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 mr-3 text-pink-600" />
              <span>{formatEventDate(event.startTime)}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-3 text-pink-600" />
              <span>{formatEventTime(event.startTime)}{event.endTime ? ` - ${formatEventTime(event.endTime)}` : ''}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="w-5 h-5 mr-3 text-pink-600" />
              <span>{event.venueName || event.venueAddress || 'Location TBD'}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Users className="w-5 h-5 mr-3 text-pink-600" />
              <button
                onClick={() => setShowAttendeesModal(true)}
                className="hover:underline"
              >
                {attendeesCount}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attending
              </button>
            </div>
          </div>

          {/* RSVP Buttons */}
          <div className="border-t pt-4">
            {isCreator ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-blue-900">You're the host of this event</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Event
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDeleteEvent}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </Button>
                </div>
              </div>
            ) : rsvpStatus ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    {isOnWaitlist ? "You're on the waitlist" : "You're attending this event"}
                  </span>
                </div>
                <Button variant="outline" onClick={handleLeave}>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Leave Event
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                {canJoin ? (
                  <>
                    <Button onClick={() => handleRSVP('going')} className="flex-1">
                      <UserPlus className="w-4 h-4 mr-2" />
                      I'm Going
                    </Button>
                    <Button variant="outline" onClick={() => handleRSVP('maybe')} className="flex-1">
                      Maybe
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleRSVP('going')} className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Waitlist
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">About This Event</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Discussion ({comments.length})
          </h2>

          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <img
                    src={comment.userAvatar || '/default-avatar.png'}
                    alt={comment.userName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{comment.userName}</div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Delete button - shown to comment author or event host */}
                          {(comment.userId === user?.id || isCreator) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {/* Report button - shown to event host for other users' comments */}
                          {isCreator && comment.userId !== user?.id && (
                            <button
                              onClick={() => handleReportComment(comment)}
                              className="p-1 text-gray-400 hover:text-orange-500"
                              title="Report user"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Modal */}
        {reportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-bold text-red-600">Report User</h3>
                <button onClick={() => setReportModal(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Reporting comment by:</p>
                  <p className="font-medium">{reportModal.userName}</p>
                  <p className="text-gray-700 mt-2 italic">"{reportModal.text}"</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="harassment">Harassment</option>
                    <option value="spam">Spam</option>
                    <option value="hate_speech">Hate speech</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide additional context for the admin..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setReportModal(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitReport}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Submit Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendees Modal */}
      {showAttendeesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Attendees ({attendeesCount})</h3>
              <button onClick={() => setShowAttendeesModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-3">
                {event.attendees?.map((attendee) => (
                  <Link key={attendee.id} to={`/profile/${attendee.id}`}>
                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <img
                        src={attendee.image || '/default-avatar.png'}
                        alt={attendee.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{attendee.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{attendee.status}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
