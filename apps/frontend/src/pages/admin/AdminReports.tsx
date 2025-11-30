import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, AlertTriangle, CheckCircle, XCircle, Clock, 
  User, MessageSquare, Calendar, Shield, Ban
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  reportedUser: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  event?: {
    id: string;
    title: string;
  };
  comment?: {
    id: string;
    text: string;
    createdAt: string;
  };
}

export function AdminReports() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response: { reports: Report[]; pagination: { page: number; total: number; totalPages: number } } = 
        await api.get(`/api/admin/reports?status=${statusFilter}&page=${pagination.page}`);
      setReports(response.reports);
      setPagination(response.pagination);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
        navigate('/');
      }
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      await api.patch(`/api/admin/reports/${reportId}`, {
        status,
        adminNotes,
      });
      
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status, adminNotes } : r
      ));
      setSelectedReport(null);
      setAdminNotes('');
      
      alert(`Report marked as ${status}`);
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report');
    }
  };

  const banUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    try {
      await api.post(`/api/admin/users/${userId}/ban`, {
        reason: adminNotes || 'Violation of community guidelines',
      });
      alert('User has been banned');
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'dismissed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      inappropriate: 'Inappropriate Content',
      harassment: 'Harassment',
      spam: 'Spam',
      hate_speech: 'Hate Speech',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-pink-500" />
                Admin Reports
              </h1>
              <p className="text-sm text-gray-500">{pagination.total} total reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['pending', 'reviewed', 'resolved', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status === 'all' ? '' : status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                (status === 'all' && !statusFilter) || statusFilter === status
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-600 border'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Reports</h3>
            <p className="text-gray-500">No reports found with the current filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                      <span className="text-sm font-medium capitalize">{report.status}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {getReasonLabel(report.reason)}
                    </span>
                  </div>

                  {/* Users */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Reporter</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={report.reporter.image || '/default-avatar.png'}
                          alt={report.reporter.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">{report.reporter.name}</p>
                          <p className="text-xs text-gray-500">{report.reporter.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Reported User</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={report.reportedUser.image || '/default-avatar.png'}
                          alt={report.reportedUser.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">{report.reportedUser.name}</p>
                          <p className="text-xs text-gray-500">{report.reportedUser.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event/Comment Context */}
                  {report.event && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Event Context
                      </p>
                      <p className="font-medium text-sm">{report.event.title}</p>
                    </div>
                  )}

                  {report.comment && (
                    <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Reported Comment
                      </p>
                      <p className="text-sm italic">"{report.comment.text}"</p>
                    </div>
                  )}

                  {/* Description */}
                  {report.description && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Additional Details</p>
                      <p className="text-sm text-gray-700">{report.description}</p>
                    </div>
                  )}

                  {/* Admin Notes (if reviewed) */}
                  {report.adminNotes && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 mb-1">Admin Notes</p>
                      <p className="text-sm">{report.adminNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes('');
                        }}
                        className="flex-1"
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateReportStatus(report.id, 'dismissed')}
                        className="flex-1 bg-gray-500 hover:bg-gray-600"
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => banUser(report.reportedUser.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">Review Report</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  Resolve
                </Button>
                <Button
                  onClick={() => {
                    updateReportStatus(selectedReport.id, 'resolved');
                    banUser(selectedReport.reportedUser.id);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Resolve & Ban
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
