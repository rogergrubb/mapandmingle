import { WebSocket } from 'ws';

// WebSocket connection management
export const wsConnections = new Map<string, WebSocket>();

// Broadcast to specific user
export function broadcastToUser(userId: string, message: any) {
  const ws = wsConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Broadcast to all connected users
export function broadcastToAll(message: any) {
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}
