import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Clock, Share2, Bookmark, MessageCircle,
  UserPlus, UserMinus, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  capacity: number;
  attendeesCount: number;
  isAttending: boolean;
  isCreator: boolean;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  attendees: Array<{
    id: string;
    name: string;
    avatar: string;
    status: 'going' | 'maybe' | 'waitlist';
  }>;
  waitlistCount: number;
  image?: string;
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

  useEffect(() => {
    if (params.id) {
      fetchEventDetails();
      fetchComments();
    }
  }, [params.id]);

  const fetchEventDetails = async () => {
    try {
      const data = await api.get(`/api/events/${params.id}`);
      setEvent(data);
      if (data.isAttending) {
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
      const data = await api.get(`/api/events/${params.id}/comments`);
      setComments(data);
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
      const comment = await api.post(`/api/events/${event.id}/comments`, {
        text: newComment,
      });
      setComments([...comments, comment]);
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
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = event.attendeesCount >= event.capacity;
  const canJoin = !event.isAttending && !isFull;
  const isOnWaitlist = event.attendees.some(a => a.id === user?.id && a.status === 'waitlist');

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
              <Link href={`/profile/${event.creator.id}`}>
                <div className="flex items-center text-gray-600 hover:text-gray-900">
                  <img
                    src={event.creator.avatar || '/default-avatar.png'}
                    alt={event.creator.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span>Hosted by {event.creator.name}</span>
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
              <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-3 text-pink-600" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="w-5 h-5 mr-3 text-pink-600" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Users className="w-5 h-5 mr-3 text-pink-600" />
              <button
                onClick={() => setShowAttendeesModal(true)}
                className="hover:underline"
              >
                {event.attendeesCount} / {event.capacity} attending
                {event.waitlistCount > 0 && ` · ${event.waitlistCount} on waitlist`}
              </button>
            </div>
          </div>

          {/* RSVP Buttons */}
          <div className="border-t pt-4">
            {event.isCreator ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-900">You're the host of this event</span>
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
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.userAvatar || '/default-avatar.png'}
                  alt={comment.userName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{comment.userName}</div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendees Modal */}
      {showAttendeesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Attendees ({event.attendeesCount})</h3>
              <button onClick={() => setShowAttendeesModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-3">
                {event.attendees.map((attendee) => (
                  <Link key={attendee.id} href={`/profile/${attendee.id}`}>
                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <img
                        src={attendee.avatar || '/default-avatar.png'}
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
