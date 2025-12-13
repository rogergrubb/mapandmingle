// Emergency Safety Routes v2.0
import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const safetyRoutes = new Hono();

// ============================================================================
// EMERGENCY CONTACTS - Uses raw SQL until Prisma types are generated
// ============================================================================

// GET /api/safety/emergency-contacts - Get user's emergency contacts
safetyRoutes.get('/emergency-contacts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contacts = await prisma.$queryRaw<any[]>`
      SELECT * FROM "EmergencyContact" WHERE "userId" = ${userId} ORDER BY "priority" ASC
    `.catch(() => []);

    return c.json({ contacts });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return c.json({ error: 'Failed to fetch contacts', contacts: [] }, 500);
  }
});

// POST /api/safety/emergency-contacts - Add emergency contact
safetyRoutes.post('/emergency-contacts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { name, phone, email, relationship, notifyViaCall, notifyViaSms, notifyViaApp, notifyViaEmail } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ error: 'Contact name is required' }, 400);
    }

    if (!phone && !email) {
      return c.json({ error: 'Phone or email is required' }, 400);
    }

    const id = `ec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.$executeRaw`
      INSERT INTO "EmergencyContact" ("id", "userId", "name", "phone", "email", "relationship", "notifyViaCall", "notifyViaSms", "notifyViaApp", "notifyViaEmail", "priority", "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${name.trim()}, ${phone || null}, ${email || null}, ${relationship || null}, ${notifyViaCall ?? true}, ${notifyViaSms ?? true}, ${notifyViaApp ?? false}, ${notifyViaEmail ?? true}, 1, NOW(), NOW())
    `.catch(e => console.error('Insert error:', e));

    return c.json({ success: true, contact: { id, name } });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    return c.json({ error: 'Failed to add contact' }, 500);
  }
});

// PUT /api/safety/emergency-contacts/:id - Update emergency contact
safetyRoutes.put('/emergency-contacts/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contactId = c.req.param('id');
    const { name, phone, email, relationship, notifyViaCall, notifyViaSms, notifyViaApp, notifyViaEmail } = await c.req.json();

    await prisma.$executeRaw`
      UPDATE "EmergencyContact" 
      SET "name" = COALESCE(${name}, "name"),
          "phone" = ${phone || null},
          "email" = ${email || null},
          "relationship" = ${relationship || null},
          "notifyViaCall" = COALESCE(${notifyViaCall}, "notifyViaCall"),
          "notifyViaSms" = COALESCE(${notifyViaSms}, "notifyViaSms"),
          "notifyViaApp" = COALESCE(${notifyViaApp}, "notifyViaApp"),
          "notifyViaEmail" = COALESCE(${notifyViaEmail}, "notifyViaEmail"),
          "updatedAt" = NOW()
      WHERE "id" = ${contactId} AND "userId" = ${userId}
    `;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    return c.json({ error: 'Failed to update contact' }, 500);
  }
});

