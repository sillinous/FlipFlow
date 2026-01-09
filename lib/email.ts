import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'FlipFlow <noreply@flipflow.ai>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Email templates
export const emailTemplates = {
  welcome: (userName: string) => ({
    subject: 'Welcome to FlipFlow!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to FlipFlow!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thanks for joining FlipFlow! You now have access to AI-powered analysis of digital business listings.</p>
              <p>Here's what you can do:</p>
              <ul>
                <li>Analyze Flippa listings with our AI scoring system</li>
                <li>Get instant valuation estimates</li>
                <li>Identify risks and opportunities</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/analyze" class="button">Start Analyzing</a>
              <p>Happy hunting!</p>
              <p>The FlipFlow Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you signed up for FlipFlow.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  analysisComplete: (listingTitle: string, score: number, url: string) => ({
    subject: `Analysis Complete: ${listingTitle} - Score: ${score}/100`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
            .score.excellent { color: #10b981; }
            .score.good { color: #3b82f6; }
            .score.fair { color: #f59e0b; }
            .score.poor { color: #ef4444; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Analysis Complete</h1>
            </div>
            <div class="content">
              <h2>${listingTitle}</h2>
              <div class="score ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'}">
                ${score}/100
              </div>
              <p>${score >= 80 ? 'Excellent opportunity!' : score >= 60 ? 'Good potential with some work.' : score >= 40 ? 'Proceed with caution.' : 'High risk - not recommended.'}</p>
              <a href="${url}" class="button">View Full Analysis</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  alertMatch: (listings: Array<{ title: string; score: number; url: string }>) => ({
    subject: `FlipFlow Alert: ${listings.length} new listings match your criteria`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .listing { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
            .listing-title { font-weight: bold; color: #1f2937; }
            .listing-score { float: right; font-weight: bold; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Listings Alert</h1>
            </div>
            <div class="content">
              <p>Great news! We found ${listings.length} listings matching your alert criteria:</p>
              ${listings.map(l => `
                <div class="listing">
                  <span class="listing-title">${l.title}</span>
                  <span class="listing-score" style="color: ${l.score >= 70 ? '#10b981' : '#f59e0b'}">${l.score}/100</span>
                  <br><a href="${l.url}">View Analysis →</a>
                </div>
              `).join('')}
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View All in Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

export async function sendWelcomeEmail(email: string, userName: string) {
  const template = emailTemplates.welcome(userName);
  return sendEmail({ to: email, ...template });
}

export async function sendAnalysisEmail(email: string, listingTitle: string, score: number, analysisUrl: string) {
  const template = emailTemplates.analysisComplete(listingTitle, score, analysisUrl);
  return sendEmail({ to: email, ...template });
}

export async function sendAlertEmail(email: string, listings: Array<{ title: string; score: number; url: string }>) {
  const template = emailTemplates.alertMatch(listings);
  return sendEmail({ to: email, ...template });
}
