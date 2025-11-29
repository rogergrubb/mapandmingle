import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const settingsRoutes = new Hono<{ Variables: { userId: string } }>();

// Apply auth middleware to all routes
settingsRoutes.use('*', authMiddleware);

// Get privacy settings
settingsRoutes.get('/privacy', async (c) => {
  const userId = c.get('userId');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileVisibility: true,
        showLocation: true,
        showActivity: true,
        allowMessages: true,
        allowTags: true,
        showOnlineStatus: true,
        shareData: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      profileVisibility: user.profileVisibility || 'public',
      showLocation: user.showLocation ?? true,
      showActivity: user.showActivity ?? true,
      allowMessages: user.allowMessages || 'everyone',
      allowTags: user.allowTags ?? true,
      showOnlineStatus: user.showOnlineStatus ?? true,
      shareData: user.shareData ?? false,
    });
  } catch (error) {
    console.error('Failed to get privacy settings:', error);
    return c.json({ error: 'Failed to get privacy settings' }, 500);
  }
});

// Update privacy settings
settingsRoutes.put('/privacy', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileVisibility: body.profileVisibility,
        showLocation: body.showLocation,
        showActivity: body.showActivity,
        allowMessages: body.allowMessages,
        allowTags: body.allowTags,
        showOnlineStatus: body.showOnlineStatus,
        shareData: body.shareData,
      },
      select: {
        profileVisibility: true,
        showLocation: true,
        showActivity: true,
        allowMessages: true,
        allowTags: true,
        showOnlineStatus: true,
        shareData: true,
      },
    });

    return c.json(updatedUser);
  } catch (error) {
    console.error('Failed to update privacy settings:', error);
    return c.json({ error: 'Failed to update privacy settings' }, 500);
  }
});

// Get notification settings
settingsRoutes.get('/notifications', async (c) => {
  const userId = c.get('userId');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyMessages: true,
        notifyLikes: true,
        notifyComments: true,
        notifyFollows: true,
        notifyEvents: true,
        notifyProximity: true,
        notifyEmail: true,
        notifyPush: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      notifyMessages: user.notifyMessages ?? true,
      notifyLikes: user.notifyLikes ?? true,
      notifyComments: user.notifyComments ?? true,
      notifyFollows: user.notifyFollows ?? true,
      notifyEvents: user.notifyEvents ?? true,
      notifyProximity: user.notifyProximity ?? true,
      notifyEmail: user.notifyEmail ?? true,
      notifyPush: user.notifyPush ?? true,
    });
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return c.json({ error: 'Failed to get notification settings' }, 500);
  }
});

// Update notification settings
settingsRoutes.put('/notifications', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        notifyMessages: body.notifyMessages,
        notifyLikes: body.notifyLikes,
        notifyComments: body.notifyComments,
        notifyFollows: body.notifyFollows,
        notifyEvents: body.notifyEvents,
        notifyProximity: body.notifyProximity,
        notifyEmail: body.notifyEmail,
        notifyPush: body.notifyPush,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return c.json({ error: 'Failed to update notification settings' }, 500);
  }
});

// Get account settings
settingsRoutes.get('/account', async (c) => {
  const userId = c.get('userId');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phone: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Failed to get account settings:', error);
    return c.json({ error: 'Failed to get account settings' }, 500);
  }
});

// Update account settings
settingsRoutes.put('/account', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: body.email,
        phone: body.phone,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update account settings:', error);
    return c.json({ error: 'Failed to update account settings' }, 500);
  }
});

// Delete account
settingsRoutes.delete('/account', async (c) => {
  const userId = c.get('userId');

  try {
    // Soft delete - mark as deleted rather than actually removing
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${userId}@deleted.local`,
      },
    });

    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export { settingsRoutes };
