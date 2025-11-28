import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { createInMemoryRateLimiter } from './middleware/rate-limit';

// Import routes
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';
import { pinRoutes } from './routes/pins';
import { conversationRoutes } from './routes/conversations';
import { eventRoutes } from './routes/events';
import { forumRoutes } from './routes/forums';
import { mingleRoutes } from './routes/mingles';
import { matchingRoutes } from './routes/matching';
import { videoCallRoutes } from './routes/video-calls';
import { videoRoomRoutes } from './routes/video-rooms';
import { streakRoutes } from './routes/streaks';
import { trustScoreRoutes } from './routes/trust-score';
import { hotspotRoutes } from './routes/hotspots';
import { proximityAlertRoutes } from './routes/proximity-alerts';
import { icebreakerRoutes } from './routes/icebreaker';
import { subscriptionRoutes } from './routes/subscription';
import { safetyRoutes } from './routes/safety';
import { activityRoutes } from './routes/activity';
import { savedPinsRoutes } from './routes/saved-pins';
import { activityIntentRoutes } from './routes/activity-intents';
import { stripeWebhookRoutes } from './routes/webhook';
import { reportRoutes } from './routes/reports';
import { userRoutes } from './routes/users';
import { uploadRoutes } from './routes/upload';
import { notificationRoutes } from './routes/notifications';
import { waveRoutes } from './routes/waves';
import { locationRoutes } from './routes/location';

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Hono app
const app = new Hono();

// Middleware - Improved CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:8081', // Expo dev
  'http://localhost:19000', // Expo dev
  'http://localhost:19006', // Expo web
];

// Add production domains from environment
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return origin;
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) return origin;
    
    // In development, allow localhost with any port
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return origin;
    }
    
    // Reject all other origins
    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Rate limiting - Use in-memory for development, Redis for production
// For production, uncomment and configure Redis:
// import Redis from 'ioredis';
// import { createRedisRateLimiter } from './middleware/rate-limit';
// const redis = new Redis(process.env.REDIS_URL);
// app.use('*', createRedisRateLimiter(redis, { maxRequests: 100, windowMs: 60000 }));

// Development rate limiter
if (process.env.NODE_ENV !== 'production') {
  app.use('*', createInMemoryRateLimiter({ maxRequests: 100, windowMs: 60000 }));
}

// Health check
app.get('/', (c) => c.json({ 
  status: 'ok', 
  message: 'Map Mingle API v1.0',
  environment: process.env.NODE_ENV || 'development',
}));

app.get('/health', (c) => c.json({ 
  status: 'healthy', 
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/pins', pinRoutes);
app.route('/api/conversations', conversationRoutes);
app.route('/api/events', eventRoutes);
app.route('/api/forums', forumRoutes);
app.route('/api/mingles', mingleRoutes);
app.route('/api/matches', matchingRoutes);
app.route('/api/video-calls', videoCallRoutes);
app.route('/api/video-rooms', videoRoomRoutes);
app.route('/api/streaks', streakRoutes);
app.route('/api/trust-score', trustScoreRoutes);
app.route('/api/hotspots', hotspotRoutes);
app.route('/api/proximity-alerts', proximityAlertRoutes);
app.route('/api/icebreaker', icebreakerRoutes);
app.route('/api/subscription', subscriptionRoutes);
app.route('/api/safety', safetyRoutes);
app.route('/api/activity', activityRoutes);
app.route('/api/saved-pins', savedPinsRoutes);
app.route('/api/activity-intents', activityIntentRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/users', userRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/waves', waveRoutes);
app.route('/api/location', locationRoutes);
app.route('/webhook', stripeWebhookRoutes);

// WebSocket connections store
const wsConnections = new Map<string, WebSocket>();

// Export for use in routes
export { wsConnections };

// Broadcast to specific user
export function broadcastToUser(userId: string, message: object) {
  const ws = wsConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Broadcast to all users
export function broadcastToAll(message: object) {
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
  // Let Hono handle HTTP requests
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // Collect body data
  const chunks: Buffer[] = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    
    // Create a proper Request object for Hono
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
    });
    
    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : body,
    });
    
    try {
      const response = await app.fetch(request);
      
      // Copy headers from Hono response
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      res.statusCode = response.status;
      
      // Send body
      const responseBody = await response.arrayBuffer();
      res.end(Buffer.from(responseBody));
    } catch (error) {
      console.error('Request error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  let userId: string | null = null;
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle authentication
      if (message.type === 'auth' && message.userId) {
        userId = message.userId as string;
        wsConnections.set(userId as string, ws);
        ws.send(JSON.stringify({ type: 'auth_success' }));
        console.log(`✅ WebSocket authenticated: ${userId}`);
      }
      
      // Handle typing indicators
      if (message.type === 'typing' && userId) {
        const { conversationId, isTyping } = message;
        // Broadcast to conversation participants
        broadcastToAll({
          type: 'typing',
          conversationId,
          userId,
          isTyping,
        });
      }
      
      // Handle video call signaling
      if (message.type === 'webrtc_offer' || 
          message.type === 'webrtc_answer' || 
          message.type === 'webrtc_ice_candidate') {
        const { targetUserId, ...signalData } = message;
        broadcastToUser(targetUserId, {
          ...signalData,
          fromUserId: userId,
        });
      }
      
      // Handle presence/heartbeat
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      wsConnections.delete(userId);
      console.log(`❌ WebSocket disconnected: ${userId}`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    🗺️  MAP MINGLE API                      ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  WebSocket ready for real-time connections                ║
║  Database: PostgreSQL via Prisma                          ║
║  Rate Limiting: ${process.env.NODE_ENV === 'production' ? 'Redis' : 'In-Memory (Dev)'}                      ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  
  // Close WebSocket connections
  wsConnections.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });
  
  // Disconnect Prisma
  await prisma.$disconnect();
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
