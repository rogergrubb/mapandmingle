// Emergency Safety Routes v2.0
import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const safetyRoutes = new Hono();

// ============================================================================
// EMERGENCY CONTACTS
// ============================================================================

// GET /api/safety/emergency-contacts - Get user's emergency contacts
safetyRoutes.get('/emergency-contacts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
      include: {
        linkedUser: {
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
        linkedUser: contact.linkedUser ? {
          id: contact.linkedUser.id,
          name: contact.linkedUser.displayName || contact.linkedUser.name,
          image: contact.linkedUser.image,
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
    const maxPriority = await prisma.emergencyContact.aggregate({
      where: { userId },
      _max: { priority: true }
    });

    const priority = (maxPriority._max.priority || 0) + 1;

    // Check if linked user exists (by email or phone)
    let linkedUserId: string | undefined;
    if (email) {
      const linkedUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
      if (linkedUser) linkedUserId = linkedUser.id;
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        relationship: relationship?.trim() || null,
        priority,
        notifyViaCall: notifyViaCall ?? true,
        notifyViaSms: notifyViaSms ?? true,
        notifyViaApp: notifyViaApp ?? false,
        notifyViaEmail: notifyViaEmail ?? true,
        linkedUserId,
      },
    });

    return c.json({ 
      success: true, 
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        priority: contact.priority,
      }
    });
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
    const updates = await c.req.json();

    // Verify ownership
    const existing = await prisma.emergencyContact.findFirst({
      where: { id: contactId, userId }
    });

    if (!existing) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    const contact = await prisma.emergencyContact.update({
      where: { id: contactId },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.phone !== undefined && { phone: updates.phone?.trim() || null }),
        ...(updates.email !== undefined && { email: updates.email?.trim().toLowerCase() || null }),
        ...(updates.relationship !== undefined && { relationship: updates.relationship?.trim() || null }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.notifyViaCall !== undefined && { notifyViaCall: updates.notifyViaCall }),
        ...(updates.notifyViaSms !== undefined && { notifyViaSms: updates.notifyViaSms }),
        ...(updates.notifyViaApp !== undefined && { notifyViaApp: updates.notifyViaApp }),
        ...(updates.notifyViaEmail !== undefined && { notifyViaEmail: updates.notifyViaEmail }),
      },
    });

    return c.json({ success: true, contact });
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
    const existing = await prisma.emergencyContact.findFirst({
      where: { id: contactId, userId }
    });

    if (!existing) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    await prisma.emergencyContact.delete({ where: { id: contactId } });

    // Reorder remaining contacts
    const remaining = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { priority: 'asc' }
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.emergencyContact.update({
        where: { id: remaining[i].id },
        data: { priority: i + 1 }
      });
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
      return c.json({ error: 'contactIds array required' }, 400);
    }

    // Update priorities
    for (let i = 0; i < contactIds.length; i++) {
      await prisma.emergencyContact.updateMany({
        where: { id: contactIds[i], userId },
        data: { priority: i + 1 }
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error reordering contacts:', error);
    return c.json({ error: 'Failed to reorder contacts' }, 500);
  }
});

// ============================================================================
// EMERGENCY ALERTS
// ============================================================================

