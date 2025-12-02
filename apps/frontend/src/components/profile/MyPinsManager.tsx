import { useState, useEffect } from "react";
import { MapPin, Trash2, Edit2, Loader, Plus } from "lucide-react";
import api from "../../lib/api";

interface Pin {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  createdAt: string;
}

export default function MyPinsManager() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingPin, setCreatingPin] = useState(false);
  const [error, setError] = useState("");
  const [pinCreationSuccess, setPinCreationSuccess] = useState(false);

  useEffect(() => {
    loadUserPins();
  }, []);

  const loadUserPins = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/pins/user/mine");
      setPins(response.data || []);
      setError("");
    } catch (err: any) {
      console.error("Failed to load pins:", err);
      setError("");
      setPins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    setCreatingPin(true);
    setError("");

    try {
      // Request geolocation
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      // Create pin
      await api.post("/api/pins/auto-create", {
        latitude: position.latitude,
        longitude: position.longitude,
      });

      setPinCreationSuccess(true);
      setTimeout(() => setPinCreationSuccess(false), 3000);

      // Reload pins
      await loadUserPins();
    } catch (err: any) {
      console.error("Failed to create pin:", err);
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg?.includes("already has a pin")) {
        setError("You already have a pin. Delete it first to create a new one.");
      } else if (errorMsg?.includes("permission")) {
        setError("Please enable location permission in your browser settings.");
      } else {
        setError(errorMsg || "Failed to create pin. Please try again.");
      }
    } finally {
      setCreatingPin(false);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    if (!window.confirm("Delete this pin?")) return;
    
    setDeletingId(pinId);
    try {
      await api.delete(`/api/pins/${pinId}`);
      setPins(pins.filter(p => p.id !== pinId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete pin");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdatePin = async (pinId: string) => {
    if (!editDescription.trim()) {
      setError("Description cannot be empty");
      return;
    }

    try {
      const updatedPins = pins.map(p => 
        p.id === pinId ? { ...p, description: editDescription } : p
      );
      setPins(updatedPins);
      setEditingId(null);
      setEditDescription("");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update pin");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <MapPin className="text-primary-500" />
          My Pins
        </h2>
        <p className="text-gray-600 text-sm">Manage your location pins on the map</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {pinCreationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm flex items-center gap-2">
          <span className="text-lg">✓</span>
          Pin created successfully!
        </div>
      )}

      {pins.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No pins yet</h3>
          <p className="text-gray-600 text-sm mb-4">Create your first pin to show up on the map</p>
          <button
            onClick={handleCreatePin}
            disabled={creatingPin}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
          >
            {creatingPin ? (
              <>
                <Loader size={20} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={20} />
                Create Pin
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pins.map((pin) => (
            <div key={pin.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              {editingId === pin.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdatePin(pin.id)}
                      className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-600 mb-1">
                        {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                      </p>
                      <p className="text-gray-800">{pin.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(pin.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingId(pin.id);
                        setEditDescription(pin.description);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePin(pin.id)}
                      disabled={deletingId === pin.id}
                      className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {deletingId === pin.id ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
