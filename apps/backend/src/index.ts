// Build: 2025-12-07 02:45:00 - Fix pgbouncer prepared statement error
// Rebuild trigger - 2025-12-03 12:09:36
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

// Import config and validate
import { config, validateConfig } from './config';
validateConfig();

// Import Prisma client
import { prisma } from './lib/prisma';

// Import rate limiting middleware
import { rateLimitMiddleware } from './middleware/auth';

// Import routes
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';
import { pinRoutes } from './routes/pins';
import { migrationRoutes } from './routes/migrations';
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
import { subscriptionRoutes } from './routes/subscription-enhanced';
import { safetyRoutes } from './routes/safety';
import { activityRoutes } from './routes/activity';
import { savedPinsRoutes } from './routes/saved-pins';
import { activityIntentRoutes } from './routes/activity-intents';
import { webhookRoutes as stripeWebhookRoutes } from './routes/webhook';
import { reportRoutes } from './routes/reports';
import messagesRoutes from './routes/messages';
import blockingRoutes from './routes/blocking';
import notificationsRoutes from './routes/notifications';
import callsRoutes from './routes/calls';
import { userRoutes } from './routes/users';
import { uploadRoutes } from './routes/upload';
import { paymentRoutes } from './routes/payments';
import { aiRoutes } from './routes/ai';
import { waveRoutes } from './routes/waves';
import { locationRoutes } from './routes/location';
import { analytics } from './routes/analytics';
import { push } from './routes/push';
import admin from './routes/admin';
import { settingsRoutes } from './routes/settings';
import connections from './routes/connections';
import photos from './routes/photos';
// Safety app pivot routes
import { circleRoutes } from './routes/circles';
import { tripRoutes } from './routes/trips';
import { safetyRoutes as safetyFeaturesRoutes } from './routes/safety-features';
import visibility from './routes/visibility';

// Import trial & usage middleware
import { rateLimitMiddleware as trialRateLimitMiddleware } from './middleware/rateLimit';
import { checkTrialExpiration } from './middleware/usageLimits';
// Trial system handled by middleware
import { initializeUsageMetricsForExistingUsers } from './utils/admin.utils';

// Import websocket utilities
import { wsConnections, broadcastToUser, broadcastToAll } from './lib/websocket';

// Re-export for routes
export { prisma, wsConnections, broadcastToUser, broadcastToAll };

// Initialize Hono app
const app = new Hono();

// Middleware
app.use('*', logger());

// CORS - Restrict to allowed origins in production
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return origin;
    
    // In development, allow localhost
    if (config.isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return origin;
    }
    
    // Check against allowed origins
    const isAllowed = config.corsOrigins.some(allowed => 
      origin === allowed || origin.endsWith(allowed.replace('https://', '.'))
    );
    
    return isAllowed ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Apply trial system rate limiting middleware
app.use('*', trialRateLimitMiddleware);
app.use('*', checkTrialExpiration);

// Initialize usage metrics for existing users (runs once)
initializeUsageMetricsForExistingUsers().catch(err => 
  console.warn('Could not initialize usage metrics:', err.message)
);

// Health check (no rate limiting)
app.get('/', (c) => c.json({ status: 'ok', message: 'Map Mingle API v1.0' }));

