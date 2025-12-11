import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

interface UserPin {
  id: string;
  latitude: number;
  longitude: number;
  pinType: 'current' | 'future';
  arrivalTime: string | null;
  createdAt: string;
  pinStatus: string;
  pinOpacity: number;
  ageHours: number;
}

/**
 * PinLegend - Dynamic visual guide showing YOUR pins
 * Shows "Where I'm At" + multiple "Where I'll Be" with actual countdowns
 */

export function PinLegend() {
  const [myPins, setMyPins] = useState<UserPin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPins();
    // Refresh every minute to update countdowns
    const interval = setInterval(fetchMyPins, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyPins = async () => {
    try {
      const response = await api.get('/api/pins/mine');
      setMyPins(response.data?.pins || response.pins || []);
    } catch (err) {
      console.error('Failed to fetch my pins:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (arrivalTime: string) => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diff = arrival.getTime() - now.getTime();
    
    if (diff <= 0) {
      const hoursSince = Math.abs(diff) / (1000 * 60 * 60);
      if (hoursSince < 1) return 'Now!';
      return `${Math.floor(hoursSince)}h ago`;
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatDateTime = (arrivalTime: string) => {
    const date = new Date(arrivalTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCountdownColor = (arrivalTime: string) => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diff = arrival.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours <= 0) return '#ef4444'; // Red - arrived
    if (hours <= 0.25) return '#ef4444'; // Red - 15 min
    if (hours <= 2) return '#f97316'; // Orange - 2h
    if (hours <= 4) return '#eab308'; // Yellow - 4h
    return '#3b82f6'; // Blue - 4h+
  };

  const currentPin = myPins.find(p => p.pinType === 'current');
  const futurePins = myPins.filter(p => p.pinType === 'future');

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
    minWidth: '160px',
    maxWidth: '200px',
    maxHeight: '70vh',
    overflowY: 'auto',
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
    marginTop: '12px',
  };

  const emptyStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '8px 0',
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
        <div style={titleStyle}>My Pins</div>

        {loading ? (
          <div style={emptyStyle}>Loading...</div>
        ) : myPins.length === 0 ? (
          <div style={emptyStyle}>
            No pins yet!<br />
            Drop a pin to get started
          </div>
        ) : (
          <>
            {/* Where I'm At Section */}
            <div>
              <div style={sectionTitleStyle}>📍 WHERE I'M AT</div>
              {currentPin ? (
                <div style={itemStyle}>
                  <div
                    style={{
                      ...iconStyle,
                      background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                      boxShadow: '0 3px 8px rgba(236, 72, 153, 0.4)',
                    }}
                  >
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }} />
                  </div>
                  <div>
                    <div style={textStyle}>Current Location</div>
                    <div style={subtextStyle}>
                      {currentPin.ageHours < 1 
                        ? 'Just now' 
                        : currentPin.ageHours < 24 
                          ? `${Math.floor(currentPin.ageHours)}h ago`
                          : `${Math.floor(currentPin.ageHours / 24)}d ago`
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div style={emptyStyle}>Not checked in</div>
              )}
            </div>

            {/* Where I'll Be Section */}
            <div style={dividerStyle}>
              <div style={sectionTitleStyle}>
                🗓️ WHERE I'LL BE ({futurePins.length}/5)
              </div>
              {futurePins.length > 0 ? (
                futurePins.map((pin, index) => (
                  <div key={pin.id} style={{ ...itemStyle, marginBottom: index === futurePins.length - 1 ? 0 : 10 }}>
                    <div
                      style={{
                        ...iconStyle,
                        background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                        boxShadow: '0 3px 8px rgba(234, 179, 8, 0.4)',
                      }}
                    >
                      {pin.arrivalTime && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: getCountdownColor(pin.arrivalTime),
                            color: 'white',
                            fontSize: '7px',
                            fontWeight: 700,
                            padding: '2px 4px',
                            borderRadius: '6px',
                            border: '1px solid white',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatCountdown(pin.arrivalTime)}
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '12px',
                      }}>📍</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...textStyle, fontSize: '10px' }}>
                        {pin.arrivalTime ? formatDateTime(pin.arrivalTime) : 'Scheduled'}
                      </div>
                      <div style={subtextStyle}>
                        {pin.arrivalTime && new Date(pin.arrivalTime) > new Date() 
                          ? 'Upcoming' 
                          : 'Arrived'
                        }
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyStyle}>
                  No upcoming pins
                </div>
              )}
            </div>

            {/* Countdown Color Guide */}
            <div style={dividerStyle}>
              <div style={sectionTitleStyle}>⏰ ARRIVAL COLORS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ ...badgeStyle, background: '#3b82f6', fontSize: '8px' }}>4h+</div>
                <div style={{ ...badgeStyle, background: '#eab308', fontSize: '8px' }}>2-4h</div>
                <div style={{ ...badgeStyle, background: '#f97316', fontSize: '8px' }}>&lt;2h</div>
                <div style={{ ...badgeStyle, background: '#ef4444', fontSize: '8px' }}>Now</div>
              </div>
            </div>
          </>
        )}

        {/* Footer notice */}
        <div style={noticeStyle}>
          Pins visible for 30 days
        </div>
      </div>
    </div>
  );
}

export default PinLegend;
