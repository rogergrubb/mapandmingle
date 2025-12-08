import { AlertCircle, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let root = document.getElementById('confirm-dialog-portal');
    if (!root) {
      root = document.createElement('div');
      root.id = 'confirm-dialog-portal';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  if (!isOpen || !portalRoot) return null;

  const variantColors = {
    danger: {
      primary: '#ef4444',
      secondary: '#dc2626',
      light: '#fee2e2',
      icon: AlertCircle,
    },
    warning: {
      primary: '#f59e0b',
      secondary: '#d97706',
      light: '#fef3c7',
      icon: AlertCircle,
    },
    info: {
      primary: '#3b82f6',
      secondary: '#2563eb',
      light: '#dbeafe',
      icon: AlertCircle,
    },
  };

  const colors = variantColors[variant];
  const Icon = colors.icon;

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000000,
          animation: 'fadeIn 0.2s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={!isLoading ? onClose : undefined}
      >
        {/* Dialog */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            width: '100%',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Icon */}
          <div
            style={{
              padding: '24px 24px 20px 24px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: colors.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={24} style={{ color: colors.primary }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '8px',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                {message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#6b7280',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 4px 12px ${colors.primary}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}50`;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}40`;
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  {confirmText}
                </>
              )}
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
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

  return createPortal(dialogContent, portalRoot);
}
