import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmColor = '#ef4444',
  type = 'danger'
}: ConfirmModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let root = document.getElementById('confirm-portal');
    if (!root) {
      root = document.createElement('div');
      root.id = 'confirm-portal';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  if (!isOpen || !portalRoot) return null;

  const typeColors = {
    danger: { bg: '#fef2f2', border: '#fee2e2', icon: '#ef4444', text: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#fef3c7', icon: '#f59e0b', text: '#92400e' },
    info: { bg: '#eff6ff', border: '#dbeafe', icon: '#3b82f6', text: '#1e40af' },
  };

  const colors = typeColors[type];

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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999998,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999999,
        width: '90%',
        maxWidth: '400px',
        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 1))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}>
          {/* Icon Header */}
          <div style={{
            background: colors.bg,
            borderBottom: `1px solid ${colors.border}`,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `${colors.icon}20`,
              border: `3px solid ${colors.icon}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              {type === 'danger' ? (
                <Trash2 size={28} style={{ color: colors.icon }} />
              ) : (
                <AlertTriangle size={28} style={{ color: colors.icon }} />
              )}
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: colors.text,
              margin: 0,
              textAlign: 'center',
            }}>{title}</h2>
          </div>

          {/* Content */}
          <div style={{
            padding: '24px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '15px',
              color: '#4b5563',
              lineHeight: '1.6',
              textAlign: 'center',
            }}>{message}</p>
          </div>

          {/* Actions */}
          <div style={{
            padding: '20px 24px 24px 24px',
            display: 'flex',
            gap: '12px',
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{
                flex: 1,
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: confirmColor,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${confirmColor}40`,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${confirmColor}60`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${confirmColor}40`;
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, portalRoot);
}
