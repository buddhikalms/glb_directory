import nodemailer from "nodemailer";

interface SendVerificationEmailInput {
  to: string;
  name?: string | null;
  verificationUrl: string;
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

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailInput) {
  const transport = createTransport();

  if (!transport) {
    console.log(
      `[auth] Verification email for ${to}: ${verificationUrl}`,
    );
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be set");
  }

  await transport.sendMail({
    from,
    to,
    subject: "Verify your email address",
    text: `Hi ${name || "there"}, verify your email: ${verificationUrl}`,
    html: `<p>Hi ${name || "there"},</p><p>Please verify your email by clicking <a href="${verificationUrl}">this link</a>.</p>`,
  });
}
