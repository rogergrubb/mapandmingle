import { X, MapPin, Clock, Calendar, Flame } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegendModal({ isOpen, onClose }: LegendModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let root = document.getElementById('legend-portal');
    if (!root) {
      root = document.createElement('div');
      root.id = 'legend-portal';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  if (!isOpen || !portalRoot) return null;

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
          backdropFilter: 'blur(8px)',
          zIndex: 999998,
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={onClose}
      />

      {/* Modal Bottom Sheet */}
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        maxWidth: '600px',
        margin: '0 auto',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 50px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}>
          {/* Drag Handle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '12px',
            paddingBottom: '8px',
          }}>
            <div style={{
              width: '40px',
              height: '4px',
              backgroundColor: '#d1d5db',
              borderRadius: '2px',
            }}></div>
          </div>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}>Map Legend</h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '4px 0 0 0',
              }}>Understand your map at a glance</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={20} style={{ color: '#6b7280' }} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
          }}>
            {/* PIN TYPES */}
            <Section icon={<MapPin size={24} />} title="Pin Types" color="#a855f7">
              <LegendItem
                visual={<PinDemo color="#6b7280" />}
                title="Where I'm At"
                description="Your current location - gray circle with white dot"
              />
              <LegendItem
                visual={<PinDemo color="#eab308" badge="2h" />}
                title="Where I'll Be"
                description="Future destination - yellow pin with countdown timer"
              />
            </Section>

            {/* COUNTDOWN COLORS */}
            <Section icon={<Clock size={24} />} title="Countdown Colors" color="#ec4899">
              <CountdownColorItem color="#3b82f6" label="Blue" time="Days or 4+ hours away" example="2d, 8h" />
              <CountdownColorItem color="#eab308" label="Yellow" time="1-4 hours away" example="2h, 3h" />
              <CountdownColorItem color="#f97316" label="Orange" time="5-30 minutes" example="15m, 25m" />
              <CountdownColorItem color="#ef4444" label="Red" time="Under 5 minutes!" example="Now!" />
            </Section>

            {/* EVENTS */}
            <Section icon={<Calendar size={24} />} title="Events" color="#10b981">
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.6',
                }}>
                  Event cards show countdowns until start time using the same color system. 
                  Tap any event to see details and RSVP!
                </p>
              </div>
            </Section>

            {/* HOT ZONES */}
            <Section icon={<Flame size={24} />} title="Hot Zones" color="#f59e0b">
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.6',
                }}>
                  Red cluster markers show high activity areas. Tap to see who's there and join the action!
                </p>
              </div>
            </Section>

            {/* PRO TIP */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
              borderRadius: '12px',
              border: '2px solid rgba(168, 85, 247, 0.2)',
            }}>
              <p style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '600',
                color: '#a855f7',
                marginBottom: '4px',
              }}>💡 Pro Tip</p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.5',
              }}>
                Drop a "Where I'll Be" pin to let others know when you're heading somewhere. 
                They'll see your countdown and can plan to meet up!
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
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

// Section Component
function Section({ 
  icon, 
  title, 
  color, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  color: string; 
  children: React.ReactNode;
}) {
  return (
    <div style={{
      marginBottom: '28px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `2px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#111827',
          margin: 0,
        }}>{title}</h3>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {children}
      </div>
    </div>
  );
}

// Legend Item Component
function LegendItem({ 
  visual, 
  title, 
  description 
}: { 
  visual: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: '12px',
    }}>
      <div style={{
        minWidth: '60px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        {visual}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '2px',
        }}>{title}</p>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: '1.4',
        }}>{description}</p>
      </div>
    </div>
  );
}

// Countdown Color Item
function CountdownColorItem({ 
  color, 
  label, 
  time, 
  example 
}: { 
  color: string; 
  label: string; 
  time: string; 
  example: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: '12px',
    }}>
      <div style={{
        minWidth: '50px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          padding: '6px 12px',
          backgroundColor: color,
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
          borderRadius: '8px',
          boxShadow: `0 2px 8px ${color}40`,
        }}>
          🕐 {example.split(',')[0]}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '2px',
        }}>{label}</p>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#6b7280',
        }}>{time}</p>
      </div>
    </div>
  );
}

// Pin Demo Component
function PinDemo({ color, badge }: { color: string; badge?: string }) {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {badge && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: color === '#eab308' ? '#f97316' : '#3b82f6',
          color: 'white',
          fontSize: '10px',
          fontWeight: '700',
          padding: '3px 6px',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          zIndex: 10,
        }}>
          🕐 {badge}
        </div>
      )}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        border: '3px solid white',
        boxShadow: `0 4px 12px ${color}60`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {badge ? (
          <div style={{ fontSize: '18px' }}>📍</div>
        ) : (
          <div style={{
            width: '14px',
            height: '14px',
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: 0.9,
          }}></div>
        )}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '-4px',
        width: '8px',
        height: '8px',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        transform: 'rotate(45deg)',
      }}></div>
    </div>
  );
}
