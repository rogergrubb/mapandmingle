import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const circleRoutes = new Hono();

// Enhanced emoji/icon list for circles
const CIRCLE_ICONS = [
  // Family
  '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👨‍👧', '👩‍👩‍👧', '👨‍👧', '👩‍👧', '👨‍👦', '👩‍👦',
  // People
  '👫', '👬', '👭', '🧑‍🤝‍🧑', '💑', '👪',
  // Places & Activities  
  '🏠', '🏡', '🏢', '🏫', '⛪', '🏥',
  // Transport
  '🚗', '🚕', '🚌', '✈️', '🚴', '🛵',
  // Activities
  '⚽', '🏀', '🎾', '🏊', '🎮', '🎬', '🎵', '📚', '💼', '🎓',
  // Hearts & Love
  '❤️', '💕', '💖', '💝', '💗', '💓',
  // Nature
  '🌳', '🏔️', '🏖️', '🌅', '🌸',
  // Groups & Social
  '👥', '🤝', '🎉', '🎊', '✨', '⭐', '🌟',
  // Safety & Care
  '🛡️', '🔒', '🏥', '🩺', '💊',
];

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
                profile: {
                  select: {
                    avatar: true,
                    currentLocationLat: true,
                    currentLocationLng: true,
                    lastActiveAt: true,
                  }
                }
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
                    profile: {
                      select: {
                        avatar: true,
                        currentLocationLat: true,
                        currentLocationLng: true,
                        lastActiveAt: true,
                      }
                    }
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
          image: m.user.profile?.avatar || m.user.image,
          role: m.role,
          lastActiveAt: m.user.profile?.lastActiveAt,
          hasLocation: !!(m.user.profile?.currentLocationLat && m.user.profile?.currentLocationLng),
        })),
        createdAt: c.createdAt,
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
          image: cm.user.profile?.avatar || cm.user.image,
          role: cm.role,
          lastActiveAt: cm.user.profile?.lastActiveAt,
          hasLocation: !!(cm.user.profile?.currentLocationLat && cm.user.profile?.currentLocationLng),
        })),
        createdAt: m.circle.createdAt,
      })),
    ];

    return c.json({ circles });
  } catch (error) {
    console.error('Error fetching circles:', error);
    return c.json({ error: 'Failed to fetch circles' }, 500);
  }
});

// GET /api/circles/icons - Get available icons for circles
circleRoutes.get('/icons', async (c) => {
  return c.json({ icons: CIRCLE_ICONS });
});

// GET /api/circles/connections - Get user's accepted connections for circle invites
circleRoutes.get('/connections', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const connections = await prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            profile: {
              select: { avatar: true }
            }
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            profile: {
              select: { avatar: true }
            }
          },
        },
      },
    });

    // Map to get the "other" user in each connection
    const friends = connections.map(conn => {
      const friend = conn.requesterId === userId ? conn.addressee : conn.requester;
      return {
        id: friend.id,
        name: friend.displayName || friend.name,
        image: friend.profile?.avatar || friend.image,
        connectionId: conn.id,
        connectedAt: conn.createdAt,
      };
    });

    return c.json({ connections: friends });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return c.json({ error: 'Failed to fetch connections' }, 500);
  }
});

// POST /api/circles - Create new circle
circleRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { name, emoji, color, memberIds } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ error: 'Circle name is required' }, 400);
    }

    // Create circle
    const circle = await prisma.circle.create({
      data: {
        name: name.trim(),
        emoji: emoji || '👨‍👩‍👧‍👦',
        color: color || '#3B82F6',
        ownerId: userId,
      },
    });

    // Add owner as first member
    await prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: userId,
        role: 'owner',
      },
    });

    // Add initial members if provided (must be connections)
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Verify these are actual connections
      const validConnections = await prisma.connection.findMany({
        where: {
          status: 'accepted',
          OR: [
            { requesterId: userId, addresseeId: { in: memberIds } },
            { addresseeId: userId, requesterId: { in: memberIds } },
          ],
        },
      });

      const validUserIds = validConnections.map(conn => 
        conn.requesterId === userId ? conn.addresseeId : conn.requesterId
      );

      // Add valid members
      for (const memberId of validUserIds) {
        await prisma.circleMember.create({
          data: {
            circleId: circle.id,
            userId: memberId,
            role: 'member',
          },
        });

        // Notify the added member
        broadcastToUser(memberId, {
          type: 'circle_added',
          circleId: circle.id,
          circleName: circle.name,
        });
      }
    }

    return c.json({ 
      success: true, 
      circle: {
        id: circle.id,
        name: circle.name,
        emoji: circle.emoji,
        color: circle.color,
      }
    });
  } catch (error) {
    console.error('Error creating circle:', error);
    return c.json({ error: 'Failed to create circle' }, 500);
  }
});

