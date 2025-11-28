import { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock, Share2, MessageCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Event } from '../../types';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (eventId: string) => Promise<void>;
  onLeave: (eventId: string) => Promise<void>;
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  onJoin,
  onLeave,
}: EventDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!event) return null;

  const handleJoinLeave = async () => {
    setIsLoading(true);
    try {
      if (event.isAttending) {
        await onLeave(event.id);
      } else {
        await onJoin(event.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const eventDate = new Date(event.date);
  const isEventFull = event.maxAttendees && event.attendeeCount >= event.maxAttendees;
  const canJoin = !event.isAttending && !isEventFull;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
          <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
            {event.category}
          </span>
        </div>

        {/* Event Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="w-5 h-5 text-pink-600" />
            <span>
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="w-5 h-5 text-pink-600" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-pink-600" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Users className="w-5 h-5 text-pink-600" />
            <span>
              {event.attendeeCount} {event.attendeeCount === 1 ? 'person' : 'people'} attending
              {event.maxAttendees && ` (${event.maxAttendees} max)`}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About this event</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Host */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <img
            src={event.host.avatar || '/default-avatar.png'}
            alt={event.host.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="text-sm text-gray-500">Hosted by</p>
            <p className="font-semibold text-gray-900">{event.host.name}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {event.isAttending && (
            <Button variant="outline" className="flex-1">
              <MessageCircle className="w-5 h-5 mr-2" />
              Message Group
            </Button>
          )}
          <Button
            variant={event.isAttending ? 'outline' : 'primary'}
            onClick={handleJoinLeave}
            disabled={isLoading || (!event.isAttending && isEventFull)}
            className="flex-1"
          >
            {isLoading
              ? 'Loading...'
              : event.isAttending
              ? 'Leave Event'
              : isEventFull
              ? 'Event Full'
              : 'Join Event'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
