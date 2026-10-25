import nodemailer from 'nodemailer';

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Send a recovery code by email. Returns false when SMTP is not configured
 * or sending fails. The code is NEVER returned to the client in either case;
 * callers must only show a masked-email "check your inbox" message.
 */
export async function sendRecoveryEmail(to: string, code: string): Promise<boolean> {
  if (!smtpConfigured()) return false;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Your password recovery code',
      text: `Your password recovery code is: ${code}\nIt works for 30 minutes. If you did not request this, ignore this email.`
    });
    return true;
  } catch {
    return false;
  }
}
