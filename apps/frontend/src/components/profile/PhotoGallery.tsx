import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Camera, Star, Trash2, GripVertical, Download } from 'lucide-react';
import api from '../../lib/api';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  order: number;
  isProfilePic: boolean;
  createdAt: string;
}

interface PhotoGalleryProps {
  userId: string;
  isOwner: boolean;
  onPhotoCountChange?: (count: number) => void;
}

export function PhotoGallery({ userId, isOwner, onPhotoCountChange }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const endpoint = isOwner ? '/api/photos' : `/api/photos/user/${userId}`;
      const response = await api.get(endpoint);
      setPhotos(response.data.photos || []);
      onPhotoCountChange?.(response.data.photos?.length || 0);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, isOwner, onPhotoCountChange]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    if (photos.length >= 25) {
      setError('Maximum 25 photos allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get presigned upload URL
      const { data: uploadData } = await api.get('/api/photos/upload-url', {
        params: {
          contentType: file.type,
          filename: file.name,
        },
      });

      // Upload to S3
      await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Save photo record
      await api.post('/api/photos', {
        url: uploadData.publicUrl,
      });

      // Refresh photos
      fetchPhotos();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await api.delete(`/api/photos/${photoId}`);
      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      onPhotoCountChange?.(photos.length - 1);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete photo');
    }
  };

  const handleSetProfilePic = async (photoId: string) => {
    try {
      await api.put(`/api/photos/${photoId}`, { isProfilePic: true });
      setPhotos(photos.map(p => ({
        ...p,
        isProfilePic: p.id === photoId,
      })));
      setSelectedPhoto(null);
    } catch (err) {
      console.error('Failed to set profile pic:', err);
      setError('Failed to set profile picture');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-pink-500" />
          <span className="font-semibold text-gray-900">Photos</span>
          <span className="text-sm text-gray-400">({photos.length}/25)</span>
        </div>
        
        {isOwner && photos.length < 25 && (
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
            <Plus size={16} />
            <span>Add</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <div className="mx-4 mt-3 px-3 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          {isOwner ? (
            <div>
              <Camera size={32} className="mx-auto mb-2 opacity-50" />
              <p>Add photos to your profile</p>
              <p className="text-sm">Show off your personality!</p>
            </div>
          ) : (
            <p>No photos yet</p>
          )}
        </div>
      ) : (
        <div className="p-3 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Profile pic indicator */}
              {photo.isProfilePic && (
                <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <Star size={14} className="text-white fill-white" />
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={24} />
          </button>

          <div 
            className="max-w-3xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Photo'}
              className="max-w-full max-h-[70vh] object-contain rounded-xl"
            />
            
            {/* Photo actions for owner */}
            {isOwner && (
              <div className="mt-4 flex justify-center gap-3">
                {!selectedPhoto.isProfilePic && (
                  <button
                    onClick={() => handleSetProfilePic(selectedPhoto.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Star size={18} />
                    Set as Profile
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            )}

            {/* Caption */}
            {selectedPhoto.caption && (
              <p className="mt-3 text-center text-white/80">{selectedPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