// GET /api/safety/emergency-setup - Check if user has emergency setup complete
safetyRoutes.get('/emergency-setup', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const [contacts, profile, circles] = await Promise.all([
      prisma.emergencyContact.count({ where: { userId } }),
      prisma.profile.findUnique({
        where: { userId },
        select: {
          phoneNumber: true,
          phoneVerified: true,
        }
      }),
      prisma.circleMember.count({ where: { userId } })
    ]);

    const hasContacts = contacts > 0;
    const hasPhone = !!profile?.phoneNumber;
    const phoneVerified = !!profile?.phoneVerified;
    const hasCircle = circles > 0;

    const setupComplete = hasContacts && hasPhone;
    const setupPercentage = [hasContacts, hasPhone, hasCircle].filter(Boolean).length / 3 * 100;

    return c.json({
      setupComplete,
      setupPercentage: Math.round(setupPercentage),
      hasContacts,
      contactCount: contacts,
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
        phone: true,
        profile: {
          select: { phoneNumber: true }
        }
      }
    });

    const userName = user?.displayName || user?.name || 'A MapMingle user';

    // Create alert record
    const alert = await prisma.emergencyAlert.create({
      data: {
        userId,
        latitude: latitude || 0,
        longitude: longitude || 0,
        message,
        alertType,
        batteryLevel,
        status: 'active',
        notificationsSent: [],
      },
    });

    // Get emergency contacts
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
      include: {
        linkedUser: { select: { id: true } }
      }
    });

    // Get circle members
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
    });

    const notificationsSent: any[] = [];

    // Notify emergency contacts
    for (const contact of contacts) {
      // In-app notification for linked users
      if (contact.notifyViaApp && contact.linkedUserId) {
        broadcastToUser(contact.linkedUserId, {
          type: 'emergency_alert',
          alertId: alert.id,
          userName,
          latitude,
          longitude,
          message,
          batteryLevel,
          timestamp: new Date().toISOString(),
        });
        notificationsSent.push({
          contactId: contact.id,
          method: 'app',
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
      }

      // TODO: Implement Twilio SMS
      if (contact.notifyViaSms && contact.phone) {
        console.log(`[EMERGENCY] Would send SMS to ${contact.phone}: "${userName} has triggered an emergency alert!"`);
        notificationsSent.push({
          contactId: contact.id,
          method: 'sms',
          sentAt: new Date().toISOString(),
          status: 'pending' // Would be 'sent' with actual Twilio integration
        });
      }

      // TODO: Implement Twilio voice call
      if (contact.notifyViaCall && contact.phone) {
        console.log(`[EMERGENCY] Would call ${contact.phone}`);
        notificationsSent.push({
          contactId: contact.id,
          method: 'call',
          sentAt: new Date().toISOString(),
          status: 'pending'
        });
      }

      // TODO: Implement email
      if (contact.notifyViaEmail && contact.email) {
        console.log(`[EMERGENCY] Would email ${contact.email}`);
        notificationsSent.push({
          contactId: contact.id,
          method: 'email',
          sentAt: new Date().toISOString(),
          status: 'pending'
        });
      }
    }

    // Notify circle members via in-app
    const circleMembers = new Set<string>();
    for (const membership of circleMemberships) {
      for (const member of membership.circle.members) {
        if (!circleMembers.has(member.user.id)) {
          circleMembers.add(member.user.id);
          broadcastToUser(member.user.id, {
            type: 'emergency_alert',
            alertId: alert.id,
            userName,
            latitude,
            longitude,
            message,
            batteryLevel,
            circleName: membership.circle.name,
            timestamp: new Date().toISOString(),
          });
          notificationsSent.push({
            userId: member.user.id,
            method: 'app',
            sentAt: new Date().toISOString(),
            status: 'sent'
          });
        }
      }
    }

    // Update alert with notifications sent
    await prisma.emergencyAlert.update({
      where: { id: alert.id },
      data: { notificationsSent }
    });

    return c.json({
      success: true,
      alertId: alert.id,
      notificationsSent: notificationsSent.length,
      contactsNotified: contacts.length,
      circleMembersNotified: circleMembers.size,
    });
  } catch (error) {
    console.error('Error triggering emergency alert:', error);
    return c.json({ error: 'Failed to send alert' }, 500);
  }
});

// POST /api/safety/emergency-alert/:id/resolve - Resolve emergency alert
safetyRoutes.post('/emergency-alert/:id/resolve', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const alertId = c.req.param('id');
    const { status = 'resolved' } = await c.req.json();

    // Verify ownership or circle membership
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
      select: { userId: true }
    });

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    // Only alert owner can resolve
    if (alert.userId !== userId) {
      return c.json({ error: 'Only alert owner can resolve' }, 403);
    }

    await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: userId
      }
    });

    // Notify all that alert is resolved
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: alert.userId },
      select: { linkedUserId: true }
    });

    for (const contact of contacts) {
      if (contact.linkedUserId) {
        broadcastToUser(contact.linkedUserId, {
          type: 'emergency_resolved',
          alertId,
          status,
        });
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

    const alerts = await prisma.emergencyAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return c.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
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
