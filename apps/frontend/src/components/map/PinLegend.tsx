import React from 'react';

/**
 * PinLegend - Permanent visual guide to pin colors and states
 * Displays along left edge of map - always visible
 * Captain Obvious design: zero ambiguity!
 */

export function PinLegend() {
  return (
    <div className="pin-legend-container">
      <style>{`
        .pin-legend-container {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }
        
        .pin-legend-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 16px 14px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.8);
          pointer-events: auto;
          min-width: 140px;
        }
        
        .pin-legend-title {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
        }
        
        .pin-legend-section {
          margin-bottom: 16px;
        }
        
        .pin-legend-section:last-of-type {
          margin-bottom: 0;
        }
        
        .pin-legend-section-title {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        
        .pin-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .pin-legend-item:last-child {
          margin-bottom: 0;
        }
        
        .pin-legend-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          flex-shrink: 0;
          position: relative;
        }
        
        .pin-legend-icon-gray {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          box-shadow: 0 3px 8px rgba(107, 114, 128, 0.4);
        }
        
        .pin-legend-icon-yellow {
          background: linear-gradient(135deg, #eab308, #f59e0b);
          box-shadow: 0 3px 8px rgba(234, 179, 8, 0.4);
        }
        
        .pin-legend-icon-ghost-60 {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          box-shadow: 0 2px 6px rgba(156, 163, 175, 0.25);
          opacity: 0.6;
        }
        
        .pin-legend-icon-ghost-40 {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          box-shadow: 0 2px 6px rgba(156, 163, 175, 0.2);
          opacity: 0.4;
        }
        
        .pin-legend-icon-ghost-25 {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          box-shadow: 0 2px 6px rgba(156, 163, 175, 0.15);
          opacity: 0.25;
        }
        
        .pin-legend-countdown-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #3b82f6;
          color: white;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 4px;
          border-radius: 6px;
          border: 1px solid white;
        }
        
        .pin-legend-text {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          line-height: 1.3;
        }
        
        .pin-legend-subtext {
          font-size: 9px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        .pin-legend-divider {
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
        }
        
        .pin-legend-countdown-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        
        .pin-legend-countdown-item:last-child {
          margin-bottom: 0;
        }
        
        .pin-legend-countdown-demo {
          font-size: 9px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 6px;
          border: 1px solid white;
          color: white;
        }
        
        .pin-legend-countdown-blue {
          background: #3b82f6;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }
        
        .pin-legend-countdown-yellow {
          background: #eab308;
          box-shadow: 0 2px 6px rgba(234, 179, 8, 0.4);
        }
        
        .pin-legend-countdown-orange {
          background: #f97316;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.4);
        }
        
        .pin-legend-countdown-red {
          background: #ef4444;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }
        
        .pin-legend-countdown-label {
          font-size: 10px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .pin-legend-notice {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 9px;
          color: #9ca3af;
          text-align: center;
          line-height: 1.4;
        }
        
        @media (max-width: 768px) {
          .pin-legend-container {
            left: 8px;
          }
          .pin-legend-card {
            min-width: 120px;
            padding: 12px 10px;
          }
        }
      `}</style>

      <div className="pin-legend-card">
        {/* Title */}
        <div className="pin-legend-title">Pin Guide</div>

        {/* Active Pins Section */}
        <div className="pin-legend-section">
          <div className="pin-legend-section-title">ACTIVE NOW</div>

          {/* Where I'm At - Gray */}
          <div className="pin-legend-item">
            <div className="pin-legend-icon pin-legend-icon-gray" />
            <div>
              <div className="pin-legend-text">
                Where I'm At
              </div>
              <div className="pin-legend-subtext">Current location</div>
            </div>
          </div>

          {/* Where I'll Be - Yellow */}
          <div className="pin-legend-item">
            <div className="pin-legend-icon pin-legend-icon-yellow">
              <div className="pin-legend-countdown-badge">2h</div>
            </div>
            <div>
              <div className="pin-legend-text">
                Where I'll Be
              </div>
              <div className="pin-legend-subtext">Future arrival</div>
            </div>
          </div>
        </div>

        {/* Ghost Pins Section */}
        <div className="pin-legend-section pin-legend-divider">
          <div className="pin-legend-section-title">RECENT ACTIVITY</div>

          {/* Recent Ghost - 60% opacity */}
          <div className="pin-legend-item">
            <div className="pin-legend-icon pin-legend-icon-ghost-60" />
            <div>
              <div className="pin-legend-text" style={{ color: '#6b7280' }}>
                1-6 hours ago
              </div>
              <div className="pin-legend-subtext">Just happened</div>
            </div>
          </div>

          {/* Old Ghost - 40% opacity */}
          <div className="pin-legend-item">
            <div className="pin-legend-icon pin-legend-icon-ghost-40" />
            <div>
              <div className="pin-legend-text" style={{ color: '#6b7280' }}>
                1-3 days ago
              </div>
              <div className="pin-legend-subtext">Recent past</div>
            </div>
          </div>

          {/* Very Old Ghost - 25% opacity */}
          <div className="pin-legend-item">
            <div className="pin-legend-icon pin-legend-icon-ghost-25" />
            <div>
              <div className="pin-legend-text" style={{ color: '#9ca3af' }}>
                3-7 days ago
              </div>
              <div className="pin-legend-subtext">This week</div>
            </div>
          </div>
        </div>

        {/* Countdown Colors Section */}
        <div className="pin-legend-section pin-legend-divider">
          <div className="pin-legend-section-title">ARRIVAL TIME</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="pin-legend-countdown-item">
              <div className="pin-legend-countdown-demo pin-legend-countdown-blue">
                4h+
              </div>
              <div className="pin-legend-countdown-label">Hours away</div>
            </div>

            <div className="pin-legend-countdown-item">
              <div className="pin-legend-countdown-demo pin-legend-countdown-yellow">
                2h
              </div>
              <div className="pin-legend-countdown-label">Soon</div>
            </div>

            <div className="pin-legend-countdown-item">
              <div className="pin-legend-countdown-demo pin-legend-countdown-orange">
                15m
              </div>
              <div className="pin-legend-countdown-label">Very soon</div>
            </div>

            <div className="pin-legend-countdown-item">
              <div className="pin-legend-countdown-demo pin-legend-countdown-red">
                Now
              </div>
              <div className="pin-legend-countdown-label">Arriving!</div>
            </div>
          </div>
        </div>

        {/* Auto-delete notice */}
        <div className="pin-legend-notice">
          Pins fade over time
          <br />
          Auto-deleted after 7 days
        </div>
      </div>
    </div>
  );
}
