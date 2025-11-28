import { Hono } from 'hono';
import { prisma } from '../index';

export const hotspotRoutes = new Hono();

// Simple geohash (5 character precision = ~4.9km)
function encodeGeohash(lat: number, lng: number, precision: number = 5): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let hash = '';
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
  let isLng = true;
  let bit = 0, ch = 0;
  
  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) { ch |= (1 << (4 - bit)); minLng = mid; } 
      else { maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { ch |= (1 << (4 - bit)); minLat = mid; } 
      else { maxLat = mid; }
    }
    isLng = !isLng;
    if (++bit === 5) { hash += base32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}

// GET /api/hotspots - Get hotspots near location
hotspotRoutes.get('/', async (c) => {
  try {
    const lat = parseFloat(c.req.query('latitude') || '0');
    const lng = parseFloat(c.req.query('longitude') || '0');
    const timeWindow = c.req.query('timeWindow') || '24h';
    
    // Calculate time filter
    const now = new Date();
    let since: Date;
    switch (timeWindow) {
      case '1h': since = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '6h': since = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
      case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Get hotspots updated recently
    const hotspots = await prisma.hotspot.findMany({
      where: {
        lastUpdated: { gte: since },
        activeUsers: { gte: 4 }, // Privacy threshold
      },
      orderBy: { trendScore: 'desc' },
      take: 20,
    });
    
    return c.json(hotspots.map(h => ({
      id: h.id,
      geohash: h.geohash,
      centerLat: h.centerLat,
      centerLng: h.centerLng,
      activeUsers: h.activeUsers,
      totalActivity: h.totalActivity,
      trendScore: h.trendScore,
      peakHour: h.peakHour,
      lastUpdated: h.lastUpdated.toISOString(),
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch hotspots' }, 500);
  }
});

// POST /api/hotspots/record - Record activity (called by other routes)
hotspotRoutes.post('/record', async (c) => {
  try {
    const body = await c.req.json();
    const { latitude, longitude, activityType } = body;
    
    const geohash = encodeGeohash(latitude, longitude, 5);
    
    // Upsert hotspot
    await prisma.hotspot.upsert({
      where: { geohash },
      create: {
        geohash,
        centerLat: latitude,
        centerLng: longitude,
        activeUsers: 1,
        totalActivity: 1,
        trendScore: 1,
      },
      update: {
        activeUsers: { increment: 1 },
        totalActivity: { increment: 1 },
        trendScore: { increment: 1 },
        lastUpdated: new Date(),
      },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to record activity' }, 500);
  }
});
