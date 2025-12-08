import { X } from 'lucide-react';
import { useState } from 'react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (arrivalTime: Date) => void;
}

export function TimePickerModal({ isOpen, onClose, onConfirm }: TimePickerModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<Date>(new Date());

  console.log('🎯 TimePickerModal render:', { isOpen });

  if (!isOpen) return null;

  console.log('✅ TimePickerModal is rendering (isOpen = true)');

  const quickOptions = [
    { label: 'In 5 minutes', value: 5 },
    { label: 'In 15 minutes', value: 15 },
    { label: 'In 30 minutes', value: 30 },
    { label: 'In 1 hour', value: 60 },
    { label: 'In 2 hours', value: 120 },
    { label: 'In 4 hours', value: 240 },
    { label: 'In 12 hours', value: 720 },
    { label: 'Tomorrow', value: 1440 },
    { label: 'In 2 days', value: 2880 },
    { label: 'In 3 days', value: 4320 },
    { label: 'This weekend', value: getMinutesUntilWeekend() },
    { label: 'Next week', value: getMinutesUntilNextWeek() },
  ];

  function getMinutesUntilWeekend() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    return daysUntilSaturday * 24 * 60;
  }

  function getMinutesUntilNextWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = ((8 - dayOfWeek) % 7) || 7;
    return daysUntilMonday * 24 * 60;
  }

  const handleQuickSelect = (minutes: number, label: string) => {
    const arrivalTime = new Date(Date.now() + minutes * 60 * 1000);
    setSelectedOption(label);
    setCustomDate(arrivalTime);
  };

  const handleConfirm = () => {
    onConfirm(customDate);
    onClose();
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-[2001] max-w-lg mx-auto">
        <div className="bg-white rounded-t-3xl shadow-2xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">When will you be there?</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Selected time display */}
            <div className="mb-5 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-1">You'll arrive:</p>
              <p className="text-lg font-bold text-purple-900">{formatDateTime(customDate)}</p>
            </div>

            {/* Quick options grid */}
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickSelect(option.value, option.label)}
                  className={`p-3 rounded-xl font-medium text-sm transition-all ${
                    selectedOption === option.label
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom date/time picker */}
            <div className="mt-5 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">Or choose a specific time:</p>
              <input
                type="datetime-local"
                value={customDate.toISOString().slice(0, 16)}
                onChange={(e) => {
                  setCustomDate(new Date(e.target.value));
                  setSelectedOption('custom');
                }}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100">
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Set Arrival Time
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
