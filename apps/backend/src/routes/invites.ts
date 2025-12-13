// Invites Routes - For sending friend invites via email/SMS
import { Hono } from 'hono';
import { prisma } from '../index';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { Resend } from 'resend';

export const invitesRoutes = new Hono();

const resend = new Resend(config.email.resendApiKey);

// Helper to get user ID from either x-user-id header OR Bearer token
const getUserIdFromRequest = (c: any): string | null => {
  const headerUserId = c.req.header('x-user-id');
  if (headerUserId) return headerUserId;
  
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      return decoded.userId;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// POST /api/invites/send - Send an invite to a friend
invitesRoutes.post('/send', async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { email, phone, message } = await c.req.json();

    if (!email && !phone) {
      return c.json({ error: 'Email or phone number required' }, 400);
    }

    // Get the inviting user's info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, displayName: true, email: true }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const senderName = user.displayName || user.name || 'A friend';
    const inviteUrl = 'https://www.mapandmingle.com';

    // Track the invite (optional - for analytics)
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Invite" (id, "senderId", email, phone, status, "createdAt")
        VALUES ($1, $2, $3, $4, 'sent', NOW())
        ON CONFLICT DO NOTHING
      `, `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, email || null, phone || null);
    } catch (e) {
      // Table might not exist, that's okay
      console.log('Invite tracking skipped (table may not exist)');
    }

    // Send email invite
    if (email) {
      try {
        await resend.emails.send({
          from: 'Map & Mingle <invites@mapandmingle.com>',
          to: email,
          subject: `${senderName} wants you to join Map & Mingle!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%); border-radius: 24px; overflow: hidden;">
                      <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                          <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">Map & Mingle</h1>
                          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Find Your People</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background: white; padding: 40px 30px;">
                          <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 15px 0; font-weight: 600;">${senderName} invited you!</h2>
                          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                            ${message || "I've been using Map & Mingle to connect with amazing people nearby. Join me and find your people too!"}
                          </p>
                          <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                            Join Map & Mingle
                          </a>
                          <p style="color: #9ca3af; font-size: 14px; margin: 25px 0 0 0;">
                            Map & Mingle helps you discover and connect with like-minded people in your area.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background: #f9fafb; padding: 20px 30px; text-align: center;">
                          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Map & Mingle. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });
        console.log(`Invite email sent to ${email} from ${userId}`);
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        return c.json({ error: 'Failed to send email invite' }, 500);
      }
    }

    // Send SMS invite (placeholder - would need Twilio integration)
    if (phone && !email) {
      // TODO: Implement Twilio SMS
      console.log(`SMS invite would be sent to ${phone} from ${userId}`);
      // For now, return success but log that SMS isn't implemented
      return c.json({ 
        success: true, 
        message: 'SMS invites coming soon! For now, share the link directly.',
        shareUrl: inviteUrl
      });
    }

    return c.json({ success: true, message: 'Invite sent!' });
  } catch (error) {
    console.error('Error sending invite:', error);
    return c.json({ error: 'Failed to send invite' }, 500);
  }
});

// GET /api/invites/stats - Get invite stats for current user
invitesRoutes.get('/stats', async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Try to get invite count, but don't fail if table doesn't exist
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM "Invite" WHERE "senderId" = $1
      `, userId) as any[];
      
      return c.json({ 
        invitesSent: parseInt(result[0]?.count || '0', 10),
        invitesAccepted: 0 // Would need to track signups from invites
      });
    } catch (e) {
      return c.json({ invitesSent: 0, invitesAccepted: 0 });
    }
  } catch (error) {
    console.error('Error getting invite stats:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});
