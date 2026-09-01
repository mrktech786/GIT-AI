import { createSession, listSessions } from '@/lib/whatsapp';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ sessions: listSessions() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
  return Response.json({ session: createSession(alias || 'WhatsApp Account') }, { status: 201 });
}
