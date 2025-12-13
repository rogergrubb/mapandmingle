// Emergency Safety Routes v3.0 - Using raw SQL
import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const safetyRoutes = new Hono();

// Helper to execute raw SQL
const rawQuery = async (query: string, params: any[] = []) => {
  return await prisma.$queryRawUnsafe(query, ...params);
};

// ============================================================================
// EMERGENCY CONTACTS
// ============================================================================

// GET /api/safety/emergency-contacts - Get user's emergency contacts
safetyRoutes.get('/emergency-contacts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contacts = await rawQuery(`
      SELECT ec.*, u.id as "linkedUserId", u.name as "linkedUserName", 
             u."displayName" as "linkedUserDisplayName", u.image as "linkedUserImage"
      FROM "EmergencyContact" ec
      LEFT JOIN "User" u ON ec."linkedUserId" = u.id
      WHERE ec."userId" = $1
      ORDER BY ec.priority ASC
    `, [userId]) as any[];

    return c.json({ 
      contacts: contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        priority: contact.priority,
        notifyViaCall: contact.notifyViaCall,
        notifyViaSms: contact.notifyViaSms,
        notifyViaApp: contact.notifyViaApp,
        notifyViaEmail: contact.notifyViaEmail,
        linkedUser: contact.linkedUserId ? {
          id: contact.linkedUserId,
          name: contact.linkedUserDisplayName || contact.linkedUserName,
          image: contact.linkedUserImage,
        } : null,
      }))
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return c.json({ error: 'Failed to fetch contacts' }, 500);
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

    // Get current max priority
    const maxResult = await rawQuery(`
      SELECT COALESCE(MAX(priority), 0) as max FROM "EmergencyContact" WHERE "userId" = $1
    `, [userId]) as any[];
    const priority = (maxResult[0]?.max || 0) + 1;

    // Check if linked user exists (by email)
    let linkedUserId: string | null = null;
    if (email) {
      const linkedUser = await rawQuery(`
        SELECT id FROM "User" WHERE email = $1 LIMIT 1
      `, [email.trim()]) as any[];
      if (linkedUser.length > 0) linkedUserId = linkedUser[0].id;
    }

    const id = `ec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await rawQuery(`
      INSERT INTO "EmergencyContact" 
      (id, "userId", name, phone, email, relationship, "notifyViaCall", "notifyViaSms", "notifyViaApp", "notifyViaEmail", "linkedUserId", priority, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [id, userId, name.trim(), phone?.trim() || null, email?.trim() || null, relationship || null, 
        notifyViaCall !== false, notifyViaSms !== false, notifyViaApp === true, notifyViaEmail !== false,
        linkedUserId, priority]);

    return c.json({ 
      success: true, 
      contact: { id, name: name.trim(), priority }
    });
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    return c.json({ error: 'Failed to save contact' }, 500);
  }
});

// PUT /api/safety/emergency-contacts/:id - Update emergency contact
safetyRoutes.put('/emergency-contacts/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contactId = c.req.param('id');
    const { name, phone, email, relationship, notifyViaCall, notifyViaSms, notifyViaApp, notifyViaEmail } = await c.req.json();

    // Verify ownership
    const existing = await rawQuery(`
      SELECT id FROM "EmergencyContact" WHERE id = $1 AND "userId" = $2
    `, [contactId, userId]) as any[];
    if (existing.length === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    await rawQuery(`
      UPDATE "EmergencyContact" 
      SET name = $1, phone = $2, email = $3, relationship = $4, 
          "notifyViaCall" = $5, "notifyViaSms" = $6, "notifyViaApp" = $7, "notifyViaEmail" = $8, "updatedAt" = NOW()
      WHERE id = $9 AND "userId" = $10
    `, [name?.trim(), phone?.trim() || null, email?.trim() || null, relationship || null,
        notifyViaCall !== false, notifyViaSms !== false, notifyViaApp === true, notifyViaEmail !== false,
        contactId, userId]);

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

    // Verify ownership
    const existing = await rawQuery(`
      SELECT id FROM "EmergencyContact" WHERE id = $1 AND "userId" = $2
    `, [contactId, userId]) as any[];
    if (existing.length === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    await rawQuery(`DELETE FROM "EmergencyContact" WHERE id = $1`, [contactId]);

    // Reorder remaining contacts
    const remaining = await rawQuery(`
      SELECT id FROM "EmergencyContact" WHERE "userId" = $1 ORDER BY priority
    `, [userId]) as any[];
    
    for (let i = 0; i < remaining.length; i++) {
      await rawQuery(`
        UPDATE "EmergencyContact" SET priority = $1 WHERE id = $2
      `, [i + 1, remaining[i].id]);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

// POST /api/safety/emergency-contacts/reorder - Reorder contacts
safetyRoutes.post('/emergency-contacts/reorder', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { contactIds } = await c.req.json();
    if (!Array.isArray(contactIds)) {
      return c.json({ error: 'Invalid contact IDs' }, 400);
    }

    for (let i = 0; i < contactIds.length; i++) {
      await rawQuery(`
        UPDATE "EmergencyContact" SET priority = $1 WHERE id = $2 AND "userId" = $3
      `, [i + 1, contactIds[i], userId]);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error reordering contacts:', error);
    return c.json({ error: 'Failed to reorder contacts' }, 500);
  }
});

// GET /api/safety/emergency-setup - Get setup status
safetyRoutes.get('/emergency-setup', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const [contactCount, profile, circleCount] = await Promise.all([
      rawQuery(`SELECT COUNT(*) as count FROM "EmergencyContact" WHERE "userId" = $1`, [userId]).then((r: any) => Number(r[0]?.count || 0)),
      rawQuery(`SELECT phone, "phoneVerified" FROM "Profile" WHERE "userId" = $1`, [userId]).then((r: any) => r[0]),
      rawQuery(`SELECT COUNT(*) as count FROM "CircleMember" WHERE "userId" = $1`, [userId]).then((r: any) => Number(r[0]?.count || 0))
    ]);

    const hasContacts = contactCount > 0;
    const hasPhone = !!profile?.phone;
    const phoneVerified = !!profile?.phoneVerified;
    const hasCircle = circleCount > 0;

    const setupPercentage = Math.round(
      (hasContacts ? 50 : 0) + 
      (hasPhone ? 30 : 0) + 
      (hasCircle ? 20 : 0)
    );

    return c.json({
      hasContacts,
      contactCount,
      hasPhone,
      phoneVerified,
      hasCircle,
      circleCount,
      setupComplete: hasContacts && hasPhone,
      setupPercentage,
    });
  } catch (error) {
    console.error('Error getting emergency setup:', error);
    return c.json({ error: 'Failed to get setup status' }, 500);
  }
});

// POST /api/safety/emergency-alert - Trigger emergency alert
safetyRoutes.post('/emergency-alert', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { latitude, longitude, message, alertType, batteryLevel } = await c.req.json();

    // Get user info
    const users = await rawQuery(`SELECT name, "displayName" FROM "User" WHERE id = $1`, [userId]) as any[];
    const user = users[0];
    if (!user) return c.json({ error: 'User not found' }, 404);

    const userName = user.displayName || user.name || 'MapMingle User';

    // Create alert
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await rawQuery(`
      INSERT INTO "EmergencyAlert" 
      (id, "userId", latitude, longitude, message, "alertType", "batteryLevel", status, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
    `, [alertId, userId, latitude || 0, longitude || 0, message || null, alertType || 'manual', batteryLevel || null]);

    // Get emergency contacts
    const contacts = await rawQuery(`
      SELECT * FROM "EmergencyContact" WHERE "userId" = $1 ORDER BY priority
    `, [userId]) as any[];

    const notificationsSent: any[] = [];
    const mapsUrl = latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '';

    // Notify each contact
    for (const contact of contacts) {
      // In-app notification for linked users
      if (contact.notifyViaApp && contact.linkedUserId) {
        try {
          broadcastToUser(contact.linkedUserId, {
            type: 'emergency_alert',
            alertId,
            fromUserId: userId,
            fromUserName: userName,
            latitude,
            longitude,
            message,
            timestamp: new Date().toISOString(),
          });
          notificationsSent.push({ contactId: contact.id, method: 'app', sentAt: new Date(), status: 'sent' });
        } catch (e) {
          console.error('Failed to send in-app notification:', e);
        }
      }

      // SMS notification (TODO: Twilio integration)
      if (contact.notifyViaSms && contact.phone) {
        console.log(`[SMS] Would send to ${contact.phone}: EMERGENCY from ${userName}. ${mapsUrl}`);
        notificationsSent.push({ contactId: contact.id, method: 'sms', sentAt: new Date(), status: 'pending_integration' });
      }

      // Voice call (TODO: Twilio integration)
      if (contact.notifyViaCall && contact.phone) {
        console.log(`[CALL] Would call ${contact.phone} for emergency alert`);
        notificationsSent.push({ contactId: contact.id, method: 'call', sentAt: new Date(), status: 'pending_integration' });
      }

      // Email notification (TODO: email integration)
      if (contact.notifyViaEmail && contact.email) {
        console.log(`[EMAIL] Would email ${contact.email}: EMERGENCY from ${userName}. ${mapsUrl}`);
        notificationsSent.push({ contactId: contact.id, method: 'email', sentAt: new Date(), status: 'pending_integration' });
      }
    }

    // Notify circle members
    const circleMembers = await rawQuery(`
      SELECT DISTINCT cm."userId" 
      FROM "CircleMember" cm
      INNER JOIN "Circle" c ON cm."circleId" = c.id
      WHERE c."ownerId" = $1 AND cm."userId" != $1
    `, [userId]) as any[];

    for (const member of circleMembers) {
      try {
        broadcastToUser(member.userId, {
          type: 'emergency_alert',
          alertId,
          fromUserId: userId,
          fromUserName: userName,
          latitude,
          longitude,
          message,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to notify circle member:', e);
      }
    }

    return c.json({
      success: true,
      alertId,
      notificationsSent: notificationsSent.length,
      contactsNotified: contacts.length,
      circleMembersNotified: circleMembers.length,
    });
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    return c.json({ error: 'Failed to create alert' }, 500);
  }
});

// POST /api/safety/emergency-alert/:id/resolve - Resolve an alert
safetyRoutes.post('/emergency-alert/:id/resolve', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const alertId = c.req.param('id');
    const { status } = await c.req.json();

    // Verify ownership
    const alerts = await rawQuery(`
      SELECT * FROM "EmergencyAlert" WHERE id = $1 AND "userId" = $2
    `, [alertId, userId]) as any[];
    
    if (alerts.length === 0) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    await rawQuery(`
      UPDATE "EmergencyAlert" 
      SET status = $1, "resolvedAt" = NOW(), "resolvedBy" = $2
      WHERE id = $3
    `, [status || 'resolved', userId, alertId]);

    // Notify contacts that alert was resolved
    const contacts = await rawQuery(`
      SELECT * FROM "EmergencyContact" WHERE "userId" = $1
    `, [userId]) as any[];

    for (const contact of contacts) {
      if (contact.notifyViaApp && contact.linkedUserId) {
        try {
          broadcastToUser(contact.linkedUserId, {
            type: 'emergency_resolved',
            alertId,
            fromUserId: userId,
            status: status || 'resolved',
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.error('Failed to notify resolution:', e);
        }
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return c.json({ error: 'Failed to resolve alert' }, 500);
  }
});

// GET /api/safety/emergency-alerts - Get user's alert history
safetyRoutes.get('/emergency-alerts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const alerts = await rawQuery(`
      SELECT * FROM "EmergencyAlert" 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT 20
    `, [userId]) as any[];

    return c.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

// ============================================================================
// BLOCKING / REPORTING (keep using Prisma since these models work)
// ============================================================================

safetyRoutes.post('/block/:userId', async (c) => {
  try {
    const blockerId = c.req.header('x-user-id');
    if (!blockerId) return c.json({ error: 'Unauthorized' }, 401);

    const blockedUserId = c.req.param('userId');
    if (blockerId === blockedUserId) {
      return c.json({ error: 'Cannot block yourself' }, 400);
    }

    await prisma.block.create({
      data: { blockerId, blockedUserId }
    });

    return c.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return c.json({ success: true, message: 'Already blocked' });
    }
    console.error('Error blocking user:', error);
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

safetyRoutes.delete('/block/:userId', async (c) => {
  try {
    const blockerId = c.req.header('x-user-id');
    if (!blockerId) return c.json({ error: 'Unauthorized' }, 401);

    const blockedUserId = c.req.param('userId');

    await prisma.block.deleteMany({
      where: { blockerId, blockedUserId }
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

safetyRoutes.get('/blocks', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blockedUser: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          }
        }
      }
    });

    return c.json({ 
      blocks: blocks.map(b => ({
        id: b.blockedUserId,
        name: b.blockedUser.displayName || b.blockedUser.name,
        image: b.blockedUser.image,
        blockedAt: b.createdAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return c.json({ error: 'Failed to fetch blocks' }, 500);
  }
});

safetyRoutes.post('/report', async (c) => {
  try {
    const reporterId = c.req.header('x-user-id');
    if (!reporterId) return c.json({ error: 'Unauthorized' }, 401);

    const { reportedUserId, reason, details, eventId, eventCommentId } = await c.req.json();

    if (!reportedUserId || !reason) {
      return c.json({ error: 'User ID and reason required' }, 400);
    }

    await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        reason,
        description: details || null,
        eventId: eventId || null,
        eventCommentId: eventCommentId || null,
      }
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error creating report:', error);
    return c.json({ error: 'Failed to create report' }, 500);
  }
});

