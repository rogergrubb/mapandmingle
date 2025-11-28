import { WebSocket } from 'ws';

// WebSocket connections store
export const wsConnections = new Map<string, WebSocket>();

// Broadcast to specific user
export function broadcastToUser(userId: string, message: object): void {
  const ws = wsConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Broadcast to all users
export function broadcastToAll(message: object): void {
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Broadcast to multiple users
export function broadcastToUsers(userIds: string[], message: object): void {
  userIds.forEach(userId => {
    broadcastToUser(userId, message);
  });
}

// Check if user is online
export function isUserOnline(userId: string): boolean {
  const ws = wsConnections.get(userId);
  return !!ws && ws.readyState === WebSocket.OPEN;
}

// Get online users count
export function getOnlineUsersCount(): number {
  let count = 0;
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) count++;
  });
  return count;
}