// Debug endpoint to check database connection
app.get('/debug/db', async (c) => {
  try {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const host = dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
    const count = await prisma.user.count();
    return c.json({ 
      host,
      isSupabase: host.includes('supabase'),
      isRailway: host.includes('railway') || host.includes('rlwy'),
      userCount: count
    });
  } catch (err: any) {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const host = dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
    return c.json({ error: err.message, host });
  }
});
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Static legal pages
app.get('/terms', async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Map Mingle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo span { font-size: 32px; background: linear-gradient(135deg, #ec4899, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
    h1 { color: #1a1a2e; font-size: 28px; margin-bottom: 10px; text-align: center; }
    .updated { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
    h2 { color: #ec4899; font-size: 20px; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #fce7f3; }
    p { margin-bottom: 15px; color: #444; }
    ul { margin: 15px 0 15px 25px; }
    li { margin-bottom: 8px; color: #444; }
    .highlight { background: #fce7f3; padding: 15px 20px; border-radius: 10px; border-left: 4px solid #ec4899; margin: 20px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    a { color: #ec4899; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><span>🗺️ Map Mingle</span></div>
    <h1>Terms of Service</h1>
    <p class="updated">Last Updated: November 28, 2024</p>
    <div class="highlight"><strong>Welcome to Map Mingle!</strong> By using our app, you agree to these terms.</div>
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using Map Mingle, you agree to be bound by these Terms of Service.</p>
    <h2>2. Eligibility</h2>
    <p>You must be at least 18 years old to use Map Mingle.</p>
    <h2>3. Account Registration</h2>
    <p>You agree to provide accurate information, keep credentials secure, and be responsible for all activity under your account.</p>
    <h2>4. Acceptable Use</h2>
    <p>You agree NOT to: harass others, post inappropriate content, impersonate others, use the app illegally, spam, or attempt to hack the service.</p>
    <h2>5. User Content</h2>
    <p>You retain ownership of content you post. By posting, you grant us a license to display your content within the app.</p>
    <h2>6. Location Services</h2>
    <p>Map Mingle uses location data to provide its services. By using location features, you consent to the collection and use of your location.</p>
    <h2>7. Premium Subscription</h2>
    <p>Premium features are available at $4.99/month. Subscriptions auto-renew unless cancelled.</p>
    <h2>8. Safety</h2>
    <p>Always exercise caution when meeting people. Meet in public places and inform someone of your plans.</p>
    <h2>9. Termination</h2>
    <p>We may suspend accounts for violations. You may delete your account anytime.</p>
    <h2>10. Disclaimers</h2>
    <p>Map Mingle is provided "as is" without warranties.</p>
    <h2>11. Contact Us</h2>
    <p>Email: <a href="mailto:support@mapandmingle.app">support@mapandmingle.app</a></p>
    <div class="footer"><p>© 2024 Map Mingle. All rights reserved.</p><p><a href="/privacy">Privacy Policy</a></p></div>
  </div>
</body>
</html>`;
  return c.html(html);
});

app.get('/privacy', async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Map Mingle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo span { font-size: 32px; background: linear-gradient(135deg, #ec4899, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
    h1 { color: #1a1a2e; font-size: 28px; margin-bottom: 10px; text-align: center; }
    .updated { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
    h2 { color: #ec4899; font-size: 20px; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #fce7f3; }
    p { margin-bottom: 15px; color: #444; }
    ul { margin: 15px 0 15px 25px; }
    li { margin-bottom: 8px; color: #444; }
    .highlight { background: #fce7f3; padding: 15px 20px; border-radius: 10px; border-left: 4px solid #ec4899; margin: 20px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    a { color: #ec4899; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><span>🗺️ Map Mingle</span></div>
    <h1>Privacy Policy</h1>
    <p class="updated">Last Updated: November 28, 2024</p>
    <div class="highlight"><strong>Your privacy matters.</strong> This policy explains what data we collect and how we use it.</div>
    <h2>1. Information We Collect</h2>
    <p>We collect: Account info (name, email), Profile info (bio, photos), Location data, Messages, and Usage data.</p>
    <h2>2. How We Use Your Data</h2>
    <p>We use your data to: provide features, connect you with nearby users, send notifications, ensure safety, process payments, and respond to support.</p>
    <h2>3. Location Data</h2>
    <p>Location is core to Map Mingle. We collect location when you view the map, create pins, or share location with others.</p>
    <h2>4. Data Sharing</h2>
    <p>We do NOT sell your data. We share with: other users (public profile), service providers (hosting, payments), and legal authorities when required.</p>
    <h2>5. Data Security</h2>
    <p>We protect data using encrypted connections, secure password hashing, and limited access.</p>
    <h2>6. Your Rights</h2>
    <p>You can: access your data, correct inaccuracies, delete your account, and withdraw consent.</p>
    <h2>7. Data Retention</h2>
    <p>We keep data while your account is active. After deletion, most data is removed within 30 days.</p>
    <h2>8. Children's Privacy</h2>
    <p>Map Mingle is not for users under 18. We do not knowingly collect data from minors.</p>
    <h2>9. Contact Us</h2>
    <p>Email: <a href="mailto:privacy@mapandmingle.app">privacy@mapandmingle.app</a></p>
    <div class="footer"><p>© 2024 Map Mingle. All rights reserved.</p><p><a href="/terms">Terms of Service</a></p></div>
  </div>
</body>
</html>`;
  return c.html(html);
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/visibility', visibility);
app.route('/api/pins', pinRoutes);
app.route('/api/migrations', migrationRoutes);
// app.route('/api/conversations', conversationRoutes); // Disabled - using new messages API
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
app.route('/api/messages', messagesRoutes);
app.route('/api/blocking', blockingRoutes);
app.route('/api/calls', callsRoutes);
app.route('/api/users', userRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/notifications', notificationsRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/waves', waveRoutes);
app.route('/api/location', locationRoutes);
app.route('/api/analytics', analytics);
app.route('/api/push', push);
app.route('/api/settings', settingsRoutes);
app.route('/api/visibility', visibility);
app.route('/api/admin', admin);
app.route('/api/connections', connections);
app.route('/api/photos', photos);
// Safety app pivot routes
app.route('/api/circles', circleRoutes);
app.route('/api/trips', tripRoutes);
app.route('/api/safety/features', safetyFeaturesRoutes);
app.route('/webhook', stripeWebhookRoutes);

// Start server
const PORT = Number(process.env.PORT) || 3000;

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  const chunks: Buffer[] = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    
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
      
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      res.statusCode = response.status;
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
      if (message.type === 'auth' && typeof message.userId === 'string') {
        userId = message.userId;
        wsConnections.set(message.userId, ws);
        ws.send(JSON.stringify({ type: 'auth_success' }));
        console.log(`✅ WebSocket authenticated: ${message.userId}`);
        
        // Broadcast that this user is now online
        broadcastToAll({
          type: 'online-status',
          userId: message.userId,
          isOnline: true,
        });
      }
      
      // Handle typing indicators
      if (message.type === 'typing' && userId) {
        const { conversationId, isTyping } = message;
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
      
      // Handle online status check
      if (message.type === 'check-online' && message.userId) {
        const targetUserId = message.userId;
        const isOnline = wsConnections.has(targetUserId);
        ws.send(JSON.stringify({ 
          type: 'online-status', 
          userId: targetUserId, 
          isOnline 
        }));
      }
      
      // Handle location updates
      if (message.type === 'location_update' && userId) {
        const { latitude, longitude } = message;
        console.log(`📍 Location update from ${userId}: ${latitude}, ${longitude}`);
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      wsConnections.delete(userId);
      console.log(`❌ WebSocket disconnected: ${userId}`);
      
      // Broadcast that this user is now offline
      broadcastToAll({
        type: 'online-status',
        userId,
        isOnline: false,
      });
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Auto-migrations removed - schema is already synchronized
// All fields exist in Prisma schema.prisma
// Future schema changes should use: npx prisma migrate dev

// Safety Tables Auto-Migration (runs once on deploy)
async function runSafetyMigration() {
  try {
    console.log('🔄 Running safety tables migration...');
    
    // Create Circle table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Circle" (
        "id" TEXT NOT NULL,
        "name" VARCHAR(50) NOT NULL,
        "ownerId" TEXT NOT NULL,
        "emoji" TEXT DEFAULT '👨‍👩‍👧‍👦',
        "color" TEXT DEFAULT '#3B82F6',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create CircleMember table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CircleMember" (
        "id" TEXT NOT NULL,
        "circleId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "canSeeLocation" BOOLEAN NOT NULL DEFAULT true,
        "canRequestLocation" BOOLEAN NOT NULL DEFAULT true,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create Trip table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Trip" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "circleId" TEXT,
        "name" VARCHAR(100),
        "originLat" DOUBLE PRECISION NOT NULL,
        "originLng" DOUBLE PRECISION NOT NULL,
        "originName" VARCHAR(200),
        "destLat" DOUBLE PRECISION NOT NULL,
        "destLng" DOUBLE PRECISION NOT NULL,
        "destName" VARCHAR(200),
        "status" TEXT NOT NULL DEFAULT 'active',
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "arrivedAt" TIMESTAMP(3),
        "expectedArrival" TIMESTAMP(3),
        "currentLat" DOUBLE PRECISION,
        "currentLng" DOUBLE PRECISION,
        "lastUpdatedAt" TIMESTAMP(3),
        "updateInterval" INTEGER NOT NULL DEFAULT 60,
        "batteryLevel" INTEGER,
        "batterySharing" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create CheckIn table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CheckIn" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "message" VARCHAR(200),
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "placeName" VARCHAR(200),
        "circleId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create EmergencyAlert table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmergencyAlert" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "batteryLevel" INTEGER,
        "message" VARCHAR(500),
        "voiceNoteUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "resolvedAt" TIMESTAMP(3),
        "resolvedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create ArrivalAlert table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ArrivalAlert" (
        "id" TEXT NOT NULL,
        "creatorId" TEXT NOT NULL,
        "watchedUserId" TEXT NOT NULL,
        "tripId" TEXT,
        "circleId" TEXT,
        "destLat" DOUBLE PRECISION NOT NULL,
        "destLng" DOUBLE PRECISION NOT NULL,
        "destName" VARCHAR(200),
        "radiusMeters" INTEGER NOT NULL DEFAULT 100,
        "expectedBy" TIMESTAMP(3),
        "notifyOnArrival" BOOLEAN NOT NULL DEFAULT true,
        "notifyIfLate" BOOLEAN NOT NULL DEFAULT true,
        "lateThresholdMin" INTEGER NOT NULL DEFAULT 15,
        "status" TEXT NOT NULL DEFAULT 'active',
        "triggeredAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3),
        CONSTRAINT "ArrivalAlert_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create indexes (silently ignore if they exist)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "Circle_ownerId_idx" ON "Circle"("ownerId")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "CircleMember_circleId_userId_key" ON "CircleMember"("circleId", "userId")',
      'CREATE INDEX IF NOT EXISTS "CircleMember_userId_idx" ON "CircleMember"("userId")',
      'CREATE INDEX IF NOT EXISTS "Trip_userId_idx" ON "Trip"("userId")',
      'CREATE INDEX IF NOT EXISTS "Trip_circleId_idx" ON "Trip"("circleId")',
      'CREATE INDEX IF NOT EXISTS "Trip_status_idx" ON "Trip"("status")',
      'CREATE INDEX IF NOT EXISTS "CheckIn_userId_idx" ON "CheckIn"("userId")',
      'CREATE INDEX IF NOT EXISTS "CheckIn_createdAt_idx" ON "CheckIn"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "EmergencyAlert_userId_idx" ON "EmergencyAlert"("userId")',
      'CREATE INDEX IF NOT EXISTS "EmergencyAlert_status_idx" ON "EmergencyAlert"("status")',
      'CREATE INDEX IF NOT EXISTS "ArrivalAlert_creatorId_idx" ON "ArrivalAlert"("creatorId")',
      'CREATE INDEX IF NOT EXISTS "ArrivalAlert_watchedUserId_idx" ON "ArrivalAlert"("watchedUserId")',
      'CREATE INDEX IF NOT EXISTS "ArrivalAlert_status_idx" ON "ArrivalAlert"("status")',
    ];
    
    for (const idx of indexes) {
      await prisma.$executeRawUnsafe(idx).catch(() => {});
    }

    // Add foreign keys (silently ignore if they exist)
    const fkeys = [
      'ALTER TABLE "Circle" ADD CONSTRAINT "Circle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE',
      'ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "Trip" ADD CONSTRAINT "Trip_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL',
      'ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "ArrivalAlert" ADD CONSTRAINT "ArrivalAlert_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "ArrivalAlert" ADD CONSTRAINT "ArrivalAlert_watchedUserId_fkey" FOREIGN KEY ("watchedUserId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "ArrivalAlert" ADD CONSTRAINT "ArrivalAlert_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL',
      'ALTER TABLE "ArrivalAlert" ADD CONSTRAINT "ArrivalAlert_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL',
    ];
    
    for (const fk of fkeys) {
      await prisma.$executeRawUnsafe(fk).catch(() => {});
    }

    // Create EmergencyContact table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmergencyContact" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(20),
        "email" VARCHAR(255),
        "relationship" VARCHAR(50),
        "notifyViaCall" BOOLEAN NOT NULL DEFAULT true,
        "notifyViaSms" BOOLEAN NOT NULL DEFAULT true,
        "notifyViaApp" BOOLEAN NOT NULL DEFAULT false,
        "notifyViaEmail" BOOLEAN NOT NULL DEFAULT true,
        "linkedUserId" TEXT,
        "priority" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
      )
    `);

    // Add columns to EmergencyAlert if missing
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmergencyAlert" ADD COLUMN IF NOT EXISTS "locationName" TEXT`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmergencyAlert" ADD COLUMN IF NOT EXISTS "alertType" TEXT DEFAULT 'manual'`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmergencyAlert" ADD COLUMN IF NOT EXISTS "notificationsSent" JSONB`).catch(() => {});

    console.log('✅ Safety tables migration complete');
  } catch (error) {
    console.error('⚠️ Safety migration error (may be OK if tables exist):', error);
  }
}

// Run migration then start server
runSafetyMigration().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    🗺️  MAP MINGLE API                      ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                              ║
║  WebSocket ready for real-time connections                ║
║  Database: PostgreSQL via Prisma                          ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
// Build trigger: 1765296961
