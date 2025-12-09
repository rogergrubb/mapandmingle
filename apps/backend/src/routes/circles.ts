import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const circleRoutes = new Hono();

// GET /api/circles - Get user's circles
circleRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get circles user owns
    const ownedCircles = await prisma.circle.findMany({
      where: { ownerId: userId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Get circles user is member of
    const memberCircles = await prisma.circleMember.findMany({
      where: { userId },
      include: {
        circle: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const circles = [
      ...ownedCircles.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        isOwner: true,
        memberCount: c.members.length,
        members: c.members.map(m => ({
          id: m.user.id,
          name: m.user.displayName || m.user.name,
          image: m.user.image,
          role: m.role,
        })),
      })),
      ...memberCircles.map(m => ({
        id: m.circle.id,
        name: m.circle.name,
        emoji: m.circle.emoji,
        color: m.circle.color,
        isOwner: false,
        ownerId: m.circle.ownerId,
        ownerName: m.circle.owner.displayName || m.circle.owner.name,
        memberCount: m.circle.members.length,
        members: m.circle.members.map(cm => ({
          id: cm.user.id,
          name: cm.user.displayName || cm.user.name,
          image: cm.user.image,
          role: cm.role,
        })),
      })),
    ];

    return c.json({ circles });
  } catch (error) {
    console.error('Error fetching circles:', error);
    return c.json({ error: 'Failed to fetch circles' }, 500);
  }
});

// POST /api/circles - Create a new circle
circleRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { name, emoji, color } = await c.req.json();

    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Circle name is required' }, 400);
    }

    // Check limit (max 10 circles per user)
    const count = await prisma.circle.count({ where: { ownerId: userId } });
    if (count >= 10) {
      return c.json({ error: 'Maximum 10 circles allowed' }, 400);
    }

    const circle = await prisma.circle.create({
      data: {
        name: name.trim(),
        emoji: emoji || '👨‍👩‍👧‍👦',
        color: color || '#3B82F6',
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });

    return c.json({ 
      id: circle.id,
      name: circle.name,
      emoji: circle.emoji,
      color: circle.color,
    }, 201);
  } catch (error) {
    console.error('Error creating circle:', error);
    return c.json({ error: 'Failed to create circle' }, 500);
  }
});

// PUT /api/circles/:id - Update circle
circleRoutes.put('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');
    const { name, emoji, color } = await c.req.json();

    // Verify ownership
    const circle = await prisma.circle.findFirst({
      where: { id: circleId, ownerId: userId },
    });

    if (!circle) {
      return c.json({ error: 'Circle not found or not authorized' }, 404);
    }

    const updated = await prisma.circle.update({
      where: { id: circleId },
      data: {
        name: name?.trim() || circle.name,
        emoji: emoji || circle.emoji,
        color: color || circle.color,
      },
    });

    return c.json({ success: true, circle: updated });
  } catch (error) {
    console.error('Error updating circle:', error);
    return c.json({ error: 'Failed to update circle' }, 500);
  }
});

// DELETE /api/circles/:id - Delete circle
circleRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');

    await prisma.circle.deleteMany({
      where: { id: circleId, ownerId: userId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting circle:', error);
    return c.json({ error: 'Failed to delete circle' }, 500);
  }
});

// POST /api/circles/:id/invite - Invite user to circle
circleRoutes.post('/:id/invite', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');
    const { inviteeId, inviteeEmail } = await c.req.json();

    // Verify ownership or admin
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId,
        role: { in: ['owner', 'admin'] },
      },
      include: { circle: true },
    });

    if (!membership) {
      return c.json({ error: 'Not authorized to invite to this circle' }, 403);
    }

    // Find user to invite
    let targetUserId = inviteeId;
    if (!targetUserId && inviteeEmail) {
      const user = await prisma.user.findUnique({
        where: { email: inviteeEmail },
        select: { id: true },
      });
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if already member
    const existing = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: { circleId, userId: targetUserId },
      },
    });

    if (existing) {
      return c.json({ error: 'User is already a member' }, 400);
    }

    // Add member
    await prisma.circleMember.create({
      data: {
        circleId,
        userId: targetUserId,
        role: 'member',
      },
    });

    // Get inviter name for notification
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, displayName: true },
    });

    // Notify invitee
    broadcastToUser(targetUserId, {
      type: 'circle_invite',
      circleId,
      circleName: membership.circle.name,
      invitedBy: inviter?.displayName || inviter?.name || 'Someone',
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error inviting to circle:', error);
    return c.json({ error: 'Failed to invite user' }, 500);
  }
});

// DELETE /api/circles/:id/members/:memberId - Remove member from circle
circleRoutes.delete('/:id/members/:memberId', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');
    const memberId = c.req.param('memberId');

    // Verify ownership or admin, or member removing themselves
    const userMembership = await prisma.circleMember.findFirst({
      where: { circleId, userId },
    });

    if (!userMembership) {
      return c.json({ error: 'Not a member of this circle' }, 403);
    }

    // Can remove if: owner/admin, or removing self
    const canRemove = 
      userMembership.role === 'owner' || 
      userMembership.role === 'admin' || 
      memberId === userId;

    if (!canRemove) {
      return c.json({ error: 'Not authorized to remove this member' }, 403);
    }

    // Can't remove owner
    const targetMembership = await prisma.circleMember.findFirst({
      where: { circleId, userId: memberId },
    });

    if (targetMembership?.role === 'owner') {
      return c.json({ error: 'Cannot remove circle owner' }, 400);
    }

    await prisma.circleMember.deleteMany({
      where: { circleId, userId: memberId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// GET /api/circles/:id/locations - Get live locations of circle members
circleRoutes.get('/:id/locations', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');

    // Verify membership
    const membership = await prisma.circleMember.findFirst({
      where: { circleId, userId },
    });

    if (!membership) {
      return c.json({ error: 'Not a member of this circle' }, 403);
    }

    // Get all members with their latest trip/location
    const members = await prisma.circleMember.findMany({
      where: { circleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            profile: {
              select: {
                currentLocationLat: true,
                currentLocationLng: true,
                lastActiveAt: true,
              },
            },
            trips: {
              where: { status: 'active' },
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const locations = members.map(m => {
      const activeTrip = m.user.trips[0];
      return {
        userId: m.user.id,
        name: m.user.displayName || m.user.name,
        image: m.user.image,
        hasActiveTrip: !!activeTrip,
        trip: activeTrip ? {
          id: activeTrip.id,
          name: activeTrip.name,
          destName: activeTrip.destName,
          status: activeTrip.status,
          currentLat: activeTrip.currentLat,
          currentLng: activeTrip.currentLng,
          expectedArrival: activeTrip.expectedArrival?.toISOString(),
          batteryLevel: activeTrip.batterySharing ? activeTrip.batteryLevel : null,
          lastUpdatedAt: activeTrip.lastUpdatedAt?.toISOString(),
        } : null,
        lastKnownLocation: m.user.profile ? {
          lat: m.user.profile.currentLocationLat,
          lng: m.user.profile.currentLocationLng,
          lastUpdated: m.user.profile.lastActiveAt?.toISOString(),
        } : null,
      };
    });

    return c.json({ locations });
  } catch (error) {
    console.error('Error fetching circle locations:', error);
    return c.json({ error: 'Failed to fetch locations' }, 500);
  }
});
