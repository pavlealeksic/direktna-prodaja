import { Resend } from '@resend/node';

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM || 'leads@example.com';

export async function sendLeadNotification(to: string, payload: { project: string; unit?: string | null; name: string; email: string; phone?: string | null; message?: string | null }) {
  const subject = `New inquiry for ${payload.project}${payload.unit ? ` — ${payload.unit}` : ''}`;
  const lines = [
    `Project: ${payload.project}`,
    payload.unit ? `Unit: ${payload.unit}` : undefined,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : undefined,
    payload.message ? `Message: ${payload.message}` : undefined,
  ].filter(Boolean) as string[];
  await resend.emails.send({ from, to, subject, text: lines.join('\n') });
}

export async function sendLeadConfirmation(to: string, payload: { project: string; unit?: string | null; builderEmail?: string | null }) {
  const subject = `Thanks for your interest in ${payload.project}`;
  const lines = [
    `Thank you for your inquiry about ${payload.project}${payload.unit ? ` — ${payload.unit}` : ''}.`,
    payload.builderEmail ? `A representative will contact you from ${payload.builderEmail}.` : 'A representative will contact you soon.',
  ];
  await resend.emails.send({ from, to, subject, text: lines.join('\n\n') });
}

export async function sendLeadReply(to: string, payload: { subject: string; text: string; replyTo?: string }) {
  await resend.emails.send({ from, to, subject: payload.subject, text: payload.text, reply_to: payload.replyTo });
}
