import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type MessageHandler = (message: WebSocketMessage) => void;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

export function useWebSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const { incrementUnread } = useNotificationStore();
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id) return;
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Authenticate
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id,
        }));
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle built-in message types
          if (message.type === 'new_message') {
            incrementUnread();
          }
          
          // Call registered handlers
          const handlers = handlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message));
          }
          
          // Also call 'all' handlers
          const allHandlers = handlersRef.current.get('*');
          if (allHandlers) {
            allHandlers.forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [isAuthenticated, user?.id, incrementUnread]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [isAuthenticated, user?.id, connect]);

  // Subscribe to message types
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.get(type)?.delete(handler);
    };
  }, []);

  // Send message
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  // Typing indicator helper
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    send({
      type: 'typing',
      conversationId,
      isTyping,
    });
  }, [send]);

  // Video call signaling helpers
  const sendWebRTCOffer = useCallback((targetUserId: string, offer: any) => {
    send({
      type: 'webrtc_offer',
      targetUserId,
      offer,
    });
  }, [send]);

  const sendWebRTCAnswer = useCallback((targetUserId: string, answer: any) => {
    send({
      type: 'webrtc_answer',
      targetUserId,
      answer,
    });
  }, [send]);

  const sendWebRTCIceCandidate = useCallback((targetUserId: string, candidate: any) => {
    send({
      type: 'webrtc_ice_candidate',
      targetUserId,
      candidate,
    });
  }, [send]);

  return {
    isConnected,
    subscribe,
    send,
    sendTyping,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate,
  };
}

// Hook for subscribing to specific message types
export function useWebSocketMessage(type: string, handler: MessageHandler) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(type, handler);
    return unsubscribe;
  }, [type, handler, subscribe]);
}
