import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  pinId?: string;
}

export default function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName, pinId }: ReportModalProps) {
  const [category, setCategory] = useState<string>('harassment');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return;
      }
    }

    setFiles([...files, ...selectedFiles]);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please describe the violation');
      return;
    }

    if (description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      const screenshots: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        screenshots.push(base64);
      }

      const response: any = await api.post('/api/reports', {
        reportedUserId,
        category,
        description,
        screenshots,
        pinId,
      });

      setConfirmationNumber(response.confirmationNumber);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-6">
          <h2 className="text-xl font-bold text-gray-900">Report User</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
              <p className="text-gray-600 mb-4">
                Your report is anonymous and will not be shared with the reported user.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-mono text-blue-900 font-semibold">
                  Confirmation #: {confirmationNumber}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Save this number to check your report status
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Provide Proof</p>
                  <p>Please provide screenshot(s) or clear evidence of the violation. Reports without proof may not be actioned.</p>
                </div>
              </div>

              {/* Reported User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting
                </label>
                <div className="bg-gray-100 rounded-lg p-3 text-gray-900 font-semibold">
                  {reportedUserName}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Violation Type *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="threats">Threats or Violence</option>
                  <option value="sexual_content">Sexual or Explicit Content</option>
                  <option value="spam">Spam or Scam</option>
                  <option value="fraud">Fraud or Deception</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened and why you're reporting this user..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/1000</p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshots ({files.length}/5)
                </label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-pink-500 transition-colors">
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={20} className="text-gray-600" />
                    <span className="text-gray-600">Click to upload (max 5MB each)</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Your identity will remain anonymous. This report will not be shown to the user.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
