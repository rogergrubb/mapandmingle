import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../lib/api';
import { Trash2, X, GripVertical, Maximize2, Minimize2 } from 'lucide-react';

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

type PanelSize = 'compact' | 'normal' | 'expanded';

/**
 * PinLegend - Dynamic visual guide showing YOUR pins + global mingler stats
 * Shows "Where I'm At" + multiple "Where I'll Be" with actual countdowns
 * Draggable left/right, resizable (compact/normal/expanded)
 */

export function PinLegend({ onPinClick, onPinDeleted }: PinLegendProps) {
  const [myPins, setMyPins] = useState<UserPin[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ liveNow: 0, activeThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingPinId, setDeletingPinId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Draggable & Resizable state
  const [position, setPosition] = useState<'left' | 'right'>(() => {
    const saved = localStorage.getItem('pinLegendPosition');
    return (saved === 'left' || saved === 'right') ? saved : 'right';
  });
  const [size, setSize] = useState<PanelSize>(() => {
    const saved = localStorage.getItem('pinLegendSize');
    return (saved === 'compact' || saved === 'normal' || saved === 'expanded') ? saved : 'normal';
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('pinLegendPosition', position);
  }, [position]);

  useEffect(() => {
    localStorage.setItem('pinLegendSize', size);
  }, [size]);

  useEffect(() => {
    fetchMyPins();
    fetchGlobalStats();
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

  // Drag handling
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const windowWidth = window.innerWidth;
    const threshold = windowWidth / 2;
    
    // Switch sides based on drag position
    if (clientX < threshold && position === 'right') {
      setPosition('left');
    } else if (clientX > threshold && position === 'left') {
      setPosition('right');
    }
  }, [isDragging, position]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const cycleSize = () => {
    const sizes: PanelSize[] = ['compact', 'normal', 'expanded'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setSize(sizes[nextIndex]);
  };

  const handleDeletePin = async (pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete === pinId) {
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
      setConfirmDelete(pinId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const formatCountdown = (arrivalTime: string | null): { text: string; color: string; hours: number } => {
    if (!arrivalTime) return { text: 'Now', color: '#ef4444', hours: 0 };
    
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diff = arrival.getTime() - now.getTime();
    
    if (diff <= 0) return { text: 'Now', color: '#ef4444', hours: 0 };
    
    const hours = diff / (1000 * 60 * 60);
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    if (days > 0) {
      text = `${days}d ${remainingHours}h`;
    } else if (remainingHours > 0) {
      text = `${remainingHours}h ${minutes}m`;
    } else {
      text = `${minutes}m`;
    }
    
    return { text, color: getCountdownColor(hours), hours };
  };

  const getCountdownColor = (hours: number) => {
    if (hours <= 0.25) return '#ef4444';
    if (hours <= 2) return '#f97316';
    if (hours <= 4) return '#eab308';
    return '#3b82f6';
  };

  const currentPin = myPins.find(p => p.pinType === 'current');
  const futurePins = myPins.filter(p => p.pinType === 'future');

  // Size-based dimensions
  const sizeConfig = {
    compact: { width: 80, padding: '6px 4px', titleSize: '7px', itemGap: '4px', showStats: false },
    normal: { width: 120, padding: '10px 8px', titleSize: '9px', itemGap: '6px', showStats: true },
    expanded: { width: 180, padding: '12px 10px', titleSize: '10px', itemGap: '8px', showStats: true },
  };

  const config = sizeConfig[size];

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    [position]: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 999,
    pointerEvents: 'auto',
    transition: isDragging ? 'none' : 'left 0.3s ease, right 0.3s ease',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    padding: config.padding,
    boxShadow: isDragging ? '0 12px 48px rgba(0, 0, 0, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    minWidth: `${config.width}px`,
    maxWidth: `${config.width + 20}px`,
    maxHeight: '70vh',
    overflowY: 'auto',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: 'transform 0.2s, box-shadow 0.2s, width 0.3s',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
    cursor: 'grab',
    userSelect: 'none',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: config.titleSize,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  };

  const controlButtonStyle: React.CSSProperties = {
    padding: '2px',
    borderRadius: '4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s, background 0.2s',
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
    gap: config.itemGap,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    position: 'relative',
  };

  const iconStyle: React.CSSProperties = {
    width: size === 'compact' ? '20px' : '24px',
    height: size === 'compact' ? '20px' : '24px',
    borderRadius: '50%',
    position: 'relative',
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    fontSize: size === 'compact' ? '8px' : '9px',
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
    padding: '2px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div ref={containerRef} style={containerStyle}>
        <div style={cardStyle}>
          <div style={titleStyle}>MY PINS</div>
          <div style={emptyStyle}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={cardStyle}>
        {/* Header with drag handle and controls */}
        <div 
          style={headerStyle}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <GripVertical size={12} style={{ color: '#d1d5db', cursor: 'grab' }} />
            <span style={titleStyle}>MY PINS</span>
          </div>
          <div style={controlsStyle}>
            <button
              style={controlButtonStyle}
              onClick={(e) => { e.stopPropagation(); cycleSize(); }}
              onMouseDown={(e) => e.stopPropagation()}
              title={`Size: ${size}`}
            >
              {size === 'compact' ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
            </button>
          </div>
        </div>

        {/* Where I'm At */}
        <div style={sectionTitleStyle}>
          <span style={{ color: '#ef4444' }}>📍</span> WHERE I'M AT
        </div>
        
        {currentPin ? (
          <div 
            style={itemStyle} 
            onClick={() => onPinClick?.(currentPin)}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ ...iconStyle, background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div>
              <div style={textStyle}>Current Location</div>
              <div style={subtextStyle}>{getTimeAgo(currentPin.createdAt)}</div>
            </div>
            <button
              style={{
                ...deleteButtonStyle,
                background: confirmDelete === currentPin.id ? '#fee2e2' : 'transparent',
                color: confirmDelete === currentPin.id ? '#dc2626' : '#d1d5db',
              }}
              onClick={(e) => handleDeletePin(currentPin.id, e)}
              disabled={deletingPinId === currentPin.id}
            >
              {confirmDelete === currentPin.id ? <X size={12} /> : <Trash2 size={10} />}
            </button>
          </div>
        ) : (
          <div style={emptyStyle}>No current pin</div>
        )}

        {/* Where I'll Be */}
        <div style={{ ...dividerStyle }}>
          <div style={sectionTitleStyle}>
            <span>🗓️</span> WHERE I'LL BE ({futurePins.length}/5)
          </div>
          
          {futurePins.length > 0 ? (
            futurePins.map((pin) => {
              const countdown = formatCountdown(pin.arrivalTime);
              return (
                <div 
                  key={pin.id}
                  style={{ ...itemStyle, marginBottom: '4px' }}
                  onClick={() => onPinClick?.(pin)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ position: 'relative' }}>
                    <span 
                      style={{ 
                        ...badgeStyle, 
                        background: countdown.color,
                        fontSize: '7px',
                        padding: '2px 4px',
                      }}
                    >
                      {countdown.text}
                    </span>
                    <div style={{
                      ...iconStyle,
                      background: `linear-gradient(135deg, ${countdown.color} 0%, ${countdown.color}88 100%)`,
                      marginTop: '2px',
                      width: '20px',
                      height: '20px',
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: countdown.color,
                        border: '2px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '8px' }}>✈️</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={textStyle}>
                      {pin.arrivalTime ? formatDate(pin.arrivalTime) : 'Scheduled'}
                    </div>
                    <div style={subtextStyle}>
                      {pin.arrivalTime ? formatTime(pin.arrivalTime) : 'Upcoming'}
                    </div>
                  </div>
                  <button
                    style={{
                      ...deleteButtonStyle,
                      background: confirmDelete === pin.id ? '#fee2e2' : 'transparent',
                      color: confirmDelete === pin.id ? '#dc2626' : '#d1d5db',
                    }}
                    onClick={(e) => handleDeletePin(pin.id, e)}
                    disabled={deletingPinId === pin.id}
                  >
                    {confirmDelete === pin.id ? <X size={12} /> : <Trash2 size={10} />}
                  </button>
                </div>
              );
            })
          ) : (
            <div style={emptyStyle}>No upcoming pins</div>
          )}
        </div>

        {/* Arrival Color Legend - only show in normal/expanded */}
        {config.showStats && (
          <div style={dividerStyle}>
            <div style={sectionTitleStyle}>
              <span>🎨</span> ARRIVAL COLORS
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { color: '#3b82f6', label: '4h+' },
                { color: '#eab308', label: '2-4h' },
                { color: '#f97316', label: '<2h' },
                { color: '#ef4444', label: 'Now' },
              ].map(({ color, label }) => (
                <span
                  key={label}
                  style={{
                    ...badgeStyle,
                    background: color,
                    fontSize: '7px',
                    padding: '2px 6px',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Global Stats - only show in normal/expanded */}
        {config.showStats && (
          <div style={dividerStyle}>
            <div style={sectionTitleStyle}>
              <span>🌍</span> WORLDWIDE
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'center',
              marginTop: '4px',
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: '6px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>
                  {globalStats.liveNow}
                </div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>Live</div>
              </div>
              <div style={{ 
                textAlign: 'center',
                padding: '6px 12px',
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>
                  {globalStats.activeThisMonth}
                </div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>Month</div>
              </div>
            </div>
          </div>
        )}

        {/* Position indicator */}
        <div style={{ 
          marginTop: '8px', 
          textAlign: 'center', 
          fontSize: '7px', 
          color: '#d1d5db',
        }}>
          Drag to move • Click resize
        </div>
      </div>
    </div>
  );
}
