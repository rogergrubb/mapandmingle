import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (arrivalTime: Date) => void;
}

export function TimePickerModal({ isOpen, onClose, onConfirm }: TimePickerModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or get portal root
    let root = document.getElementById('time-picker-portal');
    if (!root) {
      root = document.createElement('div');
      root.id = 'time-picker-portal';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  console.log('🎯 TimePickerModal render:', { isOpen });

  if (!isOpen || !portalRoot) return null;

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

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000000,
        maxWidth: '512px',
        margin: '0 auto',
        pointerEvents: 'none',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 50px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease-out',
          pointerEvents: 'auto',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
            }}>When will you be there?</h3>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} style={{ color: '#6b7280' }} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            padding: '20px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}>
            {/* Selected time display */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#faf5ff',
              borderRadius: '12px',
              border: '2px solid #e9d5ff',
            }}>
              <p style={{
                fontSize: '14px',
                color: '#9333ea',
                fontWeight: '500',
                marginBottom: '4px',
                marginTop: 0,
              }}>You'll arrive:</p>
              <p style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#581c87',
                margin: 0,
              }}>{formatDateTime(customDate)}</p>
            </div>

            {/* Quick options grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickSelect(option.value, option.label)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedOption === option.label ? '#a855f7' : '#f9fafb',
                    color: selectedOption === option.label ? 'white' : '#374151',
                    boxShadow: selectedOption === option.label 
                      ? '0 10px 25px rgba(168, 85, 247, 0.3)' 
                      : 'none',
                    transform: selectedOption === option.label ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom date/time picker */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '12px',
                marginTop: 0,
              }}>Or choose a specific time:</p>
              <input
                type="datetime-local"
                value={customDate.toISOString().slice(0, 16)}
                onChange={(e) => {
                  setCustomDate(new Date(e.target.value));
                  setSelectedOption('custom');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #f3f4f6',
          }}>
            <button
              onClick={handleConfirm}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(168, 85, 247, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(168, 85, 247, 0.3)';
              }}
            >
              Set Arrival Time
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, portalRoot);
}
