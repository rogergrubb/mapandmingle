import { prisma } from '../lib/prisma';

// Haversine distance calculation
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check if current time is within quiet hours
function isQuietHours(profile: any): boolean {
  if (!profile.quietHoursStart || !profile.quietHoursEnd) return false;
  
  try {
    const now = new Date();
    const timezone = profile.quietHoursTimezone || 'UTC';
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: timezone 
    });
    
    const start = profile.quietHoursStart;
    const end = profile.quietHoursEnd;
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return timeStr >= start || timeStr < end;
    } else {
      return timeStr >= start && timeStr < end;
    }
  } catch {
    return false;
  }
}

interface PinAlertData {
  pinId: string;
  pinUserId: string;
  pinUserName: string;
  pinLat: number;
  pinLng: number;
  pinDescription: string;
}

// Create in-app notification
export async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  fromUserId?: string,
  data?: object
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        fromUserId: fromUserId || null,
        data: data ? JSON.stringify(data) : null,
      },
    });
    console.log(`In-app notification created for ${userId}: ${type}`);
  } catch (error) {
    console.error('In-app notification error:', error);
  }
}

// Notify about new message
export async function notifyAboutMessage(
  recipientId: string,
  senderId: string,
  senderName: string,
  messagePreview: string
) {
  await createInAppNotification(
    recipientId,
    'message',
    `New message from ${senderName}`,
    messagePreview.substring(0, 100),
    senderId,
    { type: 'message' }
  );
}

// Notify about connection request
export async function notifyAboutConnectionRequest(
  recipientId: string,
  requesterId: string,
  requesterName: string
) {
  await createInAppNotification(
    recipientId,
    'connection_request',
    'New connection request',
    `${requesterName} wants to connect with you`,
    requesterId,
    { type: 'connection_request' }
  );
}

// Notify about connection accepted
export async function notifyAboutConnectionAccepted(
  requesterId: string,
  accepterId: string,
  accepterName: string
) {
  await createInAppNotification(
    requesterId,
    'connection_accepted',
    'Connection accepted!',
    `${accepterName} accepted your connection request`,
    accepterId,
    { type: 'connection_accepted' }
  );
}

// Notify about pin like
export async function notifyAboutPinLike(
  pinOwnerId: string,
  likerId: string,
  likerName: string,
  pinId: string
) {
  await createInAppNotification(
    pinOwnerId,
    'like',
    `${likerName} liked your pin`,
    'Tap to view your pin',
    likerId,
    { pinId, type: 'like' }
  );
}

// Notify about event comment
export async function notifyAboutEventComment(
  eventHostId: string,
  commenterId: string,
  commenterName: string,
  eventId: string,
  eventTitle: string,
  commentPreview: string
) {
  await createInAppNotification(
    eventHostId,
    'comment',
    `New comment on "${eventTitle}"`,
    `${commenterName}: ${commentPreview.substring(0, 80)}`,
    commenterId,
    { eventId, type: 'comment' }
  );
}

// Send email notification via Resend
async function sendEmailNotification(
  to: string,
  subject: string,
  body: string,
  pinData: PinAlertData
) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Map & Mingle <notifications@mapandmingle.com>',
        to: [to],
        subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px;">
                Map & Mingle
              </h1>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #111;">${subject}</h2>
              <p style="color: #444; line-height: 1.6; margin: 0;">${body}</p>
            </div>
            <div style="text-align: center;">
              <a href="https://www.mapandmingle.com/map" style="
                display: inline-block;
                background: linear-gradient(135deg, #ec4899, #8b5cf6);
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
              ">
                View on Map
              </a>
            </div>
            <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
              You're receiving this because you have pin notifications enabled.<br>
              <a href="https://www.mapandmingle.com/profile" style="color: #8b5cf6;">Manage preferences</a>
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Email send failed:', await response.text());
    } else {
      console.log(`Email sent to ${to}`);
    }
  } catch (error) {
    console.error('Email error:', error);
  }
}

// Send SMS notification via Twilio
async function sendSmsNotification(
  to: string,
  body: string
) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log('Twilio not configured, skipping SMS');
    return;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      console.error('SMS send failed:', await response.text());
    } else {
      console.log(`SMS sent to ${to}`);
    }
  } catch (error) {
    console.error('SMS error:', error);
  }
}

