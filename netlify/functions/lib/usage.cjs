// AI usage meter. Records each successful AI call per user in public.ai_usage.
// Limits live in public.ai_limits and are OFF (active=false) until subscriptions launch.
// Never blocks a request because of a metering error.
const SUPABASE_URL = 'https://gwagccrxnqicorqmcrma.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_xiH45eL40kzKyaYkP5XJ3g_V98SOjOw';
function userIdFrom(token) {
  try { const p = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); return typeof p.sub === 'string' ? p.sub : null; } catch { return null; }
}
async function rest(path, token, init = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
  try { return await fetch(SUPABASE_URL + '/rest/v1/' + path, { ...init, signal: ctl.signal, headers: { apikey: KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
  finally { clearTimeout(t); }
}
async function overLimit(token, uid) {
  try {
    const r = await rest('ai_limits?select=tier,monthly_limit,active&tier=eq.free', token); if (!r.ok) return null;
    const lim = (await r.json())[0]; if (!lim || !lim.active || lim.monthly_limit == null) return null;
    // TODO(subscriptions): skip the limit for premium users once entitlements exist.
    const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const c = await rest('ai_usage?select=id&user_id=eq.' + uid + '&created_at=gte.' + start.toISOString(), token, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
    const n = Number((c.headers.get('content-range') || '').split('/')[1]) || 0;
    return n >= lim.monthly_limit ? lim.monthly_limit : null;
  } catch { return null; }
}
function metered(feature, handler) {
  return async (event, context) => {
    const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''; const uid = token ? userIdFrom(token) : null;
    if (uid) {
      const lim = await overLimit(token, uid);
      if (lim) return { statusCode: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `You've used your ${lim} free AI uses this month. Upgrade to Premium for unlimited, or try again next month.`, limitReached: true }) };
    }
    const res = await handler(event, context);
    if (uid && res && res.statusCode >= 200 && res.statusCode < 300) {
      try { await rest('ai_usage', token, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: uid, feature }) }); } catch {}
    }
    return res;
  };
}
module.exports = { metered };
