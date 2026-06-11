// Lightweight in-memory abuse guards. No external service needed.
// Note: in-memory state resets when the serverless function cold-starts, which is
// fine for slowing down bursts and casual abuse. For heavier protection later, move to
// a shared store (e.g. Netlify Blobs or Upstash). Good enough for launch.

const hits = new Map(); // key -> array of timestamps

// Allow `limit` requests per `windowMs` per key (IP).
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);

  // Opportunistic cleanup so the map doesn't grow forever
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      const fresh = v.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(k); else hits.set(k, fresh);
    }
  }
  return arr.length <= limit;
}

// Pull a best-effort client IP from request headers.
export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for') || req.headers.get('x-nf-client-connection-ip') || '';
  return (fwd.split(',')[0] || 'unknown').trim();
}

// Honeypot: a field humans never see/fill. If it's non-empty, it's a bot.
export function looksLikeBot(body) {
  if (body && typeof body.company_website === 'string' && body.company_website.trim() !== '') return true;
  // Submitted impossibly fast after page load (< 2s) — likely a script.
  if (body && typeof body.elapsedMs === 'number' && body.elapsedMs >= 0 && body.elapsedMs < 2000) return true;
  return false;
}