// Main function: Notify users about a new pin
export async function notifyAboutNewPin(pinData: PinAlertData) {
  console.log(`Processing notifications for pin ${pinData.pinId} by ${pinData.pinUserName}`);

  // 1. Get friends of the pin creator who want friend notifications
  const friendConnections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: pinData.pinUserId, status: 'accepted' },
        { addresseeId: pinData.pinUserId, status: 'accepted' },
      ],
    },
  });

  const friendIds = friendConnections.map(conn => 
    conn.requesterId === pinData.pinUserId ? conn.addresseeId : conn.requesterId
  );

  // 2. Get friends who want notifications
  const friendsToNotify = await prisma.profile.findMany({
    where: {
      userId: { in: friendIds },
      notifyFriendPins: true,
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  // 3. Get users nearby who want nearby notifications (excluding the pin creator and friends)
  const nearbyUsers = await prisma.profile.findMany({
    where: {
      userId: { notIn: [pinData.pinUserId, ...friendIds] },
      notifyNearbyPins: true,
      currentLocationLat: { not: null },
      currentLocationLng: { not: null },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  // Filter nearby users by distance
  const nearbyUsersInRadius = nearbyUsers.filter(profile => {
    if (!profile.currentLocationLat || !profile.currentLocationLng) return false;
    const distance = getDistanceKm(
      pinData.pinLat,
      pinData.pinLng,
      profile.currentLocationLat,
      profile.currentLocationLng
    );
    return distance <= (profile.nearbyRadiusKm || 5);
  });

  console.log(`Found ${friendsToNotify.length} friends and ${nearbyUsersInRadius.length} nearby users to notify`);

  // 4. Send notifications to friends
  for (const profile of friendsToNotify) {
    if (isQuietHours(profile)) {
      console.log(`Skipping ${profile.user.name} - quiet hours`);
      continue;
    }

    const title = `${pinData.pinUserName} is here!`;
    const body = `Your friend ${pinData.pinUserName} just dropped a pin: "${pinData.pinDescription.substring(0, 100)}${pinData.pinDescription.length > 100 ? '...' : ''}"`;

    // In-app notification
    if (profile.notifyViaInApp) {
      await createInAppNotification(
        profile.userId,
        'friend_pin',
        title,
        body,
        pinData.pinUserId,
        { pinId: pinData.pinId, lat: pinData.pinLat, lng: pinData.pinLng }
      );
    }

    // Email notification
    if (profile.notifyViaEmail && profile.user.email) {
      await sendEmailNotification(profile.user.email, title, body, pinData);
    }

    // SMS notification
    if (profile.notifyViaSms && profile.phoneNumber && profile.phoneVerified) {
      await sendSmsNotification(
        profile.phoneNumber,
        `📍 Map & Mingle: ${title} ${body.substring(0, 100)}`
      );
    }
  }

  // 5. Send notifications to nearby users
  for (const profile of nearbyUsersInRadius) {
    if (isQuietHours(profile)) {
      console.log(`Skipping ${profile.user.name} - quiet hours`);
      continue;
    }

    const distance = getDistanceKm(
      pinData.pinLat,
      pinData.pinLng,
      profile.currentLocationLat!,
      profile.currentLocationLng!
    );
    const distanceStr = distance < 1 
      ? `${Math.round(distance * 1000)}m` 
      : `${distance.toFixed(1)}km`;

    const title = `Someone is nearby!`;
    const body = `${pinData.pinUserName} dropped a pin ${distanceStr} from you: "${pinData.pinDescription.substring(0, 80)}${pinData.pinDescription.length > 80 ? '...' : ''}"`;

    // In-app notification
    if (profile.notifyViaInApp) {
      await createInAppNotification(
        profile.userId,
        'nearby_pin',
        title,
        body,
        pinData.pinUserId,
        { pinId: pinData.pinId, lat: pinData.pinLat, lng: pinData.pinLng, distance }
      );
    }

    // Email notification
    if (profile.notifyViaEmail && profile.user.email) {
      await sendEmailNotification(profile.user.email, title, body, pinData);
    }

    // SMS notification
    if (profile.notifyViaSms && profile.phoneNumber && profile.phoneVerified) {
      await sendSmsNotification(
        profile.phoneNumber,
        `📍 Map & Mingle: ${title} ${body.substring(0, 100)}`
      );
    }
  }

  console.log(`Pin notifications complete for ${pinData.pinId}`);
}

// Test notification (for debugging)
export async function sendTestNotification(userId: string, type: 'email' | 'sms' | 'inapp') {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }

  const testData: PinAlertData = {
    pinId: 'test-pin',
    pinUserId: userId,
    pinUserName: profile.user.name || 'Test User',
    pinLat: 37.7749,
    pinLng: -122.4194,
    pinDescription: 'This is a test notification!',
  };

  if (type === 'email' && profile.user.email) {
    await sendEmailNotification(
      profile.user.email,
      'Test Notification from Map & Mingle',
      'This is a test to verify your email notifications are working!',
      testData
    );
    return { success: true, message: `Test email sent to ${profile.user.email}` };
  }

  if (type === 'sms' && profile.phoneNumber) {
    await sendSmsNotification(
      profile.phoneNumber,
      '📍 Map & Mingle: This is a test SMS notification!'
    );
    return { success: true, message: `Test SMS sent to ${profile.phoneNumber}` };
  }

  if (type === 'inapp') {
    await createInAppNotification(
      userId,
      'test',
      'Test Notification',
      'This is a test in-app notification!',
      userId,
      { test: true }
    );
    return { success: true, message: 'Test in-app notification created' };
  }

  return { success: false, error: 'No valid notification method' };
}
