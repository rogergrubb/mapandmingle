import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'MapMingle <noreply@mapandmingle.com>';

export class EmailService {
  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to MapMingle! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; }
              .content { background: white; padding: 30px; border-radius: 10px; margin-top: 20px; }
              .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to MapMingle!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Thanks for joining MapMingle! We're excited to have you in our community of explorers and social butterflies. 🦋</p>
                <p><strong>Here's what you can do:</strong></p>
                <ul>
                  <li>📍 Create pins to share your favorite spots</li>
                  <li>🎉 Discover and join local events</li>
                  <li>💬 Connect with people nearby</li>
                  <li>⚡ Start spontaneous mingles</li>
                </ul>
                <p>Ready to explore your world?</p>
                <a href="https://www.mapandmingle.com" class="button">Start Exploring</a>
              </div>
              <div class="footer">
                <p>MapMingle - Connect with your world</p>
                <p><a href="https://www.mapandmingle.com/privacy">Privacy Policy</a> | <a href="https://www.mapandmingle.com/terms">Terms of Service</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `https://www.mapandmingle.com/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your MapMingle Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .content { background: white; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb; }
              .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; }
              .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your MapMingle password. Click the button below to create a new password:</p>
                <a href="${resetUrl}" class="button">Reset Password</a>
                <div class="warning">
                  <p><strong>⚠️ Security Notice:</strong></p>
                  <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  }

  /**
   * Send event reminder email
   */
  static async sendEventReminderEmail(
    to: string,
    eventName: string,
    eventDate: Date,
    eventLocation: string
  ): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Reminder: ${eventName} is tomorrow! 📅`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .content { background: white; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb; }
              .event-card { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
              .button { display: inline-block; background: white; color: #8b5cf6; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <h2>📅 Event Reminder</h2>
                <p>Don't forget! You're attending:</p>
                <div class="event-card">
                  <h3>${eventName}</h3>
                  <p>📍 ${eventLocation}</p>
                  <p>🕐 ${eventDate.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</p>
                </div>
                <a href="https://www.mapandmingle.com/events" class="button">View Event Details</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  }

  /**
   * Send new message notification email
   */
  static async sendNewMessageEmail(
    to: string,
    senderName: string,
    messagePreview: string
  ): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New message from ${senderName} 💬`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .content { background: white; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb; }
              .message-preview { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
              .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <h2>💬 New Message</h2>
                <p><strong>${senderName}</strong> sent you a message:</p>
                <div class="message-preview">
                  <p>${messagePreview}</p>
                </div>
                <a href="https://www.mapandmingle.com/messages" class="button">Reply Now</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  }
}
