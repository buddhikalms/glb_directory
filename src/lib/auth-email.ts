import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface SendVerificationEmailInput {
  to: string;
  name?: string | null;
  verificationUrl: string;
}

interface SendRegistrationAlertEmailInput {
  name?: string | null;
  email: string;
  role?: string | null;
  provider?: string | null;
}

interface SendRegistrationWelcomeEmailInput {
  to: string;
  name?: string | null;
}

export type EmailTemplateType =
  | "verification"
  | "welcome"
  | "admin_alert"
  | "listing_under_review"
  | "payment_received"
  | "plan_upgraded"
  | "listing_approved"
  | "listing_rejected";

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

type SendListingUnderReviewEmailInput = {
  to: string;
  name?: string | null;
  businessName: string;
};

type SendPaymentReceivedEmailInput = {
  to: string;
  name?: string | null;
  packageName: string;
  amountFormatted: string;
  paymentMode: "subscription" | "one_time";
};

type SendListingApprovedEmailInput = {
  to: string;
  name?: string | null;
  businessName: string;
};

type SendListingRejectedEmailInput = {
  to: string;
  name?: string | null;
  businessName: string;
  reason?: string | null;
};

type SendPlanUpgradedEmailInput = {
  to: string;
  name?: string | null;
  businessName: string;
  newPackageName: string;
  previousPackageName?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function emailShell({
  label,
  title,
  recipient,
  contentHtml,
}: {
  label: string;
  title: string;
  recipient: string;
  contentHtml: string;
}) {
  const safeRecipient = escapeHtml(recipient);
  const safeTitle = escapeHtml(title);
  const safeLabel = escapeHtml(label);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
  <div style="background:#eef2f5;padding:24px 10px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #d9e2ec;box-shadow:0 14px 36px rgba(15,23,42,.12);">
      <tr>
        <td style="background:#0f172a;padding:0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:24px 28px;color:#ffffff;">
                <div style="font-size:30px;line-height:32px;font-weight:800;">Green Directory</div>
                <div style="margin-top:8px;font-size:12px;letter-spacing:2px;color:#9ca3af;text-transform:uppercase;">Account Email</div>
              </td>
              <td align="right" style="padding:24px 28px;background:linear-gradient(135deg,#15803d 0%,#16a34a 60%,#34d399 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:.95;">${safeLabel}</div>
                <div style="font-size:12px;margin-top:4px;font-weight:700;">${escapeHtml(date)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 30px 8px 30px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;">
            <tr>
              <td>
                <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#64748b;margin-bottom:6px;">To</div>
                <div style="font-size:17px;font-weight:700;color:#0f172a;">${safeRecipient}</div>
              </td>
              <td align="right">
                <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Email Type</div>
                <div style="font-size:13px;font-weight:600;color:#0f172a;">${safeLabel}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 30px 30px 30px;">
          <div style="font-size:27px;line-height:34px;font-weight:800;color:#111827;margin-bottom:18px;">${safeTitle}</div>
          <div style="border-left:4px solid #16a34a;padding:6px 0 6px 14px;font-size:15px;line-height:26px;color:#1f2937;">
            ${contentHtml}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="background:#0f172a;height:10px;line-height:10px;font-size:0;">&nbsp;</td>
              <td style="background:#16a34a;height:10px;line-height:10px;font-size:0;" width="130">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 30px 24px 30px;font-size:12px;color:#64748b;">
          Green Directory &middot; Sustainable businesses and services
        </td>
      </tr>
    </table>
  </div>`;
}
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getFromAddress() {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be set");
  }
  return from;
}

async function sendEmail({
  to,
  subject,
  text,
  html,
  template = "unknown",
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  template?: EmailTemplateType | "unknown";
}) {
  const createLog = async (input: {
    status: "sent" | "failed" | "skipped";
    error?: string;
    messageId?: string;
  }) => {
    try {
      await prisma.emailLog.create({
        data: {
          to,
          subject,
          template,
          status: input.status,
          error: input.error || null,
          messageId: input.messageId || null,
        },
      });
    } catch (logError) {
      console.error("email_log_error", logError);
    }
  };

  const transport = createTransport();

  if (!transport) {
    console.log(`[auth] ${subject} -> ${to}`);
    await createLog({ status: "skipped", error: "SMTP transport is not configured" });
    return;
  }

  try {
    const from = getFromAddress();
    const result = await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    await createLog({ status: "sent", messageId: result.messageId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email send error";
    await createLog({ status: "failed", error: message });
    throw error;
  }
}

export function buildVerificationEmail({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailInput): EmailContent {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  return {
    subject: "Verify your email address",
    text: `Hi ${recipientName}, verify your email: ${verificationUrl}`,
    html: emailShell({
      label: "Email Verification",
      title: "Verify your email address",
      recipient: to,
      contentHtml: `
      <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
      <p style="margin:0 0 16px;">Please verify your email address to activate your account.</p>
      <p style="margin:0 0 16px;">
        <a href="${safeVerificationUrl}" style="display:inline-block;background:#16824f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;">Verify Email</a>
      </p>
      <p style="margin:0;">If the button does not work, use this link:<br/><a href="${safeVerificationUrl}" style="color:#136f43;">${safeVerificationUrl}</a></p>`,
    }),
  };
}

export function buildRegistrationAlertEmail({
  name,
  email,
  role,
  provider,
}: SendRegistrationAlertEmailInput): EmailContent {
  const subject = "New user registration";
  const text = `A new user registered.\n\nName: ${name || "N/A"}\nEmail: ${email}\nRole: ${role || "guest"}\nProvider: ${provider || "credentials"}`;
  const html = emailShell({
    label: "Admin Notification",
    title: "New user registration",
    recipient: process.env.REGISTRATION_ALERT_TO || "Admin",
    contentHtml: `
    <p style="margin:0 0 14px;">A new user registration was completed.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;">
      <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Name</td><td style="padding:2px 0;">${escapeHtml(name || "N/A")}</td></tr>
      <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Email</td><td style="padding:2px 0;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Role</td><td style="padding:2px 0;">${escapeHtml(role || "guest")}</td></tr>
      <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Provider</td><td style="padding:2px 0;">${escapeHtml(provider || "credentials")}</td></tr>
    </table>`,
  });

  return { subject, text, html };
}

export function buildRegistrationWelcomeEmail({
  to,
  name,
}: SendRegistrationWelcomeEmailInput): EmailContent {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const loginUrl = `${appUrl()}/login`;
  const safeLoginUrl = escapeHtml(loginUrl);

  return {
    subject: "Welcome to Green Directory",
    text: `Hi ${recipientName}, your account was created successfully. Login: ${loginUrl}`,
    html: emailShell({
      label: "Welcome",
      title: "Your account is ready",
      recipient: to,
      contentHtml: `
    <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">Welcome to Green Directory. Your account is now active.</p>
    <p style="margin:0 0 16px;">
      <a href="${safeLoginUrl}" style="display:inline-block;background:#16824f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;">Go to Login</a>
    </p>
    <p style="margin:0;">You can now sign in and start using your account.</p>`,
    }),
  };
}

export function buildEmailTemplatePreview({
  type,
  to,
  name,
  email,
  role,
  provider,
}: {
  type: EmailTemplateType;
  to: string;
  name?: string;
  email?: string;
  role?: string;
  provider?: string;
}) {
  if (type === "verification") {
    const verificationUrl = `${appUrl()}/api/auth/verify-email?token=sample-token&email=${encodeURIComponent(to)}`;
    return buildVerificationEmail({ to, name, verificationUrl });
  }

  if (type === "admin_alert") {
    return buildRegistrationAlertEmail({
      name,
      email: email || to,
      role,
      provider,
    });
  }

  if (type === "listing_under_review") {
    const recipientName = name || "there";
    const businessName = "Sample Green Business";
    return {
      subject: "Listing received and under review",
      text: `Hi ${recipientName}, your listing "${businessName}" was submitted and is now under review. We will review it and publish once approved.`,
      html: emailShell({
        label: "Listing Review",
        title: "Your listing is under review",
        recipient: to,
        contentHtml: `
        <p style="margin:0 0 14px;">Dear ${escapeHtml(recipientName)},</p>
        <p style="margin:0 0 12px;">We received your listing submission for <strong>${escapeHtml(
          businessName,
        )}</strong>.</p>
        <p style="margin:0 0 12px;">Our team will review the listing and publish it once approved.</p>
        <p style="margin:0;">We will notify you after review is completed.</p>`,
      }),
    };
  }

  if (type === "payment_received") {
    const recipientName = name || "there";
    const packageName = "Starter Plan";
    const amount = "GBP 99.00";
    return {
      subject: "Payment received",
      text: `Hi ${recipientName}, we received your payment (${amount}) for ${packageName}.`,
      html: emailShell({
        label: "Payment Confirmation",
        title: "Payment received",
        recipient: to,
        contentHtml: `
        <p style="margin:0 0 14px;">Dear ${escapeHtml(recipientName)},</p>
        <p style="margin:0 0 12px;">Your payment has been received successfully.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;margin:0 0 12px;">
          <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Type</td><td style="padding:2px 0;">Subscription payment</td></tr>
          <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Package</td><td style="padding:2px 0;">${escapeHtml(packageName)}</td></tr>
          <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Amount</td><td style="padding:2px 0;">${escapeHtml(amount)}</td></tr>
        </table>
        <p style="margin:0;">Thank you for your purchase.</p>`,
      }),
    };
  }

  if (type === "listing_approved") {
    const recipientName = name || "there";
    const businessName = "Sample Green Business";
    const listingUrl = `${appUrl()}/directory`;
    return {
      subject: "Your listing has been approved",
      text: `Hi ${recipientName}, your listing "${businessName}" has been approved and published.`,
      html: emailShell({
        label: "Listing Approved",
        title: "Your listing is now published",
        recipient: to,
        contentHtml: `
        <p style="margin:0 0 14px;">Dear ${escapeHtml(recipientName)},</p>
        <p style="margin:0 0 12px;">Great news. Your listing <strong>${escapeHtml(
          businessName,
        )}</strong> has been approved and published.</p>
        <p style="margin:0 0 16px;">
          <a href="${escapeHtml(
            listingUrl,
          )}" style="display:inline-block;background:#16824f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;">View Directory</a>
        </p>
        <p style="margin:0;">Thank you for submitting your business.</p>`,
      }),
    };
  }

  if (type === "listing_rejected") {
    const recipientName = name || "there";
    const businessName = "Sample Green Business";
    const reasonText = "Missing required business information.";
    return {
      subject: "Your listing was not approved",
      text: `Hi ${recipientName}, your listing "${businessName}" was not approved. Reason: ${reasonText}`,
      html: emailShell({
        label: "Listing Rejected",
        title: "Your listing was not approved",
        recipient: to,
        contentHtml: `
        <p style="margin:0 0 14px;">Dear ${escapeHtml(recipientName)},</p>
        <p style="margin:0 0 12px;">Your listing <strong>${escapeHtml(
          businessName,
        )}</strong> was reviewed and could not be approved at this time.</p>
        <p style="margin:0 0 8px;font-weight:700;">Reason</p>
        <p style="margin:0 0 12px;">${escapeHtml(reasonText)}</p>
        <p style="margin:0;">Please update your listing and submit again.</p>`,
      }),
    };
  }

  if (type === "plan_upgraded") {
    const recipientName = name || "there";
    const businessName = "Sample Green Business";
    const oldPackage = "Starter Plan";
    const newPackage = "Growth Plan";
    const billingUrl = `${appUrl()}/dashboard/billing`;
    return {
      subject: "Your plan has been upgraded",
      text: `Hi ${recipientName}, your plan for "${businessName}" was upgraded from ${oldPackage} to ${newPackage}.`,
      html: emailShell({
        label: "Plan Upgrade",
        title: "Plan upgraded successfully",
        recipient: to,
        contentHtml: `
        <p style="margin:0 0 14px;">Dear ${escapeHtml(recipientName)},</p>
        <p style="margin:0 0 12px;">Your listing plan for <strong>${escapeHtml(
          businessName,
        )}</strong> has been upgraded.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;margin:0 0 12px;">
          <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Previous Plan</td><td style="padding:2px 0;">${escapeHtml(oldPackage)}</td></tr>
          <tr><td style="padding:2px 14px 2px 0;font-weight:700;">New Plan</td><td style="padding:2px 0;">${escapeHtml(newPackage)}</td></tr>
        </table>
        <p style="margin:0 0 16px;">
          <a href="${escapeHtml(
            billingUrl,
          )}" style="display:inline-block;background:#16824f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;">Open Billing</a>
        </p>
        <p style="margin:0;">Thank you for continuing with Green Directory.</p>`,
      }),
    };
  }

  return buildRegistrationWelcomeEmail({ to, name });
}

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailInput) {
  const content = buildVerificationEmail({ to, name, verificationUrl });
  await sendEmail({
    to,
    ...content,
    template: "verification",
  });
}

export async function sendRegistrationAlertEmail({
  name,
  email,
  role,
  provider,
}: SendRegistrationAlertEmailInput) {
  const to = process.env.REGISTRATION_ALERT_TO;
  if (!to) return;
  const content = buildRegistrationAlertEmail({
    name,
    email,
    role,
    provider,
  });
  await sendEmail({
    to,
    ...content,
    template: "admin_alert",
  });
}

export async function sendRegistrationWelcomeEmail({
  to,
  name,
}: SendRegistrationWelcomeEmailInput) {
  const content = buildRegistrationWelcomeEmail({ to, name });
  await sendEmail({
    to,
    ...content,
    template: "welcome",
  });
}

export async function sendTemplateTestEmail(input: {
  type: EmailTemplateType;
  to: string;
  name?: string;
  email?: string;
  role?: string;
  provider?: string;
}) {
  const content = buildEmailTemplatePreview(input);
  await sendEmail({
    to: input.to,
    ...content,
    template: input.type,
  });
  return content;
}

export async function sendListingUnderReviewEmail({
  to,
  name,
  businessName,
}: SendListingUnderReviewEmailInput) {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safeBusinessName = escapeHtml(businessName);

  const content: EmailContent = {
    subject: "Listing received and under review",
    text: `Hi ${recipientName}, your listing "${businessName}" was submitted and is now under review. We will review it and publish once approved.`,
    html: emailShell({
      label: "Listing Review",
      title: "Your listing is under review",
      recipient: to,
      contentHtml: `
      <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
      <p style="margin:0 0 12px;">We received your listing submission for <strong>${safeBusinessName}</strong>.</p>
      <p style="margin:0 0 12px;">Our team will review the listing and publish it once approved.</p>
      <p style="margin:0;">We will notify you after review is completed.</p>`,
    }),
  };

  await sendEmail({
    to,
    ...content,
    template: "listing_under_review",
  });
}

export async function sendPaymentReceivedEmail({
  to,
  name,
  packageName,
  amountFormatted,
  paymentMode,
}: SendPaymentReceivedEmailInput) {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safePackageName = escapeHtml(packageName);
  const safeAmount = escapeHtml(amountFormatted);
  const modeLabel =
    paymentMode === "one_time" ? "One-time payment" : "Subscription payment";

  const content: EmailContent = {
    subject: "Payment received",
    text: `Hi ${recipientName}, we received your payment (${amountFormatted}) for ${packageName}.`,
    html: emailShell({
      label: "Payment Confirmation",
      title: "Payment received",
      recipient: to,
      contentHtml: `
      <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
      <p style="margin:0 0 12px;">Your payment has been received successfully.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;margin:0 0 12px;">
        <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Type</td><td style="padding:2px 0;">${escapeHtml(modeLabel)}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Package</td><td style="padding:2px 0;">${safePackageName}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Amount</td><td style="padding:2px 0;">${safeAmount}</td></tr>
      </table>
      <p style="margin:0;">Thank you for your purchase.</p>`,
    }),
  };

  await sendEmail({
    to,
    ...content,
    template: "payment_received",
  });
}

export async function sendPlanUpgradedEmail({
  to,
  name,
  businessName,
  newPackageName,
  previousPackageName,
}: SendPlanUpgradedEmailInput) {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safeBusinessName = escapeHtml(businessName);
  const safeNewPackageName = escapeHtml(newPackageName);
  const safePreviousPackageName = escapeHtml(
    (previousPackageName || "").trim() || "No previous plan",
  );
  const billingUrl = `${appUrl()}/dashboard/billing`;
  const safeBillingUrl = escapeHtml(billingUrl);

  const content: EmailContent = {
    subject: "Your plan has been upgraded",
    text: `Hi ${recipientName}, your plan for "${businessName}" has been upgraded to ${newPackageName}.`,
    html: emailShell({
      label: "Plan Upgrade",
      title: "Plan upgraded successfully",
      recipient: to,
      contentHtml: `
      <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
      <p style="margin:0 0 12px;">Your listing plan for <strong>${safeBusinessName}</strong> has been upgraded.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;margin:0 0 12px;">
        <tr><td style="padding:2px 14px 2px 0;font-weight:700;">Previous Plan</td><td style="padding:2px 0;">${safePreviousPackageName}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;font-weight:700;">New Plan</td><td style="padding:2px 0;">${safeNewPackageName}</td></tr>
      </table>
      <p style="margin:0 0 16px;">
        <a href="${safeBillingUrl}" style="display:inline-block;background:#16824f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;">Open Billing</a>
      </p>
      <p style="margin:0;">Your new plan features are now active.</p>`,
    }),
  };

  await sendEmail({
    to,
    ...content,
    template: "plan_upgraded",
  });
}

export async function sendListingApprovedEmail({
  to,
  name,
  businessName,
}: SendListingApprovedEmailInput) {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safeBusinessName = escapeHtml(businessName);
  const listingUrl = `${appUrl()}/directory`;
  const safeListingUrl = escapeHtml(listingUrl);

  const content: EmailContent = {
    subject: "Your listing has been approved",
    text: `Hi ${recipientName}, your listing "${businessName}" has been approved and published.`,
    html: emailShell({
      label: "Listing Approved",
      title: "Your listing is now published",
      recipient: to,
      contentHtml: `
      <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
      <p style="margin:0 0 12px;">Great news. Your listing <strong>${safeBusinessName}</strong> has been approved and published.</p>
      <p style="margin:0 0 16px;">
        <a href="${safeListingUrl}" style="display:inline-block;background:#16824f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;">View Directory</a>
      </p>
      <p style="margin:0;">Thank you for submitting your business.</p>`,
    }),
  };

  await sendEmail({
    to,
    ...content,
    template: "listing_approved",
  });
}

export async function sendListingRejectedEmail({
  to,
  name,
  businessName,
  reason,
}: SendListingRejectedEmailInput) {
  const recipientName = name || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safeBusinessName = escapeHtml(businessName);
  const safeReason = escapeHtml((reason || "").trim() || "No specific reason was provided.");

  const content: EmailContent = {
    subject: "Your listing was not approved",
    text: `Hi ${recipientName}, your listing "${businessName}" was not approved. Reason: ${safeReason}`,
    html: emailShell({
      label: "Listing Rejected",
      title: "Your listing was not approved",
      recipient: to,
      contentHtml: `
      <p style="margin:0 0 14px;">Dear ${safeRecipientName},</p>
      <p style="margin:0 0 12px;">Your listing <strong>${safeBusinessName}</strong> was reviewed and could not be approved at this time.</p>
      <p style="margin:0 0 8px;font-weight:700;">Reason</p>
      <p style="margin:0 0 12px;">${safeReason}</p>
      <p style="margin:0;">Please update your listing and submit again.</p>`,
    }),
  };

  await sendEmail({
    to,
    ...content,
    template: "listing_rejected",
  });
}

