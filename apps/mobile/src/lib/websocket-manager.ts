import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/auth';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.mapmingle.app/ws';

type MessageType =
  | 'connect'
  | 'disconnect'
  | 'message'
  | 'wave'
  | 'typing'
  | 'read'
  | 'presence'
  | 'location'
  | 'proximity'
  | 'mingle_update'
  | 'event_update'
  | 'notification';

interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
}

type MessageHandler = (payload: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private pendingMessages: WebSocketMessage[] = [];
  private isConnecting = false;

  constructor(url: string) {
    this.url = url;
  }

  // Connect to WebSocket server
  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.token = token;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(`${this.url}?token=${token}`);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushPendingMessages();
        this.emit('connect', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnect', { code: event.code, reason: event.reason });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }

  // Send a message
  send(type: MessageType, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.pendingMessages.push(message);
    }
  }

  // Subscribe to a message type
  on(type: MessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  // Unsubscribe from a message type
  off(type: MessageType, handler: MessageHandler): void {
    this.messageHandlers.get(type)?.delete(handler);
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Handle incoming message
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error('[WS] Handler error:', error);
        }
      });
    }
  }

  // Emit event to handlers
  private emit(type: MessageType, payload: any): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.token) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    this.clearReconnectTimeout();
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  // Clear reconnect timeout
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Start heartbeat
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('presence', { status: 'online' });
      }
    }, 30000); // Every 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Flush pending messages
  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.pendingMessages.shift()!;
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager(WS_URL);

// React hook for WebSocket
export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isAuthenticated && token) {
      wsManager.connect(token);
    } else {
      wsManager.disconnect();
    }

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Connection state listeners
    const unsubConnect = wsManager.on('connect', () => setIsConnected(true));
    const unsubDisconnect = wsManager.on('disconnect', () => setIsConnected(false));

    return () => {
      subscription.remove();
      unsubConnect();
      unsubDisconnect();
    };
  }, [isAuthenticated, token]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground, reconnect if needed
      if (token && !wsManager.isConnected()) {
        wsManager.connect(token);
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App is going to background
      // Could keep connection alive for a short period or disconnect
    }
    appState.current = nextAppState;
  };

  const subscribe = useCallback((type: MessageType, handler: MessageHandler) => {
    return wsManager.on(type, handler);
  }, []);

  const send = useCallback((type: MessageType, payload: any) => {
    wsManager.send(type, payload);
  }, []);

  return {
    isConnected,
    subscribe,
    send,
  };
}

// Specific WebSocket hooks for features

// Chat WebSocket hook
export function useChatWebSocket(conversationId: string) {
  const { subscribe, send } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const unsubMessage = subscribe('message', (payload) => {
      if (payload.conversationId === conversationId) {
        // Handle new message
      }
    });

    const unsubTyping = subscribe('typing', (payload) => {
      if (payload.conversationId === conversationId) {
        if (payload.isTyping) {
          setTypingUsers((prev) => [...new Set([...prev, payload.userId])]);
        } else {
          setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
        }
      }
    });

    const unsubRead = subscribe('read', (payload) => {
      if (payload.conversationId === conversationId) {
        // Handle read receipt
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
    };
  }, [conversationId, subscribe]);

  const sendMessage = useCallback(
    (content: string, attachments?: any[]) => {
      send('message', {
        conversationId,
        content,
        attachments,
      });
    },
    [conversationId, send]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      send('typing', {
        conversationId,
        isTyping,
      });
      setIsTyping(isTyping);
    },
    [conversationId, send]
  );

  const sendRead = useCallback(
    (messageId: string) => {
      send('read', {
        conversationId,
        messageId,
      });
    },
    [conversationId, send]
  );

  return {
    typingUsers,
    isTyping,
    sendMessage,
    sendTyping,
    sendRead,
  };
}

// Proximity WebSocket hook
export function useProximityWebSocket() {
  const { subscribe, send } = useWebSocket();
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubProximity = subscribe('proximity', (payload) => {
      if (payload.action === 'enter') {
        setNearbyUsers((prev) => [...prev.filter((u) => u.id !== payload.user.id), payload.user]);
      } else if (payload.action === 'leave') {
        setNearbyUsers((prev) => prev.filter((u) => u.id !== payload.userId));
      }
    });

    return () => {
      unsubProximity();
    };
  }, [subscribe]);

  const updateLocation = useCallback(
    (latitude: number, longitude: number) => {
      send('location', { latitude, longitude });
    },
    [send]
  );

  return {
    nearbyUsers,
    updateLocation,
  };
}

// Mingle WebSocket hook
export function useMingleWebSocket(mingleId: string) {
  const { subscribe, send } = useWebSocket();

  useEffect(() => {
    const unsubUpdate = subscribe('mingle_update', (payload) => {
      if (payload.mingleId === mingleId) {
        // Handle mingle updates (new participant, location change, etc.)
      }
    });

    return () => {
      unsubUpdate();
    };
  }, [mingleId, subscribe]);

  const joinMingle = useCallback(() => {
    send('mingle_update', {
      mingleId,
      action: 'join',
    });
  }, [mingleId, send]);

  const leaveMingle = useCallback(() => {
    send('mingle_update', {
      mingleId,
      action: 'leave',
    });
  }, [mingleId, send]);

  return {
    joinMingle,
    leaveMingle,
  };
}

export default wsManager;
