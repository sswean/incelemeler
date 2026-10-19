/** Herkese açık görsel vekili: API yalnızca lisanslı ve herkese açık görseli verir (Ek A14.6). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/v1/media/${id}`, { cache: 'no-store' });
  if (!res.ok) return new Response(null, { status: res.status === 404 ? 404 : 502 });
  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
