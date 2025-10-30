// Email Notifier - Send gazette alerts via email
// Task 2.4: Email notification system
// This is a placeholder implementation - integrate with your email provider

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  gazetteNumber: string;
  matchReasons: string[];
}

/**
 * Send email notification for gazette match
 * Note: This is a placeholder - integrate with your email service (SendGrid, Resend, etc.)
 */
export async function sendGazetteEmail(notification: EmailNotification): Promise<boolean> {
  try {
    console.log('Email notification:', {
      to: notification.to,
      subject: notification.subject,
    });

    // TODO: Integrate with actual email service
    // Example implementations:

    // Option 1: SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: notification.to,
    //   from: 'tradenest@example.com',
    //   subject: notification.subject,
    //   html: notification.body,
    // });

    // Option 2: Resend
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'tradenest@example.com',
    //   to: notification.to,
    //   subject: notification.subject,
    //   html: notification.body,
    // });

    // Option 3: Supabase Email Auth (basic)
    // Use Supabase's built-in email functionality

    // For now, just log to console
    console.log(`Would send email to ${notification.to}:`);
    console.log(`Subject: ${notification.subject}`);
    console.log(`Body: ${notification.body}`);

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate email body for gazette match alert
 */
export function generateEmailBody(notification: EmailNotification): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Gazette Alert</h2>
      <p>A new gazette matching your watchlist has been published:</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>${notification.gazetteNumber}</h3>
        <p><strong>Match Reasons:</strong> ${notification.matchReasons.join(', ')}</p>
      </div>
      
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/gazette-tracker" 
            style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View in TradeNest
      </a></p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        You're receiving this because you have active watchlists in TradeNest.
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/settings">Manage notifications</a>
      </p>
    </div>
  `;
}

/**
 * Send batch emails for multiple matches
 */
export async function sendBatchEmails(notifications: EmailNotification[]): Promise<void> {
  for (const notification of notifications) {
    const body = generateEmailBody(notification);
    await sendGazetteEmail({
      ...notification,
      body,
    });
  }
}