// GET /api/circles/:id - Get single circle details
circleRoutes.get('/:id', async (c) => {
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

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
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
                profile: {
                  select: {
                    avatar: true,
                    currentLocationLat: true,
                    currentLocationLng: true,
                    lastActiveAt: true,
                  }
                }
              },
            },
          },
        },
      },
    });

    if (!circle) {
      return c.json({ error: 'Circle not found' }, 404);
    }

    return c.json({
      circle: {
        id: circle.id,
        name: circle.name,
        emoji: circle.emoji,
        color: circle.color,
        isOwner: circle.ownerId === userId,
        owner: {
          id: circle.owner.id,
          name: circle.owner.displayName || circle.owner.name,
          image: circle.owner.image,
        },
        members: circle.members.map(m => ({
          id: m.user.id,
          name: m.user.displayName || m.user.name,
          image: m.user.profile?.avatar || m.user.image,
          role: m.role,
          canSeeLocation: m.canSeeLocation,
          canRequestLocation: m.canRequestLocation,
          lastActiveAt: m.user.profile?.lastActiveAt,
          location: m.canSeeLocation ? {
            lat: m.user.profile?.currentLocationLat,
            lng: m.user.profile?.currentLocationLng,
          } : null,
        })),
        memberCount: circle.members.length,
        createdAt: circle.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching circle:', error);
    return c.json({ error: 'Failed to fetch circle' }, 500);
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
      return c.json({ error: 'Not authorized to edit this circle' }, 403);
    }

    const updated = await prisma.circle.update({
      where: { id: circleId },
      data: {
        ...(name && { name: name.trim() }),
        ...(emoji && { emoji }),
        ...(color && { color }),
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

    // Verify ownership
    const circle = await prisma.circle.findFirst({
      where: { id: circleId, ownerId: userId },
    });

    if (!circle) {
      return c.json({ error: 'Not authorized to delete this circle' }, 403);
    }

    // Notify members before deletion
    const members = await prisma.circleMember.findMany({
      where: { circleId, userId: { not: userId } },
    });

    for (const member of members) {
      broadcastToUser(member.userId, {
        type: 'circle_deleted',
        circleName: circle.name,
      });
    }

    await prisma.circle.delete({ where: { id: circleId } });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting circle:', error);
    return c.json({ error: 'Failed to delete circle' }, 500);
  }
});

// POST /api/circles/:id/members - Add specific members to circle
circleRoutes.post('/:id/members', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');
    const { memberIds } = await c.req.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return c.json({ error: 'memberIds array required' }, 400);
    }

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
      return c.json({ error: 'Not authorized to add members' }, 403);
    }

    // Verify these are actual connections
    const validConnections = await prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId, addresseeId: { in: memberIds } },
          { addresseeId: userId, requesterId: { in: memberIds } },
        ],
      },
    });

    const validUserIds = validConnections.map(conn => 
      conn.requesterId === userId ? conn.addresseeId : conn.requesterId
    );

    const added: string[] = [];
    const alreadyMembers: string[] = [];

    for (const memberId of validUserIds) {
      // Check if already member
      const existing = await prisma.circleMember.findUnique({
        where: { circleId_userId: { circleId, userId: memberId } },
      });

      if (existing) {
        alreadyMembers.push(memberId);
        continue;
      }

      await prisma.circleMember.create({
        data: {
          circleId,
          userId: memberId,
          role: 'member',
        },
      });

      added.push(memberId);

      // Notify the added member
      broadcastToUser(memberId, {
        type: 'circle_added',
        circleId,
        circleName: membership.circle.name,
      });
    }

    return c.json({ 
      success: true, 
      added: added.length,
      alreadyMembers: alreadyMembers.length,
    });
  } catch (error) {
    console.error('Error adding members:', error);
    return c.json({ error: 'Failed to add members' }, 500);
  }
});

// POST /api/circles/:id/invite - Invite by email (legacy)
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
                avatar: true,
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
        image: m.user.profile?.avatar || m.user.image,
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

// PATCH /api/circles/:id/members/:memberId/role - Update member role
circleRoutes.patch('/:id/members/:memberId/role', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const circleId = c.req.param('id');
    const memberId = c.req.param('memberId');
    const { role } = await c.req.json();

    if (!['admin', 'member'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be admin or member' }, 400);
    }

    // Verify ownership
    const circle = await prisma.circle.findFirst({
      where: { id: circleId, ownerId: userId },
    });

    if (!circle) {
      return c.json({ error: 'Only circle owner can change roles' }, 403);
    }

    // Can't change owner role
    if (memberId === userId) {
      return c.json({ error: 'Cannot change your own role' }, 400);
    }

    await prisma.circleMember.updateMany({
      where: { circleId, userId: memberId },
      data: { role },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return c.json({ error: 'Failed to update role' }, 500);
  }
});
