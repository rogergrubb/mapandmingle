import React from 'react';

/**
 * PinLegend - Permanent visual guide to pin colors and states
 * Simple inline-styled version guaranteed to render
 */

export function PinLegend() {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 999,
    pointerEvents: 'auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '16px 14px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    minWidth: '140px',
    maxWidth: '160px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6b7280',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'center',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: '8px',
    letterSpacing: '0.3px',
    marginTop: '12px',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  };

  const iconStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid white',
    flexShrink: 0,
    position: 'relative',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#374151',
    lineHeight: 1.3,
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: '9px',
    color: '#9ca3af',
    fontWeight: 500,
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '12px',
    marginTop: '16px',
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    padding: '3px 6px',
    borderRadius: '6px',
    border: '1px solid white',
    color: 'white',
    display: 'inline-block',
  };

  const noticeStyle: React.CSSProperties = {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '9px',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 1.4,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Title */}
        <div style={titleStyle}>Pin Guide</div>

        {/* Active Pins Section */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px' }}>
            ACTIVE NOW
          </div>

          {/* Where I'm At - Gray */}
          <div style={itemStyle}>
            <div
              style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                boxShadow: '0 3px 8px rgba(107, 114, 128, 0.4)',
              }}
            />
            <div>
              <div style={textStyle}>Where I'm At</div>
              <div style={subtextStyle}>Current location</div>
            </div>
          </div>

          {/* Where I'll Be - Yellow */}
          <div style={itemStyle}>
            <div
              style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                boxShadow: '0 3px 8px rgba(234, 179, 8, 0.4)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '8px',
                  fontWeight: 700,
                  padding: '2px 4px',
                  borderRadius: '6px',
                  border: '1px solid white',
                }}
              >
                2h
              </div>
            </div>
            <div>
              <div style={textStyle}>Where I'll Be</div>
              <div style={subtextStyle}>Future arrival</div>
            </div>
          </div>
        </div>

        {/* Ghost Pins Section */}
        <div style={dividerStyle}>
          <div style={sectionTitleStyle}>RECENT ACTIVITY</div>

          <div style={itemStyle}>
            <div
              style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                opacity: 0.6,
              }}
            />
            <div>
              <div style={{ ...textStyle, color: '#6b7280' }}>1-6 hours ago</div>
              <div style={subtextStyle}>Just happened</div>
            </div>
          </div>

          <div style={itemStyle}>
            <div
              style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                opacity: 0.4,
              }}
            />
            <div>
              <div style={{ ...textStyle, color: '#6b7280' }}>1-3 days ago</div>
              <div style={subtextStyle}>Recent past</div>
            </div>
          </div>

          <div style={{ ...itemStyle, marginBottom: 0 }}>
            <div
              style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                opacity: 0.6,
              }}
            />
            <div>
              <div style={{ ...textStyle, color: '#9ca3af' }}>3-7 days ago</div>
              <div style={subtextStyle}>This week</div>
            </div>
          </div>
        </div>

        {/* Countdown Colors */}
        <div style={dividerStyle}>
          <div style={sectionTitleStyle}>ARRIVAL TIME</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ ...badgeStyle, background: '#3b82f6' }}>4h+</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Hours away</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ ...badgeStyle, background: '#eab308' }}>2h</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Soon</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ ...badgeStyle, background: '#f97316' }}>15m</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Very soon</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ ...badgeStyle, background: '#ef4444' }}>Now</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Arriving!</div>
            </div>
          </div>
        </div>

        {/* Auto-delete notice */}
        <div style={noticeStyle}>
          Pins fade over time
          <br />
          Auto-deleted after 30 days
        </div>
      </div>
    </div>
  );
}