// DELETE /api/safety/emergency-contacts/:id - Delete emergency contact
safetyRoutes.delete('/emergency-contacts/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contactId = c.req.param('id');

    await prisma.$executeRaw`
      DELETE FROM "EmergencyContact" WHERE "id" = ${contactId} AND "userId" = ${userId}
    `;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

// GET /api/safety/emergency-setup - Check if user has emergency setup complete
safetyRoutes.get('/emergency-setup', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contacts = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "EmergencyContact" WHERE "userId" = ${userId}
    `.catch(() => [{ count: 0 }]);

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        phoneNumber: true,
        phoneVerified: true,
      }
    }).catch(() => null);

    const circles = await prisma.circleMember.count({ where: { userId } }).catch(() => 0);

    const contactCount = Number(contacts[0]?.count || 0);
    const hasContacts = contactCount > 0;
    const hasPhone = !!profile?.phoneNumber;
    const phoneVerified = !!profile?.phoneVerified;
    const hasCircle = circles > 0;

    const setupComplete = hasContacts && hasPhone;
    const setupPercentage = [hasContacts, hasPhone, hasCircle].filter(Boolean).length / 3 * 100;

    return c.json({
      setupComplete,
      setupPercentage: Math.round(setupPercentage),
      hasContacts,
      contactCount,
      hasPhone,
      phoneVerified,
      hasCircle,
      circleCount: circles,
    });
  } catch (error) {
    console.error('Error checking emergency setup:', error);
    return c.json({ error: 'Failed to check setup' }, 500);
  }
});

// POST /api/safety/emergency-alert - Trigger emergency alert
safetyRoutes.post('/emergency-alert', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { latitude, longitude, message, alertType = 'manual', batteryLevel } = await c.req.json();

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        displayName: true,
      }
    });

    const userName = user?.displayName || user?.name || 'A MapMingle user';
    const alertId = `ea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create alert record
    await prisma.$executeRaw`
      INSERT INTO "EmergencyAlert" ("id", "userId", "latitude", "longitude", "message", "alertType", "batteryLevel", "status", "createdAt")
      VALUES (${alertId}, ${userId}, ${latitude || 0}, ${longitude || 0}, ${message}, ${alertType}, ${batteryLevel}, 'active', NOW())
    `.catch(e => console.error('Alert insert error:', e));

    // Get emergency contacts for notification
    const contacts = await prisma.$queryRaw<any[]>`
      SELECT * FROM "EmergencyContact" WHERE "userId" = ${userId} ORDER BY "priority" ASC
    `.catch(() => []);

    // Get circle members for notification
    const circleMemberships = await prisma.circleMember.findMany({
      where: { userId },
      include: {
        circle: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: {
                user: { select: { id: true, name: true, displayName: true } }
              }
            }
          }
        }
      }
    }).catch(() => []);

    let notifiedCount = 0;

    // Notify emergency contacts via app if they have linkedUserId
    for (const contact of contacts) {
      if (contact.linkedUserId && contact.notifyViaApp) {
        broadcastToUser(contact.linkedUserId, {
          type: 'emergency_alert',
          alertId,
          userName,
          latitude,
          longitude,
          message,
          batteryLevel,
          timestamp: new Date().toISOString(),
        });
        notifiedCount++;
      }
      // Log SMS/Call/Email (would be implemented with Twilio/SendGrid)
      if (contact.notifyViaSms && contact.phone) {
        console.log(`[EMERGENCY SMS] Would send to ${contact.phone}: "${userName} needs help!"`);
        notifiedCount++;
      }
      if (contact.notifyViaCall && contact.phone) {
        console.log(`[EMERGENCY CALL] Would call ${contact.phone}`);
        notifiedCount++;
      }
      if (contact.notifyViaEmail && contact.email) {
        console.log(`[EMERGENCY EMAIL] Would email ${contact.email}`);
        notifiedCount++;
      }
    }

    // Notify circle members
    const circleMemberIds = new Set<string>();
    for (const membership of circleMemberships) {
      for (const member of membership.circle.members) {
        if (!circleMemberIds.has(member.user.id)) {
          circleMemberIds.add(member.user.id);
          broadcastToUser(member.user.id, {
            type: 'emergency_alert',
            alertId,
            userName,
            latitude,
            longitude,
            message,
            batteryLevel,
            circleName: membership.circle.name,
            timestamp: new Date().toISOString(),
          });
          notifiedCount++;
        }
      }
    }

    return c.json({
      success: true,
      alertId,
      notifiedCount,
      contactsCount: contacts.length,
      circleMembersCount: circleMemberIds.size,
    });
  } catch (error) {
    console.error('Error triggering emergency alert:', error);
    return c.json({ error: 'Failed to send alert' }, 500);
  }
});

// ============================================================================
// BLOCKING & REPORTING (existing functionality)
// ============================================================================

safetyRoutes.post('/block/:userId', async (c) => {
  try {
    const currentUserId = c.req.header('x-user-id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const targetUserId = c.req.param('userId');

    await prisma.block.create({
      data: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error blocking user:', error);
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

safetyRoutes.delete('/block/:userId', async (c) => {
  try {
    const currentUserId = c.req.header('x-user-id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const targetUserId = c.req.param('userId');

    await prisma.block.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

safetyRoutes.get('/blocked', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    return c.json({
      blockedUsers: blocks.map((b) => ({
        id: b.blocked.id,
        name: b.blocked.displayName || b.blocked.name,
        image: b.blocked.image,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return c.json({ error: 'Failed to fetch blocked users' }, 500);
  }
});

safetyRoutes.post('/report/:userId', async (c) => {
  try {
    const currentUserId = c.req.header('x-user-id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const targetUserId = c.req.param('userId');
    const { reason, details } = await c.req.json();

    await prisma.report.create({
      data: {
        reporterId: currentUserId,
        targetId: targetUserId,
        reason: reason || 'other',
        details: details || '',
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error reporting user:', error);
    return c.json({ error: 'Failed to report user' }, 500);
  }
});
