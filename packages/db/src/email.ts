export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function createWelcomeEmail(email: string, name?: string): EmailTemplate {
  return {
    to: email,
    subject: "Welcome to AIMediaOS!",
    html: `
      <h1>Welcome to AIMediaOS!</h1>
      <p>Hi ${name || "there"},</p>
      <p>Your account is ready. You've been given <strong>10 free credits</strong> to get started.</p>
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>Generate images from text</li>
        <li>Transform existing images</li>
        <li>Change clothes in photos</li>
        <li>Generate videos from images</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding">Complete your setup</a></p>
    `,
    text: `Welcome to AIMediaOS! Your account is ready with 10 free credits.`,
  };
}

export function createPaymentSuccessEmail(email: string, planId: string, amount: number): EmailTemplate {
  const planNames: Record<string, string> = {
    "pro-monthly": "Pro Monthly ($9.99/month)",
    "pro-annual": "Pro Annual ($99.99/year)",
  };

  return {
    to: email,
    subject: "Payment Confirmed - Subscription Activated",
    html: `
      <h1>Payment Confirmed!</h1>
      <p>Thank you for subscribing to <strong>${planNames[planId] || planId}</strong>.</p>
      <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
      <p>Your subscription is now active. Visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a> to start creating.</p>
      <p><strong>Need help?</strong> Reply to this email or visit our support page.</p>
    `,
    text: `Payment confirmed for ${planNames[planId] || planId}. Your subscription is now active.`,
  };
}

export function createSubscriptionCancelledEmail(email: string): EmailTemplate {
  return {
    to: email,
    subject: "Subscription Cancelled",
    html: `
      <h1>Subscription Cancelled</h1>
      <p>Your subscription has been cancelled. You can still use your free tier with 10 credits per month.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">View pricing</a> to upgrade anytime.</p>
    `,
    text: "Your subscription has been cancelled. You can still use the free tier.",
  };
}

export function createCreditWarningEmail(email: string, creditsRemaining: number): EmailTemplate {
  return {
    to: email,
    subject: "Low Credit Balance",
    html: `
      <h1>Credit Balance Low</h1>
      <p>You have only <strong>${creditsRemaining} credits</strong> remaining this month.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">Upgrade your plan</a> or purchase additional credits.</p>
    `,
    text: `You have only ${creditsRemaining} credits remaining.`,
  };
}

export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@aimedia.os";

  if (!sendgridApiKey) {
    console.warn("SENDGRID_API_KEY not configured - emails will not be sent");
    return false;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: template.to }] }],
        from: { email: sendgridFromEmail },
        subject: template.subject,
        content: [
          { type: "text/plain", value: template.text },
          { type: "text/html", value: template.html },
        ],
      }),
    });

    if (!response.ok) {
      console.error("SendGrid error:", response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
