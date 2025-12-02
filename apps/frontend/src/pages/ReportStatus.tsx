import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../lib/api';

export default function ReportStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirmationNumber = searchParams.get('id');
  const [loading, setLoading] = useState(!!confirmationNumber);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);
  const [input, setInput] = useState('');

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await api.get(`/api/reports/status/${input}`);
      setReport(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Report not found');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      warning_48h: 'bg-orange-100 text-orange-700',
      banned: 'bg-red-100 text-red-700',
      dismissed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'pending') return <Clock className="w-5 h-5" />;
    if (status === 'dismissed') return <XCircle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-gray-100 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Status</h1>
          <p className="text-gray-600 mb-8">Check the status of your anonymous report</p>

          <form onSubmit={handleCheckStatus} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmation Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  placeholder="e.g., RPT1234567ABCDE"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {report && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Report Information</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      {report.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-semibold text-gray-900">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {report.status !== 'pending' && (
                <div className="bg-green-50 border-l-4 border-l-green-500 p-4 rounded">
                  <h3 className="font-bold text-green-700 mb-2">✓ Action Taken</h3>
                  <p className="text-green-600">
                    Our moderation team has reviewed your report and taken appropriate action.
                  </p>
                </div>
              )}

              {report.status === 'pending' && (
                <div className="bg-blue-50 border-l-4 border-l-blue-500 p-4 rounded">
                  <h3 className="font-bold text-blue-700 mb-2">⏳ Under Review</h3>
                  <p className="text-blue-600">
                    Your report is being reviewed by our moderation team. You'll see updates here as soon as a decision is made.
                  </p>
                </div>
              )}
            </div>
          )}

          {!report && !error && (
            <div className="text-center text-gray-500">
              <p>Enter your confirmation number above to check the status of your report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
