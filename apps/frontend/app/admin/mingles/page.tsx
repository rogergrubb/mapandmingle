'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MingleRecord {
  id: string;
  hostId: string;
  hostName: string;
  hostUsername: string;
  title: string;
  description: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  locationName: string;
  maxParticipants: number;
  privacy: string;
  tags: string;
  status: string;
  isActive: boolean;
  isDraft: boolean;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
}

export default function AdminMinglesPage() {
  const [mingles, setMingles] = useState<MingleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'draft' | 'ended'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMingles();
  }, []);

  const fetchMingles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/mingles');
      setMingles(response.data);
    } catch (error) {
      console.error('Failed to fetch mingles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMingles = mingles.filter((mingle) => {
    const matchesStatus = filter === 'all' || mingle.status === filter;
    const matchesSearch =
      searchTerm === '' ||
      mingle.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mingle.hostUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mingle.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mingle.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const exportData = () => {
    const csv = [
      ['ID', 'Host Name', 'Username', 'Description', 'Location', 'Max Participants', 'Privacy', 'Tags', 'Status', 'Active', 'Photo URL', 'Start Time', 'End Time', 'Created At', 'Participants'].join(','),
      ...filteredMingles.map((m) =>
        [
          m.id,
          m.hostName,
          m.hostUsername,
          `"${m.description.replace(/"/g, '""')}"`,
          m.locationName,
          m.maxParticipants,
          m.privacy,
          m.tags,
          m.status,
          m.isActive,
          m.photoUrl || '',
          m.startTime,
          m.endTime,
          m.createdAt,
          m.participantCount,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mingles-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin: Mingle Records</h1>
          <p className="text-gray-600">Complete tracking of all user mingles (invisible to users)</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name, username, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="ended">Ended</option>
            </select>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Export CSV
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {filteredMingles.length} mingle(s) found
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Mingles</p>
            <p className="text-2xl font-bold text-gray-900">{mingles.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Currently Live</p>
            <p className="text-2xl font-bold text-green-600">{mingles.filter((m) => m.status === 'live').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Drafts</p>
            <p className="text-2xl font-bold text-yellow-600">{mingles.filter((m) => m.status === 'draft').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Participants</p>
            <p className="text-2xl font-bold text-blue-600">{mingles.reduce((sum, m) => sum + m.participantCount, 0)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading...</div>
          ) : filteredMingles.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No mingles found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Host</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Privacy</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Active</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Participants</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Photo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMingles.map((mingle) => (
                    <tr key={mingle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{mingle.hostName}</div>
                        <div className="text-gray-600">@{mingle.hostUsername}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {mingle.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mingle.locationName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mingle.privacy === 'public'
                              ? 'bg-green-100 text-green-800'
                              : mingle.privacy === 'private'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mingle.privacy}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mingle.status === 'live'
                              ? 'bg-green-100 text-green-800'
                              : mingle.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {mingle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={mingle.isActive ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                          {mingle.isActive ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{mingle.participantCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(mingle.createdAt).toLocaleDateString()} {new Date(mingle.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {mingle.photoUrl ? (
                          <a href={mingle.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:underline">View</summary>
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs">
                            <div className="mb-2">
                              <strong>Tags:</strong> {mingle.tags || 'None'}
                            </div>
                            <div className="mb-2">
                              <strong>Max Participants:</strong> {mingle.maxParticipants}
                            </div>
                            <div className="mb-2">
                              <strong>Location Coords:</strong> {mingle.latitude.toFixed(4)}, {mingle.longitude.toFixed(4)}
                            </div>
                            <div className="mb-2">
                              <strong>Start:</strong> {new Date(mingle.startTime).toLocaleString()}
                            </div>
                            <div className="mb-2">
                              <strong>End:</strong> {new Date(mingle.endTime).toLocaleString()}
                            </div>
                            <div>
                              <strong>ID:</strong> {mingle.id}
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}