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

interface GlobalStats {
  liveNow: number;
  activeThisMonth: number;
}

/**
 * PinLegend - Dynamic visual guide showing YOUR pins + global mingler stats
 * Shows "Where I'm At" + multiple "Where I'll Be" with actual countdowns
 */

export function PinLegend() {
  const [myPins, setMyPins] = useState<UserPin[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ liveNow: 0, activeThisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPins();
    fetchGlobalStats();
    // Refresh every minute to update countdowns
    const interval = setInterval(() => {
      fetchMyPins();
      fetchGlobalStats();
    }, 60000);
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

  const fetchGlobalStats = async () => {
    try {
      const response = await api.get('/api/pins/global-stats');
      const data = response.data || response;
      setGlobalStats({
        liveNow: data.liveNow || 0,
        activeThisMonth: data.activeThisMonth || 0,
      });
    } catch (err) {
      console.error('Failed to fetch global stats:', err);
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
    borderRadius: '12px',
    padding: '10px 8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    minWidth: '90px',
    maxWidth: '110px',
    maxHeight: '70vh',
    overflowY: 'auto',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    color: '#6b7280',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    textAlign: 'center',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '7px',
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: '4px',
    letterSpacing: '0.2px',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '6px',
  };

  const iconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid white',
    flexShrink: 0,
    position: 'relative',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '8px',
    fontWeight: 600,
    color: '#374151',
    lineHeight: 1.2,
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: '7px',
    color: '#9ca3af',
    fontWeight: 500,
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '6px',
    marginTop: '6px',
  };

  const emptyStyle: React.CSSProperties = {
    fontSize: '7px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '4px 0',
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: '6px',
    fontWeight: 700,
    padding: '2px 3px',
    borderRadius: '4px',
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
                🗓️ WHERE I'LL BE ({futurePins.length}/2)
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
                <div style={{ ...badgeStyle, background: '#ef4444', fontSize: '6px' }}>Now</div>
              </div>
            </div>
          </>
        )}

        {/* Global Mingler Stats */}
        <div style={{
          ...dividerStyle,
          background: 'linear-gradient(135deg, #fdf2f8, #f3e8ff)',
          margin: '6px -8px -10px -8px',
          padding: '6px 6px 8px 6px',
          borderRadius: '0 0 12px 12px',
          borderTop: '1px solid #e5e7eb',
        }}>
          <div style={{ 
            fontSize: '7px', 
            fontWeight: 700, 
            color: '#7c3aed',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.2px',
            textAlign: 'center',
          }}>
            🌍 WORLDWIDE
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{
              flex: 1,
              background: 'white',
              borderRadius: '6px',
              padding: '4px',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {globalStats.liveNow}
              </div>
              <div style={{ fontSize: '6px', color: '#6b7280', fontWeight: 500 }}>
                Live
              </div>
            </div>
            <div style={{
              flex: 1,
              background: 'white',
              borderRadius: '6px',
              padding: '4px',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {globalStats.activeThisMonth}
              </div>
              <div style={{ fontSize: '6px', color: '#6b7280', fontWeight: 500 }}>
                Month
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PinLegend;
