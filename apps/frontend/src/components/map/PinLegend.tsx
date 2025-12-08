/**
 * PinLegend - Permanent visual guide to pin colors and states
 * Displays along left edge of map - always visible
 * Captain Obvious design: zero ambiguity!
 */

export function PinLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
    >
      {/* Container with glassmorphic background */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '16px 14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          pointerEvents: 'auto',
          minWidth: '140px',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#6b7280',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        >
          Pin Guide
        </div>

        {/* Active Pins Section */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#9ca3af',
              marginBottom: '8px',
              letterSpacing: '0.3px',
            }}
          >
            ACTIVE NOW
          </div>

          {/* Where I'm At - Gray */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                border: '2px solid white',
                boxShadow: '0 3px 8px rgba(107, 114, 128, 0.4)',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#374151',
                lineHeight: '1.3',
              }}
            >
              Where I'm At
              <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '500' }}>
                Current location
              </div>
            </div>
          </div>

          {/* Where I'll Be - Yellow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                border: '2px solid white',
                boxShadow: '0 3px 8px rgba(234, 179, 8, 0.4)',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Mini countdown badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '8px',
                  fontWeight: '700',
                  padding: '2px 4px',
                  borderRadius: '6px',
                  border: '1px solid white',
                }}
              >
                2h
              </div>
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#374151',
                lineHeight: '1.3',
              }}
            >
              Where I'll Be
              <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '500' }}>
                Future arrival
              </div>
            </div>
          </div>
        </div>

        {/* Ghost Pins Section */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#9ca3af',
              marginBottom: '8px',
              letterSpacing: '0.3px',
            }}
          >
            RECENT ACTIVITY
          </div>

          {/* Recent Ghost - 60% opacity */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(156, 163, 175, 0.25)',
                opacity: 0.6,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                lineHeight: '1.3',
              }}
            >
              1-6 hours ago
              <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '500' }}>
                Just happened
              </div>
            </div>
          </div>

          {/* Old Ghost - 40% opacity */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(156, 163, 175, 0.2)',
                opacity: 0.4,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                lineHeight: '1.3',
              }}
            >
              1-3 days ago
              <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '500' }}>
                Recent past
              </div>
            </div>
          </div>

          {/* Very Old Ghost - 20% opacity */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(156, 163, 175, 0.15)',
                opacity: 0.25,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#9ca3af',
                lineHeight: '1.3',
              }}
            >
              3-7 days ago
              <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '500' }}>
                This week
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Colors Section */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '12px',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#9ca3af',
              marginBottom: '8px',
              letterSpacing: '0.3px',
            }}
          >
            ARRIVAL TIME
          </div>

          {/* Countdown badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid white',
                  boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
                }}
              >
                4h+
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                Hours away
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  background: '#eab308',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid white',
                  boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)',
                }}
              >
                2h
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                Soon
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  background: '#f97316',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid white',
                  boxShadow: '0 2px 6px rgba(249, 115, 22, 0.4)',
                }}
              >
                15m
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                Very soon
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid white',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                }}
              >
                Now
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                Arriving!
              </div>
            </div>
          </div>
        </div>

        {/* Auto-delete notice */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '9px',
            color: '#9ca3af',
            textAlign: 'center',
            lineHeight: '1.4',
          }}
        >
          Pins fade over time
          <br />
          Auto-deleted after 7 days
        </div>
      </div>
    </div>
  );
}
