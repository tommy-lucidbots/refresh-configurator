import { Resend } from 'resend';
import { generatePdf } from '../../lib/pdf.jsx';
import {
  TIERS, ITEMS, itemById, fmt, computeTotal, configName,
  taxRateFor, STATE_NAMES,
} from '../../lib/data';
import { rateLimit, clientIp, looksLikeBot } from '../../lib/guard';

export const runtime = 'nodejs';

const FROM = process.env.RESEND_FROM_EMAIL || 'Refresh Builder <refresh@refresh.lucidbots.com>';
const TO = process.env.REFRESH_INBOX || 'refresh@lucidbots.com';

export async function POST(req) {
  try {
    // Abuse guards: max 5 submissions per IP per 10 minutes
    const ip = clientIp(req);
    if (!rateLimit(`submit:${ip}`, 5, 10 * 60 * 1000)) {
      return Response.json({ error: 'Too many submissions. Please try again in a few minutes.' }, { status: 429 });
    }

    const body = await req.json();

    // Honeypot / too-fast check — silently accept so bots don't learn, but do nothing
    if (looksLikeBot(body)) {
      return Response.json({ ok: true });
    }

    const { name, email, phone, tier, selected, taxState, link } = body || {};

    // Validate
    if (!name || !email || !phone || !tier || !Array.isArray(selected) || !TIERS[tier]) {
      return Response.json({ error: 'Missing or invalid fields.' }, { status: 400 });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    if (!emailOk) return Response.json({ error: 'Invalid email.' }, { status: 400 });

    // Sanitize selected against known items, ensure the tier floor is present
    const validIds = selected.filter((id) => itemById[id]);
    TIERS[tier].items.forEach((id) => { if (!validIds.includes(id)) validIds.push(id); });

    const total = computeTotal(tier, validIds);
    const rate = taxRateFor(taxState);
    const cfg = configName(tier, validIds);
    const withTax = Math.round(total * (1 + rate));
    const stateName = taxState && STATE_NAMES[taxState] ? STATE_NAMES[taxState] : 'Not selected';
    const estLine = taxState
      ? (rate > 0
          ? `$${fmt(withTax)}/mo (${(rate * 100).toFixed(3).replace(/\.?0+$/, '')}% ${taxState} state rate, local taxes not included)`
          : 'No state sales tax')
      : 'Not selected';

    const includedList = ITEMS.filter((it) => validIds.includes(it.id))
      .map((it) => `<li>${it.name}${it.included ? ' — included free' : ` — $${fmt(it.mo)}/mo`}</li>`)
      .join('');

    // Generate the PDF
    const contact = { name: String(name).trim(), email: String(email).trim(), phone: String(phone).trim() };
    const pdfBuffer = await generatePdf({ tier, selected: validIds, taxState, contact });

    // Build a clean HTML email
    const safeLink = typeof link === 'string' ? link : '';
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#142933;max-width:560px">
        <div style="background:#142933;border-radius:10px;padding:16px 20px;margin-bottom:18px">
          <span style="color:#fff;font-size:17px;font-weight:bold">LUCID<span style="color:#23c0d8">BOTS</span></span>
          <span style="color:#9fc4cf;font-size:11px;letter-spacing:1px;float:right;margin-top:4px">NEW REFRESH SUBMISSION</span>
        </div>
        <h2 style="margin:0 0 2px">${cfg}</h2>
        <p style="color:#606060;margin:0 0 18px">$${fmt(total)}/mo before tax · 24-month subscription · $0 down</p>

        <h3 style="margin:0 0 6px;font-size:13px;color:#1aa3b8;text-transform:uppercase;letter-spacing:1px">Contact</h3>
        <table style="font-size:14px;margin-bottom:18px">
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Name</td><td><b>${contact.name}</b></td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Email</td><td><a href="mailto:${contact.email}">${contact.email}</a></td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Phone</td><td>${contact.phone}</td></tr>
        </table>

        <h3 style="margin:0 0 6px;font-size:13px;color:#1aa3b8;text-transform:uppercase;letter-spacing:1px">Configuration</h3>
        <table style="font-size:14px;margin-bottom:6px">
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Package</td><td>${cfg}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Monthly (before tax)</td><td>$${fmt(total)}/mo</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Customer state</td><td>${stateName}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#606060">Est. with tax</td><td>${estLine}</td></tr>
        </table>
        <ul style="font-size:14px;margin:6px 0 18px">${includedList}</ul>

        ${safeLink ? `<p style="font-size:14px"><a href="${safeLink}" style="color:#1aa3b8">View this exact build</a></p>` : ''}
        <p style="font-size:12px;color:#606060">The full configuration summary is attached as a PDF.</p>
      </div>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `New Refresh build: ${contact.name} — ${cfg} ($${fmt(total)}/mo)`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: contact.email,
      subject,
      html,
      attachments: [
        { filename: `Refresh-${cfg.replace(/[^a-z0-9]+/gi, '-')}.pdf`, content: pdfBuffer },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: 'Email failed to send.' }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Submit error:', err);
    return Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
