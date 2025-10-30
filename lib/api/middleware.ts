import { NextRequest } from 'next/server';
import { z, ZodTypeAny } from 'zod';

type Handler = (req: NextRequest, parsed?: any) => Promise<Response>;
type Options = {
  schema?: ZodTypeAny;
  rateLimit?: { windowMs: number; max: number };
  idempotent?: boolean;
  requireOrgId?: boolean;
};

const rateBuckets = new Map<string, { tokens: number; ts: number }>();
const idemCache = new Map<string, Response>();

export function withApiMiddleware(handler: Handler, opts: Options = {}) {
  return async (req: NextRequest) => {
    const requestId = crypto.randomUUID();
    const started = Date.now();

    try {
      const orgId = req.headers.get('x-org-id') || '';
      if (opts.requireOrgId && !orgId) {
        return json({ error: 'Missing x-org-id' }, 400);
      }

      if (opts.rateLimit) {
        const key = `${req.ip || 'ip'}:${req.nextUrl.pathname}`;
        const now = Date.now();
        const bucket = rateBuckets.get(key) || { tokens: opts.rateLimit.max!, ts: now };
        const refill = Math.floor((now - bucket.ts) / opts.rateLimit.windowMs!);
        if (refill > 0) {
          bucket.tokens = Math.min(opts.rateLimit.max!, bucket.tokens + refill);
          bucket.ts = now;
        }
        if (bucket.tokens <= 0) {
          return json({ error: 'Rate limit exceeded' }, 429);
        }
        bucket.tokens -= 1;
        rateBuckets.set(key, bucket);
      }

      if (opts.idempotent && req.method === 'POST') {
        const idemKey = req.headers.get('idempotency-key');
        if (!idemKey) return json({ error: 'Missing Idempotency-Key' }, 400);
        const cached = idemCache.get(idemKey);
        if (cached) return cloneResponse(cached);
      }

      let parsed: any = undefined;
      if (opts.schema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const body = await req.json().catch(() => undefined);
        const res = opts.schema.safeParse(body);
        if (!res.success) {
          return json({ error: 'ValidationError', details: res.error.flatten() }, 400);
        }
        parsed = res.data;
      }

      const res = await handler(req, parsed);

      if (opts.idempotent && req.method === 'POST') {
        const idemKey = req.headers.get('idempotency-key')!;
        idemCache.set(idemKey, await cloneResponse(res));
      }

      console.info(JSON.stringify({
        level: 'info',
        msg: 'api_request',
        path: req.nextUrl.pathname,
        method: req.method,
        status: res.status,
        orgId: req.headers.get('x-org-id') || null,
        requestId,
        duration_ms: Date.now() - started,
      }));

      return res;
    } catch (e: any) {
      console.error(JSON.stringify({
        level: 'error',
        msg: 'api_error',
        path: req.nextUrl.pathname,
        method: req.method,
        error: e?.message || String(e),
        requestId,
      }));
      return json({ error: 'InternalError' }, 500);
    }
  };
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function cloneResponse(res: Response) {
  const buf = await res.clone().arrayBuffer();
  return new Response(buf, { status: res.status, headers: res.headers });
}


