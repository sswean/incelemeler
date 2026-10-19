import { NextResponse } from 'next/server';
import { getSessionToken } from '../../../lib/session';

/** Panel önizlemesi: görsel baytları oturum token'ıyla API'den alınır (tarayıcı API'ye doğrudan gitmez). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/v1/admin/media/${id}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return new NextResponse(null, { status: res.status });
  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
