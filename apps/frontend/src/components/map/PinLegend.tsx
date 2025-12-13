import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Trash2, X } from 'lucide-react';

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

interface PinLegendProps {
  onPinClick?: (pin: UserPin) => void;
  onPinDeleted?: () => void;
}

/**
 * PinLegend - Dynamic visual guide showing YOUR pins + global mingler stats
 * Shows "Where I'm At" + multiple "Where I'll Be" with actual countdowns
 * Clickable to navigate to pins, with delete functionality
 */

export function PinLegend({ onPinClick, onPinDeleted }: PinLegendProps) {
  const [myPins, setMyPins] = useState<UserPin[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ liveNow: 0, activeThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingPinId, setDeletingPinId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const handleDeletePin = async (pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete === pinId) {
      // Second click - actually delete
      setDeletingPinId(pinId);
      try {
        await api.delete(`/api/pins/${pinId}`);
        setMyPins(prev => prev.filter(p => p.id !== pinId));
        onPinDeleted?.();
      } catch (err) {
        console.error('Failed to delete pin:', err);
      } finally {
        setDeletingPinId(null);
        setConfirmDelete(null);
      }
    } else {
      // First click - show confirm
      setConfirmDelete(pinId);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handlePinClick = (pin: UserPin) => {
    onPinClick?.(pin);
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
    right: '12px',  // Changed from left to right
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
    minWidth: '100px',
    maxWidth: '120px',
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
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    position: 'relative',
  };

  const iconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    position: 'relative',
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 600,
    color: '#1f2937',
    lineHeight: 1.2,
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: '7px',
    color: '#6b7280',
    marginTop: '1px',
  };

  const emptyStyle: React.CSSProperties = {
    fontSize: '8px',
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: '4px 0',
  };

  const dividerStyle: React.CSSProperties = {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  };

  const badgeStyle: React.CSSProperties = {
    color: 'white',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: 600,
  };

  const deleteButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '2px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '3px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
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
                <div 
                  style={itemStyle}
                  onClick={() => handlePinClick(currentPin)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
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
                  <div style={{ flex: 1 }}>
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
                  {/* Delete button */}
                  <button
                    style={{
                      ...deleteButtonStyle,
                      background: confirmDelete === currentPin.id ? '#ef4444' : '#f3f4f6',
                      color: confirmDelete === currentPin.id ? 'white' : '#6b7280',
                    }}
                    onClick={(e) => handleDeletePin(currentPin.id, e)}
                    title={confirmDelete === currentPin.id ? 'Click again to confirm' : 'Delete pin'}
                  >
                    {deletingPinId === currentPin.id ? (
                      <div style={{ width: 12, height: 12, border: '2px solid', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    ) : confirmDelete === currentPin.id ? (
                      <X size={12} />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
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
                  <div 
                    key={pin.id} 
                    style={{ ...itemStyle, marginBottom: index === futurePins.length - 1 ? 0 : 10 }}
                    onClick={() => handlePinClick(pin)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
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
                    {/* Delete button */}
                    <button
                      style={{
                        ...deleteButtonStyle,
                        background: confirmDelete === pin.id ? '#ef4444' : '#f3f4f6',
                        color: confirmDelete === pin.id ? 'white' : '#6b7280',
                      }}
                      onClick={(e) => handleDeletePin(pin.id, e)}
                      title={confirmDelete === pin.id ? 'Click again to confirm' : 'Delete pin'}
                    >
                      {deletingPinId === pin.id ? (
                        <div style={{ width: 12, height: 12, border: '2px solid', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      ) : confirmDelete === pin.id ? (
                        <X size={12} />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
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
      
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PinLegend;
