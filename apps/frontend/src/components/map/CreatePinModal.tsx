import React, { useState } from 'react';
import { Modal, Input, Textarea, Select, Button } from '../common';
import { api } from '../../lib/api';
import { useMapStore } from '../../stores/mapStore';

interface CreatePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number };
}

const PIN_CATEGORIES = [
  { value: 'food', label: '🍔 Food & Dining' },
  { value: 'entertainment', label: '🎭 Entertainment' },
  { value: 'outdoors', label: '🏞️ Outdoors & Nature' },
  { value: 'sports', label: '⚽ Sports & Fitness' },
  { value: 'culture', label: '🎨 Arts & Culture' },
  { value: 'nightlife', label: '🌃 Nightlife' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'community', label: '👥 Community' },
  { value: 'other', label: '📍 Other' }
];

export const CreatePinModal: React.FC<CreatePinModalProps> = ({
  isOpen,
  onClose,
  initialLocation
}) => {
  const { addPin } = useMapStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    address: '',
    latitude: initialLocation?.lat || 0,
    longitude: initialLocation?.lng || 0,
    tags: '',
    isPublic: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/pins', {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      
      addPin(response.data);
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'other',
        address: '',
        latitude: initialLocation?.lat || 0,
        longitude: initialLocation?.lng || 0,
        tags: '',
        isPublic: true
      });
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to create pin' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Pin" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="What's this place about?"
          fullWidth
          required
        />

        <div className="w-full">
          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={PIN_CATEGORIES}
          />
        </div>

        <div className="w-full">
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="Tell us more about this place..."
            rows={4}
            required
          />
        </div>

        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          placeholder="123 Main St, City, State"
          fullWidth
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={handleChange}
            fullWidth
            readOnly
          />
          <Input
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={handleChange}
            fullWidth
            readOnly
          />
        </div>

        <Input
          label="Tags (comma separated)"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="coffee, wifi, outdoor seating"
          helperText="Add tags to help others find this pin"
          fullWidth
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-700">
            Make this pin public (visible to everyone)
          </label>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Pin
          </Button>
        </div>
      </form>
    </Modal>
  );
};
