import { useState, ChangeEvent } from 'react';
import { X, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Textarea, Select } from '../common/index';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<void>;
}

const EVENT_CATEGORIES = [
  { value: 'social', label: '🎉 Social' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'music', label: '🎵 Music' },
  { value: 'food', label: '🍔 Food & Drink' },
  { value: 'outdoors', label: '🌳 Outdoors' },
  { value: 'learning', label: '📚 Learning' },
  { value: 'wellness', label: '🧘 Wellness' },
  { value: 'other', label: '📍 Other' },
];

export function CreateEventModal({ isOpen, onClose, onSubmit }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'social',
    date: '',
    time: '',
    location: '',
    latitude: 0,
    longitude: 0,
    maxAttendees: '',
    isPublic: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        category: 'social',
        date: '',
        time: '',
        location: '',
        latitude: 0,
        longitude: 0,
        maxAttendees: '',
        isPublic: true,
      });
      onClose();
    } catch (err) {
      setError('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Event Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Weekend Hiking Trip"
          required
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <Select
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={EVENT_CATEGORIES}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date
            </label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Time
            </label>
            <Input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Location
          </label>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter address or place name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Max Attendees (optional)
          </label>
          <Input
            type="number"
            name="maxAttendees"
            value={formData.maxAttendees}
            onChange={handleChange}
            placeholder="Leave empty for unlimited"
            min="2"
          />
        </div>

        <div className="w-full">
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell people what to expect..."
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-700">
            Make this event public (anyone can join)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
