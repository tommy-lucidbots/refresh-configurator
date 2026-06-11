import { generatePdf } from '../../lib/pdf.jsx';
import { TIERS, itemById, configName } from '../../lib/data';
import { rateLimit, clientIp } from '../../lib/guard';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    // Looser limit: PDF downloads are benign but still do work. 20 per IP per 10 min.
    const ip = clientIp(req);
    if (!rateLimit(`pdf:${ip}`, 20, 10 * 60 * 1000)) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    const body = await req.json();
    const { tier, selected, taxState } = body || {};

    if (!tier || !TIERS[tier] || !Array.isArray(selected)) {
      return Response.json({ error: 'Invalid configuration.' }, { status: 400 });
    }

    // Sanitize and ensure tier floor is present
    const validIds = selected.filter((id) => itemById[id]);
    TIERS[tier].items.forEach((id) => { if (!validIds.includes(id)) validIds.push(id); });

    // No contact block on the customer-facing download (that's only for the internal email PDF)
    const pdfBuffer = await generatePdf({ tier, selected: validIds, taxState, contact: null });
    const cfg = configName(tier, validIds);
    const filename = `Refresh-${cfg.replace(/[^a-z0-9]+/gi, '-')}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF route error:', err);
    return Response.json({ error: 'Could not generate PDF.' }, { status: 500 });
  }
}
